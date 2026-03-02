import { Routes, Route, Navigate } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import MainLayout from './components/layout/MainLayout';
import ProtectedRoute from './routes/ProtectedRoute';
import AdminRoute from './routes/AdminRoute';
import LoadingScreen from './components/ui/LoadingScreen';

// Lazy-loaded pages
const LoginPage = lazy(() => import('./pages/auth/LoginPage'));
const TwoFactorPage = lazy(() => import('./pages/auth/TwoFactorPage'));
const DashboardPage = lazy(() => import('./pages/dashboard/DashboardPage'));
const UsersPage = lazy(() => import('./pages/users/UsersPage'));
const ProjectsPage = lazy(() => import('./pages/projects/ProjectsPage'));
const ProjectDetailPage = lazy(() => import('./pages/projects/ProjectDetailPage'));
const TasksPage = lazy(() => import('./pages/tasks/TasksPage'));
const TaskDetailPage = lazy(() => import('./pages/tasks/TaskDetailPage'));
const ProposalsPage = lazy(() => import('./pages/proposals/ProposalsPage'));
const EditorialCalendarPage = lazy(() => import('./pages/calendar/EditorialCalendarPage'));
const EventsCalendarPage = lazy(() => import('./pages/calendar/EventsCalendarPage'));
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

        {/* ── Protected (internal + client) ── */}
        <Route element={<ProtectedRoute />}>
          <Route element={<MainLayout />}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<DashboardPage />} />

            {/* Shared pages — both internal & client */}
            <Route path="projects" element={<ProjectsPage />} />
            <Route path="projects/:id" element={<ProjectDetailPage />} />
            <Route path="tasks" element={<TasksPage />} />
            <Route path="tasks/:id" element={<TaskDetailPage />} />
            <Route path="proposals" element={<ProposalsPage />} />
            <Route path="calendar/editorial" element={<EditorialCalendarPage />} />
            <Route path="calendar/events" element={<EventsCalendarPage />} />
            <Route path="calendar" element={<Navigate to="/calendar/editorial" replace />} />
            <Route path="media" element={<MediaPage />} />
            <Route path="profile" element={<ProfilePage />} />
            <Route path="settings" element={<SettingsPage />} />

            {/* Users — internal admins + client_admin (page adapts) */}
            <Route path="users" element={<UsersPage />} />

            {/* Admin-only pages — internal users only (single-organisation mode) */}
            <Route element={<AdminRoute />}>
              <Route path="reporting" element={<ReportingPage />} />
              <Route path="audit" element={<AuditPage />} />
            </Route>
          </Route>
        </Route>

        {/* ── Error pages ─────────────── */}
        <Route path="/403" element={<ForbiddenPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Suspense>
  );
}
