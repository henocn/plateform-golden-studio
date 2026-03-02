import { useNavigate } from 'react-router-dom';
import {
  X,
  CheckCheck,
  MessageSquare,
  ClipboardCheck,
  Clock,
  Calendar,
  Trash2,
} from 'lucide-react';
import { useNotificationStore } from '../../store/notificationStore';
import { useClickOutside } from '../../hooks';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

const TYPE_CONFIG = {
  task_comment: {
    icon: MessageSquare,
    color: 'text-blue-500',
    bg: 'bg-blue-50',
  },
  task_pending_validation: {
    icon: ClipboardCheck,
    color: 'text-amber-500',
    bg: 'bg-amber-50',
  },
  task_deadline_warning: {
    icon: Clock,
    color: 'text-red-500',
    bg: 'bg-red-50',
  },
  publication_deadline_warning: {
    icon: Calendar,
    color: 'text-orange-500',
    bg: 'bg-orange-50',
  },
};

/* Formate la date relative en français */
function timeAgo(dateStr) {
  try {
    return formatDistanceToNow(new Date(dateStr), { addSuffix: true, locale: fr });
  } catch {
    return '';
  }
}


// ═══════════════════════════════════════════════════
//               NotificationPanel
// ═══════════════════════════════════════════════════


export default function NotificationPanel() {
  const navigate = useNavigate();
  const {
    notifications,
    unreadCount,
    loading,
    panelOpen,
    closePanel,
    markAsRead,
    markAllAsRead,
    removeNotification,
  } = useNotificationStore();

  const panelRef = useClickOutside(() => closePanel());

  if (!panelOpen) return null;

  /* Clic sur une notification : marque comme lue + navigue */
  const handleClick = async (notif) => {
    if (!notif.is_read) {
      await markAsRead(notif.id);
    }
    if (notif.link) {
      navigate(notif.link);
      closePanel();
    }
  };

  /* Supprime une notification sans naviguer */
  const handleDelete = (e, id) => {
    e.stopPropagation();
    removeNotification(id);
  };

  return (
    <div
      ref={panelRef}
      className="absolute right-0 top-full mt-2 w-96 max-h-[32rem] bg-white rounded-xl border border-surface-200 shadow-dropdown animate-fade-in flex flex-col z-50"
    >
      {/* ── En-tête ──────────────────── */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-surface-200">
        <h3 className="text-body-md font-semibold text-ink-900">
          Notifications
          {unreadCount > 0 && (
            <span className="ml-2 text-xs px-1.5 py-0.5 rounded-full bg-danger-500 text-white">
              {unreadCount}
            </span>
          )}
        </h3>
        <div className="flex items-center gap-1">
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="p-1.5 rounded-lg text-ink-400 hover:bg-surface-100 hover:text-primary-500 transition-default"
              title="Tout marquer comme lu"
            >
              <CheckCheck className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={closePanel}
            className="p-1.5 rounded-lg text-ink-400 hover:bg-surface-100 hover:text-ink-700 transition-default"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ── Liste ────────────────────── */}
      <div className="overflow-y-auto flex-1">
        {loading && notifications.length === 0 ? (
          <div className="p-8 text-center text-ink-400 text-body-sm">
            Chargement…
          </div>
        ) : notifications.length === 0 ? (
          <div className="p-8 text-center text-ink-400 text-body-sm">
            Aucune notification
          </div>
        ) : (
          notifications.map((notif) => {
            const cfg = TYPE_CONFIG[notif.type] || TYPE_CONFIG.task_comment;
            const Icon = cfg.icon;

            return (
              <div
                key={notif.id}
                onClick={() => handleClick(notif)}
                className={`
                  flex items-start gap-3 px-4 py-3 cursor-pointer transition-default
                  hover:bg-surface-50 border-b border-surface-100 last:border-b-0
                  ${!notif.is_read ? 'bg-primary-50/30' : ''}
                `}
              >
                <div className={`mt-0.5 p-2 rounded-lg shrink-0 ${cfg.bg}`}>
                  <Icon className={`w-4 h-4 ${cfg.color}`} />
                </div>

                <div className="flex-1 min-w-0">
                  <p className={`text-body-sm leading-snug ${!notif.is_read ? 'font-semibold text-ink-900' : 'text-ink-700'}`}>
                    {notif.title}
                  </p>
                  {notif.message && (
                    <p className="text-xs text-ink-400 mt-0.5 line-clamp-2">
                      {notif.message}
                    </p>
                  )}
                  <p className="text-xs text-ink-300 mt-1">
                    {timeAgo(notif.created_at)}
                  </p>
                </div>

                <div className="flex items-center gap-1 shrink-0 mt-1">
                  {!notif.is_read && (
                    <div className="w-2 h-2 rounded-full bg-primary-500" />
                  )}
                  <button
                    onClick={(e) => handleDelete(e, notif.id)}
                    className="p-1 rounded text-ink-300 hover:text-danger-500 hover:bg-danger-50 transition-default"
                    title="Supprimer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
