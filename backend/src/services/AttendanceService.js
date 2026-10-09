const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcryptjs');
const { prisma } = require('../config/database');
const { redis, PREFIXES } = require('../config/redis');
const env = require('../config/env');
const logger = require('../config/logger');
const EmployeePolicy = require('./EmployeePolicyService');
const { dateOnly, dateKey, zonedParts, evaluateAttendance, attendanceDate, isSunday, openingOccurrence, atZonedTime, officeHoursFor } = require('../utils/attendanceClock');
const { getCurrentServerTime } = require('../utils/networkTime');
const { performFaceVerification, hasValidEnrolledFace } = require('../utils/faceVerify');
const AuditService = require('./AuditService');
const WorkEventService = require('./WorkEventService');
const BreakService = require('./BreakService');

const CHALLENGE_TTL_SECONDS = 120; // code valid for 2 minutes

class AttendanceService {
  async _executeAttendanceEvent({
    orgId,
    employeeId,
    actorId = employeeId,
    sessionId = null,
    eventType,
    source,
    idempotencyKey,
    clientTimestamp = null,
    deviceId = null,
    networkEvidence = null,
    identityEvidence = null,
    livenessEvidence = null,
    ruleVersion = 'attendance-trust-v1',
    persist,
  }) {
    const key = String(idempotencyKey || uuidv4());
    const existing = await prisma.attendanceEvent.findUnique({
      where: { orgId_idempotencyKey: { orgId, idempotencyKey: key } },
    });
    if (existing) return this._replayAttendanceEvent(existing);

    try {
      return await prisma.$transaction(async (tx) => {
        const event = await tx.attendanceEvent.create({
          data: {
            orgId,
            employeeId,
            actorId,
            sessionId,
            eventType,
            source,
            result: 'PROCESSING',
            idempotencyKey: key,
            clientTimestamp: clientTimestamp instanceof Date && !Number.isNaN(clientTimestamp.getTime()) ? clientTimestamp : null,
            deviceId,
            networkEvidence,
            identityEvidence,
            livenessEvidence,
            ruleVersion,
          },
        });
        const outcome = await persist(tx);
        await tx.attendanceEvent.update({
          where: { id: event.id },
          data: {
            result: 'ACCEPTED',
            attendanceRecordId: outcome.record?.id || null,
            outcome: {
              recordId: outcome.record?.id || null,
              status: outcome.status || null,
              penalty: outcome.penalty ?? null,
              clockInTime: outcome.clockInTime || outcome.record?.clockInTime || null,
              clockOutTime: outcome.clockOutTime || outcome.record?.clockOutTime || null,
              ruleEvaluation: outcome.ruleEvaluation || null,
            },
          },
        });
        await WorkEventService.recordAttendanceEvent(
          tx,
          { ...event, result: 'ACCEPTED', attendanceRecordId: outcome.record?.id || null, outcome },
          outcome,
        );
        return { ...outcome, eventId: event.id, duplicate: false };
      });
    } catch (err) {
      if (err.code === 'P2002') {
        const committed = await prisma.attendanceEvent.findUnique({
          where: { orgId_idempotencyKey: { orgId, idempotencyKey: key } },
        });
        if (committed) return this._replayAttendanceEvent(committed);
      }
      throw err;
    }
  }

  async _replayAttendanceEvent(event) {
    if (event.result !== 'ACCEPTED' || !event.attendanceRecordId) {
      throw Object.assign(new Error('This attendance event is still being processed.'), { status: 409, code: 'EVENT_IN_PROGRESS' });
    }
    const record = await prisma.attendanceRecord.findUnique({ where: { id: event.attendanceRecordId } });
    if (!record) throw Object.assign(new Error('The original attendance result is unavailable.'), { status: 409, code: 'EVENT_RESULT_UNAVAILABLE' });
    const outcome = event.outcome || {};
    return {
      record,
      status: outcome.status || record.status,
      penalty: outcome.penalty ?? record.penalty,
      clockInTime: outcome.clockInTime || record.clockInTime,
      clockOutTime: outcome.clockOutTime || record.clockOutTime,
      eventId: event.id,
      duplicate: true,
    };
  }

  // ── CHALLENGE (anti-automation) ───────────────────────────────────────────────
  // Step 1 of check-in: validate the Wi-Fi FIRST, then issue a short-lived random
  // code the employee must type back. If they're on the wrong network, no code is
  // issued — they're told to connect to the company Wi-Fi instead.
  async issueChallenge(employeeId, sessionId, ctx = {}) {
    const employee = await this._loadEmployeeForChannel(employeeId, 'PHONE');
    // Session must exist and be active to issue a challenge
    const session = await prisma.attendanceSession.findUnique({
      where: { id: sessionId },
      select: {
        id: true, status: true, startTime: true, endTime: true,
        office: { select: { id: true, orgId: true, isActive: true, wifiSSID: true, publicIp: true, timezone: true, weeklySchedule: true, securitySettings: true } },
      },
    });
    const challengeTime = await getCurrentServerTime();
    if (session?.office && !officeHoursFor(challengeTime, session.office)) return { success: false, reason: 'SUNDAY_CLOSED', message: 'This office is closed today.' };
    if (
      !session || session.status !== 'ACTIVE' || !session.office?.isActive ||
      challengeTime < session.startTime || (session.endTime && challengeTime > session.endTime)
    ) {
      return { success: false, reason: 'SESSION_CLOSED', message: 'No active attendance session. Ask your admin to start a session.' };
    }
    if (session.office.orgId !== employee.orgId) {
      return { success: false, reason: 'SESSION_CLOSED', message: 'This attendance session does not belong to your organization.' };
    }
    if (employee.officeId && session.office?.id && employee.officeId !== session.office.id) {
      return { success: false, reason: 'OFFICE_MISMATCH', message: `This employee belongs to ${employee.office?.name || 'another office'} and cannot check in at this office session.` };
    }

    // Gate: must be on the company Wi-Fi BEFORE we reveal a code
    const wifi = this._checkWifi(session.office, ctx, employeeId);
    if (!wifi.ok) {
      return { success: false, reason: wifi.reason, message: wifi.message };
    }

    const code = String(Math.floor(100000 + Math.random() * 900000)); // random 6-digit
    const key = `${PREFIXES.CHALLENGE}${employeeId}`;
    const payload = JSON.stringify({ code, sessionId });
    try {
      await redis.set(key, payload, 'EX', CHALLENGE_TTL_SECONDS);
    } catch (err) {
      logger.error('Challenge store failed:', err.message);
      return { success: false, reason: 'CHALLENGE_REQUIRED', message: 'Could not start check-in. Try again.' };
    }
    return { success: true, code, expiresIn: CHALLENGE_TTL_SECONDS };
  }

  // Wi-Fi validation, shared by issueChallenge and the check-in pipeline.
  // Each office enforces ITS OWN configured SSID only — no global/cross-org fallback.
  _checkWifi(office, ctx, employeeId) {
    const settings = office?.securitySettings ?? {};
    const wifiRequired = settings.wifiRequired !== false; // default on
    if (!wifiRequired) return { ok: true, verified: false };

    // ── Web / PWA (iOS): browsers can't read the Wi-Fi SSID, so verify the office
    //    NETWORK by source IP. Employees on the office Wi-Fi share its public IP. ──
    if (ctx.platform === 'web') {
      const expectedIp = (office?.publicIp || '').trim();
      if (!expectedIp) {
        return {
          ok: false, reason: 'NETWORK_NOT_CONFIGURED',
          message: 'Web check-in is not set up for your office yet. Ask your admin to set the office network IP in Security Settings.',
        };
      }
      const gotIp = (ctx.ip || '').trim();
      if (!gotIp) {
        return { ok: false, reason: 'NETWORK_REQUIRED', message: 'Could not detect your network. Connect to the office Wi-Fi and try again.' };
      }
      if (gotIp !== expectedIp) {
        logger.warn(`Network mismatch: employee ${employeeId} from "${gotIp}" expected "${expectedIp}"`);
        return { ok: false, reason: 'NETWORK_MISMATCH', message: 'You must be on the company network (office Wi-Fi) to check in.' };
      }
      return { ok: true, verified: true };
    }

    // ── Native app (Android): SSID check ──
    const expected = (office?.wifiSSID || '').trim();
    // Wi-Fi is required but the org hasn't set its SSID yet → we cannot verify, so
    // we must NOT let anyone through. Admin has to set it in Security Settings.
    if (!expected) {
      return {
        ok: false, reason: 'WIFI_NOT_CONFIGURED',
        message: 'Your office Wi-Fi has not been set up yet. Please contact your administrator.',
      };
    }

    const got = (ctx.wifiSSID || '').trim();

    if (!got) {
      logger.warn(`WiFi: employee ${employeeId} sent no SSID (expected "${expected}")`);
      return {
        ok: false, reason: 'WIFI_REQUIRED',
        message: `Couldn't detect your Wi-Fi. Turn ON Location/GPS, grant location permission, and connect to "${expected}", then try again.`,
      };
    }
    if (got.toLowerCase() !== expected.toLowerCase()) {
      logger.warn(`WiFi mismatch: employee ${employeeId} on "${got}" but expected "${expected}"`);
      return {
        ok: false, reason: 'WIFI_MISMATCH',
        message: `You are connected to "${got}". Please connect to the company Wi-Fi "${expected}" to check in.`,
      };
    }
    return { ok: true, verified: true };
  }

