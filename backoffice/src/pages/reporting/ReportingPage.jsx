import { useState, useEffect } from 'react';
import {
  BarChart3, TrendingUp, Download, FileText, Calendar,
  FolderKanban, CheckSquare, Users, Building2, ArrowUpRight, ArrowDownRight,
} from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import { Card, Button, Badge, Select, Skeleton } from '../../components/ui';
import { reportingAPI } from '../../api/services';
import toast from 'react-hot-toast';

const CHART_COLORS = ['#1E3A5F', '#2d5a8e', '#4a90d9', '#7ab8f5', '#a8d4ff', '#d1e9ff'];
const PIE_COLORS = ['#1E3A5F', '#22c55e', '#f59e0b', '#ef4444', '#6366f1', '#8b5cf6'];

export default function ReportingPage() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('month');

  useEffect(() => { loadStats(); }, [period]);

  const loadStats = async () => {
    setLoading(true);
    try {
      const { data } = await reportingAPI.getStats({ period });
      setStats(data.data || data);
    } catch {
      // Use mock data for UI rendering
      setStats(mockStats);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async (format) => {
    try {
      const { data } = await reportingAPI.export({ format, period });
      const blob = new Blob([data], { type: format === 'pdf' ? 'application/pdf' : 'application/vnd.ms-excel' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `rapport-${period}.${format === 'pdf' ? 'pdf' : 'xlsx'}`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Export téléchargé');
    } catch {
      toast.error('Erreur lors de l\'export');
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">{[1,2,3,4].map((i) => <Skeleton key={i} className="h-28 rounded-xl" />)}</div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6"><Skeleton className="h-80 rounded-xl" /><Skeleton className="h-80 rounded-xl" /></div>
      </div>
    );
  }

  const s = stats || mockStats;

  const kpis = [
    { label: 'Projets actifs', value: s.activeProjects ?? 0, icon: FolderKanban, trend: s.projectsTrend ?? 0, color: 'text-primary-500', bg: 'bg-primary-50' },
    { label: 'Tâches terminées', value: s.completedTasks ?? 0, icon: CheckSquare, trend: s.tasksTrend ?? 0, color: 'text-success-500', bg: 'bg-success-50' },
    { label: 'Publications ce mois', value: s.monthlyPublications ?? 0, icon: Calendar, trend: s.pubTrend ?? 0, color: 'text-info-500', bg: 'bg-info-50' },
    { label: 'Utilisateurs actifs', value: s.activeUsers ?? 0, icon: Users, trend: s.usersTrend ?? 0, color: 'text-warning-500', bg: 'bg-warning-50' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-display-lg">Reporting</h1>
          <p className="text-body-md text-ink-400 mt-1">Tableau de bord analytique</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={period} onChange={(e) => setPeriod(e.target.value)} className="w-36">
            <option value="week">Cette semaine</option>
            <option value="month">Ce mois</option>
            <option value="quarter">Ce trimestre</option>
            <option value="year">Cette année</option>
          </Select>
          <Button variant="outline" icon={Download} onClick={() => handleExport('pdf')}>PDF</Button>
          <Button variant="outline" icon={Download} onClick={() => handleExport('excel')}>Excel</Button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {kpis.map((kpi) => (
          <Card key={kpi.label}>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-body-sm text-ink-400 mb-1">{kpi.label}</p>
                <p className="text-display-md font-bold text-ink-900">{kpi.value}</p>
                {kpi.trend !== 0 && (
                  <div className={`flex items-center gap-1 mt-1 text-body-sm ${kpi.trend > 0 ? 'text-success-600' : 'text-danger-600'}`}>
                    {kpi.trend > 0 ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
                    {Math.abs(kpi.trend)}%
                  </div>
                )}
              </div>
              <div className={`w-10 h-10 rounded-xl ${kpi.bg} flex items-center justify-center`}>
                <kpi.icon className={`w-5 h-5 ${kpi.color}`} />
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Activity over time */}
        <Card title="Activité mensuelle" subtitle="Projets, tâches et publications">
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={s.monthlyActivity || mockMonthlyActivity}>
              <defs>
                <linearGradient id="gradProjects" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#1E3A5F" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#1E3A5F" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gradTasks" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#22c55e" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis fontSize={12} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #e5e7eb', boxShadow: '0 4px 6px rgba(0,0,0,0.07)' }} />
              <Legend />
              <Area type="monotone" dataKey="projects" name="Projets" stroke="#1E3A5F" fillOpacity={1} fill="url(#gradProjects)" strokeWidth={2} />
              <Area type="monotone" dataKey="tasks" name="Tâches" stroke="#22c55e" fillOpacity={1} fill="url(#gradTasks)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </Card>

        {/* Projects by status */}
        <Card title="Projets par statut">
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie
                data={s.projectsByStatus || mockProjectsByStatus}
                cx="50%" cy="50%"
                innerRadius={70} outerRadius={110}
                dataKey="value"
                nameKey="name"
                paddingAngle={3}
                strokeWidth={0}
              >
                {(s.projectsByStatus || mockProjectsByStatus).map((_, idx) => (
                  <Cell key={idx} fill={PIE_COLORS[idx % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #e5e7eb' }} />
              <Legend verticalAlign="bottom" height={36} />
            </PieChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Tasks by priority */}
        <Card title="Tâches par priorité">
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={s.tasksByPriority || mockTasksByPriority} layout="vertical" barCategoryGap={12}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
              <XAxis type="number" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis dataKey="name" type="category" fontSize={12} tickLine={false} axisLine={false} width={80} />
              <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #e5e7eb' }} />
              <Bar dataKey="count" name="Nombre" fill="#1E3A5F" radius={[0, 6, 6, 0]} barSize={24} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* Top organizations */}
        <Card title="Organisations les plus actives">
          <div className="space-y-3">
            {(s.topOrganizations || mockTopOrgs).map((org, idx) => (
              <div key={idx} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-primary-50 flex items-center justify-center shrink-0">
                  <Building2 className="w-4 h-4 text-primary-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-body-sm font-medium text-ink-700 truncate">{org.name}</p>
                    <span className="text-body-sm text-ink-400 shrink-0">{org.projects} projets</span>
                  </div>
                  <div className="h-1.5 bg-surface-100 rounded-full overflow-hidden">
                    <div className="h-full bg-primary-400 rounded-full" style={{ width: `${Math.min(100, (org.projects / Math.max(...(s.topOrganizations || mockTopOrgs).map(o => o.projects))) * 100)}%` }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}

// Mock data fallback for when API is not available
const mockStats = {
  activeProjects: 12,
  completedTasks: 87,
  monthlyPublications: 23,
  activeUsers: 34,
  projectsTrend: 8,
  tasksTrend: 15,
  pubTrend: -3,
  usersTrend: 5,
};

const mockMonthlyActivity = [
  { month: 'Jan', projects: 4, tasks: 18 },
  { month: 'Fév', projects: 6, tasks: 24 },
  { month: 'Mar', projects: 5, tasks: 20 },
  { month: 'Avr', projects: 8, tasks: 32 },
  { month: 'Mai', projects: 7, tasks: 28 },
  { month: 'Jun', projects: 10, tasks: 35 },
];

const mockProjectsByStatus = [
  { name: 'Brief reçu', value: 3 },
  { name: 'En production', value: 5 },
  { name: 'En validation', value: 2 },
  { name: 'Publié', value: 8 },
  { name: 'Archivé', value: 4 },
];

const mockTasksByPriority = [
  { name: 'Critique', count: 3 },
  { name: 'Haute', count: 8 },
  { name: 'Moyenne', count: 15 },
  { name: 'Basse', count: 12 },
];

const mockTopOrgs = [
  { name: 'Ministère de l\'Intérieur', projects: 8 },
  { name: 'Ministère de la Santé', projects: 6 },
  { name: 'Ministère de l\'Éducation', projects: 5 },
  { name: 'Primature', projects: 4 },
  { name: 'Présidence', projects: 3 },
];
