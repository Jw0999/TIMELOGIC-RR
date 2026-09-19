"use client";

import React, { useState, useEffect } from "react";
import {
  Building2,
  MapPin,
  Clock,
  ShieldCheck,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  Users,
  CreditCard,
  PhoneCall,
  Lock,
  Plus,
  Trash2,
  AlertCircle,
  Sparkles,
  Mail,
  ExternalLink,
} from "lucide-react";
import { Button } from "./ui/Button";

export type PlanType = "starter" | "enterprise" | "organisation";

interface OrgRegistrationFormProps {
  initialPlan?: PlanType;
  onSuccess?: () => void;
  className?: string;
  isCompact?: boolean;
}

const INDUSTRIES = [
  "Technology",
  "Finance & Banking",
  "Healthcare & Clinics",
  "Education & Training",
  "Logistics & Transport",
  "Retail & Commerce",
  "Manufacturing & Factories",
  "Hospitality & Hotels",
  "Construction & Engineering",
  "Non-profit & NGO",
  "Government & Public Sector",
  "Other",
];

const TIMEZONES = [
  "Africa/Lagos (GMT+1)",
  "Africa/Accra (GMT+0)",
  "Africa/Nairobi (GMT+3)",
  "Europe/London (GMT+0/1)",
  "America/New_York (EST)",
  "Asia/Dubai (GST)",
  "UTC",
];

