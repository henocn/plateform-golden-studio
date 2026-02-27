import { useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  FolderKanban,
  CheckSquare,
  Calendar,
  Megaphone,
  Image,
  BarChart3,
  Users,
  Building2,
  Shield,
  Settings,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useOrganizationStore } from '../../store/organizationStore';

const navItems = [
  { label: 'Dashboard',            to: '/dashboard',          icon: LayoutDashboard },
  { label: 'Projets',              to: '/projects',           icon: FolderKanban },
  { label: 'Tâches',               to: '/tasks',              icon: CheckSquare },
  { label: 'Propositions',         to: '/proposals',          icon: FolderKanban },
  { label: 'Calendrier éditorial', to: '/calendar/editorial', icon: Megaphone },
  { label: 'Calendrier événements', to: '/calendar/events',   icon: Calendar },
  { label: 'Médiathèque',          to: '/media',              icon: Image },
  { label: 'Reporting',            to: '/reporting',          icon: BarChart3, roles: ['super_admin', 'admin', 'validator'], internal: true },
  { label: 'Utilisateurs',         to: '/users',              icon: Users, roles: ['super_admin', 'admin', 'client_admin'] },
  { label: 'Audit',                to: '/audit',              icon: Shield, roles: ['super_admin', 'admin'], internal: true },
];

const bottomItems = [
  { label: 'Paramètres',     to: '/settings',       icon: Settings },
];

export default function Sidebar({ collapsed, onToggle, mobileOpen, onMobileClose }) {
  const { user } = useAuthStore();
  const { current, fetchCurrent, logoUrl, displayName } = useOrganizationStore();
  const location = useLocation();

  useEffect(() => {
    fetchCurrent();
  }, [fetchCurrent]);

  const isClient = user?.user_type === 'client';
  const logoSrc = logoUrl();
  const orgName = displayName();

  const filteredNav = navItems.filter((item) => {
    // Hide internal-only items from client users
    if (item.internal && isClient) return false;
    // Check role restriction
    if (item.roles && !item.roles.includes(user?.role)) return false;
    return true;
  });

  const isActive = (to) => location.pathname.startsWith(to);

  const NavItem = ({ item }) => (
    <NavLink
      to={item.to}
      onClick={onMobileClose}
      className={`
        group flex items-center gap-3 px-3 py-2 rounded-lg
        text-body-md font-medium transition-default
        ${isActive(item.to)
          ? 'bg-primary-50 text-primary-500'
          : 'text-ink-500 hover:bg-surface-200 hover:text-ink-700'
        }
      `}
    >
      <item.icon
        className={`w-5 h-5 shrink-0 ${
          isActive(item.to) ? 'text-primary-500' : 'text-ink-400 group-hover:text-ink-700'
        }`}
      />
      {!collapsed && (
        <span className="truncate">{item.label}</span>
      )}
      {/* Active indicator */}
      {isActive(item.to) && !collapsed && (
        <div className="ml-auto w-1.5 h-1.5 rounded-full bg-primary-500" />
      )}
    </NavLink>
  );

  return (
    <aside
      className={`
        fixed top-0 left-0 h-full z-50
        bg-white border-r border-surface-200 shadow-sidebar
        flex flex-col
        transition-all duration-300 ease-out
        ${collapsed ? 'w-[72px]' : 'w-68'}
        ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}
    >
      {/* ── Logo Kidou (gauche) + Logo organisation backend (droite), justify-between ─────────── */}
      <div className={`flex items-center justify-between border-b border-surface-200 shrink-0 gap-2 ${collapsed ? 'h-14 px-2' : 'h-20 px-4'}`}>
        <img
          src="/images/Qidoo white.jpeg"
          alt=""
          className={`object-contain shrink-0 ${collapsed ? 'h-9 w-auto max-w-11' : 'h-10 w-auto max-w-[140px]'}`}
        />
        <div className={`rounded-lg bg-surface-100 flex items-center justify-center overflow-hidden shrink-0 ${collapsed ? 'w-9 h-9' : 'w-11 h-11'}`}>
          {logoSrc ? (
            <img src={logoSrc} alt="" className="w-full h-full object-contain" />
          ) : (
            <span className="text-ink-400 font-bold text-sm">O</span>
          )}
        </div>
      </div>

      {/* ── Navigation ────────────────── */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
        {filteredNav.map((item) => (
          <NavItem key={item.to} item={item} />
        ))}
      </nav>

      {/* ── Bottom Items ──────────────── */}
      <div className="py-3 px-3 border-t border-surface-200 space-y-1">
        {bottomItems.map((item) => (
          <NavItem key={item.to} item={item} />
        ))}

        {/* Collapse toggle — desktop only */}
        <button
          onClick={onToggle}
          className="hidden lg:flex items-center gap-3 px-3 py-2 w-full rounded-lg text-ink-400 hover:bg-surface-200 hover:text-ink-700 transition-default"
        >
          {collapsed ? (
            <ChevronRight className="w-5 h-5 mx-auto" />
          ) : (
            <>
              <ChevronLeft className="w-5 h-5 shrink-0" />
              <span className="text-body-sm">Réduire</span>
            </>
          )}
        </button>
      </div>
    </aside>
  );
}
