import React from 'react';
import { Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const ORG_COLORS = ['#EF4444','#F59E0B','#10B981','#3B82F6','#8B5CF6'];

export default function OrgList({ orgs }: { orgs: any[] }) {
  const navigate = useNavigate();
  const visible = orgs.filter((o) => o.id !== 'platform-org').slice(0, 5);

  return (
    <div className="bg-[var(--card-bg)] rounded-2xl border border-[var(--border)] p-5 flex flex-col h-full">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-[15px] text-[var(--text-main)]">Organization</h3>
        <button
          onClick={() => navigate('/organizations')}
          className="flex items-center gap-1 text-xs font-semibold border border-[var(--border)] rounded-xl px-2.5 py-1.5 text-[var(--text-muted)] hover:bg-[var(--hover-bg)] transition-colors"
        >
          <Plus size={12} /> New
        </button>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto">
        {visible.length === 0 ? (
          <p className="text-sm text-[var(--text-muted)] text-center py-6">No organizations yet</p>
        ) : visible.map((org, i) => (
          <div key={org.id} className="flex items-center gap-3 cursor-pointer hover:bg-[var(--hover-bg)] rounded-xl px-2 py-1.5 transition-colors" onClick={() => navigate('/organizations')}>
            <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 text-white text-xs font-black"
              style={{ background: ORG_COLORS[i % ORG_COLORS.length] }}>
              {org.name?.[0]?.toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-semibold text-[var(--text-main)] truncate">{org.name}</p>
              <p className="text-[11px] text-[var(--text-muted)]">
                {org._count?.users ?? 0} users · {org._count?.offices ?? 0} offices
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
