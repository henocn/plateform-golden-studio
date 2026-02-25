import { useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  FolderKanban,
  CheckSquare,
  Calendar,
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
  { label: 'Dashboard',      to: '/dashboard',      icon: LayoutDashboard },
  { label: 'Organisation',   to: '/organization',   icon: Building2, roles: ['super_admin', 'admin'], internal: true },
  { label: 'Projets',        to: '/projects',       icon: FolderKanban },
  { label: 'Tâches',         to: '/tasks',          icon: CheckSquare },
  { label: 'Propositions',   to: '/proposals',      icon: FolderKanban },
  { label: 'Calendrier',     to: '/calendar',       icon: Calendar },
  { label: 'Médiathèque',    to: '/media',          icon: Image },
  { label: 'Reporting',      to: '/reporting',       icon: BarChart3, roles: ['super_admin', 'admin', 'validator'], internal: true },
  { label: 'Utilisateurs',   to: '/users',          icon: Users, roles: ['super_admin', 'admin', 'client_admin'] },
  { label: 'Audit',          to: '/audit',          icon: Shield, roles: ['super_admin', 'admin'], internal: true },
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
      {/* ── Logo / nom en haut ─────────── */}
      <div className={`flex items-center h-16 px-4 border-b border-surface-200 shrink-0 ${collapsed ? 'justify-center' : 'gap-3'}`}>
        <div className={`shrink-0 overflow-hidden ${collapsed ? 'w-9 h-9 rounded-xl' : 'flex items-center gap-2 min-w-0'}`}>
          <img
            src="/images/nom simple.png"
            alt=""
            className={collapsed ? 'w-full h-full object-contain' : 'h-8 w-auto max-w-[140px] object-contain object-left'}
          />
        </div>
        {!collapsed && (
          <div className="min-w-0 flex-1">
            <h1 className="text-sm font-bold text-ink-900 tracking-tight truncate">{orgName}</h1>
          </div>
        )}
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