  // Auto-learn the office public IP from a Wi-Fi-VERIFIED native check-in.
  // Only trusts a check-in whose SSID matched the office network, so the IP is
  // genuinely the office's. Keeps office.publicIp current for iOS/web (PWA)
  // employees with zero manual setup, across unlimited organizations.
  async _learnOfficeIp(office, ctx) {
    if (!office || ctx.platform === 'web') return;            // never learn from web
    const ssid = (office.wifiSSID || '').trim();
    const got  = (ctx.wifiSSID || '').trim();
    const ip   = (ctx.ip || '').trim();
    if (!ssid || !ip) return;                                  // need a verified SSID + an IP
    if (got.toLowerCase() !== ssid.toLowerCase()) return;      // not actually on the office Wi-Fi
    if (office.publicIp === ip) return;                        // already current
    try {
      await prisma.office.update({ where: { id: office.id }, data: { publicIp: ip } });
      logger.info(`Auto-learned office IP for office ${office.id}: ${ip}`);
    } catch (err) {
      logger.warn('Could not auto-learn office IP:', err.message);
    }
  }

  // ── ADMIN ATTENDANCE (anti-cheat) ───────────────────────────────────────────
  // Every explicit admin login is stored. The first login of the organization’s
  // local day is authoritative for attendance and uses the same opening-time,
  // grace, late, and penalty rules as employee attendance.
  async recordAdminLogin(adminId, loginAt = null, context = {}) {
    loginAt = loginAt ?? await getCurrentServerTime();
    const admin = await prisma.user.findUnique({
      where: { id: adminId },
      select: {
        id: true, orgId: true, role: true, status: true,
        organization: {
          select: {
            id: true, openingTime: true, timezone: true,
            offices: {
              where: { isActive: true }, orderBy: { createdAt: 'asc' }, take: 1,
              select: { id: true, closeTime: true, graceMinutes: true, lateAfterMinutes: true, gracePenalty: true, latePenalty: true, completelyLatePenalty: true },
            },
          },
        },
      },
    });
    if (!admin || admin.role !== 'ADMIN' || admin.status !== 'ACTIVE') return null;

    if (isSunday(loginAt, admin.organization.timezone)) return null;

    const officeRules = admin.organization.offices[0] ?? {};
    const evaluation = evaluateAttendance(loginAt, {
      ...officeRules,
      openTime: admin.organization.openingTime,
      timezone: admin.organization.timezone,
      graceMinutes: 20,
      lateAfterMinutes: 20,
    });
    const event = await prisma.adminLoginEvent.create({
      data: {
        id: uuidv4(), adminId, orgId: admin.orgId, loggedInAt: loginAt,
        attendanceStatus: evaluation.status,
        minutesLate: evaluation.minutesLate,
        penalty: 0,
        ipAddress: context.ipAddress || null,
        userAgent: context.userAgent ? String(context.userAgent).slice(0, 500) : null,
      },
    });

    try {
      await redis.set(`${PREFIXES.ADMIN_PRESENT}${adminId}`, String(loginAt.getTime()), 'NX', 'EX', 86400);
    } catch (_) { /* optional cache; the database event is authoritative */ }

    const activeSession = officeRules.id ? await prisma.attendanceSession.findFirst({
      where: {
        officeId: officeRules.id,
        status: 'ACTIVE',
        startTime: { lte: loginAt },
        OR: [{ endTime: null }, { endTime: { gt: loginAt } }],
      },
      orderBy: { startTime: 'desc' },
      select: { id: true },
    }) : null;
    if (activeSession) await this.syncAdminAttendanceForSession(activeSession.id, adminId);

    return {
      loggedInAt: event.loggedInAt,
      status: event.attendanceStatus,
      minutesLate: event.minutesLate,
      penalty: 0,
      openingTime: admin.organization.openingTime,
      timezone: admin.organization.timezone,
      sessionId: activeSession?.id ?? null,
    };
  }

  async syncAdminAttendanceForSession(sessionId, onlyAdminId = null) {
    const session = await prisma.attendanceSession.findUnique({
      where: { id: sessionId },
      select: {
        id: true,
        startTime: true,
        endTime: true,
        office: { select: { id: true, orgId: true, timezone: true, openTime: true, closeTime: true, weeklySchedule: true } },
      },
    });
    if (!session?.office) return;
    const timezone = session.office.timezone || 'Africa/Lagos';
    const hours = officeHoursFor(session.startTime, session.office);
    const workPolicy = {
      openTime: hours?.openTime || session.office.openTime,
      closeTime: hours?.closeTime || session.office.closeTime,
      timezone,
    };
    const recordDate = attendanceDate(session.startTime, {
      ...workPolicy,
      openingReference: session.startTime,
    });
    const now = await getCurrentServerTime();
    if (!officeHoursFor(session.startTime, session.office)) return;
    const candidateStart = new Date(session.startTime.getTime() - 24 * 60 * 60 * 1000);
    const candidateEnd = new Date((session.endTime || session.startTime).getTime() + 24 * 60 * 60 * 1000);
    const admins = await prisma.user.findMany({
      where: {
        orgId: session.office.orgId, role: 'ADMIN', status: 'ACTIVE',
        ...(onlyAdminId ? { id: onlyAdminId } : {}),
      },
      select: { id: true },
    });

    for (const admin of admins) {
      const loginCandidates = await prisma.adminLoginEvent.findMany({
        where: { adminId: admin.id, loggedInAt: { gte: candidateStart, lt: candidateEnd } },
        orderBy: { loggedInAt: 'asc' },
      });
      const firstLogin = loginCandidates.find((event) => (
        attendanceDate(event.loggedInAt, workPolicy).getTime() === recordDate.getTime()
      ));
      if (!firstLogin) {
        const opening = openingOccurrence(now, workPolicy.openTime, timezone, workPolicy.closeTime, session.startTime);
        const lateCutoff = opening ? new Date(opening.getTime() + 20 * 60000) : null;
        if (!lateCutoff || now < lateCutoff) continue;
        await prisma.attendanceRecord.upsert({
          where: { employeeId_sessionId_date: { employeeId: admin.id, sessionId, date: recordDate } },
          create: {
            id: uuidv4(), employeeId: admin.id, sessionId, date: recordDate,
            status: 'LATE', checkInSource: 'ADMIN_LOGIN', penalty: 0,
          },
          update: {},
        });
        continue;
      }
      await prisma.attendanceRecord.upsert({
        where: { employeeId_sessionId_date: { employeeId: admin.id, sessionId, date: recordDate } },
        create: {
          id: uuidv4(), employeeId: admin.id, sessionId, date: recordDate,
          clockInTime: firstLogin.loggedInAt,
          status: firstLogin.attendanceStatus,
          penalty: 0,
          checkInSource: 'ADMIN_LOGIN',
        },
        update: {
          clockInTime: firstLogin.loggedInAt,
          status: firstLogin.attendanceStatus,
          penalty: 0,
          checkInSource: 'ADMIN_LOGIN',
        },
      });
    }
  }

  // ── WiFi HEARTBEAT ──────────────────────────────────────────────────────────
  // The app pings this periodically while the employee is clocked in. It tracks
  // live presence, and when someone on break returns to the office Wi-Fi it ends
  // the break automatically (the overstay sweep handles those who never return).
  async recordHeartbeat(employeeId, wifiSSID) {
    const record = await prisma.attendanceRecord.findFirst({
      where: { employeeId, clockInTime: { not: null }, clockOutTime: null },
      orderBy: { clockInTime: 'desc' },
      include: { session: { select: { id: true, office: { select: { wifiSSID: true } } } } },
    });
    if (!record) return { tracked: false, onWifi: null }; // not clocked in / already out

    const expected = (record.session?.office?.wifiSSID || '').trim();
    const got = (wifiSSID || '').trim();
    const onWifi = expected ? got.toLowerCase() === expected.toLowerCase() : !!got;

    // Live presence (ephemeral, 3-minute TTL)
    try {
      await redis.set(`${PREFIXES.PRESENCE}${employeeId}`,
        JSON.stringify({ onWifi, ssid: got || null, at: Date.now() }), 'EX', 180);
    } catch (_) { /* presence is best-effort */ }

    // Returning to Wi-Fi does not end a break. The employee must press Break Over
    // so the exact return time and any overstay penalty are recorded.
    let breakEnded = false;
    return { tracked: true, onWifi, breakEnded };
  }

  async _verifyChallenge(employeeId, sessionId, submittedCode) {
    const key = `${PREFIXES.CHALLENGE}${employeeId}`;
    let stored;
    try {
      stored = await redis.get(key);
    } catch (err) {
      logger.error('Challenge read failed:', err.message);
      return { ok: false, reason: 'CHALLENGE_REQUIRED', message: 'Could not verify your code. Try again.' };
    }
    if (!stored) {
      return { ok: false, reason: 'CHALLENGE_EXPIRED', message: 'Your check-in code expired. Tap Check In again to get a new code.' };
    }
    const { code, sessionId: challengeSession } = JSON.parse(stored);
    if (!submittedCode || String(submittedCode).trim() !== code || challengeSession !== sessionId) {
      return { ok: false, reason: 'CHALLENGE_FAILED', message: 'The code you entered is incorrect. Please try again.' };
    }
    // One-time use — consume it
    await redis.del(key).catch(() => {});
    return { ok: true };
  }

