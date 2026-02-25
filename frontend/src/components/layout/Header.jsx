import { useState, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Menu, LogOut, User, ChevronDown, Bell } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useClickOutside } from '../../hooks';
import Avatar from '../ui/Avatar';
import { ROLE_LABELS } from '../../utils/helpers';

export default function Header({ sidebarCollapsed, onMenuClick }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuthStore();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useClickOutside(() => setMenuOpen(false));

  const roleInfo = ROLE_LABELS[user?.role] || { label: user?.role, color: '#6B7280' };

  // Build breadcrumb from path
  const pathSegments = location.pathname.split('/').filter(Boolean);
  const breadcrumbLabels = {
    dashboard: 'Dashboard',
    organization: 'Organisation',
    organizations: 'Organisations',
    users: 'Utilisateurs',
    projects: 'Projets',
    tasks: 'Tâches',
    proposals: 'Propositions',
    calendar: 'Calendrier',
    media: 'Médiathèque',
    reporting: 'Reporting',
    audit: 'Audit',
    settings: 'Paramètres',
    profile: 'Profil',
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <header className="sticky top-0 z-30 h-16 bg-white/80 backdrop-blur-md border-b border-surface-200">
      <div className="flex items-center justify-between h-full px-6">
        {/* ── Left: Menu + Breadcrumb ──── */}
        <div className="flex items-center gap-4">
          <button
            onClick={onMenuClick}
            className="lg:hidden p-2 rounded-lg text-ink-400 hover:bg-surface-100 hover:text-ink-700 transition-default"
          >
            <Menu className="w-5 h-5" />
          </button>

          <nav className="hidden sm:flex items-center gap-1.5 text-body-sm">
            {pathSegments.map((seg, i) => {
              const label = breadcrumbLabels[seg] || seg;
              const isLast = i === pathSegments.length - 1;
              return (
                <span key={i} className="flex items-center gap-1.5">
                  {i > 0 && <span className="text-ink-300">/</span>}
                  <span className={isLast ? 'text-ink-900 font-medium' : 'text-ink-400'}>
                    {label}
                  </span>
                </span>
              );
            })}
          </nav>
        </div>

        {/* ── Right: Notifications + User ─ */}
        <div className="flex items-center gap-2">
          {/* Notifications bell */}
          <button className="relative p-2 rounded-lg text-ink-400 hover:bg-surface-100 hover:text-ink-700 transition-default">
            <Bell className="w-5 h-5" />
            {/* Unread dot */}
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-danger-500 rounded-full ring-2 ring-white" />
          </button>

          {/* User dropdown */}
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="flex items-center gap-2.5 p-1.5 pr-3 rounded-xl hover:bg-surface-100 transition-default"
            >
              <Avatar
                firstName={user?.first_name}
                lastName={user?.last_name}
                size="sm"
              />
              <div className="hidden md:block text-left min-w-0">
                <p className="text-body-sm font-medium text-ink-900 truncate">
                  {user?.first_name} {user?.last_name}
                </p>
                <p className="text-[0.625rem] truncate" style={{ color: roleInfo.color }}>
                  {roleInfo.label}
                </p>
                {user?.user_type === 'client' && user?.organization_name && (
                  <p className="text-[0.6rem] text-ink-400 truncate">{user.organization_name}</p>
                )}
              </div>
              <ChevronDown className={`w-4 h-4 text-ink-400 transition-transform ${menuOpen ? 'rotate-180' : ''}`} />
            </button>

            {menuOpen && (
              <div className="absolute right-0 top-full mt-1 w-52 bg-white rounded-xl border border-surface-200 shadow-dropdown animate-fade-in py-1.5">
                <div className="px-3 py-2 border-b border-surface-200 mb-1">
                  <p className="text-body-sm font-medium text-ink-900 truncate">
                    {user?.first_name} {user?.last_name}
                  </p>
                  <p className="text-body-sm text-ink-400 truncate">{user?.email}</p>
                </div>

                <button
                  onClick={() => { setMenuOpen(false); navigate('/profile'); }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-body-sm text-ink-700 hover:bg-surface-100 transition-default"
                >
                  <User className="w-4 h-4 text-ink-400" />
                  Mon profil
                </button>

                <div className="border-t border-surface-200 my-1" />

                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2 px-3 py-2 text-body-sm text-danger-500 hover:bg-danger-50 transition-default"
                >
                  <LogOut className="w-4 h-4" />
                  Se déconnecter
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
