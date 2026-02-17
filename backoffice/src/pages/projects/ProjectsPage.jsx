import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, FolderKanban, Filter, MoreVertical, Edit, Trash2 } from 'lucide-react';
import { Card, Button, Badge, SearchInput, Select, Pagination, EmptyState, Skeleton, Modal, Input, Textarea } from '../../components/ui';
import { projectsAPI, organizationsAPI, usersAPI } from '../../api/services';
import { usePagination, useDebounce, usePermissions } from '../../hooks';
import { formatDate, PROJECT_STATUS, PRIORITY, extractList } from '../../utils/helpers';
import { useAuthStore } from '../../store/authStore';
import toast from 'react-hot-toast';

export default function ProjectsPage() {
  const navigate = useNavigate();
  const { can, isInternal, userType } = usePermissions();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const debouncedSearch = useDebounce(search);
  const pagination = usePagination();
  const [showCreate, setShowCreate] = useState(false);

  const loadProjects = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await projectsAPI.list({
        page: pagination.page,
        limit: pagination.limit,
        search: debouncedSearch || undefined,
        status: statusFilter || undefined,
        priority: priorityFilter || undefined,
      });
      const { items, total } = extractList(data.data);
      setProjects(items);
      pagination.setTotal(total);
    } catch (err) {
      toast.error('Erreur lors du chargement des projets');
    } finally {
      setLoading(false);
    }
  }, [pagination.page, debouncedSearch, statusFilter, priorityFilter]);

  useEffect(() => { loadProjects(); }, [loadProjects]);

  const statusOptions = Object.entries(PROJECT_STATUS).map(([k, v]) => ({ value: k, label: v.label }));
  const priorityOptions = Object.entries(PRIORITY).map(([k, v]) => ({ value: k, label: v.label }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-display-lg">Projets</h1>
          <p className="text-body-md text-ink-500 mt-1">Gestion des projets de communication</p>
        </div>
        {can('projects.create') && <Button icon={Plus} onClick={() => setShowCreate(true)}>Nouveau projet</Button>}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <SearchInput value={search} onChange={setSearch} placeholder="Rechercher un projet…" className="w-72" />
        <Select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); pagination.setPage(1); }}
          placeholder="Tous les statuts" options={statusOptions} className="w-44" />
        <Select value={priorityFilter} onChange={(e) => { setPriorityFilter(e.target.value); pagination.setPage(1); }}
          placeholder="Toutes priorités" options={priorityOptions} className="w-44" />
      </div>

      <Card padding={false}>
        {loading ? (
          <div className="p-5 space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4">
                <Skeleton className="w-10 h-10 rounded-xl" />
                <Skeleton className="h-4 flex-1" />
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-24" />
              </div>
            ))}
          </div>
        ) : projects.length === 0 ? (
          <EmptyState icon={FolderKanban} title="Aucun projet" description="Créez votre premier projet de communication"
            action={can('projects.create') ? <Button icon={Plus} onClick={() => setShowCreate(true)}>Créer un projet</Button> : null} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-surface-200">
                  <th className="text-left text-label text-ink-500 font-medium px-5 py-3">Projet</th>
                  <th className="text-left text-label text-ink-500 font-medium px-5 py-3">Organisation</th>
                  <th className="text-left text-label text-ink-500 font-medium px-5 py-3">Statut</th>
                  <th className="text-left text-label text-ink-500 font-medium px-5 py-3">Priorité</th>
                  <th className="text-left text-label text-ink-500 font-medium px-5 py-3">Date cible</th>
                  <th className="px-5 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-200">
                {projects.map((p) => {
                  const status = PROJECT_STATUS[p.status] || { label: p.status, color: 'neutral' };
                  const priority = PRIORITY[p.priority] || { label: p.priority, color: 'neutral' };
                  return (
                    <tr key={p.id} className="hover:bg-surface-100 cursor-pointer transition-default"
                      onClick={() => navigate(`/projects/${p.id}`)}>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-primary-50 flex items-center justify-center shrink-0">
                            <FolderKanban className="w-4 h-4 text-primary-500" />
                          </div>
                          <div>
                            <p className="text-body-md font-medium text-ink-900">{p.title}</p>
                            <p className="text-body-sm text-ink-400">{p.agency_direction || '—'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3 text-body-sm text-ink-500">
                        {p.Organization?.name || p.organization?.name || '—'}
                      </td>
                      <td className="px-5 py-3">
                        <Badge color={status.color} dot size="sm">{status.label}</Badge>
                      </td>
                      <td className="px-5 py-3">
                        <Badge color={priority.color} size="sm">{priority.label}</Badge>
                      </td>
                      <td className="px-5 py-3 text-body-sm text-ink-400">{formatDate(p.target_date)}</td>
                      <td className="px-5 py-3">
                        {can('projects.update') && (
                          <ProjectActions project={p} onRefresh={loadProjects} canDelete={can('projects.delete')} />
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        {!loading && projects.length > 0 && (
          <div className="px-5 border-t border-surface-200">
            <Pagination page={pagination.page} totalPages={pagination.totalPages} total={pagination.total} limit={pagination.limit} onPageChange={pagination.setPage} />
          </div>
        )}
      </Card>

      <CreateProjectModal open={showCreate} onClose={() => setShowCreate(false)} onCreated={() => { setShowCreate(false); loadProjects(); }} />
    </div>
  );
}

function ProjectActions({ project, onRefresh, canDelete }) {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  const handleDelete = async () => {
    if (!confirm('Supprimer ce projet ? Cette action est irréversible.')) return;
    try {
      await projectsAPI.delete(project.id);
      toast.success('Projet supprimé');
      onRefresh();
    } catch (err) {
      toast.error(err.response?.data?.error?.message || 'Erreur lors de la suppression');
    }
  };

  const [showEdit, setShowEdit] = useState(false);
  return (
    <div className="relative">
      <button
        className="p-1 rounded-lg text-ink-400 hover:bg-surface-200"
        onClick={(e) => { e.stopPropagation(); setOpen(!open); }}
      >
        <MoreVertical className="w-4 h-4" />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-8 z-20 bg-white rounded-xl shadow-dropdown border border-surface-200 py-1 w-44 animate-fade-in">
            <button
              onClick={(e) => { e.stopPropagation(); setShowEdit(true); setOpen(false); }}
              className="w-full flex items-center gap-2 px-3 py-2 text-body-sm text-ink-700 hover:bg-surface-100 transition-default"
            >
              <Edit className="w-4 h-4" /> Modifier
            </button>
            {canDelete && (
              <button
                onClick={(e) => { e.stopPropagation(); handleDelete(); }}
                className="w-full flex items-center gap-2 px-3 py-2 text-body-sm text-danger-600 hover:bg-danger-50 transition-default"
              >
                <Trash2 className="w-4 h-4" /> Supprimer
              </button>
            )}
          </div>
        </>
      )}
      {showEdit && (
        <CreateProjectModal
          open={showEdit}
          onClose={() => setShowEdit(false)}
          onCreated={() => { setShowEdit(false); onRefresh(); }}
          project={project}
        />
      )}
    </div>
  );
}

function CreateProjectModal({ open, onClose, onCreated, project }) {
  const [loading, setLoading] = useState(false);
  const [orgs, setOrgs] = useState([]);
  const [internalUsers, setInternalUsers] = useState([]);
  const { userType, user } = usePermissions();
  const [form, setForm] = useState(() => {
    if (project) {
      return {
        title: project.title || '',
        description: project.description || '',
        organization_id: project.organization_id || (userType === 'client' && user?.organization_id ? user.organization_id : ''),
        agency_direction: project.agency_direction || '',
        priority: project.priority || 'normal',
        target_date: project.target_date || '',
        internal_manager_id: project.internal_manager_id || '',
        studio_manager_id: project.studio_manager_id || '',
      };
    }
    return {
      title: '', description: '',
      organization_id: userType === 'client' && user?.organization_id ? user.organization_id : '',
      agency_direction: '',
      priority: 'normal', target_date: '', internal_manager_id: '', studio_manager_id: '',
    };
  });

  useEffect(() => {
    if (!open) return;
    if (userType === 'internal') {
      organizationsAPI.list({ limit: 100 }).then(({ data }) => {
        setOrgs(extractList(data.data).items);
      }).catch(() => {});
      usersAPI.listMembers({ type: 'internal' }).then(({ data }) => {
        setInternalUsers(extractList(data.data).items);
      }).catch(() => {});
    } else if (userType === 'client' && user?.organization_id) {
      setOrgs([{ id: user.organization_id, name: user.organization?.name || 'Mon organisation' }]);
    }
    // Si on édite, on synchronise le form avec le projet (utile si on rouvre le modal sur un autre projet)
    if (project) {
      setForm({
        title: project.title || '',
        description: project.description || '',
        organization_id: project.organization_id || (userType === 'client' && user?.organization_id ? user.organization_id : ''),
        agency_direction: project.agency_direction || '',
        priority: project.priority || 'normal',
        target_date: project.target_date || '',
        internal_manager_id: project.internal_manager_id || '',
        studio_manager_id: project.studio_manager_id || '',
      });
    }
  }, [open, userType, user, project]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const is_parametrized = !!(form.internal_manager_id || form.studio_manager_id);
      const payload = { ...form, is_parametrized };
      if (!payload.internal_manager_id) delete payload.internal_manager_id;
      if (!payload.studio_manager_id) delete payload.studio_manager_id;
      if (project) {
        await projectsAPI.update(project.id, payload);
        toast.success('Projet modifié avec succès');
      } else {
        await projectsAPI.create(payload);
        toast.success('Projet créé avec succès');
      }
      onCreated();
    } catch (err) {
      toast.error(err.response?.data?.error?.message || 'Erreur lors de la sauvegarde');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={project ? 'Modifier le projet' : 'Nouveau projet'}
      size="lg"
      closable={!project}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Annuler</Button>
          <Button loading={loading} onClick={handleSubmit}>{project ? 'Enregistrer' : 'Créer'}</Button>
        </>
      }
    >
      <form className="space-y-4" onSubmit={handleSubmit}>
        <Input label="Titre" required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Campagne de communication…" />
        <Textarea label="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} />
        <div className="grid grid-cols-2 gap-4">
          {userType === 'internal' && (
            <Select
              label="Organisation"
              required
              value={form.organization_id}
              onChange={e => setForm({ ...form, organization_id: e.target.value })}
              options={orgs.map((o) => ({ value: o.id, label: o.name }))}
            />
          )}
          <Input label="Direction / Agence" value={form.agency_direction} onChange={(e) => setForm({ ...form, agency_direction: e.target.value })} />
        </div>
        {userType === 'internal' && (
          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Responsable interne"
              value={form.internal_manager_id}
              onChange={e => setForm({ ...form, internal_manager_id: e.target.value })}
              options={[
                { value: '', label: 'Sélectionner' },
                ...internalUsers.map(u => ({ value: u.id, label: `${u.first_name} ${u.last_name}` }))
              ]}
            />
            <Select
              label="Responsable studio"
              value={form.studio_manager_id}
              onChange={e => setForm({ ...form, studio_manager_id: e.target.value })}
              options={[
                { value: '', label: 'Sélectionner' },
                ...internalUsers.map(u => ({ value: u.id, label: `${u.first_name} ${u.last_name}` }))
              ]}
            />
          </div>
        )}
        <div className="grid grid-cols-2 gap-4">
          <Select label="Priorité" value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}
            options={Object.entries(PRIORITY).map(([k, v]) => ({ value: k, label: v.label }))} />
          <Input label="Date cible" type="date" value={form.target_date} onChange={(e) => setForm({ ...form, target_date: e.target.value })} />
        </div>
      </form>
    </Modal>
  );
}