  // ── CHECK IN ────────────────────────────────────────────────────────────────
  async checkIn(employeeId, scanData) {
    const { sessionId, deviceId, wifiSSID, challengeCode, platform, model, ip } = scanData;
    const employee = await this._loadEmployeeForChannel(employeeId, 'PHONE');
    const clockInTime = await getCurrentServerTime();

    // Load session + office + security settings in one query
    const session = await prisma.attendanceSession.findUnique({
      where: { id: sessionId },
      select: {
        id: true, status: true, startTime: true, endTime: true,
        office: {
          select: {
            id: true, orgId: true, name: true, isActive: true, timezone: true,
            wifiSSID: true, publicIp: true, openTime: true, closeTime: true, weeklySchedule: true,
            graceMinutes: true, lateAfterMinutes: true, gracePenalty: true, latePenalty: true, completelyLatePenalty: true, absentPenalty: true,
            securitySettings: true,
          },
        },
      },
    });

    if (
      !session || session.status !== 'ACTIVE' || !session.office?.isActive ||
      clockInTime < session.startTime || (session.endTime && clockInTime > session.endTime)
    ) {
      return { success: false, reason: 'SESSION_CLOSED' };
    }
    if (!officeHoursFor(clockInTime, session.office)) return { success: false, reason: 'SUNDAY_CLOSED', message: 'This office is closed today.' };
    if (session.office.orgId !== employee.orgId) {
      return { success: false, reason: 'SESSION_CLOSED', message: 'This attendance session does not belong to your organization.' };
    }
    if (employee.officeId && session.office?.id && employee.officeId !== session.office.id) {
      return { success: false, reason: 'OFFICE_MISMATCH', message: `This employee belongs to ${employee.office?.name || 'another office'} and cannot check in at ${session.office?.name || 'this office'}.` };
    }
    await this._assertEmployeeMayCheckIn(employeeId, clockInTime, session.office.timezone);

    // The session starts AUTO_SESSION_LEAD_MIN before official opening. Keep
    // accepting check-ins until office close; lateness is applied below.
    // Prevent duplicate check-in on same session/day
    // ── STEP 0: Time-based challenge (anti-automation) ──
    const challenge = await this._verifyChallenge(employeeId, sessionId, challengeCode);
    if (!challenge.ok) {
      return { success: false, reason: challenge.reason, message: challenge.message };
    }

    // ── Verification pipeline (device binding → network) ──
    const ctx = { deviceId, wifiSSID, platform, model, ip };
    const check = await this._verifyContext({
      employeeId,
      office: session.office,
      ctx,
      registerIfNew: true,
    });
    if (!check.ok) {
      return { success: false, reason: check.reason, message: check.message };
    }

    // ── Auto-learn the office public IP from a VERIFIED Android check-in ──
    // The SSID check proves this device is on the office Wi-Fi, so its public IP
    // IS the office's. We store it so iOS/web (PWA) employees on the same Wi-Fi
    // can be verified by IP. Self-healing: tracks dynamic IP changes daily.
    await this._learnOfficeIp(session.office, ctx);
    // ── Attendance rules: status + penalty ──
    const { status, penalty } = this._computeStatusAndPenalty(clockInTime, session, employee);
    const today = attendanceDate(clockInTime, {
      ...session.office,
      openingReference: session.startTime,
    });

    // ── Persist the record ──
    const outcome = await this._executeAttendanceEvent({
      orgId: employee.orgId,
      employeeId,
      actorId: employeeId,
      sessionId,
      eventType: 'CHECK_IN',
      source: 'PHONE',
      ruleVersion: 'attendance-office-v1',
      idempotencyKey: scanData.idempotencyKey,
      deviceId: deviceId ?? null,
      networkEvidence: { wifiSSID: wifiSSID ?? null, ip: ip ?? null, wifiVerified: check.wifiVerified },
      identityEvidence: { method: 'AUTHENTICATED_EMPLOYEE_TOKEN' },
      persist: (tx) => this._persistCheckIn({
        employeeId, sessionId, date: today, clockInTime, status, penalty,
        checkInSource: 'PHONE', scanResult: 'VALID',
        wifiVerified: check.wifiVerified, deviceVerified: check.deviceVerified,
        deviceId: deviceId ?? null, wifiSSID: wifiSSID ?? null,
      }, tx).then((record) => ({ record, status, penalty, clockInTime, timezone: session.office.timezone || 'Africa/Lagos' })),
    });

    if (!outcome.duplicate) this._emit('attendance:checkin', { record: outcome.record, sessionId });
    return { success: true, ...outcome };
  }

  // ── CHECK OUT ─────────────────────────────────────────────────────────────────
  async checkOut(employeeId, sessionId, ctx = {}) {
    const employee = await this._loadEmployeeForChannel(employeeId, 'PHONE');

    // Resolve the record (sessionId optional)
    const record = await prisma.attendanceRecord.findFirst({
      where: {
        employeeId,
        ...(sessionId ? { sessionId } : {}),
        clockInTime: { not: null },
        clockOutTime: null,
      },
      orderBy: { clockInTime: 'desc' },
      include: {
        session: {
          select: {
            id: true,
            startTime: true,
            office: {
              select: {
                id: true, orgId: true, name: true, wifiSSID: true, publicIp: true,
                openTime: true, closeTime: true, weeklySchedule: true, timezone: true,
                overtimeStartAfterCloseMinutes: true, overtimeFeePerHour: true,
                overstayPenalty: true, breakMinutes: true, breakStart: true, breakEnd: true,
                securitySettings: true,
              },
            },
          },
        },
      },
    });

    if (!record) throw Object.assign(new Error('No check-in record found for today'), { status: 404 });
    if (record.clockOutTime) throw Object.assign(new Error('Already clocked out'), { status: 409 });
    if (record.session.office?.orgId !== employee.orgId) {
      throw Object.assign(new Error('Attendance record not found.'), { status: 404 });
    }

    const clockOutTime = await getCurrentServerTime();
    const office = record.session.office;
    this._assertCheckoutAllowed(record, clockOutTime);

    // ── Same device / wifi / geo enforcement on the way out ──
    const check = await this._verifyContext({
      employeeId,
      office: record.session.office,
      ctx,
      registerIfNew: false,
    });
    if (!check.ok) {
      const err = new Error(check.message);
      err.status = 403; err.reason = check.reason;
      throw err;
    }

    const workMs = clockOutTime - record.clockInTime;
    const totalWorkHours = parseFloat((workMs / 3600000).toFixed(2));
    const activeBreaks = await prisma.breakRecord.findMany({ where: { employeeId, endTime: null } });
    const { policy: overtimePolicy, evaluation: overtimeEvaluation } = await this._evaluateOvertimeAtCheckout(employee.orgId, record, clockOutTime);

    // Auto-end any active break upon clock out with break penalty calculation
    const bPolicy = await BreakService._getPolicy(employeeId).catch(() => null);
    const bOffice = record.session?.office;
    const bTz = bOffice?.timezone || 'Africa/Lagos';
    for (const b of activeBreaks) {
      const dur = Math.max(1, Math.floor((clockOutTime - b.startTime) / 60000));
      const bPenalty = BreakService._overstayPenalty(b.startTime, clockOutTime, bPolicy, bTz, bOffice);
      await prisma.breakRecord.update({
        where: { id: b.id },
        data: { endTime: clockOutTime, durationMinutes: dur, penalty: bPenalty, isAutoEnded: true, notes: 'Auto-ended on clock out' },
      });
      await prisma.attendanceRecord.update({
        where: { id: record.id },
        data: { totalBreakMinutes: { increment: dur } },
      }).catch(() => {});
    }

    const outcome = await this._executeAttendanceEvent({
      orgId: employee.orgId,
      employeeId,
      actorId: employeeId,
      sessionId: record.sessionId,
      eventType: 'CHECK_OUT',
      source: 'PHONE',
      ruleVersion: overtimeEvaluation ? 'OFFICE-OVERTIME-v1' : 'NO-OVERTIME-CONFIGURED',
      idempotencyKey: ctx.idempotencyKey,
      deviceId: ctx.deviceId ?? null,
      networkEvidence: { wifiSSID: ctx.wifiSSID ?? null, ip: ctx.ip ?? null, wifiVerified: check.wifiVerified },
      identityEvidence: { method: 'AUTHENTICATED_EMPLOYEE_TOKEN' },
      persist: async (tx) => {
        const activeBreaks = await tx.breakRecord.findMany({ where: { employeeId, endTime: null } });
        for (const b of activeBreaks) {
          const dur = Math.max(1, Math.floor((clockOutTime - b.startTime) / 60000));
          const bPenalty = BreakService._overstayPenalty(b.startTime, clockOutTime, bPolicy, bTz, bOffice);
          await tx.breakRecord.update({
            where: { id: b.id },
            data: { endTime: clockOutTime, durationMinutes: dur, penalty: bPenalty, isAutoEnded: true, notes: 'Auto-ended on clock out' },
          });
          await tx.attendanceRecord.update({
            where: { id: record.id },
            data: { totalBreakMinutes: { increment: dur } },
          }).catch(() => {});
        }
        const changed = await tx.attendanceRecord.updateMany({
          where: { id: record.id, clockOutTime: null },
          data: {
            clockOutTime,
            totalWorkHours,
            checkOutSource: 'PHONE',
            overtimeMinutes: overtimeEvaluation?.overtimeMinutes ?? 0,
            overtimeEarnings: overtimeEvaluation?.overtimeEarnings ?? 0,
            overtimeRuleVersion: overtimeEvaluation?.ruleVersion ?? null,
            overtimeDetails: overtimeEvaluation ?? null,
          },
        });
        if (!changed.count) throw Object.assign(new Error('Already clocked out'), { status: 409 });
        const updated = await tx.attendanceRecord.findUnique({
          where: { id: record.id },
          include: { session: { select: { office: { select: { timezone: true } } } } },
        });
        return { record: updated, clockOutTime: updated.clockOutTime, ruleEvaluation: overtimeEvaluation };
      },
    });

    if (!outcome.duplicate) this._emit('attendance:checkout', { record: outcome.record, sessionId: record.sessionId });
    return outcome.record;
  }

