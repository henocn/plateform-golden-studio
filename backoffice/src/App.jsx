import { Routes, Route, Navigate } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import { useAuthStore } from './store/authStore';
import MainLayout from './components/layout/MainLayout';
import ProtectedRoute from './routes/ProtectedRoute';
import LoadingScreen from './components/ui/LoadingScreen';

// Lazy-loaded pages
const LoginPage = lazy(() => import('./pages/auth/LoginPage'));
const TwoFactorPage = lazy(() => import('./pages/auth/TwoFactorPage'));
const DashboardPage = lazy(() => import('./pages/dashboard/DashboardPage'));
const OrganizationsPage = lazy(() => import('./pages/organizations/OrganizationsPage'));
const OrganizationDetailPage = lazy(() => import('./pages/organizations/OrganizationDetailPage'));
const UsersPage = lazy(() => import('./pages/users/UsersPage'));
const ProjectsPage = lazy(() => import('./pages/projects/ProjectsPage'));
const ProjectDetailPage = lazy(() => import('./pages/projects/ProjectDetailPage'));
const TasksPage = lazy(() => import('./pages/tasks/TasksPage'));
const ProposalsPage = lazy(() => import('./pages/proposals/ProposalsPage'));
const CalendarPage = lazy(() => import('./pages/calendar/CalendarPage'));
const MediaPage = lazy(() => import('./pages/media/MediaPage'));
const ReportingPage = lazy(() => import('./pages/reporting/ReportingPage'));
const AuditPage = lazy(() => import('./pages/audit/AuditPage'));
const ProfilePage = lazy(() => import('./pages/profile/ProfilePage'));
const SettingsPage = lazy(() => import('./pages/settings/SettingsPage'));
const NotFoundPage = lazy(() => import('./pages/errors/NotFoundPage'));
const ForbiddenPage = lazy(() => import('./pages/errors/ForbiddenPage'));

export default function App() {
  return (
    <Suspense fallback={<LoadingScreen />}>
      <Routes>
        {/* ── Public ──────────────────── */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/2fa" element={<TwoFactorPage />} />

        {/* ── Protected ───────────────── */}
        <Route element={<ProtectedRoute />}>
          <Route element={<MainLayout />}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<DashboardPage />} />

            <Route path="organizations" element={<OrganizationsPage />} />
            <Route path="organizations/:id" element={<OrganizationDetailPage />} />

            <Route path="users" element={<UsersPage />} />

            <Route path="projects" element={<ProjectsPage />} />
            <Route path="projects/:id" element={<ProjectDetailPage />} />

            <Route path="tasks" element={<TasksPage />} />

            <Route path="proposals" element={<ProposalsPage />} />

            <Route path="calendar" element={<CalendarPage />} />

            <Route path="media" element={<MediaPage />} />

            <Route path="reporting" element={<ReportingPage />} />

            <Route path="audit" element={<AuditPage />} />

            <Route path="profile" element={<ProfilePage />} />
            <Route path="settings" element={<SettingsPage />} />
          </Route>
        </Route>

        {/* ── Error pages ─────────────── */}
        <Route path="/403" element={<ForbiddenPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Suspense>
  );
}