export function OrgRegistrationForm({
  initialPlan = "enterprise",
  className = "",
  isCompact = false,
}: OrgRegistrationFormProps) {
  const [step, setStep] = useState<number>(1);
  const [selectedPlan, setSelectedPlan] = useState<PlanType>(
    initialPlan === "organisation" ? "enterprise" : initialPlan
  );
  const [error, setError] = useState<string>("");
  const [paymentInitiated, setPaymentInitiated] = useState<boolean>(false);
  const [refCode, setRefCode] = useState<string>("");

  useEffect(() => {
    if (initialPlan && initialPlan !== "organisation") {
      setSelectedPlan(initialPlan);
    }
  }, [initialPlan]);

  // Form State
  const [form, setForm] = useState({
    name: "",
    industry: "Technology",
    timezone: "Africa/Lagos (GMT+1)",
    allowDeviceCheckIn: true,
    allowManualCheckIn: false,
    hasStudents: false,
    // Office
    office: {
      name: "Main Office HQ",
      address: "",
      openTime: "08:00",
      closeTime: "17:00",
      breakMinutes: 60,
      breakStart: "13:00",
      breakEnd: "14:00",
      graceMinutes: 30,
      lateAfterMinutes: 90,
    },
    // Departments
    departments: [
      { name: "Operations & Admin", breakStart: "13:00", breakEnd: "14:00" },
    ],
    // Admin Account
    admin: {
      firstName: "",
      lastName: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  const updateOffice = (field: string, value: any) => {
    setForm((prev) => ({
      ...prev,
      office: { ...prev.office, [field]: value },
    }));
  };

  const updateDepartment = (index: number, field: string, value: string) => {
    setForm((prev) => {
      const nextDepts = [...prev.departments];
      nextDepts[index] = { ...nextDepts[index], [field]: value };
      return { ...prev, departments: nextDepts };
    });
  };

  const addDepartment = () => {
    setForm((prev) => ({
      ...prev,
      departments: [
        ...prev.departments,
        { name: "", breakStart: "13:00", breakEnd: "14:00" },
      ],
    }));
  };

  const removeDepartment = (index: number) => {
    if (form.departments.length <= 1) return;
    setForm((prev) => ({
      ...prev,
      departments: prev.departments.filter((_, idx) => idx !== index),
    }));
  };

  const updateAdmin = (field: string, value: string) => {
    setForm((prev) => ({
      ...prev,
      admin: { ...prev.admin, [field]: value },
    }));
  };

  // Step Validation
  const validateCurrentStep = (): boolean => {
    setError("");

    if (step === 1) {
      if (!form.name.trim()) {
        setError("Please enter your organization or company name.");
        return false;
      }
      if (!form.allowDeviceCheckIn && !form.allowManualCheckIn) {
        setError("Please select at least one check-in capability.");
        return false;
      }
    } else if (step === 2) {
      if (!form.office.name.trim()) {
        setError("Please specify the office or station name.");
        return false;
      }
      if (!form.office.address.trim()) {
        setError("Please provide the physical office address.");
        return false;
      }
      if (Number(form.office.lateAfterMinutes) < Number(form.office.graceMinutes)) {
        setError("Late arrival threshold must be greater than grace period.");
        return false;
      }
    } else if (step === 3) {
      const emptyDept = form.departments.some((d) => !d.name.trim());
      if (emptyDept) {
        setError("Please provide a name for each department or remove empty rows.");
        return false;
      }
    } else if (step === 4) {
      if (!form.admin.firstName.trim() || !form.admin.lastName.trim()) {
        setError("Admin first name and last name are required.");
        return false;
      }
      if (!form.admin.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.admin.email)) {
        setError("Please enter a valid administrator work email.");
        return false;
      }
      if (form.admin.password.length < 8) {
        setError("Password must be at least 8 characters long.");
        return false;
      }
      if (form.admin.password !== form.admin.confirmPassword) {
        setError("Passwords do not match.");
        return false;
      }
    } else if (step === 5) {
      if (!selectedPlan) {
        setError("Please select a subscription tier.");
        return false;
      }
      if (selectedPlan === "organisation") {
        setError("Self-serve online registration is disabled for the Custom Organisation plan. Please contact our deployment team via email or phone below, or select Starter (₦20,000) or Enterprise (₦60,000) to proceed online.");
        return false;
      }
    }

    return true;
  };

  const handleNext = () => {
    if (validateCurrentStep()) {
      setStep((prev) => Math.min(prev + 1, 6));
    }
  };

  const handleBack = () => {
    setError("");
    setStep((prev) => Math.max(prev - 1, 1));
  };

  const stageRegistrationDetails = (plan: PlanType) => {
    const generatedCode = `TL-ORG-${Math.floor(10000 + Math.random() * 90000)}`;
    setRefCode(generatedCode);

    const price = plan === "starter" ? "₦20,000" : "₦60,000";
    const paystackUrl =
      plan === "starter"
        ? "https://paystack.shop/pay/eh6-mzczwq"
        : "https://paystack.shop/pay/fx02rvbsve";

    const payload = {
      refCode: generatedCode,
      orgName: form.name,
      industry: form.industry,
      timezone: form.timezone,
      officeName: form.office.name,
      officeAddress: form.office.address,
      openTime: form.office.openTime,
      closeTime: form.office.closeTime,
      breakMinutes: form.office.breakMinutes,
      breakStart: form.office.breakStart,
      breakEnd: form.office.breakEnd,
      adminName: `${form.admin.firstName} ${form.admin.lastName}`,
      adminFirstName: form.admin.firstName,
      adminLastName: form.admin.lastName,
      adminEmail: form.admin.email,
      adminPassword: form.admin.password,
      selectedPlan: plan,
      planName: plan === "starter" ? "Starter Plan (20 Employees)" : "Enterprise Plan (60 Employees)",
      amount: price,
      paystackUrl,
      stagedAt: new Date().toISOString(),
    };

    try {
      localStorage.setItem("timelogic_staged_org", JSON.stringify(payload));
    } catch {
      // ignore storage errors
    }

    return payload;
  };

  const handleOpenPaystack = () => {
    if (selectedPlan === "organisation") return;
    const payload = stageRegistrationDetails(selectedPlan);
    setPaymentInitiated(true);
    window.open(payload.paystackUrl, "_blank", "noopener,noreferrer");
  };

  const handleGoToSuccess = () => {
    stageRegistrationDetails(selectedPlan === "starter" ? "starter" : "enterprise");
    window.location.href = "/success";
  };

  const stepTitles = [
    "Org Info",
    "Office & Hours",
    "Departments",
    "Admin Account",
    "Select Plan",
    "Payment Gateway",
  ];

  const plans = [
    {
      id: "starter" as PlanType,
      name: "Starter",
      price: "₦20,000",
      period: "/ month",
      capacity: "20 Employees",
      billing: "₦20,000 / month (Paid monthly)",
      paystackUrl: "https://paystack.shop/pay/eh6-mzczwq",
      isCustomContact: false,
      desc: "Designed for small single-location offices and clinics eliminating proxy check-ins.",
      badge: "Small Teams",
      highlights: [
        "Up to 20 registered staff",
        "1 Hardware-bound Kiosk Station",
        "Biometric facial & PIN verify",
        "Live presence dashboard",
      ],
    },
    {
      id: "enterprise" as PlanType,
      name: "Enterprise",
      price: "₦60,000",
      period: "/ month",
      capacity: "60 Employees",
      billing: "₦60,000 / month (Paid monthly)",
      paystackUrl: "https://paystack.shop/pay/fx02rvbsve",
      isCustomContact: false,
      desc: "Built for expanding companies, manufacturing plants, and multi-department teams.",
      badge: "Most Popular",
      highlights: [
        "Up to 60 registered staff",
        "Multi-kiosk support across rooms",
        "Automated fraud alerts engine",
        "Direct Microsoft Excel payroll export",
      ],
    },
    {
      id: "organisation" as PlanType,
      name: "Organisation",
      price: "Custom",
      period: "Pricing",
      capacity: "Custom Headcount",
      billing: "Custom terms",
      isCustomContact: true,
      desc: "Tailored for large multi-branch corporations, schools, and multi-site enterprises.",
      badge: "Contact Required",
      highlights: [
        "Custom employee headcount",
        "Multi-branch & facility network",
        "Student & apprentice cohort portal",
        "Dedicated SLA & technical lead",
      ],
    },
  ];

  const inpClass =
    "w-full bg-[#060e26] border border-blue-400/30 text-white rounded-xl px-3.5 py-2 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-sky-400 placeholder-slate-400 transition";
  const lblClass = "block text-xs font-semibold text-blue-200 mb-1.5";

  return (
    <div
      className={`rounded-2xl bg-[#0c1a42]/95 border border-blue-400/30 shadow-2xl backdrop-blur-md overflow-hidden text-slate-100 ${className}`}
    >
      {/* Top Header & Step Progress Bar */}
      <div className="px-5 sm:px-7 py-5 bg-[#091538] border-b border-blue-400/20">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-block w-2 h-2 rounded-full bg-sky-400 animate-pulse" />
              <h2 className="text-base sm:text-lg font-bold text-white tracking-tight flex items-center gap-2">
                <Building2 size={18} className="text-sky-400" />
                <span>Register Your Organisation</span>
              </h2>
            </div>
            <p className="text-xs text-blue-200/80 mt-0.5">
              Configure your attendance station, administrative profile, and capacity tier.
            </p>
          </div>

          <div className="text-xs font-mono font-bold text-sky-400 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-400/30 self-start sm:self-auto">
            STEP 0{step} OF 06
          </div>
        </div>

        {/* Step Indicator Pills */}
        <div className="grid grid-cols-6 gap-1.5 sm:gap-2">
          {stepTitles.map((title, idx) => {
            const stepNum = idx + 1;
            const isPassed = step > stepNum;
            const isCurrent = step === stepNum;

            return (
              <div
                key={title}
                className={`flex flex-col items-center text-center pb-1 border-b-2 transition-all ${
                  isPassed
                    ? "border-sky-400 text-sky-300"
                    : isCurrent
                    ? "border-white text-white font-bold"
                    : "border-blue-900 text-blue-400/50"
                }`}
              >
                <span className="text-[10px] sm:text-xs font-mono">
                  {isPassed ? "✓" : `0${stepNum}`}
                </span>
                <span className="hidden md:inline text-[10px] truncate max-w-[80px]">
                  {title}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Main Body Content */}
      <div className="p-5 sm:p-7">
        {/* Error Alert Box */}
        {error && (
          <div className="mb-5 p-3.5 rounded-xl bg-rose-500/15 border border-rose-400/40 text-rose-200 text-xs sm:text-sm flex items-start gap-2.5">
            <AlertCircle size={17} className="text-rose-400 flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* ── STEP 1: ORGANIZATION INFORMATION ── */}
        {step === 1 && (
          <div className="space-y-4">
            <div className="border-b border-blue-400/20 pb-2">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Building2 size={16} className="text-sky-400" />
                <span>Organization Identity & Attendance Modes</span>
              </h3>
              <p className="text-xs text-blue-200/70 mt-0.5">
                Primary business details and allowed attendance channels.
              </p>
            </div>

            <div>
              <label className={lblClass}>
                Organization / Company Name <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                className={inpClass}
                placeholder="e.g. Apex Industrial Manufacturing Ltd"
                value={form.name}
                onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className={lblClass}>Industry / Sector</label>
                <select
                  className={inpClass}
                  value={form.industry}
                  onChange={(e) => setForm((prev) => ({ ...prev, industry: e.target.value }))}
                >
                  {INDUSTRIES.map((ind) => (
                    <option key={ind} value={ind} className="bg-[#07112d] text-white">
                      {ind}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className={lblClass}>Company Timezone</label>
                <select
                  className={inpClass}
                  value={form.timezone}
                  onChange={(e) => setForm((prev) => ({ ...prev, timezone: e.target.value }))}
                >
                  {TIMEZONES.map((tz) => (
                    <option key={tz} value={tz} className="bg-[#07112d] text-white">
                      {tz}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Attendance Capabilities */}
            <div className="p-4 rounded-xl bg-[#081333] border border-blue-400/25 space-y-3">
              <div className="text-xs font-bold uppercase tracking-wider text-blue-300">
                Authorized Check-In Capabilities
              </div>

              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  className="mt-0.5 h-4 w-4 rounded border-blue-400/40 text-blue-600 focus:ring-blue-500 accent-blue-500"
                  checked={form.allowDeviceCheckIn}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, allowDeviceCheckIn: e.target.checked }))
                  }
                />
                <div>
                  <span className="block text-xs sm:text-sm font-semibold text-white">
                    Hardware Biometric Kiosk Station & Verified Device Check-in
                  </span>
                  <span className="block text-[11px] text-blue-200/70 mt-0.5">
                    Recommended: Employees punch on on-premise authorized kiosk tablets or PC terminals.
                  </span>
                </div>
              </label>

              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  className="mt-0.5 h-4 w-4 rounded border-blue-400/40 text-blue-600 focus:ring-blue-500 accent-blue-500"
                  checked={form.allowManualCheckIn}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, allowManualCheckIn: e.target.checked }))
                  }
                />
                <div>
                  <span className="block text-xs sm:text-sm font-semibold text-white">
                    Supervisor Manual Override Portal
                  </span>
                  <span className="block text-[11px] text-blue-200/70 mt-0.5">
                    Allows authorized managers to manually record excused duty or field operations.
                  </span>
                </div>
              </label>

              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  className="mt-0.5 h-4 w-4 rounded border-blue-400/40 text-blue-600 focus:ring-blue-500 accent-blue-500"
                  checked={form.hasStudents}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, hasStudents: e.target.checked }))
                  }
                />
                <div>
                  <span className="block text-xs sm:text-sm font-semibold text-white">
                    Student & Apprentice Cohort Register
                  </span>
                  <span className="block text-[11px] text-blue-200/70 mt-0.5">
                    Enables classroom tracking, cohort assignments, and apprentice punch monitoring.
                  </span>
                </div>
              </label>
            </div>
          </div>
        )}

        {/* ── STEP 2: OFFICES & WORK HOURS ── */}
        {step === 2 && (
          <div className="space-y-4">
            <div className="border-b border-blue-400/20 pb-2">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <MapPin size={16} className="text-sky-400" />
                <span>Office Location, Shift Hours & Punctuality Policy</span>
              </h3>
              <p className="text-xs text-blue-200/70 mt-0.5">
                Defines the physical station schedule and lateness penalties.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className={lblClass}>
                  Primary Facility / Office Name <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  className={inpClass}
                  placeholder="e.g. Headquarters Lagos"
                  value={form.office.name}
                  onChange={(e) => updateOffice("name", e.target.value)}
                />
              </div>

              <div>
                <label className={lblClass}>
                  Office Physical Address <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  className={inpClass}
                  placeholder="e.g. 14 Commercial Ave, Sabo, Yaba"
                  value={form.office.address}
                  onChange={(e) => updateOffice("address", e.target.value)}
                />
              </div>
            </div>

            <div className="p-4 rounded-xl bg-[#081333] border border-blue-400/25 space-y-3">
              <div className="text-xs font-bold uppercase tracking-wider text-blue-300 flex items-center gap-2">
                <Clock size={14} className="text-sky-400" />
                <span>Daily Operating Hours & Break Window</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className={lblClass}>Opening Time</label>
                  <input
                    type="time"
                    className={inpClass}
                    value={form.office.openTime}
                    onChange={(e) => updateOffice("openTime", e.target.value)}
                  />
                </div>

                <div>
                  <label className={lblClass}>Closing Time</label>
                  <input
                    type="time"
                    className={inpClass}
                    value={form.office.closeTime}
                    onChange={(e) => updateOffice("closeTime", e.target.value)}
                  />
                </div>

                <div>
                  <label className={lblClass}>Break Start</label>
                  <input
                    type="time"
                    className={inpClass}
                    value={form.office.breakStart}
                    onChange={(e) => updateOffice("breakStart", e.target.value)}
                  />
                </div>

                <div>
                  <label className={lblClass}>Break End</label>
                  <input
                    type="time"
                    className={inpClass}
                    value={form.office.breakEnd}
                    onChange={(e) => updateOffice("breakEnd", e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-blue-400/20">
                <div>
                  <label className={lblClass}>Daily Break Limit (min)</label>
                  <input
                    type="number"
                    min={0}
                    className={inpClass}
                    value={form.office.breakMinutes}
                    onChange={(e) => updateOffice("breakMinutes", Number(e.target.value))}
                  />
                </div>

                <div>
                  <label className={lblClass}>Grace Period (min, ₦0)</label>
                  <input
                    type="number"
                    min={0}
                    className={inpClass}
                    value={form.office.graceMinutes}
                    onChange={(e) => updateOffice("graceMinutes", Number(e.target.value))}
                  />
                </div>

                <div>
                  <label className={lblClass}>Mark Late After (min)</label>
                  <input
                    type="number"
                    min={1}
                    className={inpClass}
                    value={form.office.lateAfterMinutes}
                    onChange={(e) => updateOffice("lateAfterMinutes", Number(e.target.value))}
                  />
                </div>
              </div>
              <p className="text-[11px] text-blue-200/70">
                Punctuality rule: Staff arriving within {form.office.graceMinutes} mins of opening are marked ON-TIME. After {form.office.lateAfterMinutes} mins, system logs LATE violation.
              </p>
            </div>
          </div>
        )}

        {/* ── STEP 3: DEPARTMENTS ── */}
        {step === 3 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-blue-400/20 pb-2">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Users size={16} className="text-sky-400" />
                  <span>Departments & Shift Roster</span>
                </h3>
                <p className="text-xs text-blue-200/70 mt-0.5">
                  Organize staff into operational units with department break schedules.
                </p>
              </div>

              <button
                type="button"
                onClick={addDepartment}
                className="px-3 py-1.5 rounded-lg bg-blue-600/30 hover:bg-blue-600/50 border border-blue-400/30 text-xs font-semibold text-sky-300 flex items-center gap-1.5 transition"
              >
                <Plus size={13} />
                <span>Add Department</span>
              </button>
            </div>

            <div className="space-y-3">
              {form.departments.map((dept, index) => (
                <div
                  key={index}
                  className="p-4 rounded-xl bg-[#081333] border border-blue-400/25 flex flex-col sm:flex-row sm:items-end gap-3"
                >
                  <div className="flex-1">
                    <label className={lblClass}>
                      Department {index + 1} Name <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="text"
                      className={inpClass}
                      placeholder="e.g. Operations, Engineering, Logistics"
                      value={dept.name}
                      onChange={(e) => updateDepartment(index, "name", e.target.value)}
                    />
                  </div>

                  <div className="w-full sm:w-32">
                    <label className={lblClass}>Break Start</label>
                    <input
                      type="time"
                      className={inpClass}
                      value={dept.breakStart}
                      onChange={(e) => updateDepartment(index, "breakStart", e.target.value)}
                    />
                  </div>

                  <div className="w-full sm:w-32">
                    <label className={lblClass}>Break End</label>
                    <input
                      type="time"
                      className={inpClass}
                      value={dept.breakEnd}
                      onChange={(e) => updateDepartment(index, "breakEnd", e.target.value)}
                    />
                  </div>

                  {form.departments.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeDepartment(index)}
                      className="p-2 text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-lg transition self-end sm:self-auto mb-0.5"
                      title="Remove Department"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              ))}
            </div>
            <p className="text-[11px] text-blue-200/70">
              Each department can manage separate shift sessions, employee assignments, and punctuality leaderboards.
            </p>
          </div>
        )}

        {/* ── STEP 4: ADMIN ACCOUNT CREDENTIALS ── */}
        {step === 4 && (
          <div className="space-y-4">
            <div className="border-b border-blue-400/20 pb-2">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Lock size={16} className="text-sky-400" />
                <span>Super Administrator Credentials</span>
              </h3>
              <p className="text-xs text-blue-200/70 mt-0.5">
                These master credentials allow you to access the TimeLogic Admin Dashboard and pair attendance kiosks.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className={lblClass}>
                  Admin First Name <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  className={inpClass}
                  placeholder="e.g. John"
                  value={form.admin.firstName}
                  onChange={(e) => updateAdmin("firstName", e.target.value)}
                />
              </div>

              <div>
                <label className={lblClass}>
                  Admin Last Name <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  className={inpClass}
                  placeholder="e.g. Adeyemi"
                  value={form.admin.lastName}
                  onChange={(e) => updateAdmin("lastName", e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className={lblClass}>
                Work / Company Email <span className="text-rose-400">*</span>
              </label>
              <input
                type="email"
                className={inpClass}
                placeholder="admin@yourcompany.com"
                value={form.admin.email}
                onChange={(e) => updateAdmin("email", e.target.value)}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className={lblClass}>
                  Password (min 8 chars) <span className="text-rose-400">*</span>
                </label>
                <input
                  type="password"
                  className={inpClass}
                  placeholder="••••••••"
                  value={form.admin.password}
                  onChange={(e) => updateAdmin("password", e.target.value)}
                />
              </div>

              <div>
                <label className={lblClass}>
                  Confirm Password <span className="text-rose-400">*</span>
                </label>
                <input
                  type="password"
                  className={inpClass}
                  placeholder="••••••••"
                  value={form.admin.confirmPassword}
                  onChange={(e) => updateAdmin("confirmPassword", e.target.value)}
                />
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-blue-500/10 border border-blue-400/25 flex items-start gap-2.5 text-xs text-blue-200">
              <ShieldCheck size={16} className="text-sky-400 flex-shrink-0 mt-0.5" />
              <span>
                Passwords are cryptographically salted and hashed using bcrypt. Your administrative account will have full authority to authorize on-premise hardware kiosks.
              </span>
            </div>
          </div>
        )}

        {/* ── STEP 5: SELECT PLAN TIER (STARTER 20K, ENTERPRISE 60K, ORGANISATION CUSTOM) ── */}
        {step === 5 && (
          <div className="space-y-5">
            <div className="border-b border-blue-400/20 pb-2">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Sparkles size={16} className="text-sky-400" />
                  <span>Select Your Monthly Plan</span>
                </h3>
                <span className="text-xs font-semibold text-sky-400">Monthly Licensing</span>
              </div>
              <p className="text-xs text-blue-200/70 mt-0.5">
                Starter (₦20k/mo) and Enterprise (₦60k/mo) can be provisioned online. Organisation tier requires custom consultation.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {plans.map((p) => {
                const isSelected = selectedPlan === p.id;
                return (
                  <div
                    key={p.id}
                    onClick={() => {
                      setSelectedPlan(p.id);
                      if (p.id === "organisation") {
                        setError("");
                      }
                    }}
                    className={`p-5 rounded-xl cursor-pointer border-2 transition-all flex flex-col justify-between ${
                      isSelected
                        ? p.isCustomContact
                          ? "bg-[#181d3d] border-amber-400 shadow-xl ring-2 ring-amber-400/30"
                          : "bg-[#10245a] border-sky-400 shadow-xl ring-2 ring-sky-400/30"
                        : "bg-[#081333] border-blue-400/20 hover:border-blue-400/40 hover:bg-[#0b1b46]"
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-bold text-white">{p.name}</span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            p.id === "enterprise"
                              ? "bg-sky-500 text-slate-950"
                              : p.isCustomContact
                              ? "bg-amber-500/20 text-amber-300 border border-amber-400/30"
                              : "bg-blue-500/20 text-blue-200"
                          }`}
                        >
                          {p.badge}
                        </span>
                      </div>

                      {/* Price Display */}
                      <div className="mt-2 mb-1 flex items-baseline gap-1.5">
                        <span className="text-2xl font-extrabold text-white">
                          {p.price}
                        </span>
                        {p.period && (
                          <span className="text-xs text-slate-300 font-medium">
                            {p.period}
                          </span>
                        )}
                      </div>

                      <div className="text-[11px] font-semibold uppercase tracking-wider text-sky-400 mb-2">
                        {p.capacity}
                      </div>

                      <p className="text-xs text-blue-100/75 leading-relaxed mb-4">
                        {p.desc}
                      </p>

                      <div className="space-y-2 border-t border-blue-400/20 pt-3">
                        {p.highlights.map((h, hIdx) => (
                          <div
                            key={hIdx}
                            className="flex items-start gap-2 text-[11px] text-blue-200/90"
                          >
                            <CheckCircle2 size={13} className="text-sky-400 flex-shrink-0 mt-0.5" />
                            <span>{h}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="pt-4 mt-4 border-t border-blue-400/20 flex items-center justify-between">
                      <span className="text-xs font-semibold text-blue-200">
                        {p.isCustomContact
                          ? "Contact Required"
                          : isSelected
                          ? "Selected Tier"
                          : "Click to Select"}
                      </span>
                      <div
                        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                          isSelected
                            ? p.isCustomContact
                              ? "border-amber-400 bg-amber-400 text-slate-950"
                              : "border-sky-400 bg-sky-400 text-slate-950"
                            : "border-blue-400/40"
                        }`}
                      >
                        {isSelected && <div className="w-2 h-2 rounded-full bg-slate-950" />}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* ── ORGANISATION CONTACT CALLOUT WHEN SELECTED ── */}
            {selectedPlan === "organisation" && (
              <div className="p-5 rounded-xl bg-[#1c1f38] border-2 border-amber-400/60 shadow-xl space-y-4 animate-in fade-in duration-200">
                <div className="flex items-start gap-3">
                  <AlertCircle size={20} className="text-amber-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-bold text-amber-200">
                      Organisation Plan: Online Checkout Disabled (Custom Headcount)
                    </h4>
                    <p className="text-xs text-slate-300 leading-relaxed mt-1">
                      For large enterprises, multi-branch campuses, and apprentice training cohorts, our technical architecture team configures custom database instances and provides on-site terminal pairing. Please contact our deployment team directly via email or phone:
                    </p>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-3 pt-1">
                  <Button
                    variant="outline"
                    size="md"
                    href="mailto:deployment@timelogic.app?subject=TimeLogic%20Custom%20Organisation%20Deployment%20Inquiry&body=Hello%20TimeLogic%20Team%2C%0A%0AWe%20would%20like%20to%20deploy%20TimeLogic%20for%20our%20organisation%20with%20custom%20headcount.%0A%0AOrganisation%20Name%3A%20...%0AEstimated%20Employees%3A%20...%0APhone%20Number%3A%20..."
                    icon={<Mail size={15} />}
                    className="w-full sm:w-auto justify-center text-white border-white/30 hover:bg-white/10 font-bold"
                  >
                    Email Deployment Team
                  </Button>

                  <Button
                    variant="primary"
                    size="md"
                    href="tel:09036627043"
                    icon={<PhoneCall size={15} />}
                    className="w-full sm:w-auto justify-center bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold shadow-md hover:shadow-lg"
                  >
                    Call Phone: 09036627043
                  </Button>
                </div>

                <p className="text-[11px] text-amber-300/80 italic">
                  Tip: To continue self-serve registration online right now, click <strong>Starter (₦20,000)</strong> or <strong>Enterprise (₦60,000)</strong> above.
                </p>
              </div>
            )}
          </div>
        )}

        {/* ── STEP 6: PAYMENT GATEWAY HAND-OFF (PAYSTACK) ── */}
        {step === 6 && (
          <div className="space-y-5">
            <div className="border-b border-blue-400/20 pb-2">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <CreditCard size={16} className="text-sky-400" />
                <span>TimeLogic Paystack Payment Gateway</span>
              </h3>
              <p className="text-xs text-blue-200/70 mt-0.5">
                Complete your monthly license fee on Paystack. Once paid, your master admin credentials will be displayed and dispatched.
              </p>
            </div>

            {/* Summary Review Card */}
            <div className="p-4 rounded-xl bg-[#081333] border border-blue-400/30 space-y-3">
              <div className="text-xs font-bold uppercase tracking-wider text-sky-400">
                Order & Account Provisioning Summary
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-blue-300">Organisation:</span>{" "}
                  <strong className="text-white">{form.name || "N/A"}</strong>
                </div>
                <div>
                  <span className="text-blue-300">Primary Office:</span>{" "}
                  <strong className="text-white">
                    {form.office.name} ({form.office.openTime} – {form.office.closeTime})
                  </strong>
                </div>
                <div>
                  <span className="text-blue-300">Super Administrator:</span>{" "}
                  <strong className="text-white">
                    {form.admin.firstName} {form.admin.lastName} ({form.admin.email})
                  </strong>
                </div>
                <div>
                  <span className="text-blue-300">Selected Plan:</span>{" "}
                  <strong className="text-sky-300 uppercase">
                    {selectedPlan === "starter" ? "Starter (20 Employees)" : "Enterprise (60 Employees)"}
                  </strong>
                </div>
                <div>
                  <span className="text-blue-300">Total Monthly Amount:</span>{" "}
                  <strong className="text-emerald-400 text-sm">
                    {selectedPlan === "starter" ? "₦20,000" : "₦60,000"} / month
                  </strong>
                </div>
                <div>
                  <span className="text-blue-300">Payment Channel:</span>{" "}
                  <strong className="text-white">Paystack Official Gateway</strong>
                </div>
              </div>
            </div>

            {/* Paystack Payment Card */}
            <div className="p-5 rounded-2xl bg-gradient-to-br from-[#0e2154] to-[#081438] border-2 border-sky-400/50 shadow-xl space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-sm font-bold text-white tracking-tight">
                    Paystack Checkout Ready ({selectedPlan === "starter" ? "₦20,000" : "₦60,000"})
                  </span>
                </div>
                <span className="text-[11px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-sky-500/20 border border-sky-400/30 text-sky-300">
                  SECURE GATEWAY
                </span>
              </div>

              <p className="text-xs text-blue-100/85 leading-relaxed">
                Click below to complete your payment on the official TimeLogic Paystack checkout page. After your transaction, return to view your confirmation and administrator access credentials.
              </p>

              <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
                <Button
                  variant="primary"
                  size="lg"
                  onClick={handleOpenPaystack}
                  icon={<ExternalLink size={16} />}
                  iconPosition="right"
                  className="w-full sm:w-auto justify-center bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold shadow-lg hover:shadow-xl"
                >
                  Pay {selectedPlan === "starter" ? "₦20,000" : "₦60,000"} on Paystack
                </Button>

                <Button
                  variant="outline"
                  size="lg"
                  onClick={handleGoToSuccess}
                  icon={<CheckCircle2 size={16} />}
                  className="w-full sm:w-auto justify-center text-white border-white/30 hover:bg-white/10 font-bold"
                >
                  I Have Completed Payment
                </Button>
              </div>

              {paymentInitiated && (
                <div className="p-3.5 rounded-xl bg-emerald-500/15 border border-emerald-400/30 text-emerald-200 text-xs flex items-center justify-between gap-3">
                  <span>
                    Paystack checkout opened in a new tab. Once payment succeeds, click <strong>"I Have Completed Payment"</strong> to view your provisioning receipt.
                  </span>
                  <button
                    onClick={handleGoToSuccess}
                    className="px-3 py-1.5 rounded-lg bg-emerald-500 text-slate-950 font-bold hover:bg-emerald-400 flex-shrink-0 transition"
                  >
                    View Receipt →
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── FOOTER NAVIGATION CONTROLS ── */}
        <div className="mt-7 pt-5 border-t border-blue-400/20 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={handleBack}
            disabled={step === 1}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-1.5 transition ${
              step === 1
                ? "opacity-30 cursor-not-allowed text-slate-400"
                : "text-blue-200 hover:text-white hover:bg-white/10 border border-blue-400/20"
            }`}
          >
            <ChevronLeft size={16} />
            <span>Back</span>
          </button>

          {step < 6 ? (
            <Button
              variant="primary"
              size="md"
              onClick={handleNext}
              disabled={step === 5 && selectedPlan === "organisation"}
              icon={<ChevronRight size={16} />}
              iconPosition="right"
              className={`shadow-md hover:shadow-lg font-bold ${
                step === 5 && selectedPlan === "organisation"
                  ? "opacity-40 cursor-not-allowed"
                  : ""
              }`}
            >
              {step === 5 ? "Proceed to Payment Gateway" : "Continue"}
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