  async getManualDashboard(adminOrgId, { sessionId, search = '', page = 1, limit = 100 } = {}) {
    const organization = await EmployeePolicy.getOrganizationPolicy(adminOrgId);
    const now = await getCurrentServerTime();

    // Query all active offices for this organization
    const offices = await prisma.office.findMany({
      where: { orgId: adminOrgId, isActive: true },
      select: {
        id: true,
        name: true,
        timezone: true,
        openTime: true,
        closeTime: true,
        breakStart: true,
        breakEnd: true,
        breakMinutes: true,
        graceMinutes: true,
        lateAfterMinutes: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    const activeSessions = await prisma.attendanceSession.findMany({
      where: {
        office: { orgId: adminOrgId, isActive: true },
        status: 'ACTIVE',
        startTime: { lte: now },
        OR: [{ endTime: null }, { endTime: { gt: now } }],
      },
      select: {
        id: true, sessionName: true, startTime: true, endTime: true,
        office: {
          select: {
            id: true, name: true, timezone: true, openTime: true, closeTime: true,
            graceMinutes: true, lateAfterMinutes: true, gracePenalty: true, latePenalty: true, completelyLatePenalty: true,
            breakStart: true, breakEnd: true, breakMinutes: true,
          },
        },
      },
      orderBy: { startTime: 'desc' },
    });

    // Auto-ensure daily active session for any active office that has no active session today
    for (const office of offices) {
      const alreadyHas = activeSessions.some((s) => s.office?.id === office.id);
      if (!alreadyHas) {
        const hours = officeHoursFor(now, { ...office, organizationOpeningTime: organization?.openingTime });
        if (hours) {
          const openAt = atZonedTime(now, hours.openTime, office.timezone);
          const closeAt = atZonedTime(now, hours.closeTime, office.timezone);
          if (!closeAt || now < closeAt) {
            try {
              const autoSession = await prisma.attendanceSession.create({
                data: {
                  id: uuidv4(),
                  sessionName: `${office.name} Standard Session`,
                  officeId: office.id,
                  officeName: office.name,
                  orgName: organization?.name ?? null,
                  startTime: openAt || now,
                  endTime: closeAt || new Date(now.getTime() + 10 * 3600 * 1000),
                  status: 'ACTIVE',
                  qrRefreshInterval: 120,
                },
                select: {
                  id: true, sessionName: true, startTime: true, endTime: true,
                  office: {
                    select: {
                      id: true, name: true, timezone: true, openTime: true, closeTime: true,
                      graceMinutes: true, lateAfterMinutes: true, gracePenalty: true, latePenalty: true, completelyLatePenalty: true,
                      breakStart: true, breakEnd: true, breakMinutes: true,
                    },
                  },
                },
              });
              activeSessions.push(autoSession);
            } catch {
              // Ignore session creation clash if created concurrently
            }
          }
        }
      }
    }

    let selectedSession = null;
    if (sessionId) {
      selectedSession = activeSessions.find((session) => session.id === sessionId) || null;
      if (!selectedSession) {
        selectedSession = await prisma.attendanceSession.findFirst({
          where: {
            id: sessionId,
            office: { orgId: adminOrgId },
          },
          select: {
            id: true, sessionName: true, startTime: true, endTime: true,
            office: {
              select: {
                id: true, name: true, timezone: true, openTime: true, closeTime: true,
                graceMinutes: true, lateAfterMinutes: true, gracePenalty: true, latePenalty: true, completelyLatePenalty: true,
                breakStart: true, breakEnd: true, breakMinutes: true,
              },
            },
          },
        });
      }
    }
    if (!selectedSession && activeSessions.length > 0) {
      selectedSession = activeSessions[0];
    }

    if (!organization.allowManualCheckIn) {
      return {
        enabled: false, serverTime: now, organization,
        offices,
        activeSessions, selectedSession: selectedSession ?? null,
        employees: [], total: 0, page: 1, totalPages: 0,
      };
    }

    const safePage = Math.max(1, Number(page) || 1);
    const safeLimit = Math.min(200, Math.max(1, Number(limit) || 100));
    const where = {
      orgId: adminOrgId,
      role: 'EMPLOYEE',
      status: 'ACTIVE',
      checkInMethod: { in: ['MANUAL', 'BOTH'] },
      ...(selectedSession?.office?.id ? {
        OR: [
          { officeId: selectedSession.office.id },
          { officeId: null },
        ],
      } : {}),
      ...(search ? {
        OR: [
          { firstName: { contains: search, mode: 'insensitive' } },
          { lastName: { contains: search, mode: 'insensitive' } },
          { employeeCode: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
        ],
      } : {}),
    };
    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date(now);
    todayEnd.setHours(23, 59, 59, 999);

    const recordDate = selectedSession ? attendanceDate(now, {
      ...selectedSession.office,
      openingReference: selectedSession.startTime,
    }) : null;
    const [employees, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true, firstName: true, lastName: true, employeeCode: true,
          email: true, checkInMethod: true, phone: true, profileImageUrl: true,
          faceEncodingData: true, shiftType: true, officeId: true,
          office: { select: { id: true, name: true } },
          department: { select: { name: true } },
          attendanceRecords: selectedSession ? {
            where: { sessionId: selectedSession.id, date: recordDate },
            take: 1,
            select: {
              id: true, sessionId: true, clockInTime: true, clockOutTime: true, status: true,
              penalty: true, checkInSource: true, checkOutSource: true,
              checkInRecorder: { select: { id: true, firstName: true, lastName: true } },
              checkOutRecorder: { select: { id: true, firstName: true, lastName: true } },
              session: { select: { office: { select: { name: true, timezone: true } } } },
            },
          } : false,
        },
        orderBy: [{ firstName: 'asc' }, { lastName: 'asc' }],
        skip: (safePage - 1) * safeLimit,
        take: safeLimit,
      }),
      prisma.user.count({ where }),
    ]);
    const [openRecords, todayRecords] = employees.length ? await Promise.all([
      prisma.attendanceRecord.findMany({
        where: {
          employeeId: { in: employees.map((employee) => employee.id) },
          clockInTime: { not: null },
          clockOutTime: null,
          session: { office: { orgId: adminOrgId } },
        },
        orderBy: { clockInTime: 'desc' },
        select: {
          id: true, employeeId: true, sessionId: true,
          clockInTime: true, clockOutTime: true, status: true, penalty: true,
          checkInSource: true, checkOutSource: true,
          checkInRecorder: { select: { id: true, firstName: true, lastName: true } },
          checkOutRecorder: { select: { id: true, firstName: true, lastName: true } },
          session: { select: { office: { select: { name: true, timezone: true } } } },
        },
      }),
      prisma.attendanceRecord.findMany({
        where: {
          employeeId: { in: employees.map((employee) => employee.id) },
          clockInTime: { gte: todayStart, lte: todayEnd },
          session: { office: { orgId: adminOrgId } },
        },
        orderBy: { clockInTime: 'desc' },
        select: {
          id: true, employeeId: true, sessionId: true,
          clockInTime: true, clockOutTime: true, status: true, penalty: true,
          checkInSource: true, checkOutSource: true,
          checkInRecorder: { select: { id: true, firstName: true, lastName: true } },
          checkOutRecorder: { select: { id: true, firstName: true, lastName: true } },
          session: { select: { office: { select: { name: true, timezone: true } } } },
        },
      }),
    ]) : [[], []];
    const openByEmployee = new Map();
    for (const record of openRecords) {
      if (!openByEmployee.has(record.employeeId)) openByEmployee.set(record.employeeId, record);
    }
    const todayByEmployee = new Map();
    for (const record of todayRecords) {
      if (!todayByEmployee.has(record.employeeId)) todayByEmployee.set(record.employeeId, record);
    }
    return {
      enabled: true, serverTime: now, organization,
      offices,
      activeSessions, selectedSession: selectedSession ?? null,
      employees: employees.map((employee) => {
        const hasFace = Boolean(hasValidEnrolledFace(employee));
        return {
          ...employee,
          profileImageUrl: hasFace ? 'enrolled' : null,
          hasFaceEnrolled: hasFace,
          attendance: openByEmployee.get(employee.id) ?? employee.attendanceRecords?.[0] ?? todayByEmployee.get(employee.id) ?? null,
          attendanceRecords: undefined,
        };
      }),
      total, page: safePage, totalPages: Math.ceil(total / safeLimit),
    };
  }

  async findManualEmployee(adminOrgId, email) {
    const cleanEmail = String(email || '').trim().toLowerCase();
    const employee = await prisma.user.findFirst({
      where: {
        orgId: adminOrgId,
        role: 'EMPLOYEE',
        status: 'ACTIVE',
        email: cleanEmail,
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        employeeCode: true,
        profileImageUrl: true,
        faceEncodingData: true,
        shiftType: true,
        officeId: true,
        office: { select: { id: true, name: true, openTime: true, closeTime: true, breakStart: true, breakEnd: true, breakMinutes: true } },
        department: { select: { name: true } },
      },
    });
    if (!employee) throw Object.assign(new Error('No active employee was found with that registered Gmail address.'), { status: 404 });

    // Look for an open attendance record first (clocked in, not yet clocked out)
    let record = await prisma.attendanceRecord.findFirst({
      where: {
        employeeId: employee.id,
        clockInTime: { not: null },
        clockOutTime: null,
      },
      orderBy: { clockInTime: 'desc' },
      select: { sessionId: true, clockInTime: true, clockOutTime: true },
    });

    // If no open record, check if they checked out today
    if (!record) {
      const now = await getCurrentServerTime();
      const todayStart = new Date(now);
      todayStart.setHours(0, 0, 0, 0);
      const todayEnd = new Date(now);
      todayEnd.setHours(23, 59, 59, 999);

      record = await prisma.attendanceRecord.findFirst({
        where: {
          employeeId: employee.id,
          clockInTime: { gte: todayStart, lte: todayEnd },
          clockOutTime: { not: null },
        },
        orderBy: { clockInTime: 'desc' },
        select: { sessionId: true, clockInTime: true, clockOutTime: true },
      });
    }

    const hasFace = Boolean(hasValidEnrolledFace(employee));
    return {
      ...employee,
      hasFaceEnrolled: hasFace,
      profileImageUrl: hasFace ? 'enrolled' : null,
      attendance: record ?? null,
    };
  }

