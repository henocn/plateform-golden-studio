import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Send, Plus, Eye, MessageSquare, ArrowUpRight,
} from 'lucide-react';
import {
  Card, Button, Badge, Modal, Input, Select, Textarea, SearchInput,
  Pagination, EmptyState, Skeleton, Avatar,
} from '../../components/ui';
import { proposalsAPI, projectsAPI, validationsAPI } from '../../api/services';
import { formatDate, formatRelative, PROPOSAL_STATUS } from '../../utils/helpers';
import toast from 'react-hot-toast';

export default function ProposalsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [proposals, setProposals] = useState([]);
  const [projects, setProjects] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [detail, setDetail] = useState(null);
  const [showCreate, setShowCreate] = useState(false);

  const page = parseInt(searchParams.get('page') || '1');
  const statusFilter = searchParams.get('status') || '';
  const projectId = searchParams.get('project') || '';

  useEffect(() => { loadProposals(); }, [page, statusFilter, projectId]);
  useEffect(() => { loadProjects(); }, []);

  const loadProposals = async () => {
    setLoading(true);
    try {
      const params = { page, limit: 20 };
      if (statusFilter) params.status = statusFilter;
      if (projectId) params.project_id = projectId;
      const { data } = await proposalsAPI.list(params);
      setProposals(data.data?.rows || data.data || []);
      setTotal(data.data?.count || 0);
    } catch {
      toast.error('Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  const loadProjects = async () => {
    try {
      const { data } = await projectsAPI.list({ limit: 200 });
      setProjects(data.data?.rows || data.data || []);
    } catch {}
  };

  const updateParam = (key, value) => {
    const p = new URLSearchParams(searchParams);
    if (value) p.set(key, value); else p.delete(key);
    if (key !== 'page') p.set('page', '1');
    setSearchParams(p);
  };

  // Workflow steps
  const workflowSteps = ['draft', 'submitted', 'pending_validation', 'approved', 'rejected'];
  const stepLabels = { draft: 'Brouillon', submitted: 'Soumis', pending_validation: 'En validation', approved: 'Validé', rejected: 'Refusé' };

  const getStepIndex = (status) => workflowSteps.indexOf(status);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-display-lg">Propositions</h1>
          <p className="text-body-md text-ink-400 mt-1">{total} proposition{total !== 1 ? 's' : ''}</p>
        </div>
        <Button onClick={() => setShowCreate(true)} icon={Plus}>Nouvelle proposition</Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <Select value={projectId} onChange={(e) => updateParam('project', e.target.value)} className="w-52">
          <option value="">Tous les projets</option>
          {projects.map((p) => <option key={p.id} value={p.id}>{p.title}</option>)}
        </Select>
        <Select value={statusFilter} onChange={(e) => updateParam('status', e.target.value)} className="w-44">
          <option value="">Tous les statuts</option>
          {Object.entries(PROPOSAL_STATUS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </Select>
      </div>

      {/* List */}
      {loading ? (
        <div className="space-y-3">{[1,2,3].map((i) => <Skeleton key={i} className="h-28 rounded-xl" />)}</div>
      ) : proposals.length === 0 ? (
        <EmptyState icon={Send} title="Aucune proposition" description="Aucune proposition ne correspond aux filtres" />
      ) : (
        <div className="space-y-3">
          {proposals.map((p) => {
            const st = PROPOSAL_STATUS[p.status] || { label: p.status, color: 'neutral' };
            const currentStep = getStepIndex(p.status);
            return (
              <Card key={p.id} className="hover:shadow-card-hover transition-shadow cursor-pointer" onClick={() => setDetail(p)}>
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center shrink-0 mt-0.5">
                    <Send className="w-5 h-5 text-primary-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <h3 className="text-body-lg font-medium text-ink-900">{p.title}</h3>
                        <Badge color="neutral" size="xs">v{p.version_number}</Badge>
                      </div>
                      <Badge color={st.color} dot>{st.label}</Badge>
                    </div>
                    <p className="text-body-sm text-ink-400 line-clamp-1 mb-2.5">{p.description || 'Pas de description'}</p>

                    {/* Workflow progress */}
                    <div className="flex items-center gap-1">
                      {workflowSteps.slice(0, -1).map((step, idx) => {
                        const isActive = idx <= currentStep;
                        const isRejected = p.status === 'rejected' && idx === currentStep;
                        return (
                          <div key={step} className="flex items-center gap-1 flex-1">
                            <div className={`h-1.5 rounded-full flex-1 ${isRejected ? 'bg-danger-400' : isActive ? 'bg-primary-400' : 'bg-surface-200'}`} />
                          </div>
                        );
                      })}
                    </div>

                    <div className="flex items-center gap-4 mt-2 text-body-sm text-ink-400">
                      <span>Projet: {p.Project?.title || '—'}</span>
                      <span>Par {p.Author?.first_name || '—'} {p.Author?.last_name || ''}</span>
                      <span>{formatRelative(p.created_at)}</span>
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <Pagination
        currentPage={page}
        totalItems={total}
        pageSize={20}
        onPageChange={(p) => updateParam('page', String(p))}
      />

      {detail && <ProposalDetailModal proposal={detail} onClose={() => setDetail(null)} onRefresh={loadProposals} />}
      {showCreate && <CreateProposalModal projects={projects} onClose={() => setShowCreate(false)} onCreated={() => { setShowCreate(false); loadProposals(); }} />}
    </div>
  );
}

function ProposalDetailModal({ proposal: p, onClose, onRefresh }) {
  const [validations, setValidations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await validationsAPI.getByProposal(p.id);
        setValidations(data.data?.rows || data.data || []);
      } catch {} finally { setLoading(false); }
    })();
  }, [p.id]);

  const st = PROPOSAL_STATUS[p.status] || { label: p.status, color: 'neutral' };

  return (
    <Modal open onClose={onClose} title="Détail de la proposition" size="lg">
      <div className="space-y-5">
        <div className="flex items-center gap-3">
          <h3 className="text-display-sm">{p.title}</h3>
          <Badge color="neutral" size="sm">v{p.version_number}</Badge>
          <Badge color={st.color} dot>{st.label}</Badge>
        </div>

        {p.description && <p className="text-body-md text-ink-500">{p.description}</p>}

        <div className="grid grid-cols-2 gap-4 text-body-sm">
          <div><span className="text-ink-400">Projet:</span> <span className="text-ink-700 ml-1">{p.Project?.title || '—'}</span></div>
          <div><span className="text-ink-400">Auteur:</span> <span className="text-ink-700 ml-1">{p.Author?.first_name || '—'} {p.Author?.last_name || ''}</span></div>
          <div><span className="text-ink-400">Créée le:</span> <span className="text-ink-700 ml-1">{formatDate(p.created_at)}</span></div>
          <div><span className="text-ink-400">Mise à jour:</span> <span className="text-ink-700 ml-1">{formatDate(p.updated_at)}</span></div>
        </div>

        {/* Validation history */}
        <div>
          <h4 className="text-label font-semibold text-ink-700 mb-3">Historique de validation</h4>
          {loading ? <Skeleton className="h-20 rounded-lg" /> : validations.length === 0 ? (
            <p className="text-body-sm text-ink-400 py-4 text-center">Aucune validation enregistrée</p>
          ) : (
            <div className="space-y-2">
              {validations.map((v) => (
                <div key={v.id} className="flex items-start gap-3 p-3 bg-surface-50 rounded-lg">
                  <div className={`w-2 h-2 rounded-full mt-2 shrink-0 ${v.status === 'approved' ? 'bg-success-500' : v.status === 'rejected' ? 'bg-danger-500' : 'bg-warning-500'}`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 text-body-sm">
                      <span className="font-medium text-ink-700">{v.Validator?.first_name || '—'} {v.Validator?.last_name || ''}</span>
                      <Badge color={v.status === 'approved' ? 'success' : v.status === 'rejected' ? 'danger' : 'warning'} size="xs">
                        {v.status === 'approved' ? 'Validé' : v.status === 'rejected' ? 'Refusé' : 'À modifier'}
                      </Badge>
                    </div>
                    {v.comments && <p className="text-body-sm text-ink-400 mt-1">{v.comments}</p>}
                    <p className="text-body-sm text-ink-300 mt-1">{formatDate(v.validated_at || v.created_at)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}

function CreateProposalModal({ projects, onClose, onCreated }) {
  const [form, setForm] = useState({ title: '', description: '', project_id: '', file: null });
  const [submitting, setSubmitting] = useState(false);
  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title || !form.project_id) return toast.error('Titre et projet requis');
    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append('title', form.title);
      fd.append('description', form.description);
      fd.append('project_id', form.project_id);
      if (form.file) fd.append('file', form.file);
      await proposalsAPI.create(fd);
      toast.success('Proposition créée');
      onCreated();
    } catch (err) {
      toast.error(err.response?.data?.error?.message || 'Erreur');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal open onClose={onClose} title="Nouvelle proposition" size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input label="Titre *" value={form.title} onChange={(e) => set('title', e.target.value)} />
        <Textarea label="Description" value={form.description} onChange={(e) => set('description', e.target.value)} rows={3} />
        <Select label="Projet *" value={form.project_id} onChange={(e) => set('project_id', e.target.value)}>
          <option value="">Sélectionner un projet</option>
          {projects.map((p) => <option key={p.id} value={p.id}>{p.title}</option>)}
        </Select>
        <div>
          <label className="block text-label text-ink-600 mb-1">Fichier</label>
          <input type="file" onChange={(e) => set('file', e.target.files[0])} className="text-body-sm" />
        </div>
        <div className="flex justify-end gap-3 pt-2">
          <Button variant="secondary" onClick={onClose}>Annuler</Button>
          <Button type="submit" loading={submitting}>Soumettre</Button>
        </div>
      </form>
    </Modal>
  );
}
