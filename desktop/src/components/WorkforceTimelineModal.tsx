import React, { useEffect, useState } from 'react';
import {
  X, ShieldCheck, CheckCircle2, Clock, Smartphone,
  Wifi, Calendar, Coffee, Calculator, FileCheck, Copy, Check,
  AlertTriangle, ArrowRight, UserCheck, Award,
} from 'lucide-react';
import { fetchWorkforceTimeline } from '../services';

interface Props {
  employeeId: string;
  date?: string;
  recordId?: string;
  onClose: () => void;
}

export default function WorkforceTimelineModal({ employeeId, date, recordId, onClose }: Props) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [copiedHash, setCopiedHash] = useState(false);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);
    fetchWorkforceTimeline(employeeId, { date, recordId })
      .then((res) => {
        if (active) setData(res);
      })
      .catch((err) => {
        if (active) setError(err.message || 'Could not load workforce timeline');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, [employeeId, date, recordId]);

  const copyHash = (hash: string) => {
    navigator.clipboard.writeText(hash);
    setCopiedHash(true);
    setTimeout(() => setCopiedHash(false), 2000);
  };

  const getStageIcon = (stageNumber: number) => {
    switch (stageNumber) {
      case 1: return <UserCheck size={18} className="text-primary-600" />;
      case 2: return <ShieldCheck size={18} className="text-emerald-600" />;
      case 3: return <Clock size={18} className="text-blue-600" />;
      case 4: return <Clock size={18} className="text-indigo-600" />;
      case 5: return <Smartphone size={18} className="text-cyan-600" />;
      case 6: return <Wifi size={18} className="text-teal-600" />;
      case 7: return <Calendar size={18} className="text-purple-600" />;
      case 8: return <Coffee size={18} className="text-amber-600" />;
      case 9: return <CheckCircle2 size={18} className="text-blue-600" />;
      case 10: return <Calculator size={18} className="text-violet-600" />;
      case 11: return <FileCheck size={18} className="text-emerald-600" />;
      case 12: return <Award size={18} className="text-emerald-600" />;
      default: return <CheckCircle2 size={18} className="text-primary-600" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-950/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary-100 dark:bg-primary-950/60 border border-primary-200 dark:border-primary-800 flex items-center justify-center text-primary-600 dark:text-primary-400">
              <ShieldCheck size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                  Trusted Workforce Record
                </h2>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 font-bold">
                  12-STAGE CUSTODY PROOF
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Authoritative verifiable historical timeline and proof of custody
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {loading && (
            <div className="flex flex-col items-center justify-center py-20 gap-3 text-slate-400">
              <div className="w-8 h-8 rounded-full border-2 border-primary-600 border-t-transparent animate-spin" />
              <p className="text-sm">Verifying provenance & cryptographic audit ledger...</p>
            </div>
          )}

          {error && (
            <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800/50 text-red-700 dark:text-red-300 flex items-center gap-3">
              <AlertTriangle size={20} />
              <span>{error}</span>
            </div>
          )}

          {!loading && data && (
            <>
              {/* Employee & Record Summary Card */}
              <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-50 to-slate-100/60 dark:from-slate-800/40 dark:to-slate-800/20 border border-slate-200/80 dark:border-slate-800 flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-primary-600 text-white flex items-center justify-center font-bold text-lg shadow-md shadow-primary-500/20">
                    {data.employee?.name?.slice(0, 2)?.toUpperCase()}
                  </div>
                  <div>
                    <h3 className="font-bold text-base text-slate-900 dark:text-white">
                      {data.employee?.name}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Code: <span className="font-mono font-semibold text-slate-700 dark:text-slate-300">{data.employee?.code || 'N/A'}</span>
                      {' · '}{data.employee?.department || 'Operations'} · {data.employee?.office || 'HQ'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Lifecycle State</p>
                    <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-bold ${
                      data.lifecycleState === 'FINALIZED'
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                        : data.lifecycleState === 'IN_PROGRESS'
                        ? 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300'
                        : 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                    }`}>
                      {data.lifecycleState}
                    </span>
                  </div>
                </div>
              </div>

              {/* Calculated Metrics Strip */}
              {data.calculatedSummary && (
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800 text-center">
                    <p className="text-[10px] font-bold text-slate-400 uppercase">Gross Hours</p>
                    <p className="text-base font-extrabold text-slate-800 dark:text-white mt-0.5">{data.calculatedSummary.grossHours}h</p>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800 text-center">
                    <p className="text-[10px] font-bold text-slate-400 uppercase">Break Deductions</p>
                    <p className="text-base font-extrabold text-amber-600 mt-0.5">{data.calculatedSummary.totalBreakMinutes}m</p>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800 text-center">
                    <p className="text-[10px] font-bold text-slate-400 uppercase">Net Worked</p>
                    <p className="text-base font-extrabold text-primary-600 mt-0.5">{data.calculatedSummary.netWorkHours}h</p>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800 text-center">
                    <p className="text-[10px] font-bold text-slate-400 uppercase">Overtime</p>
                    <p className="text-base font-extrabold text-emerald-600 mt-0.5">{data.calculatedSummary.overtimeHours}h</p>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800 text-center col-span-2 sm:col-span-1">
                    <p className="text-[10px] font-bold text-slate-400 uppercase">Penalties</p>
                    <p className="text-base font-extrabold text-red-600 mt-0.5">₦{data.calculatedSummary.penalties?.toLocaleString() || 0}</p>
                  </div>
                </div>
              )}

              {/* Cryptographic Proof Hash Banner */}
              {data.recordHash && (
                <div className="p-3.5 rounded-xl bg-slate-900 text-slate-200 text-xs font-mono flex items-center justify-between gap-3 border border-slate-800 shadow-inner">
                  <div className="flex items-center gap-2 truncate">
                    <Award size={16} className="text-emerald-400 flex-shrink-0" />
                    <span className="text-slate-400 flex-shrink-0">SHA-256 Audit Hash:</span>
                    <span className="text-emerald-300 font-bold truncate">{data.recordHash}</span>
                  </div>
                  <button
                    onClick={() => copyHash(data.recordHash)}
                    className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-300 hover:text-white flex-shrink-0 transition-colors"
                    title="Copy Proof Hash"
                  >
                    {copiedHash ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                  </button>
                </div>
              )}

              {/* The 12-Stage Timeline Chain */}
              <div className="pt-2">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 px-1">
                  Verified Stages of Work (Chain of Custody)
                </h4>

                <div className="space-y-3 relative before:absolute before:inset-0 before:left-[19px] before:w-[2px] before:bg-slate-200 dark:before:bg-slate-800 before:z-0">
                  {data.stages?.map((stage: any) => (
                    <div key={stage.stageNumber} className="relative z-10 flex items-start gap-4 p-3.5 rounded-xl bg-white dark:bg-slate-800/70 border border-slate-200/70 dark:border-slate-800 shadow-sm hover:border-primary-400/50 transition-all">
                      <div className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700/60 flex items-center justify-center flex-shrink-0 shadow-sm">
                        {getStageIcon(stage.stageNumber)}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span className="text-[11px] font-bold text-slate-400 font-mono">Stage {stage.stageNumber}</span>
                            <span className="text-xs font-bold text-slate-900 dark:text-white">{stage.title}</span>
                          </div>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            ['VERIFIED', 'PASSED', 'COMPLETED', 'CALCULATED', 'FINALIZED', 'SYNCHRONIZED', 'BOUND_HARDWARE', 'OFFICE_NETWORK', 'FROZEN_SNAPSHOT'].includes(stage.status)
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                              : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                          }`}>
                            {stage.status}
                          </span>
                        </div>

                        <p className="text-xs text-slate-600 dark:text-slate-300 font-medium mt-1">
                          {stage.summary}
                        </p>

                        {/* Stage Details expansion */}
                        {stage.details && (
                          <div className="mt-2 p-2.5 rounded-lg bg-slate-50 dark:bg-slate-900/60 border border-slate-200/50 dark:border-slate-800/60 text-[11px] text-slate-500 dark:text-slate-400 space-y-1 font-mono">
                            {Object.entries(stage.details).map(([key, val]) => {
                              if (val === null || val === undefined) return null;
                              return (
                                <div key={key} className="flex items-center justify-between gap-4">
                                  <span className="text-slate-400">{key}:</span>
                                  <span className="font-semibold text-slate-700 dark:text-slate-300 text-right truncate max-w-xs">
                                    {typeof val === 'object' ? JSON.stringify(val) : String(val)}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-950/40">
          <span className="text-xs text-slate-400">TimeLogic Cryptographic Workforce Chain v2.4</span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition-colors"
          >
            Close Provenance View
          </button>
        </div>

      </div>
    </div>
  );
}