  async manualCheckIn(adminId, adminOrgId, { employeeId, sessionId, password, faceImage, livenessFrames, timestamp, idempotencyKey }) {
    const clientTimestamp = timestamp ? new Date(timestamp) : null;
    const clockInTime = await getCurrentServerTime();
    const employee = await this._loadEmployeeForChannel(employeeId, 'MANUAL', true);
    if (adminOrgId !== 'platform-org' && employee.orgId !== adminOrgId) {
      throw Object.assign(new Error('Employee not found.'), { status: 404 });
    }
    if (!password || !(await bcrypt.compare(password, employee.passwordHash))) {
      throw Object.assign(new Error('Employee password is incorrect.'), { status: 403 });
    }

    // ── Face verification (after password passes) ──────────────────────────
    const hasFace = Boolean(hasValidEnrolledFace(employee));
    let faceResult = null;
    if (hasFace) {
      // Employee has a verified face enrolled on disk → must verify
      if (!faceImage) {
        throw Object.assign(new Error('Face image is required. Please capture your face.'), { status: 400, code: 'FACE_REQUIRED' });
      }
      faceResult = await performFaceVerification(employee, faceImage, livenessFrames);
    } else if (employee.organization?.requireFaceVerification) {
      // Org requires face but employee hasn't enrolled yet
      throw Object.assign(new Error('Face not registered. Please enroll your face first.'), { status: 400, code: 'FACE_NOT_ENROLLED' });
    }
    // else: no valid face enrolled + org doesn't require it → password-only (backwards compatible)

    const session = await this._loadManualSession(sessionId, employee.orgId, clockInTime);
    if (!officeHoursFor(clockInTime, session.office)) throw Object.assign(new Error('This office is closed today.'), { status: 400 });
    if (employee.officeId && session.officeId && employee.officeId !== session.officeId) {
      throw Object.assign(new Error(`This employee is assigned to ${employee.office?.name || 'another office'} and cannot check in at ${session.office?.name || 'this office'}.`), { status: 403, code: 'OFFICE_MISMATCH' });
    }
    await this._assertEmployeeMayCheckIn(employeeId, clockInTime, session.office.timezone);

    const { status, penalty } = this._computeStatusAndPenalty(clockInTime, session, employee);
    const outcome = await this._executeAttendanceEvent({
      orgId: employee.orgId,
      employeeId,
      actorId: adminId,
      sessionId,
      eventType: 'CHECK_IN',
      source: 'MANUAL',
      ruleVersion: 'attendance-office-v1',
      idempotencyKey,
      clientTimestamp,
      identityEvidence: { method: 'EMPLOYEE_PASSWORD', faceVerified: Boolean(faceResult?.identity?.verified ?? faceResult?.verified) },
      livenessEvidence: faceResult?.liveness || (faceResult ? { verified: faceResult.is_real === true, method: faceResult.liveness_method || 'provider' } : null),
      persist: (tx) => this._persistCheckIn({
        employeeId, sessionId, date: attendanceDate(clockInTime, {
          ...session.office,
          openingReference: session.startTime,
        }),
        clockInTime, status, penalty,
        checkInSource: 'MANUAL', checkInRecordedById: adminId,
        wifiVerified: false, deviceVerified: false,
      }, tx).then((record) => ({ record, status, penalty, clockInTime })),
    });
    if (!outcome.duplicate) this._emit('attendance:checkin', { record: outcome.record, sessionId, source: 'MANUAL' });
    return outcome;
  }

  async manualCheckOut(adminId, adminOrgId, { employeeId, sessionId, password, faceImage, timestamp, idempotencyKey }) {
    const employee = await this._loadEmployeeForChannel(employeeId, 'MANUAL', true);
    if (adminOrgId !== 'platform-org' && employee.orgId !== adminOrgId) {
      throw Object.assign(new Error('Employee not found.'), { status: 404 });
    }
    if (!password || !(await bcrypt.compare(password, employee.passwordHash))) {
      throw Object.assign(new Error('Employee password is incorrect.'), { status: 403 });
    }

    // Checkout is password-only. Face verification is required only at check-in.

    const record = await prisma.attendanceRecord.findFirst({
      where: {
        employeeId,
        ...(sessionId ? { sessionId } : {}),
        clockInTime: { not: null },
        clockOutTime: null,
        session: { office: { orgId: adminOrgId } },
      },
      orderBy: { clockInTime: 'desc' },
      include: {
        session: {
          select: {
            startTime: true,
            office: { select: { orgId: true, openTime: true, closeTime: true, weeklySchedule: true, timezone: true, overtimeStartAfterCloseMinutes: true, overtimeFeePerHour: true, overstayPenalty: true, breakMinutes: true, breakStart: true, breakEnd: true } },
          },
        },
      },
    });
    if (!record) throw Object.assign(new Error('No open attendance record found for this employee.'), { status: 404 });
    const clientTimestamp = timestamp ? new Date(timestamp) : null;
    const clockOutTime = await getCurrentServerTime();
    this._assertCheckoutAllowed(record, clockOutTime);
    const totalWorkHours = parseFloat(((clockOutTime - record.clockInTime) / 3600000).toFixed(2));
    const { policy: overtimePolicy, evaluation: overtimeEvaluation } = await this._evaluateOvertimeAtCheckout(employee.orgId, record, clockOutTime);
    const outcome = await this._executeAttendanceEvent({
      orgId: employee.orgId,
      employeeId,
      actorId: adminId,
      sessionId: record.sessionId,
      eventType: 'CHECK_OUT',
      source: 'MANUAL',
      ruleVersion: overtimeEvaluation ? 'OFFICE-OVERTIME-v1' : 'NO-OVERTIME-CONFIGURED',
      idempotencyKey,
      clientTimestamp,
      identityEvidence: { method: 'EMPLOYEE_PASSWORD' },
      persist: async (tx) => {
        const activeBreaks = await tx.breakRecord.findMany({ where: { employeeId, endTime: null } });
        const bPolicy = await BreakService._getPolicy(employeeId).catch(() => null);
        const bOffice = record.session?.office;
        const bTz = bOffice?.timezone || 'Africa/Lagos';
        for (const b of activeBreaks) {
          const dur = Math.max(1, Math.floor((clockOutTime - b.startTime) / 60000));
          const bPenalty = BreakService._overstayPenalty(b.startTime, clockOutTime, bPolicy, bTz, bOffice);
          await tx.breakRecord.update({
            where: { id: b.id },
            data: { endTime: clockOutTime, durationMinutes: dur, penalty: bPenalty, isAutoEnded: true, notes: 'Auto-ended on manual clock out' },
          });
          await tx.attendanceRecord.update({
            where: { id: record.id },
            data: { totalBreakMinutes: { increment: dur } },
          }).catch(() => {});
        }
        const changed = await tx.attendanceRecord.updateMany({
          where: { id: record.id, clockOutTime: null },
          data: {
            clockOutTime, totalWorkHours,
            checkOutSource: 'MANUAL', checkOutRecordedById: adminId,
            overtimeMinutes: overtimeEvaluation?.overtimeMinutes ?? 0,
            overtimeEarnings: overtimeEvaluation?.overtimeEarnings ?? 0,
            overtimeRuleVersion: overtimeEvaluation?.ruleVersion ?? null,
            overtimeDetails: overtimeEvaluation ?? null,
          },
        });
        if (!changed.count) throw Object.assign(new Error('Employee is already checked out.'), { status: 409 });
        const updated = await tx.attendanceRecord.findUnique({ where: { id: record.id } });
        return { record: updated, clockOutTime: updated.clockOutTime, ruleEvaluation: overtimeEvaluation };
      },
    });
    if (!outcome.duplicate) this._emit('attendance:checkout', { record: outcome.record, sessionId: record.sessionId, source: 'MANUAL' });
    return outcome;
  }

  async batchSyncAttendance(adminId, adminOrgId, { records }) {
    if (!Array.isArray(records)) {
      throw Object.assign(new Error('records array is required'), { status: 400 });
    }

    const results = [];
    let syncedCount = 0;
    let failedCount = 0;

    for (const item of records) {
      const { clientEventId, employeeId, type, sessionId, password, faceImage, timestamp } = item;
      try {
        if (type === 'check_in') {
          const res = await this.manualCheckIn(adminId, adminOrgId, {
            employeeId,
            sessionId,
            password,
            faceImage,
            timestamp,
            idempotencyKey: clientEventId,
          });
          results.push({
            clientEventId,
            status: res.duplicate ? 'ALREADY_SYNCED' : 'SYNCED',
            type: 'check_in',
            recordId: res.record.id,
            clockInTime: res.clockInTime,
          });
          syncedCount++;
        } else if (type === 'check_out') {
          const res = await this.manualCheckOut(adminId, adminOrgId, {
            employeeId,
            sessionId,
            password,
            faceImage,
            timestamp,
            idempotencyKey: clientEventId,
          });
          results.push({
            clientEventId,
            status: res.duplicate ? 'ALREADY_SYNCED' : 'SYNCED',
            type: 'check_out',
            recordId: res.record.id,
            clockOutTime: res.clockOutTime,
          });
          syncedCount++;
        } else {
          results.push({
            clientEventId,
            status: 'FAILED',
            error: `Unsupported record type: ${type}`,
          });
          failedCount++;
        }
      } catch (err) {
        if (err.status === 409 || err.message?.includes('Already clocked in') || err.message?.includes('already checked out')) {
          results.push({
            clientEventId,
            status: 'ALREADY_SYNCED',
            message: err.message,
          });
          syncedCount++;
        } else {
          results.push({
            clientEventId,
            status: 'FAILED',
            error: err.message || 'Sync failed',
          });
          failedCount++;
        }
      }
    }

    return {
      total: records.length,
      syncedCount,
      failedCount,
      results,
    };
  }

