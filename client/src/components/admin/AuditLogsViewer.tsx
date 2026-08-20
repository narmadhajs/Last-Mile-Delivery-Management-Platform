import React, { useState, useEffect } from 'react';
import { notificationApi } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { ShieldCheck, Search, Clock, MapPin, User, FileText } from 'lucide-react';

export const AuditLogsViewer: React.FC = () => {
  const { showToast } = useToast();
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res: any = await notificationApi.getAuditLogs();
      if (res.success && res.data) {
        setLogs(res.data);
      }
    } catch (err: any) {
      showToast({ type: 'error', title: 'Failed to load audit logs', message: err.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const filteredLogs = logs.filter((log) => {
    const q = search.toLowerCase();
    return (
      log.order?.trackingNumber?.toLowerCase().includes(q) ||
      log.status?.toLowerCase().includes(q) ||
      log.actorName?.toLowerCase().includes(q) ||
      log.actorRole?.toLowerCase().includes(q) ||
      log.remarks?.toLowerCase().includes(q) ||
      log.locationText?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-4">
      
      {/* Header & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900/60 p-4 rounded-2xl border border-slate-800">
        <div>
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-indigo-400" />
            Immutable Audit Ledger & Event Log
          </h3>
          <p className="text-xs text-slate-400">
            Append-only chronological record of every status transition, agent assignment, and customer reschedule event.
          </p>
        </div>

        <div className="relative max-w-xs w-full">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search audit trail..."
            className="w-full pl-9 pr-3 py-1.5 rounded-xl glass-input text-xs"
          />
        </div>
      </div>

      {/* Log Feed */}
      <div className="space-y-2.5 max-h-[500px] overflow-y-auto pr-1">
        {filteredLogs.length === 0 ? (
          <div className="p-8 text-center rounded-2xl bg-slate-900/40 border border-slate-800 text-slate-500 text-xs">
            No audit logs matching search query.
          </div>
        ) : (
          filteredLogs.map((log) => (
            <div
              key={log.id}
              className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition space-y-2 text-xs"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-brand-300">
                    {log.order?.trackingNumber || 'System Event'}
                  </span>
                  <span className="font-bold text-white uppercase text-[11px] px-2 py-0.5 rounded-md bg-slate-800 border border-slate-700">
                    {log.status.replace(/_/g, ' ')}
                  </span>
                  {log.previousStatus && (
                    <span className="text-[10px] text-slate-500">
                      (from {log.previousStatus})
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-1.5 text-slate-400 font-mono text-[11px]">
                  <Clock className="w-3.5 h-3.5" />
                  {new Date(log.timestamp).toLocaleString()}
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-400 bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/60">
                <span className="flex items-center gap-1 text-slate-300">
                  <User className="w-3 h-3 text-slate-400" />
                  Actor: <b className="text-white">{log.actorName}</b> ({log.actorRole})
                </span>
                {log.locationText && (
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-brand-400" />
                    {log.locationText}
                  </span>
                )}
              </div>

              {log.remarks && (
                <p className="text-slate-300 italic text-[11px]">
                  "{log.remarks}"
                </p>
              )}

              {log.failureReason && (
                <p className="text-rose-300 font-semibold text-[11px]">
                  Failure Reason: {log.failureReason}
                </p>
              )}
            </div>
          ))
        )}
      </div>

    </div>
  );
};
