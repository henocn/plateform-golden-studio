import { useState, useEffect } from 'react';
import {
  FolderKanban,
  Clock,
  AlertTriangle,
  Send,
  CheckCircle2,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  Activity,
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, Area, AreaChart,
} from 'recharts';
import { useNavigate } from 'react-router-dom';
import { Card, Badge, Avatar, Skeleton } from '../../components/ui';
import { useAuthStore } from '../../store/authStore';
import { reportingAPI, projectsAPI, auditAPI } from '../../api/services';
import { formatRelative, PROJECT_STATUS } from '../../utils/helpers';

const CHART_COLORS = ['#1E3A5F', '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

export default function DashboardPage() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [overview, setOverview] = useState(null);
  const [recentActivity, setRecentActivity] = useState([]);
  const [projectStats, setProjectStats] = useState(null);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    setLoading(true);
    try {
      const [overviewRes, projectsRes, auditRes] = await Promise.allSettled([
        reportingAPI.overview(),
        reportingAPI.projects(),
        auditAPI.list({ limit: 8, sort: 'created_at', order: 'DESC' }),
      ]);

      if (overviewRes.status === 'fulfilled') setOverview(overviewRes.value.data.data);
      if (projectsRes.status === 'fulfilled') setProjectStats(projectsRes.value.data.data);
      if (auditRes.status === 'fulfilled') setRecentActivity(auditRes.value.data.data?.rows || (Array.isArray(auditRes.value.data.data) ? auditRes.value.data.data : []));
    } catch (err) {
      console.error('Dashboard load error:', err);
    } finally {
      setLoading(false);
    }
  };

  const kpiCards = [
    {
      label: 'Projets en cours',
      value: overview?.active_projects ?? overview?.projects_in_progress ?? '—',
      icon: FolderKanban,
      color: 'text-primary-500',
      bgColor: 'bg-primary-50',
      trend: '+12%',
      trendUp: true,
    },
    {
      label: 'En attente validation',
      value: overview?.pending_validation ?? overview?.projects_pending ?? '—',
      icon: Clock,
      color: 'text-warning-500',
      bgColor: 'bg-warning-50',
      trend: null,
    },
    {
      label: 'Projets urgents',
      value: overview?.urgent_projects ?? '—',
      icon: AlertTriangle,
      color: 'text-danger-500',
      bgColor: 'bg-danger-50',
      trend: null,
    },
    {
      label: 'Publications programmées',
      value: overview?.scheduled_publications ?? overview?.publications_scheduled ?? '—',
      icon: Send,
      color: 'text-success-500',
      bgColor: 'bg-success-50',
      trend: '+5%',
      trendUp: true,
    },
    {
      label: 'Projets terminés',
      value: overview?.completed_projects ?? overview?.projects_published ?? '—',
      icon: CheckCircle2,
      color: 'text-info-500',
      bgColor: 'bg-info-50',
      trend: null,
    },
  ];

  // Mock chart data if API doesn't return it
  const statusChartData = projectStats?.by_status
    ? Object.entries(projectStats.by_status).map(([key, val]) => ({
        name: PROJECT_STATUS[key]?.label || key,
        value: val,
      }))
    : [
        { name: 'Brief reçu', value: 3 },
        { name: 'En production', value: 5 },
        { name: 'En validation', value: 2 },
        { name: 'Publié', value: 8 },
        { name: 'Archivé', value: 4 },
      ];

  const monthlyData = projectStats?.monthly || [
    { month: 'Jan', projets: 4, publications: 3 },
    { month: 'Fév', projets: 6, publications: 5 },
    { month: 'Mar', projets: 5, publications: 4 },
    { month: 'Avr', projets: 8, publications: 7 },
    { month: 'Mai', projets: 7, publications: 6 },
    { month: 'Jun', projets: 9, publications: 8 },
  ];

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-4 w-72" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-72 rounded-xl" />
          <Skeleton className="h-72 rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ── Page Header ───────────────── */}
      <div>
        <h1 className="text-display-lg">
          Bonjour, {user?.first_name} 👋
        </h1>
        <p className="text-body-md text-ink-500 mt-1">
          Voici un aperçu de votre activité
        </p>
      </div>

      {/* ── KPI Cards ─────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {kpiCards.map((kpi, i) => (
          <div key={i} className="kpi-card group cursor-pointer" onClick={() => navigate('/projects')}>
            <div className="flex items-start justify-between mb-3">
              <div className={`w-10 h-10 rounded-xl ${kpi.bgColor} flex items-center justify-center`}>
                <kpi.icon className={`w-5 h-5 ${kpi.color}`} />
              </div>
              {kpi.trend && (
                <span className={`flex items-center gap-0.5 text-body-sm font-medium ${
                  kpi.trendUp ? 'text-success-600' : 'text-danger-600'
                }`}>
                  {kpi.trendUp ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
                  {kpi.trend}
                </span>
              )}
            </div>
            <p className="text-2xl font-bold text-ink-900">{kpi.value}</p>
            <p className="text-body-sm text-ink-500 mt-0.5">{kpi.label}</p>
          </div>
        ))}
      </div>

      {/* ── Charts Row ────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Area Chart: Monthly Trend */}
        <Card title="Tendance mensuelle" subtitle="Projets & publications" className="lg:col-span-2">
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={monthlyData}>
              <defs>
                <linearGradient id="gradProjets" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#1E3A5F" stopOpacity={0.1} />
                  <stop offset="95%" stopColor="#1E3A5F" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gradPubs" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10B981" stopOpacity={0.1} />
                  <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#E9ECEF" />
              <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#6B7280' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: '#6B7280' }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{
                  borderRadius: '0.75rem',
                  border: '1px solid #E9ECEF',
                  boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.06)',
                  fontSize: '0.875rem',
                }}
              />
              <Area type="monotone" dataKey="projets" stroke="#1E3A5F" fill="url(#gradProjets)" strokeWidth={2} name="Projets" />
              <Area type="monotone" dataKey="publications" stroke="#10B981" fill="url(#gradPubs)" strokeWidth={2} name="Publications" />
            </AreaChart>
          </ResponsiveContainer>
        </Card>

        {/* Pie Chart: Projects by Status */}
        <Card title="Projets par statut">
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie
                data={statusChartData}
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={85}
                paddingAngle={3}
                dataKey="value"
              >
                {statusChartData.map((_, i) => (
                  <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  borderRadius: '0.75rem',
                  border: '1px solid #E9ECEF',
                  fontSize: '0.875rem',
                }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex flex-wrap gap-3 justify-center -mt-2">
            {statusChartData.map((item, i) => (
              <span key={i} className="flex items-center gap-1.5 text-body-sm text-ink-500">
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ background: CHART_COLORS[i % CHART_COLORS.length] }}
                />
                {item.name}
              </span>
            ))}
          </div>
        </Card>
      </div>

      {/* ── Recent Activity ───────────── */}
      <Card
        title="Activité récente"
        subtitle="Dernières actions sur la plateforme"
        action={
          <button
            onClick={() => navigate('/audit')}
            className="text-body-sm text-primary-500 hover:text-primary-600 font-medium transition-default"
          >
            Voir tout →
          </button>
        }
      >
        {recentActivity.length > 0 ? (
          <div className="divide-y divide-surface-200">
            {recentActivity.map((entry, i) => (
              <div key={entry.id || i} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                <div className="w-8 h-8 rounded-lg bg-surface-200 flex items-center justify-center shrink-0">
                  <Activity className="w-4 h-4 text-ink-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-body-sm text-ink-700 truncate">
                    <span className="font-medium">{entry.action}</span>
                    {' sur '}
                    <span className="text-ink-500">{entry.entity_type}</span>
                  </p>
                  <p className="text-body-sm text-ink-400">
                    {formatRelative(entry.created_at)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-body-md text-ink-400 text-center py-8">
            Aucune activité récente
          </p>
        )}
      </Card>
    </div>
  );
}