  _assertCheckoutAllowed(record, clockOutTime) {
    const office = record.session?.office;
    if (!office?.closeTime) return;
    const hours = officeHoursFor(clockOutTime, office);
    if (!hours) throw Object.assign(new Error('This office is closed today.'), { status: 400, reason: 'SUNDAY_CLOSED' });

    const closeAt = this._getScheduledOfficeClose(record, clockOutTime, hours);
    if (closeAt && clockOutTime < closeAt) {
      throw Object.assign(
        new Error(`Check-out is available after the organisation closes at ${hours.closeTime} (${office.timezone || 'Africa/Lagos'}).`),
        { status: 400, reason: 'CHECKOUT_TOO_EARLY' }
      );
    }
  }

  _getScheduledOfficeClose(record, at, knownHours = null) {
    const office = record.session?.office;
    if (!office?.closeTime) return null;
    const hours = knownHours || officeHoursFor(at, office);
    if (!hours?.closeTime) return null;
    const opening = openingOccurrence(
      record.session.startTime,
      hours.openTime,
      office.timezone,
      hours.closeTime,
      record.session.startTime,
    );
    let closeAt = atZonedTime(record.session.startTime, hours.closeTime, office.timezone);
    if (opening && closeAt && closeAt <= opening) closeAt = atZonedTime(record.session.startTime, hours.closeTime, office.timezone, 1);
    return closeAt;
  }

  async _evaluateOvertimeAtCheckout(orgId, record, clockOutTime) {
    const office = record.session?.office;
    const scheduledClose = this._getScheduledOfficeClose(record, clockOutTime);
    const startAfterCloseMinutes = Math.max(0, Number(office?.overtimeStartAfterCloseMinutes) || 0);
    const feePerOvertimeHour = Math.max(0, Number(office?.overtimeFeePerHour) || 0);
    if (!office || !scheduledClose || feePerOvertimeHour <= 0) return { policy: null, evaluation: null };

    const overtimeStartsAt = new Date(scheduledClose.getTime() + startAfterCloseMinutes * 60_000);
    const elapsedMinutes = Math.max(0, Math.floor((clockOutTime.getTime() - overtimeStartsAt.getTime()) / 60_000));
    const breaks = await prisma.breakRecord.findMany({
      where: { attendanceRecordId: record.id },
      select: { startTime: true, endTime: true },
    });
    const overtimeBreakMinutes = breaks.reduce((total, item) => {
      const breakStart = item.startTime.getTime();
      const breakEnd = (item.endTime || clockOutTime).getTime();
      const overlapStart = Math.max(breakStart, overtimeStartsAt.getTime());
      const overlapEnd = Math.min(breakEnd, clockOutTime.getTime());
      return total + Math.max(0, Math.floor((overlapEnd - overlapStart) / 60_000));
    }, 0);
    const overtimeMinutes = Math.max(0, elapsedMinutes - overtimeBreakMinutes);
    const overtimeEarnings = Math.round((overtimeMinutes / 60) * feePerOvertimeHour * 100) / 100;
    return {
      policy: null,
      evaluation: {
        ruleVersion: 'OFFICE-OVERTIME-v1',
        scheduledClose: scheduledClose.toISOString(),
        overtimeStartsAt: overtimeStartsAt.toISOString(),
        startAfterCloseMinutes,
        overtimeMinutes,
        overtimeHours: Math.round((overtimeMinutes / 60) * 100) / 100,
        feePerOvertimeHour,
        overtimeEarnings,
      },
    };
  }

  async _loadEmployeeForChannel(employeeId, channel, includePassword = false) {
    const employee = await prisma.user.findUnique({
      where: { id: employeeId },
      select: {
        id: true, orgId: true, role: true, status: true, checkInMethod: true,
        profileImageUrl: true,
        faceEncodingData: true,
        faceBlockedUntil: true,
        faceMismatchCount: true,
        faceLastMismatchAt: true,
        officeId: true,
        office: { select: { id: true, name: true } },
        shiftType: true,
        ...(
          includePassword ? { passwordHash: true } : {}
        ),
        organization: {
          select: {
            id: true, allowDeviceCheckIn: true, allowManualCheckIn: true,
            hasStudents: true, openingTime: true, timezone: true,
            requireFaceVerification: true, shiftSchedules: true,
          },
        },
      },
    });
    if (!employee || employee.role !== 'EMPLOYEE' || employee.status !== 'ACTIVE') {
      throw Object.assign(new Error('Active employee account not found.'), { status: 403 });
    }
    EmployeePolicy.assertChannelAllowed(employee.organization, employee.checkInMethod, channel);
    return employee;
  }

  async _assertEmployeeMayCheckIn(employeeId, value, timezone) {
    const date = dateOnly(value, timezone || 'Africa/Lagos');
    const leave = await prisma.leaveRequest.findFirst({
      where: { employeeId, status: 'APPROVED', startDate: { lte: date }, endDate: { gte: date } },
      select: { startDate: true, endDate: true, leaveType: true },
    });
    if (leave) throw Object.assign(new Error(`You are on approved ${leave.leaveType} leave and cannot check in until ${leave.endDate.toISOString().slice(0, 10)}.`), { status: 403, code: 'ON_LEAVE' });
  }

  async syncEmployeeAbsencesForSession(sessionId) {
    const session = await prisma.attendanceSession.findUnique({
      where: { id: sessionId },
      select: {
        id: true,
        startTime: true,
        office: {
          select: {
            id: true,
            orgId: true,
            timezone: true,
            openTime: true,
            closeTime: true,
            weeklySchedule: true,
            absentPenalty: true,
            organization: { select: { shiftSchedules: true } },
          },
        },
      },
    });
    if (!session?.office) return;
    const tz = session.office.timezone || 'Africa/Lagos';
    const date = attendanceDate(session.startTime, { ...session.office, openingReference: session.startTime });
    if (!officeHoursFor(session.startTime, session.office)) return;

    const employees = await prisma.user.findMany({
      where: {
        orgId: session.office.orgId,
        officeId: session.office.id,
        role: 'EMPLOYEE',
        status: 'ACTIVE',
      },
      select: { id: true, createdAt: true, shiftType: true },
    });

    const nowServer = await getCurrentServerTime();
    for (const employee of employees) {
      const empCreatedDate = dateOnly(employee.createdAt || new Date(), tz);
      if (date < empCreatedDate) continue;

      // Shift check: an evening worker should not be marked absent during morning hours
      if (employee.shiftType === 'EVENING') {
        const eveningClose = session.office.organization?.shiftSchedules?.EVENING?.closeTime || '18:00';
        const eveningCloseAt = atZonedTime(nowServer, eveningClose, tz);
        if (eveningCloseAt && nowServer < eveningCloseAt) {
          continue;
        }
      }

      const leave = await prisma.leaveRequest.findFirst({
        where: { employeeId: employee.id, status: 'APPROVED', startDate: { lte: date }, endDate: { gte: date } },
        select: { id: true },
      });

      const existingClockIn = await prisma.attendanceRecord.findFirst({
        where: { employeeId: employee.id, date, clockInTime: { not: null } },
        select: { id: true },
      });
      if (existingClockIn) continue;

      const existing = await prisma.attendanceRecord.findUnique({
        where: { employeeId_sessionId_date: { employeeId: employee.id, sessionId, date } },
        select: { id: true, reviewNotes: true, penalty: true },
      });
      if (existing?.reviewNotes === 'WAIVED_BY_ADMIN') continue;

      const evaluation = {
        status: leave ? 'ON_LEAVE' : 'ABSENT',
        penalty: leave ? 0 : (session.office.absentPenalty || 0),
      };
      const savedRecord = await prisma.attendanceRecord.upsert({
        where: { employeeId_sessionId_date: { employeeId: employee.id, sessionId, date } },
        create: { id: uuidv4(), employeeId: employee.id, sessionId, date, status: evaluation.status, penalty: evaluation.penalty, checkInSource: 'PHONE' },
        update: { status: evaluation.status, penalty: evaluation.penalty },
      });
      await WorkEventService.record({
        orgId: session.office.orgId, employeeId: employee.id, type: evaluation.status,
        occurredAt: session.startTime, source: 'SYSTEM', status: 'FINALIZED', sessionId,
        ruleVersion: 'absence-office-v1', sourceType: 'AttendanceRecord', sourceId: savedRecord.id,
        dedupeKey: `absence:${savedRecord.id}:${evaluation.status}:absence-office-v1`,
        metadata: { ruleEvaluation: evaluation, policySnapshot: { version: 'absence-office-v1' } },
      });
    }
  }

