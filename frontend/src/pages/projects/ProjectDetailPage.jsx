import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, FolderKanban, FileText, CheckSquare, Send, History,
  Calendar, Paperclip, Clock,
} from 'lucide-react';
import { Card, Badge, Tabs, Skeleton, EmptyState } from '../../components/ui';
import { projectsAPI, briefsAPI, tasksAPI, proposalsAPI, publicationsAPI } from '../../api/services';
import { formatDate, formatRelative, PROJECT_STATUS, PROPOSAL_STATUS, PRIORITY, extractList, formatErrorMessage } from '../../utils/helpers';
import { usePermissions } from '../../hooks';
import toast from 'react-hot-toast';

export default function ProjectDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isInternal, can } = usePermissions();
  const [project, setProject] = useState(null);
  const [briefs, setBriefs] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [proposals, setProposals] = useState([]);
  const [publications, setPublications] = useState([]);
  const [activeTab, setActiveTab] = useState('brief');
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadProject(); }, [id]);

  const loadProject = async () => {
    setLoading(true);
    try {
      const [projRes, briefRes, taskRes, propRes, pubRes] = await Promise.allSettled([
        projectsAPI.getById(id),
        briefsAPI.list(id),
        tasksAPI.list({ project_id: id, limit: 50 }),
        proposalsAPI.list(id),
        publicationsAPI.list(id),
      ]);
      if (projRes.status === 'fulfilled') setProject(projRes.value.data.data);
      if (briefRes.status === 'fulfilled') setBriefs(extractList(briefRes.value.data.data).items);
      if (taskRes.status === 'fulfilled') {
        // Filtrage strict côté client au cas où l'API ne filtre pas
        const allTasks = extractList(taskRes.value.data.data).items;
        setTasks(allTasks.filter(t => String(t.project_id) === String(id)));
      }
      if (propRes.status === 'fulfilled') {
        const propData = propRes.value.data.data;
        setProposals(Array.isArray(propData) ? propData : extractList(propData).items);
      }
      if (pubRes.status === 'fulfilled') setPublications(extractList(pubRes.value.data.data).items);
    } catch (err) {
      toast.error('Erreur lors du chargement du projet');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-10 w-96" />
        <Skeleton className="h-48 rounded-xl" />
        <Skeleton className="h-64 rounded-xl" />
      </div>
    );
  }

  if (!project) return null;

  const status = PROJECT_STATUS[project.status] || { label: project.status, color: 'neutral' };
  const priority = PRIORITY[project.priority] || { label: project.priority, color: 'neutral' };

  const tabs = [
    { id: 'brief', label: 'Brief', icon: FileText },
    { id: 'tasks', label: 'Tâches', icon: CheckSquare, count: tasks.length },
    { id: 'proposals', label: 'Propositions', icon: Send, count: proposals.length },
    { id: 'validations', label: 'Validations', icon: History },
    { id: 'publications', label: 'Publications', icon: Calendar, count: publications.length },
  ];

  return (
    <div className="space-y-6">
      <button onClick={() => navigate('/projects')} className="flex items-center gap-1 text-body-sm text-ink-400 hover:text-ink-700 transition-default">
        <ArrowLeft className="w-4 h-4" /> Projets
      </button>

      {/* Project Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 rounded-2xl bg-primary-50 flex items-center justify-center shrink-0">
            <FolderKanban className="w-7 h-7 text-primary-500" />
          </div>
          <div>
            <h1 className="text-display-lg">{project.title}</h1>
            <div className="flex flex-wrap items-center gap-2 mt-1.5">
              <Badge color={status.color} dot>{status.label}</Badge>
              <Badge color={priority.color}>{priority.label}</Badge>
              <span className="text-body-sm text-ink-400">
                {project.Organization?.name || '—'} • {project.agency_direction || ''}
              </span>
            </div>
            {project.description && (
              <p className="text-body-md text-ink-500 mt-3 max-w-2xl">{project.description}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {can('projects.update') && <StatusDropdown project={project} onUpdate={loadProject} />}
        </div>
      </div>

      {/* Info bar */}
      <div className="flex items-center gap-6 text-body-sm text-ink-500">
        {project.target_date && (
          <span className="flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-ink-400" /> Cible: {formatDate(project.target_date)}
          </span>
        )}
        <span className="flex items-center gap-1.5">
          <Calendar className="w-4 h-4 text-ink-400" /> Créé le {formatDate(project.createdAt)}
        </span>
      </div>

      {/* Tabs */}
      <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

      {/* Tab Content */}
      <div className="animate-fade-in">
        {activeTab === 'brief' && <BriefTab briefs={briefs} projectId={id} onRefresh={loadProject} />}
        {activeTab === 'tasks' && <TasksTab tasks={tasks} onRefresh={loadProject} />}
        {activeTab === 'proposals' && <ProposalsTab proposals={proposals} />}
        {activeTab === 'validations' && <ValidationsTab proposals={proposals} />}
        {activeTab === 'publications' && <PublicationsTab publications={publications} />}
      </div>
    </div>
  );
}

