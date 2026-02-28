import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  FolderKanban,
  FileText,
  CheckSquare,
  Calendar,
  Clock,
  Facebook,
  Linkedin,
  Instagram,
  Youtube,
  MessageCircle,
  MessageSquare,
  Music2,
  Globe,
  ExternalLink,
} from 'lucide-react';
import { Card, Badge, Tabs, Skeleton, EmptyState, Modal } from '../../components/ui';
import { projectsAPI, tasksAPI, publicationsAPI } from '../../api/services';
import { formatDate, PROJECT_STATUS, PRIORITY, extractList, formatErrorMessage } from '../../utils/helpers';
import { usePermissions } from '../../hooks';
import toast from 'react-hot-toast';

export default function ProjectDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isInternal, can } = usePermissions();
  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [publications, setPublications] = useState([]);
  const [activeTab, setActiveTab] = useState('details');
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadProject(); }, [id]);

  const loadProject = async () => {
    setLoading(true);
    try {
      const [projRes, taskRes, pubRes] = await Promise.allSettled([
        projectsAPI.getById(id),
        tasksAPI.list({ project_id: id, limit: 50 }),
        publicationsAPI.list(id),
      ]);
      if (projRes.status === 'fulfilled') setProject(projRes.value.data.data);
      if (taskRes.status === 'fulfilled') {
        const allTasks = extractList(taskRes.value.data.data).items;
        setTasks(allTasks.filter(t => String(t.project_id) === String(id)));
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
    { id: 'details', label: 'Détails', icon: FileText },
    { id: 'tasks', label: 'Tâches', icon: CheckSquare, count: tasks.length },
    { id: 'publications', label: 'Publications', icon: Calendar, count: publications.length },
  ];

  return (
    <div className="space-y-6">
      <button onClick={() => navigate('/projects')} className="flex items-center gap-1 text-body-sm text-ink-400 hover:text-ink-700 transition-default">
        <ArrowLeft className="w-4 h-4" /> Projets
      </button>

      {/* Project Header (titre + statuts uniquement) */}
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
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {can('projects.update') && <StatusDropdown project={project} onUpdate={loadProject} />}
        </div>
      </div>

      {/* Tabs */}
      <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

      {/* Tab Content */}
      <div className="animate-fade-in">
        {activeTab === 'details' && <DetailsTab project={project} />}
        {activeTab === 'tasks' && <TasksTab tasks={tasks} onRefresh={loadProject} />}
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

function DetailsTab({ project }) {
  return (
    <Card>
      <div className="space-y-6">
        {/* Identité projet */}
        <div className="border-b border-surface-200 pb-4">
          <div className="space-y-1">
            <h4 className="text-label text-ink-500">Direction / Agence</h4>
            <p className="text-body-md text-ink-900 font-medium">
              {project?.direction?.name || '—'}
            </p>
          </div>
        </div>

        {/* Description */}
        {project.description && (
          <div className="bg-surface-50 border border-surface-200 rounded-xl p-4 space-y-2">
            <h4 className="text-label text-ink-500">Description du projet</h4>
            <p className="text-body-md text-ink-700 whitespace-pre-line">
              {project.description}
            </p>
          </div>
        )}

        {/* Dates & métadonnées */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-1">
            <h4 className="text-label text-ink-500">Créé le</h4>
            <p className="text-body-md text-ink-700 flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-ink-400" />
              {formatDate(project.createdAt)}
            </p>
          </div>
          <div className="space-y-1">
            <h4 className="text-label text-ink-500">Date cible</h4>
            <p className="text-body-md text-ink-700 flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-ink-400" />
              {project.target_date ? formatDate(project.target_date) : '—'}
            </p>
          </div>
          <div className="space-y-1">
            <h4 className="text-label text-ink-500">Créé par</h4>
            <p className="text-body-md text-ink-700">
              {project.creator
                ? `${project.creator.first_name || ''} ${project.creator.last_name || ''}`.trim()
                : '—'}
            </p>
          </div>
        </div>

        {/* Responsables */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-surface-50 border border-surface-200 rounded-xl p-4">
          <div className="space-y-1">
            <h4 className="text-label text-ink-500">Responsable interne</h4>
            <p className="text-body-md text-ink-700">
              {project.internalManager
                ? `${project.internalManager.first_name || ''} ${project.internalManager.last_name || ''}`.trim()
                : '—'}
            </p>
          </div>
          <div className="space-y-1">
            <h4 className="text-label text-ink-500">Responsable client</h4>
            <p className="text-body-md text-ink-700">
              {project.clientContact
                ? `${project.clientContact.first_name || ''} ${project.clientContact.last_name || ''}`.trim()
                : '—'}
            </p>
          </div>
        </div>
      </div>
    </Card>
  );
}

const NETWORK_ICON_MAP = {
  facebook: Facebook,
  linkedin: Linkedin,
  instagram: Instagram,
  youtube: Youtube,
  x: MessageSquare,
  tiktok: Music2,
  whatsapp: MessageCircle,
  messenger: MessageSquare,
  other: Globe,
};

function TasksTab({ tasks, onRefresh }) {
  const navigate = useNavigate();
  const [draggedTask, setDraggedTask] = useState(null);
  const [showArchived, setShowArchived] = useState(false);
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

  const baseColumns = ['todo', 'in_production', 'done'];
  const columns = showArchived ? [...baseColumns, 'cancelled'] : baseColumns;
  const colMap = {
    todo: { label: 'À faire', color: 'bg-surface-300' },
    in_production: { label: 'En cours', color: 'bg-info-500' },
    done: { label: 'Terminé', color: 'bg-success-500' },
    cancelled: { label: 'Archivé', color: 'bg-warning-500' },
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <label className="flex items-center gap-2 cursor-pointer select-none">
          <span className="text-body-sm text-ink-500">Archivés</span>
          <button
            type="button"
            role="switch"
            aria-checked={showArchived}
            onClick={() => setShowArchived((v) => !v)}
            className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${showArchived ? 'bg-primary-500' : 'bg-surface-300'}`}
          >
            <span className={`inline-block h-3.5 w-3.5 rounded-full bg-white shadow-sm transition-transform ${showArchived ? 'translate-x-[18px]' : 'translate-x-[3px]'}`} />
          </button>
        </label>
      </div>
      <div className={`grid grid-cols-1 md:grid-cols-2 ${showArchived ? 'xl:grid-cols-4' : 'xl:grid-cols-3'} gap-4`}>
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
    </div>
  );
}

function PublicationsTab({ publications }) {
  const [selected, setSelected] = useState(null);

  if (publications.length === 0) {
    return <EmptyState icon={Calendar} title="Aucune publication" description="Aucune publication n'a été enregistrée" />;
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {publications.map((pub) => (
          <Card
            key={pub.id}
            className="cursor-pointer hover:border-primary-300 hover:shadow-card-hover transition-default"
            onClick={() => setSelected(pub)}
          >
            <div className="flex items-center justify-between gap-2 mb-2">
              <div className="flex items-center gap-2 min-w-0">
                <Badge color="info" size="sm">
                  {pub.channel || 'Publication'}
                </Badge>
                {pub.status && (
                  <span className="text-body-xs text-ink-400 uppercase tracking-wide">
                    {pub.status}
                  </span>
                )}
              </div>
              {pub.publication_date && (
                <span className="text-body-sm text-ink-400 whitespace-nowrap">
                  {formatDate(pub.publication_date)}
                </span>
              )}
            </div>

            <p className="text-body-md font-medium text-ink-900 mb-1 line-clamp-1">
              {pub.task?.title || pub.notes || 'Publication éditoriale'}
            </p>

            <p className="text-body-sm text-ink-500 mb-2 line-clamp-2">
              {(pub.networks || []).length
                ? `Réseaux : ${(pub.networks || []).join(', ')}`
                : 'Réseaux : —'}
            </p>

            {!!pub.link && (
              <a
                href={pub.link}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-body-sm text-primary-600 hover:text-primary-700 hover:underline"
                onClick={(e) => e.stopPropagation()}
              >
                <Globe className="w-3.5 h-3.5" />
                <span className="truncate max-w-[220px]">{pub.link}</span>
              </a>
            )}
          </Card>
        ))}
      </div>

      {selected && (
        <Modal
          open
          onClose={() => setSelected(null)}
          title="Détail publication éditoriale"
          size="md"
        >
          <div className="space-y-3">
            <p>
              <span className="text-ink-400">Publicateur:</span>{' '}
              <span className="text-ink-700">
                {selected.publisher_name || '—'}
              </span>
            </p>
            <p>
              <span className="text-ink-400">Date de publication:</span>{' '}
              <span className="text-ink-700">
                {selected.publication_date
                  ? formatDate(selected.publication_date)
                  : '—'}
              </span>
            </p>
            <p>
              <span className="text-ink-400">Tâche publiée:</span>{' '}
              <span className="text-ink-700">
                {selected.task?.title || '—'}
              </span>
            </p>
            <p>
              <span className="text-ink-400">Réseaux:</span>{' '}
              <span className="text-ink-700">
                {(selected.networks || []).join(', ') || '—'}
              </span>
            </p>

            <div>
              <span className="text-ink-400">Liens réseaux:</span>
              <div className="mt-2 space-y-2">
                {Object.entries(selected.network_links || {}).length ? (
                  Object.entries(selected.network_links || {}).map(
                    ([network, link]) => (
                      <a
                        key={network}
                        href={link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-between gap-3 rounded-lg border border-surface-200 bg-surface-50 px-3 py-2 hover:border-primary-300 hover:bg-primary-50 transition-default"
                      >
                        <span className="flex items-center gap-2 min-w-0">
                          {(() => {
                            const Icon =
                              NETWORK_ICON_MAP[
                                String(network || '').toLowerCase()
                              ] || Globe;
                            return (
                              <Icon className="w-4 h-4 text-primary-500 shrink-0" />
                            );
                          })()}
                          <span className="text-body-sm font-medium text-ink-700 capitalize">
                            {network}
                          </span>
                        </span>
                        <span className="flex items-center gap-1 text-primary-600 text-body-sm truncate">
                          <span className="truncate max-w-[220px]">
                            {link}
                          </span>
                          <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                        </span>
                      </a>
                    ),
                  )
                ) : (
                  <p className="text-ink-700">—</p>
                )}
              </div>
            </div>

            {selected.notes && (
              <div className="pt-1">
                <span className="text-ink-400 block mb-1">Notes:</span>
                <p className="text-body-sm text-ink-700 whitespace-pre-line">
                  {selected.notes}
                </p>
              </div>
            )}
          </div>
        </Modal>
      )}
    </>
  );
}