  async reconcilePastAbsencesForOrg(orgId, monthStr = null) {
    if (!orgId || orgId === 'platform-org') return;
    const now = await getCurrentServerTime();
    const org = await prisma.organization.findUnique({
      where: { id: orgId },
      include: {
        offices: { where: { isActive: true } },
      },
    });
    if (!org || !org.offices || org.offices.length === 0) return;

    const admin = await prisma.user.findFirst({
      where: { orgId, role: 'ADMIN', status: 'ACTIVE' },
      select: { id: true },
    });

    for (const office of org.offices) {
      const tz = office.timezone || org.timezone || 'Africa/Lagos';
      const nowParts = zonedParts(now, tz);
      const todayDate = dateOnly(now, tz);
      const todayKey = dateKey(now, tz);

      // Multi-office isolation: only reconcile employees assigned to this specific office
      const activeEmployees = await prisma.user.findMany({
        where: {
          orgId,
          officeId: office.id,
          role: 'EMPLOYEE',
          status: 'ACTIVE',
        },
        select: { id: true, firstName: true, lastName: true, createdAt: true, shiftType: true },
      });
      if (activeEmployees.length === 0) continue;

      let startDate;
      let endDate;
      if (monthStr && /^(\d{4})-(0[1-9]|1[0-2])$/.test(monthStr)) {
        const [y, m] = monthStr.split('-').map(Number);
        startDate = new Date(Date.UTC(y, m - 1, 1));
        const lastDayOfMonth = new Date(Date.UTC(y, m, 0)).getUTCDate();
        const monthEnd = new Date(Date.UTC(y, m - 1, lastDayOfMonth));
        endDate = monthEnd > todayDate ? todayDate : monthEnd;
      } else {
        // Default to current month from 1st of month up to today
        startDate = new Date(Date.UTC(nowParts.year, nowParts.month - 1, 1));
        endDate = todayDate;
      }

      const curr = new Date(startDate.getTime());
      while (curr <= endDate) {
        const targetDate = dateOnly(curr, tz);
        const targetKey = dateKey(curr, tz);

        const hours = officeHoursFor(curr, {
          ...office,
          organizationOpeningTime: org.openingTime,
        });

        if (hours && hours.openTime && hours.closeTime) {
          let shouldReconcile = true;
          const closeAt = atZonedTime(curr, hours.closeTime, tz);
          const openAt = atZonedTime(curr, hours.openTime, tz);

          if (targetKey === todayKey) {
            // For TODAY: only reconcile if office closing time has passed
            if (closeAt && now < closeAt) {
              shouldReconcile = false;
            }
          }

          if (shouldReconcile) {
            let session = await prisma.attendanceSession.findFirst({
              where: {
                officeId: office.id,
                startTime: {
                  gte: new Date(openAt.getTime() - 90 * 60_000),
                  lte: new Date(closeAt.getTime() + 90 * 60_000),
                },
              },
              orderBy: { startTime: 'desc' },
            });

            if (!session) {
              session = await prisma.attendanceSession.create({
                data: {
                  id: uuidv4(),
                  sessionName: `${office.name} – ${targetKey}`,
                  officeId: office.id,
                  officeName: office.name,
                  orgName: org.name,
                  startTime: openAt,
                  endTime: closeAt,
                  status: 'ENDED',
                  createdBy: admin?.id ?? null,
                },
              });
            } else if (session.status === 'ACTIVE' || session.status === 'PAUSED') {
              if (targetKey !== todayKey || now >= closeAt) {
                await prisma.attendanceSession.update({
                  where: { id: session.id },
                  data: { status: 'ENDED' },
                }).catch(() => {});
              }
            }

            for (const emp of activeEmployees) {
              const empCreatedDate = dateOnly(emp.createdAt || new Date(), tz);
              if (targetDate < empCreatedDate) continue;

              // Shift check for today: an evening worker should not be marked absent during morning hours
              if (targetKey === todayKey && emp.shiftType === 'EVENING') {
                const shiftSchedule = org.shiftSchedules?.EVENING;
                const eveningCloseTime = shiftSchedule?.closeTime || '18:00';
                const eveningCloseAt = atZonedTime(now, eveningCloseTime, tz);
                if (eveningCloseAt && now < eveningCloseAt) {
                  continue;
                }
              }

              const clockedIn = await prisma.attendanceRecord.findFirst({
                where: {
                  employeeId: emp.id,
                  date: targetDate,
                  clockInTime: { not: null },
                },
                select: { id: true },
              });
              if (clockedIn) continue;

              const leave = await prisma.leaveRequest.findFirst({
                where: {
                  employeeId: emp.id,
                  status: 'APPROVED',
                  startDate: { lte: targetDate },
                  endDate: { gte: targetDate },
                },
                select: { id: true },
              });

              const existingRecord = await prisma.attendanceRecord.findUnique({
                where: {
                  employeeId_sessionId_date: {
                    employeeId: emp.id,
                    sessionId: session.id,
                    date: targetDate,
                  },
                },
                select: { id: true, reviewNotes: true, penalty: true },
              });

              if (existingRecord?.reviewNotes === 'WAIVED_BY_ADMIN') {
                continue;
              }

              const evaluation = {
                status: leave ? 'ON_LEAVE' : 'ABSENT',
                penalty: leave ? 0 : (office.absentPenalty || 0),
              };
              const savedRecord = await prisma.attendanceRecord.upsert({
                where: {
                  employeeId_sessionId_date: {
                    employeeId: emp.id,
                    sessionId: session.id,
                    date: targetDate,
                  },
                },
                create: {
                  id: uuidv4(),
                  employeeId: emp.id,
                  sessionId: session.id,
                  date: targetDate,
                  status: evaluation.status,
                  penalty: evaluation.penalty,
                  checkInSource: 'PHONE',
                },
                update: {
                  status: evaluation.status,
                  penalty: evaluation.penalty,
                },
              });
              await WorkEventService.record({
                orgId, employeeId: emp.id, type: evaluation.status,
                occurredAt: openAt, source: 'SYSTEM', status: 'FINALIZED', sessionId: session.id,
                ruleVersion: 'absence-office-v1', sourceType: 'AttendanceRecord', sourceId: savedRecord.id,
                dedupeKey: `absence:${savedRecord.id}:${evaluation.status}:absence-office-v1`,
                metadata: { ruleEvaluation: evaluation, policySnapshot: { version: 'absence-office-v1' } },
              });
            }
          }
        }

        curr.setUTCDate(curr.getUTCDate() + 1);
      }
    }
  }

  async reconcileAllPastAbsences(now) {
    const orgs = await prisma.organization.findMany({
      where: { id: { not: 'platform-org' } },
      select: { id: true },
    });
    for (const org of orgs) {
      await this.reconcilePastAbsencesForOrg(org.id).catch((err) => {
        logger.warn(`reconcileAllPastAbsences error for org ${org.id}:`, err.message);
      });
    }
  }

  async _loadManualSession(sessionId, orgId, now) {
    const session = await prisma.attendanceSession.findUnique({
      where: { id: sessionId },
      select: {
        id: true, status: true, startTime: true, endTime: true,
        office: {
          select: {
            id: true, orgId: true, isActive: true, timezone: true, openTime: true, closeTime: true, weeklySchedule: true,
            graceMinutes: true, lateAfterMinutes: true, gracePenalty: true, latePenalty: true, completelyLatePenalty: true,
          },
        },
      },
    });
    if (
      !session || session.status !== 'ACTIVE' || !session.office?.isActive ||
      session.office.orgId !== orgId || now < session.startTime ||
      (session.endTime && now > session.endTime)
    ) {
      throw Object.assign(new Error('No active attendance session was found for this organization.'), { status: 400 });
    }
    return session;
  }

  async _persistCheckIn(data, db = prisma) {
    const key = {
      employeeId_sessionId_date: {
        employeeId: data.employeeId,
        sessionId: data.sessionId,
        date: data.date,
      },
    };
    const existing = await db.attendanceRecord.findUnique({ where: key });
    if (existing?.clockInTime) {
      throw Object.assign(new Error('Already clocked in for this session today.'), { status: 409 });
    }
    const recordData = {
      clockInTime: data.clockInTime,
      status: data.status,
      penalty: data.penalty,
      checkInSource: data.checkInSource,
      checkInRecordedById: data.checkInRecordedById ?? null,
      scanResult: data.scanResult ?? null,
      wifiVerified: data.wifiVerified ?? false,
      deviceVerified: data.deviceVerified ?? false,
      deviceId: data.deviceId ?? null,
      wifiSSID: data.wifiSSID ?? null,
    };
    if (existing) {
      const changed = await db.attendanceRecord.updateMany({
        where: { id: existing.id, clockInTime: null },
        data: recordData,
      });
      if (!changed.count) {
        throw Object.assign(new Error('Already clocked in for this session today.'), { status: 409 });
      }
      return db.attendanceRecord.findUnique({ where: { id: existing.id } });
    }
    try {
      return await db.attendanceRecord.create({
        data: {
          id: uuidv4(), employeeId: data.employeeId, sessionId: data.sessionId,
          date: data.date, ...recordData,
        },
      });
    } catch (error) {
      if (error.code === 'P2002') {
        throw Object.assign(new Error('Already clocked in for this session today.'), { status: 409 });
      }
      throw error;
    }
  }

  // ── Verification pipeline: Device Binding → Wi-Fi → Geo-fence ──────────────────
  async _verifyContext({ employeeId, office, ctx, registerIfNew }) {
    const settings = office?.securitySettings ?? {};
    let deviceVerified = false;
    let wifiVerified = false;

    // ── STEP 1: Device Binding ──
    const deviceBindingEnabled = settings.deviceBindingEnabled !== false; // default on
    if (deviceBindingEnabled) {
      if (!ctx.deviceId) {
        return { ok: false, reason: 'DEVICE_REQUIRED', message: 'Device identification is required to check in.' };
      }

      // Is this physical device already bound to a *different* employee?
      const boundElsewhere = await prisma.registeredDevice.findFirst({
        where: { deviceFingerprint: ctx.deviceId, isActive: true, employeeId: { not: employeeId } },
        select: { id: true },
      });
      if (boundElsewhere) {
        return { ok: false, reason: 'DEVICE_CONFLICT', message: 'This device is already assigned to another employee.' };
      }

      // Already registered to this employee?
      const mine = await prisma.registeredDevice.findFirst({
        where: { deviceFingerprint: ctx.deviceId, employeeId, isActive: true },
        select: { id: true },
      });

      if (mine) {
        await prisma.registeredDevice.update({ where: { id: mine.id }, data: { lastUsedAt: new Date() } });
        deviceVerified = true;
      } else if (registerIfNew) {
        // First time this employee uses this device → bind it (respect max devices)
        const maxDevices = settings.maxDevicesPerEmployee ?? 2;
        const activeCount = await prisma.registeredDevice.count({ where: { employeeId, isActive: true } });
        if (activeCount >= maxDevices) {
          return { ok: false, reason: 'DEVICE_LIMIT', message: `You have reached the maximum of ${maxDevices} registered devices. Contact your admin.` };
        }
        await prisma.registeredDevice.create({
          data: {
            id: uuidv4(), employeeId, deviceFingerprint: ctx.deviceId,
            platform: ctx.platform || 'unknown', model: ctx.model || null,
            isActive: true, lastUsedAt: new Date(),
          },
        });
        deviceVerified = true;
      } else {
        // Checkout / no auto-register: device must already be bound
        return { ok: false, reason: 'DEVICE_NOT_BOUND', message: 'This device is not registered to you. Check in first.' };
      }
    }

    // ── STEP 2: Wi-Fi Validation (re-checked here in case the network changed) ──
    const wifi = this._checkWifi(office, ctx, employeeId);
    if (!wifi.ok) return { ok: false, reason: wifi.reason, message: wifi.message };
    wifiVerified = wifi.verified;

    return { ok: true, deviceVerified, wifiVerified };
  }