function StatusDropdown({ project, onUpdate }) {
  const [loading, setLoading] = useState(false);
  const statuses = ['brief_received', 'in_production', 'in_validation', 'published', 'archived'];

  const handleChange = async (newStatus) => {
    setLoading(true);
    try {
      await projectsAPI.patchStatus(project.id, { status: newStatus });
      toast.success('Statut mis à jour');
      onUpdate();
    } catch (err) {
      const details = formatErrorMessage(err);
      details.forEach((detail) => toast.error(detail.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <select
      value={project.status}
      onChange={(e) => handleChange(e.target.value)}
      disabled={loading}
      className="h-8 px-3 pr-8 text-body-sm font-medium bg-white border border-surface-400 rounded-lg appearance-none focus:outline-none focus:ring-2 focus:ring-primary-500/20"
    >
      {statuses.map((s) => (
        <option key={s} value={s}>{PROJECT_STATUS[s]?.label || s}</option>
      ))}
    </select>
  );
}

function BriefTab({ briefs }) {
  if (briefs.length === 0) {
    return <EmptyState icon={FileText} title="Aucun brief" description="Le brief initial n'a pas encore été soumis" />;
  }

  const brief = briefs[0];
  return (
    <Card>
      <div className="space-y-4">
        {brief.description && <div><h4 className="text-label text-ink-500 mb-1">Description</h4><p className="text-body-md text-ink-700">{brief.description}</p></div>}
        {brief.objective && <div><h4 className="text-label text-ink-500 mb-1">Objectif</h4><p className="text-body-md text-ink-700">{brief.objective}</p></div>}
        {brief.target_audience && <div><h4 className="text-label text-ink-500 mb-1">Cible</h4><p className="text-body-md text-ink-700">{brief.target_audience}</p></div>}
        {brief.key_message && <div><h4 className="text-label text-ink-500 mb-1">Message clé</h4><p className="text-body-md text-ink-700">{brief.key_message}</p></div>}
        {brief.deadline && <div><h4 className="text-label text-ink-500 mb-1">Deadline</h4><p className="text-body-md text-ink-700">{formatDate(brief.deadline)}</p></div>}
        {brief.Attachments?.length > 0 && (
          <div>
            <h4 className="text-label text-ink-500 mb-2">Pièces jointes</h4>
            <div className="space-y-1">
              {brief.Attachments.map((a) => (
                <div key={a.id} className="flex items-center gap-2 px-3 py-2 bg-surface-100 rounded-lg text-body-sm">
                  <Paperclip className="w-4 h-4 text-ink-400" />
                  <span className="text-ink-700">{a.file_name}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}



function TasksTab({ tasks, onRefresh }) {
  const navigate = useNavigate();
  const [draggedTask, setDraggedTask] = useState(null);
  const dragOverCol = useRef(null);

  const handleDragStart = (task) => setDraggedTask(task);
  const handleDragEnd = () => {
    setDraggedTask(null);
    dragOverCol.current = null;
  };
  const handleDragOver = (col) => (e) => {
    e.preventDefault();
    dragOverCol.current = col;
  };
  const handleDrop = async (col) => {
    if (!draggedTask || draggedTask.status === col) return;
    try {
      await tasksAPI.patchStatus(draggedTask.id, { status: col });
      toast.success('Statut de la tâche mis à jour');
      if (typeof onRefresh === 'function') onRefresh();
    } catch (err) {
      const details = formatErrorMessage(err);
      details.forEach((detail) => toast.error(detail.message));
    } finally {
      setDraggedTask(null);
      dragOverCol.current = null;
    }
  };

  if (tasks.length === 0) {
    return <EmptyState icon={CheckSquare} title="Aucune tâche" description="Aucune tâche associée à ce projet" />;
  }

  const columns = ['todo', 'in_production', 'done', 'blocked'];
  const colMap = {
    todo: { label: 'À faire', color: 'bg-surface-300' },
    in_production: { label: 'En cours', color: 'bg-info-500' },
    done: { label: 'Terminé', color: 'bg-success-500' },
    blocked: { label: 'Bloqué', color: 'bg-danger-500' },
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
      {columns.map((col) => {
        const colTasks = tasks.filter((t) => t.status === col);
        const info = colMap[col];
        return (
          <div
            key={col}
            className={`space-y-3 min-h-[280px] ${dragOverCol.current === col ? 'ring-2 ring-info-400' : ''}`}
            onDragOver={handleDragOver(col)}
            onDrop={() => handleDrop(col)}
          >
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${info.color}`} />
              <h4 className="text-label text-ink-700">{info.label}</h4>
              <span className="text-body-sm text-ink-400">({colTasks.length})</span>
            </div>
            <div className="space-y-2">
              {colTasks.map((t) => (
                <div
                  key={t.id}
                  className="bg-white rounded-xl border border-surface-300 p-3 shadow-card hover:shadow-card-hover transition-shadow cursor-pointer"
                  draggable
                  onDragStart={() => handleDragStart(t)}
                  onDragEnd={handleDragEnd}
                  onClick={() => navigate(`/tasks/${t.id}`)}
                >
                  <p className="text-body-md font-medium text-ink-900 mb-1">{t.title}</p>
                  {t.description && <p className="text-body-sm text-ink-400 line-clamp-2 mb-2">{t.description}</p>}
                  <div className="flex items-center justify-between">
                    <Badge color={PRIORITY[t.priority]?.color || 'neutral'} size="xs">{PRIORITY[t.priority]?.label || t.priority}</Badge>
                    {t.due_date && <span className="text-body-sm text-ink-400">{formatDate(t.due_date)}</span>}
                  </div>
                </div>
              ))}
              {colTasks.length === 0 && (
                <div className="border-2 border-dashed border-surface-300 rounded-xl p-4 text-center text-body-sm text-ink-400">Vide</div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function ProposalsTab({ proposals }) {
  if (proposals.length === 0) {
    return <EmptyState icon={Send} title="Aucune proposition" description="Aucune proposition n'a été déposée" />;
  }

  return (
    <div className="space-y-3">
      {proposals.map((p) => {
        const status = PROPOSAL_STATUS[p.status] || { label: p.status, color: 'neutral' };
        return (
          <Card key={p.id}>
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="text-body-lg font-medium text-ink-900">{p.title}</h4>
                  <Badge color="neutral" size="xs">v{p.version_number}</Badge>
                </div>
                <p className="text-body-sm text-ink-400">{p.description}</p>
                <div className="flex items-center gap-3 mt-2 text-body-sm text-ink-400">
                  <span>Par {p.Author?.first_name || '—'} {p.Author?.last_name || ''}</span>
                  <span>•</span>
                  <span>{formatRelative(p.created_at)}</span>
                </div>
              </div>
              <Badge color={status.color} dot>{status.label}</Badge>
            </div>
          </Card>
        );
      })}
    </div>
  );
}

function ValidationsTab({ proposals }) {
  const [validations, setValidations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const allVals = [];
        for (const p of proposals) {
          try {
            const projectId = p.project_id || p.Project?.id;
            if (!projectId) continue;
            const { data } = await proposalsAPI.getValidations(projectId, p.id);
            const vals = Array.isArray(data.data) ? data.data : extractList(data.data).items;
            allVals.push(...vals.map((v) => ({ ...v, proposalTitle: p.title, version: p.version_number })));
          } catch {}
        }
        setValidations(allVals);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [proposals]);

  if (loading) return <Skeleton className="h-32 rounded-xl" />;

  if (validations.length === 0) {
    return <EmptyState icon={History} title="Aucune validation" description="L'historique de validation est vide" />;
  }

  return (
    <Card padding={false}>
      <table className="w-full">
        <thead>
          <tr className="border-b border-surface-200">
            <th className="text-left text-label text-ink-500 font-medium px-5 py-3">Proposition</th>
            <th className="text-left text-label text-ink-500 font-medium px-5 py-3">Validateur</th>
            <th className="text-left text-label text-ink-500 font-medium px-5 py-3">Décision</th>
            <th className="text-left text-label text-ink-500 font-medium px-5 py-3">Commentaire</th>
            <th className="text-left text-label text-ink-500 font-medium px-5 py-3">Date</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-surface-200">
          {validations.map((v) => (
            <tr key={v.id}>
              <td className="px-5 py-3 text-body-sm text-ink-700">{v.proposalTitle} (v{v.version})</td>
              <td className="px-5 py-3 text-body-sm text-ink-500">{v.Validator?.first_name || '—'} {v.Validator?.last_name || ''}</td>
              <td className="px-5 py-3">
                <Badge
                  color={v.status === 'approved' ? 'success' : v.status === 'rejected' ? 'danger' : 'warning'}
                  dot size="sm"
                >
                  {v.status === 'approved' ? 'Validé' : v.status === 'rejected' ? 'Refusé' : 'À modifier'}
                </Badge>
              </td>
              <td className="px-5 py-3 text-body-sm text-ink-400 max-w-xs truncate">{v.comments || '—'}</td>
              <td className="px-5 py-3 text-body-sm text-ink-400">{formatDate(v.validated_at || v.created_at)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  );
}

function PublicationsTab({ publications }) {
  if (publications.length === 0) {
    return <EmptyState icon={Calendar} title="Aucune publication" description="Aucune publication n'a été enregistrée" />;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {publications.map((pub) => (
        <Card key={pub.id}>
          <div className="flex items-center gap-2 mb-2">
            <Badge color="info" size="sm">{pub.channel}</Badge>
            <span className="text-body-sm text-ink-400">{formatDate(pub.publication_date)}</span>
          </div>
          {pub.link && (
            <a href={pub.link} target="_blank" rel="noopener noreferrer"
              className="text-body-sm text-primary-500 hover:underline truncate block">
              {pub.link}
            </a>
          )}
        </Card>
      ))}
    </div>
  );
}
