import React from 'react';
import { useToast } from '../../context/ToastContext';
import { Mail, MessageSquare, Bell, X, CheckCheck, Clock, ExternalLink } from 'lucide-react';

export const NotificationDrawer: React.FC = () => {
  const { notifications, isDrawerOpen, setIsDrawerOpen, refreshNotifications } = useToast();

  if (!isDrawerOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
        onClick={() => setIsDrawerOpen(false)}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-[#0f172a] border-l border-slate-800 shadow-2xl flex flex-col">
          
          {/* Drawer Header */}
          <div className="px-6 py-4 border-b border-slate-800 bg-slate-900/60 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-brand-500/10 text-brand-400 border border-brand-500/20">
                <Bell className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-white">Live Notification Center</h3>
                <p className="text-[11px] text-slate-400">Simulated Multi-Channel Email & SMS Feed</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={refreshNotifications}
                className="text-xs text-brand-400 hover:text-brand-300 font-medium px-2 py-1 bg-brand-500/10 rounded-md border border-brand-500/20"
              >
                Refresh
              </button>
              <button
                onClick={() => setIsDrawerOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Notifications List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {notifications.length === 0 ? (
              <div className="h-64 flex flex-col items-center justify-center text-center p-6 text-slate-500">
                <Bell className="w-10 h-10 mb-2 opacity-40" />
                <p className="text-sm font-medium">No notifications generated yet</p>
                <p className="text-xs mt-1">Book an order or change status to view live Email/SMS alerts</p>
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/60 hover:border-slate-600 transition"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span
                      className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                        n.channel === 'EMAIL'
                          ? 'bg-sky-500/10 text-sky-400 border border-sky-500/20'
                          : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                      }`}
                    >
                      {n.channel === 'EMAIL' ? <Mail className="w-3 h-3" /> : <MessageSquare className="w-3 h-3" />}
                      {n.channel} Alert
                    </span>

                    <span className="text-[11px] text-slate-400 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  <h4 className="text-xs font-bold text-slate-200 mb-1">{n.title}</h4>
                  <p className="text-xs text-slate-300 whitespace-pre-line bg-slate-900/60 p-2.5 rounded-lg border border-slate-800 font-mono text-[11px] leading-relaxed">
                    {n.message}
                  </p>

                  <div className="mt-2.5 flex items-center justify-between text-[11px] text-slate-400 border-t border-slate-700/40 pt-2">
                    <span className="truncate max-w-[200px]">
                      To: {n.channel === 'EMAIL' ? n.recipientEmail : n.recipientPhone || n.recipientEmail}
                    </span>
                    <span className="flex items-center gap-1 text-emerald-400 text-[10px] font-semibold">
                      <CheckCheck className="w-3 h-3" />
                      Delivered
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer Note */}
          <div className="p-4 bg-slate-900/80 border-t border-slate-800 text-center">
            <p className="text-[11px] text-slate-400">
              💡 Production Ready: Configure SMTP or Twilio API keys in <code className="text-brand-300 font-mono">.env</code> to dispatch live carrier emails & SMS.
            </p>
          </div>

        </div>
      </div>
    </div>
  );
};
