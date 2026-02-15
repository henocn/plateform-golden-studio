import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Building2, Users, FolderKanban, Mail, Phone, MapPin } from 'lucide-react';
import { Card, Button, Badge, Tabs, Skeleton, Avatar } from '../../components/ui';
import { organizationsAPI } from '../../api/services';
import { formatDate, ROLE_LABELS } from '../../utils/helpers';
import toast from 'react-hot-toast';

export default function OrganizationDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [org, setOrg] = useState(null);
  const [users, setUsers] = useState([]);
  const [projects, setProjects] = useState([]);
  const [stats, setStats] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadOrganization();
  }, [id]);

  const loadOrganization = async () => {
    setLoading(true);
    try {
      const [orgRes, usersRes, projectsRes, statsRes] = await Promise.allSettled([
        organizationsAPI.getById(id),
        organizationsAPI.getUsers(id),
        organizationsAPI.getProjects(id),
        organizationsAPI.getStats(id),
      ]);
      if (orgRes.status === 'fulfilled') setOrg(orgRes.value.data.data);
      if (usersRes.status === 'fulfilled') setUsers(usersRes.value.data.data?.rows || usersRes.value.data.data || []);
      if (projectsRes.status === 'fulfilled') setProjects(projectsRes.value.data.data?.rows || projectsRes.value.data.data || []);
      if (statsRes.status === 'fulfilled') setStats(statsRes.value.data.data);
    } catch (err) {
      toast.error('Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  const toggleStatus = async () => {
    try {
      await organizationsAPI.patchStatus(id, { is_active: !org.is_active });
      toast.success(org.is_active ? 'Organisation désactivée' : 'Organisation activée');
      loadOrganization();
    } catch (err) {
      toast.error('Erreur');
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-48 rounded-xl" />
        <Skeleton className="h-64 rounded-xl" />
      </div>
    );
  }

  if (!org) return null;

  const tabs = [
    { id: 'overview', label: 'Aperçu', icon: Building2 },
    { id: 'users', label: 'Utilisateurs', icon: Users, count: users.length },
    { id: 'projects', label: 'Projets', icon: FolderKanban, count: projects.length },
  ];

  return (
    <div className="space-y-6">
      {/* Back + Header */}
      <button onClick={() => navigate('/organizations')} className="flex items-center gap-1 text-body-sm text-ink-400 hover:text-ink-700 transition-default">
        <ArrowLeft className="w-4 h-4" /> Organisations
      </button>

      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-primary-50 flex items-center justify-center">
            <Building2 className="w-7 h-7 text-primary-500" />
          </div>
          <div>
            <h1 className="text-display-lg">{org.name}</h1>
            <div className="flex items-center gap-2 mt-1">
              <Badge color="info" size="sm">{org.type}</Badge>
              <Badge color={org.is_active ? 'success' : 'neutral'} dot size="sm">{org.is_active ? 'Actif' : 'Inactif'}</Badge>
              <span className="text-body-sm text-ink-400">• {org.short_name}</span>
            </div>
          </div>
        </div>
        <Button variant={org.is_active ? 'outline' : 'success'} size="sm" onClick={toggleStatus}>
          {org.is_active ? 'Désactiver' : 'Activer'}
        </Button>
      </div>

      {/* Tabs */}
      <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card title="Informations">
            <div className="space-y-3">
              {org.contact_email && (
                <div className="flex items-center gap-2 text-body-md text-ink-700">
                  <Mail className="w-4 h-4 text-ink-400" /> {org.contact_email}
                </div>
              )}
              {org.contact_phone && (
                <div className="flex items-center gap-2 text-body-md text-ink-700">
                  <Phone className="w-4 h-4 text-ink-400" /> {org.contact_phone}
                </div>
              )}
              {org.address && (
                <div className="flex items-center gap-2 text-body-md text-ink-700">
                  <MapPin className="w-4 h-4 text-ink-400" /> {org.address}
                </div>
              )}
              <p className="text-body-sm text-ink-400 pt-2">Créée le {formatDate(org.created_at)}</p>
            </div>
          </Card>
          <Card title="Statistiques">
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-3 bg-surface-100 rounded-xl">
                <p className="text-2xl font-bold text-ink-900">{users.length}</p>
                <p className="text-body-sm text-ink-500">Utilisateurs</p>
              </div>
              <div className="text-center p-3 bg-surface-100 rounded-xl">
                <p className="text-2xl font-bold text-ink-900">{projects.length}</p>
                <p className="text-body-sm text-ink-500">Projets</p>
              </div>
            </div>
          </Card>
        </div>
      )}

      {activeTab === 'users' && (
        <Card padding={false}>
          <table className="w-full">
            <thead>
              <tr className="border-b border-surface-200">
                <th className="text-left text-label text-ink-500 font-medium px-5 py-3">Utilisateur</th>
                <th className="text-left text-label text-ink-500 font-medium px-5 py-3">Rôle</th>
                <th className="text-left text-label text-ink-500 font-medium px-5 py-3">Statut</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-200">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-surface-100 transition-default">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <Avatar firstName={u.first_name} lastName={u.last_name} size="sm" />
                      <div>
                        <p className="text-body-md font-medium text-ink-900">{u.first_name} {u.last_name}</p>
                        <p className="text-body-sm text-ink-400">{u.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3">
                    <Badge color="info" size="sm">{ROLE_LABELS[u.role]?.label || u.role}</Badge>
                  </td>
                  <td className="px-5 py-3">
                    <Badge color={u.is_active ? 'success' : 'neutral'} dot size="sm">{u.is_active ? 'Actif' : 'Inactif'}</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      {activeTab === 'projects' && (
        <Card padding={false}>
          <table className="w-full">
            <thead>
              <tr className="border-b border-surface-200">
                <th className="text-left text-label text-ink-500 font-medium px-5 py-3">Projet</th>
                <th className="text-left text-label text-ink-500 font-medium px-5 py-3">Statut</th>
                <th className="text-left text-label text-ink-500 font-medium px-5 py-3">Priorité</th>
                <th className="text-left text-label text-ink-500 font-medium px-5 py-3">Date cible</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-200">
              {projects.map((p) => (
                <tr key={p.id} className="hover:bg-surface-100 cursor-pointer transition-default" onClick={() => navigate(`/projects/${p.id}`)}>
                  <td className="px-5 py-3 text-body-md font-medium text-ink-900">{p.title}</td>
                  <td className="px-5 py-3"><Badge color="info" size="sm">{p.status}</Badge></td>
                  <td className="px-5 py-3"><Badge color={p.priority === 'urgent' ? 'danger' : 'neutral'} size="sm">{p.priority}</Badge></td>
                  <td className="px-5 py-3 text-body-sm text-ink-400">{formatDate(p.target_date)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}