  // ── Status + penalty from the ORGANIZATION's configured grace/late/penalty ─────
  // Lateness is measured from the official OPEN TIME (today), so it's consistent no
  // matter when the session was actually created. The penalty clock effectively
  // starts at openTime + graceMinutes (e.g. open 07:00 + grace 50 → penalties at 07:50).
  //  ≤ graceMinutes after open      → PRESENT, no penalty
  //  ≤ lateAfterMinutes after open  → PRESENT, gracePenalty (₦ off salary)
  //  > lateAfterMinutes after open  → COMPLETELY_LATE, latePenalty (₦ off salary)
  _computeStatusAndPenalty(clockInTime, session, employee = null) {
    if (employee?.role === 'ADMIN' || employee?.role === 'SUPER_ADMIN') {
      return { status: 'PRESENT', penalty: 0, minutesLate: 0 };
    }
    const o = session.office ?? {};
    let hours = officeHoursFor(clockInTime, o);

    // Shift awareness: if employee has a shiftType and organization has shift schedules,
    // evaluate lateness against the employee's shift start time rather than office openTime.
    const orgSchedules = employee?.organization?.shiftSchedules || o.organization?.shiftSchedules;
    if (employee?.shiftType && orgSchedules && orgSchedules[employee.shiftType]) {
      const shift = orgSchedules[employee.shiftType];
      if (shift.openTime && shift.closeTime) {
        hours = {
          openTime: shift.openTime,
          closeTime: shift.closeTime,
        };
      }
    }

    if (!hours?.openTime) {
      const minutes = (clockInTime.getTime() - session.startTime.getTime()) / 60000;
      if (minutes <= (o.graceMinutes ?? 30)) return { status: 'PRESENT', penalty: 0, minutesLate: Math.max(0, Math.floor(minutes)) };
      if (minutes <= (o.lateAfterMinutes ?? 90)) return { status: 'PRESENT', penalty: o.gracePenalty ?? 0, minutesLate: Math.floor(minutes) };
      return { status: 'COMPLETELY_LATE', penalty: o.completelyLatePenalty ?? o.latePenalty ?? 0, minutesLate: Math.floor(minutes) };
    }
    const configuredLateAfter = Number(o.lateAfterMinutes);
    const lateAfterMinutes = configuredLateAfter > 0 ? configuredLateAfter : Number(env.CHECKIN_WINDOW_MIN) || 40;
    const result = evaluateAttendance(clockInTime, {
      ...o,
      ...hours,
      lateAfterMinutes,
      openingReference: session.startTime,
    });
    return result.status === 'LATE' ? { ...result, status: 'COMPLETELY_LATE', penalty: o.completelyLatePenalty ?? o.latePenalty ?? 0 } : result;
  }

  _isAfterCheckInDeadline(value, session) {
    const office = session.office ?? {};
    const hours = officeHoursFor(value, office);
    if (!hours) return true;
    const opening = openingOccurrence(session.startTime, hours.openTime, office.timezone, hours.closeTime, session.startTime);
    const configuredLateAfter = Number(office.lateAfterMinutes);
    const lateAfter = configuredLateAfter > 0 ? configuredLateAfter : Number(env.CHECKIN_WINDOW_MIN) || 40;
    return opening && value >= new Date(opening.getTime() + Math.max(0, lateAfter) * 60_000);
  }

  _isBeforeOpening(value, session) {
    const office = session.office ?? {};
    const hours = officeHoursFor(value, office);
    if (!hours) return true;
    const opening = openingOccurrence(session.startTime, hours.openTime, office.timezone, hours.closeTime, session.startTime);
    return opening && value < opening;
  }

  async getStatus(employeeId, date) {
    const employee = await prisma.user.findUnique({
      where: { id: employeeId },
      select: { id: true, organization: { select: { timezone: true } } },
    });
    if (!employee) return null;
    if (date) {
      const targetDate = /^\d{4}-\d{2}-\d{2}$/.test(String(date))
        ? new Date(`${date}T00:00:00.000Z`)
        : new Date(date);
      if (Number.isNaN(targetDate.getTime())) {
        throw Object.assign(new Error('Invalid attendance date.'), { status: 400 });
      }
      return prisma.attendanceRecord.findFirst({
        where: { employeeId, date: dateOnly(targetDate, employee.organization?.timezone || 'Africa/Lagos') },
        include: { breakRecords: true, session: { select: { office: { select: { timezone: true } } } } },
      });
    }

    const now = await getCurrentServerTime();
    const activeRecord = await prisma.attendanceRecord.findFirst({
      where: {
        employeeId,
        session: {
          startTime: { lte: now },
          OR: [{ endTime: null }, { endTime: { gt: now } }],
        },
      },
      include: {
        breakRecords: true,
        session: { select: { office: { select: { timezone: true } } } },
      },
      orderBy: { clockInTime: 'desc' },
    });
    if (activeRecord) return activeRecord;

    const recent = await prisma.attendanceRecord.findMany({
      where: { employeeId },
      include: {
        breakRecords: true,
        session: { select: { startTime: true, office: { select: { timezone: true, openTime: true, closeTime: true } } } },
      },
      orderBy: { clockInTime: 'desc' },
      take: 20,
    });
    return recent.find((record) => {
      const office = record.session?.office;
      if (!office) return false;
      const localWorkDate = attendanceDate(now, office);
      return record.date.getTime() === localWorkDate.getTime();
    }) ?? null;
  }

  async getHistory(employeeId, range) {
    const { startDate, endDate, page = 1, limit = 30 } = range;
    const skip = (page - 1) * limit;

    const [records, total] = await Promise.all([
      prisma.attendanceRecord.findMany({
        where: { employeeId, date: { gte: new Date(startDate), lte: new Date(endDate) } },
        include: {
          breakRecords: true,
          session: { select: { sessionName: true, office: { select: { name: true, timezone: true } } } },
          checkInRecorder: { select: { id: true, firstName: true, lastName: true, email: true } },
          checkOutRecorder: { select: { id: true, firstName: true, lastName: true, email: true } },
        },
        orderBy: { date: 'desc' },
        skip, take: limit,
      }),
      prisma.attendanceRecord.count({
        where: { employeeId, date: { gte: new Date(startDate), lte: new Date(endDate) } },
      }),
    ]);

    return { records, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async flagRecord(recordId, reason, adminId, orgId) {
    const record = await prisma.attendanceRecord.findFirst({
      where: { id: recordId, employee: { orgId } }, select: { id: true, employeeId: true, flagged: true, flagReason: true },
    });
    if (!record) throw Object.assign(new Error('Attendance record not found.'), { status: 404 });
    const updated = await prisma.attendanceRecord.update({
      where: { id: record.id },
      data: { flagged: true, flagReason: reason, reviewedBy: adminId },
    });
    await AuditService.log({ actorId: adminId, action: 'ATTENDANCE_RECORD_FLAGGED', targetId: record.id, targetType: 'AttendanceRecord', details: { orgId, before: record, after: { flagged: updated.flagged, flagReason: updated.flagReason } } });
    await WorkEventService.record({
      orgId, employeeId: record.employeeId, actorId: adminId, type: 'ATTENDANCE_CORRECTED',
      occurredAt: updated.updatedAt, source: 'ADMIN', status: 'CORRECTED',
      sourceType: 'AttendanceRecord', sourceId: record.id,
      dedupeKey: `attendance-correction:flag:${record.id}:${updated.updatedAt.toISOString()}`,
      metadata: { action: 'FLAGGED', before: record, after: updated, reason },
    });
    return updated;
  }

  async approveRecord(recordId, adminId, notes, orgId) {
    const record = await prisma.attendanceRecord.findFirst({
      where: { id: recordId, employee: { orgId } }, select: { id: true, employeeId: true, flagged: true, reviewNotes: true },
    });
    if (!record) throw Object.assign(new Error('Attendance record not found.'), { status: 404 });
    const updated = await prisma.attendanceRecord.update({
      where: { id: record.id },
      data: { flagged: false, reviewedBy: adminId, reviewNotes: notes },
    });
    await AuditService.log({ actorId: adminId, action: 'ATTENDANCE_RECORD_APPROVED', targetId: record.id, targetType: 'AttendanceRecord', details: { orgId, before: record, after: { flagged: updated.flagged, reviewNotes: updated.reviewNotes } } });
    await WorkEventService.record({
      orgId, employeeId: record.employeeId, actorId: adminId, type: 'ATTENDANCE_CORRECTED',
      occurredAt: updated.updatedAt, source: 'ADMIN', status: 'CORRECTED',
      sourceType: 'AttendanceRecord', sourceId: record.id,
      dedupeKey: `attendance-correction:approve:${record.id}:${updated.updatedAt.toISOString()}`,
      metadata: { action: 'APPROVED', before: record, after: updated, notes },
    });
    return updated;
  }

  _emit(event, payload) {
    if (!this._io) {
      try { this._io = require('../sockets/io').getIO(); } catch { return; }
    }
    if (this._io) this._io.emit(event, payload);
  }
}

module.exports = new AttendanceService();
