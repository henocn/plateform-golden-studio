import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, FolderKanban, Filter, MoreVertical } from 'lucide-react';
import { Card, Button, Badge, SearchInput, Select, Pagination, EmptyState, Skeleton, Modal, Input, Textarea } from '../../components/ui';
import { projectsAPI, organizationsAPI, usersAPI } from '../../api/services';
import { usePagination, useDebounce } from '../../hooks';
import { formatDate, PROJECT_STATUS, PRIORITY } from '../../utils/helpers';
import toast from 'react-hot-toast';

export default function ProjectsPage() {
  const navigate = useNavigate();
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
      const result = data.data;
      setProjects(result.rows || result);
      pagination.setTotal(result.count || result.length || 0);
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
        <Button icon={Plus} onClick={() => setShowCreate(true)}>Nouveau projet</Button>
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
            action={<Button icon={Plus} onClick={() => setShowCreate(true)}>Créer un projet</Button>} />
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
                        <button className="p-1 rounded-lg text-ink-400 hover:bg-surface-200" onClick={(e) => e.stopPropagation()}>
                          <MoreVertical className="w-4 h-4" />
                        </button>
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

function CreateProjectModal({ open, onClose, onCreated }) {
  const [loading, setLoading] = useState(false);
  const [orgs, setOrgs] = useState([]);
  const [form, setForm] = useState({
    title: '', description: '', organization_id: '', agency_direction: '', priority: 'medium', target_date: '',
  });

  useEffect(() => {
    if (open) {
      organizationsAPI.list({ limit: 100 }).then(({ data }) => {
        setOrgs(data.data?.rows || (Array.isArray(data.data) ? data.data : []));
      }).catch(() => {});
    }
  }, [open]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await projectsAPI.create(form);
      toast.success('Projet créé avec succès');
      onCreated();
    } catch (err) {
      toast.error(err.response?.data?.error?.message || 'Erreur lors de la création');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Nouveau projet" size="lg"
      footer={<><Button variant="ghost" onClick={onClose}>Annuler</Button><Button loading={loading} onClick={handleSubmit}>Créer</Button></>}>
      <form className="space-y-4">
        <Input label="Titre" required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Campagne de communication…" />
        <Textarea label="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} />
        <div className="grid grid-cols-2 gap-4">
          <Select label="Organisation" required value={form.organization_id} onChange={(e) => setForm({ ...form, organization_id: e.target.value })}
            options={orgs.map((o) => ({ value: o.id, label: o.name }))} />
          <Input label="Direction / Agence" value={form.agency_direction} onChange={(e) => setForm({ ...form, agency_direction: e.target.value })} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Select label="Priorité" value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}
            options={Object.entries(PRIORITY).map(([k, v]) => ({ value: k, label: v.label }))} />
          <Input label="Date cible" type="date" value={form.target_date} onChange={(e) => setForm({ ...form, target_date: e.target.value })} />
        </div>
      </form>
    </Modal>
  );
}
