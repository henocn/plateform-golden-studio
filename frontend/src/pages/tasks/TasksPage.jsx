import { useState, useEffect, useMemo, useRef } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Plus, Clock, AlertTriangle, List, LayoutGrid, Trash2 } from "lucide-react";
import {
  Card,
  Button,
  Badge,
  Modal,
  Input,
  Select,
  Textarea,
  SearchInput,
  Autocomplete,
  Skeleton,
  Avatar,
} from "../../components/ui";
import { tasksAPI, projectsAPI, calendarAPI, usersAPI } from "../../api/services";
import {
  formatDate,
  TASK_STATUS,
  PRIORITY,
  extractList,
  formatErrorMessage,
} from "../../utils/helpers";
import { usePermissions } from "../../hooks";
import toast from "react-hot-toast";

export default function TasksPage() {
  const navigate = useNavigate();
  const { isInternal, can } = usePermissions();
  const [searchParams, setSearchParams] = useSearchParams();
  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [events, setEvents] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState("kanban");
  const [showCreate, setShowCreate] = useState(false);
  const [showArchived, setShowArchived] = useState(false);

  const page = parseInt(searchParams.get("page") || "1");
  const status = searchParams.get("status") || "";
  const priority = searchParams.get("priority") || "";
  const projectId = searchParams.get("project") || "";
  const search = searchParams.get("q") || "";

  useEffect(() => {
    loadTasks();
  }, [page, status, priority, projectId, search]);
  useEffect(() => {
    loadEvents();
    loadProjects();
  }, []);

  const loadTasks = async () => {
    setLoading(true);
    try {
      const params = { page, limit: 100 };
      if (status) params.status = status;
      if (priority) params.priority = priority;
      if (projectId) params.projectId = projectId;
      if (search) params.search = search;
      const { data } = await tasksAPI.list(params);
      const { items, total } = extractList(data.data);
      const sorted = items
        .slice()
        .sort(
          (a, b) =>
            new Date(b.createdAt || b.updatedAt || 0) -
            new Date(a.createdAt || a.updatedAt || 0),
        );
      setTasks(sorted);
      setTotal(total);
    } catch (err) {
      toast.error("Erreur lors du chargement des tâches");
    } finally {
      setLoading(false);
    }
  };

  const loadProjects = async () => {
    try {
      const { data } = await projectsAPI.list({ page: 1, limit: 100 });
      setProjects(extractList(data.data).items);
    } catch (err) {
      toast.error("Erreur lors du chargement des projets");
    }
  };

  const loadEvents = async () => {
    try {
      const { data } = await calendarAPI.listEvents({ page: 1, limit: 100 });
      setEvents(extractList(data.data).items);
    } catch (err) {
      toast.error("Erreur lors du chargement des événements");
    }
  };

  const updateParam = (key, value) => {
    const p = new URLSearchParams(searchParams);
    if (value) p.set(key, value);
    else p.delete(key);
    if (key !== "page") p.set("page", "1");
    setSearchParams(p);
  };

  const baseColumns = ["todo", "in_production", "done"];
  const columns = showArchived ? [...baseColumns, "cancelled"] : baseColumns;
  const columnConfig = {
    todo: { label: "À faire", accent: "bg-surface-400" },
    in_production: { label: "En cours", accent: "bg-info-500" },
    done: { label: "Terminé", accent: "bg-success-500" },
    cancelled: { label: "Archivé", accent: "bg-warning-500" },
  };

  /* Normalise les anciens statuts: blocked → cancelled (archivé) */
  const normalizeStatus = (statusValue) =>
    statusValue === "blocked" ? "cancelled" : statusValue;

  const grouped = useMemo(() => {
    const allCols = ["todo", "in_production", "done", "cancelled"];
    const map = {};
    allCols.forEach((c) => (map[c] = []));
    (Array.isArray(tasks) ? tasks : []).forEach((t) => {
      const s = normalizeStatus(t.status);
      if (map[s]) map[s].push(t);
    });
    return map;
  }, [tasks]);

  // Drag & Drop logic
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
      toast.success("Statut de la tâche mis à jour");
      loadTasks();
    } catch (err) {
      const details = formatErrorMessage(err);
      details.forEach((detail) => toast.error(detail.message));
    } finally {
      setDraggedTask(null);
      dragOverCol.current = null;
    }
  };

  const isOverdue = (t) =>
    t.due_date && new Date(t.due_date) < new Date() && t.status !== "done" && t.status !== "cancelled";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-display-lg">Tâches</h1>
          <p className="text-body-md text-ink-400 mt-1">
            {total} tâche{total !== 1 ? "s" : ""}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* View toggle */}
          <div className="flex items-center bg-surface-100 rounded-lg p-0.5">
            <button
              onClick={() => setView("kanban")}
              className={`p-1.5 rounded-md ${view === "kanban" ? "bg-white shadow-sm text-ink-700" : "text-ink-400"}`}
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setView("list")}
              className={`p-1.5 rounded-md ${view === "list" ? "bg-white shadow-sm text-ink-700" : "text-ink-400"}`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
          {can("tasks.create") && (
            <Button onClick={() => setShowCreate(true)} icon={Plus}>
              Nouvelle tâche
            </Button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <SearchInput
          value={search}
          onChange={(v) => updateParam("q", v)}
          placeholder="Rechercher une tâche…"
          className="w-64"
        />
        <Autocomplete
          label={null}
          value={projectId}
          onChange={(v) => updateParam("project", v)}
          options={[
            { value: "", label: "Tous les projets" },
            ...projects.map((p) => ({ value: p.id, label: p.title })),
          ]}
          placeholder="Projet..."
          className="w-48"
        />
        <Select
          value={priority}
          onChange={(e) => updateParam("priority", e.target.value)}
          className="w-36"
          options={[
            { value: "", label: "Toutes priorités" },
            ...Object.entries(PRIORITY).map(([k, v]) => ({
              value: k,
              label: v.label,
            })),
          ]}
          placeholder="Priorité"
        />
        <Select
          value={status}
          onChange={(e) => updateParam("status", e.target.value)}
          className="w-36"
          options={[
            { value: "", label: "Tous statuts" },
            ...Object.entries(TASK_STATUS).map(([k, v]) => ({
              value: k,
              label: v.label,
            })),
          ]}
          placeholder="Statut"
        />
        <label className="flex items-center gap-2 ml-auto cursor-pointer select-none">
          <span className="text-body-sm text-ink-500">Archivés</span>
          <button
            type="button"
            role="switch"
            aria-checked={showArchived}
            onClick={() => setShowArchived((v) => !v)}
            className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${showArchived ? "bg-primary-500" : "bg-surface-300"}`}
          >
            <span
              className={`inline-block h-3.5 w-3.5 rounded-full bg-white shadow-sm transition-transform ${showArchived ? "translate-x-[18px]" : "translate-x-[3px]"}`}
            />
          </button>
        </label>
      </div>

      {/* Content */}
      {loading ? (
        <div className={`grid grid-cols-1 md:grid-cols-2 ${showArchived ? "xl:grid-cols-4" : "xl:grid-cols-3"} gap-4`}>
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-48 rounded-xl" />
          ))}
        </div>
      ) : view === "kanban" ? (
        <div className={`grid grid-cols-1 md:grid-cols-2 ${showArchived ? "xl:grid-cols-4" : "xl:grid-cols-3"} gap-5`}>
          {columns.map((col) => {
            const cfg = columnConfig[col];
            const items = grouped[col] || [];
            return (
              <div
                key={col}
                className={`flex flex-col min-h-[280px] ${dragOverCol.current === col ? "ring-2 ring-info-400" : ""}`}
                onDragOver={handleDragOver(col)}
                onDrop={() => handleDrop(col)}
              >
                <div className="flex items-center gap-2.5 mb-3">
                  <div className={`w-2.5 h-2.5 rounded-full ${cfg.accent}`} />
                  <h3 className="text-label font-semibold text-ink-700">
                    {cfg.label}
                  </h3>
                  <span className="ml-auto text-body-sm text-ink-400 bg-surface-100 px-2 py-0.5 rounded-full">
                    {items.length}
                  </span>
                </div>
                <div className="space-y-2.5 flex-1 min-h-[80px]">
                  {items.map((t) => (
                    <div
                      key={t.id}
                      onClick={() => navigate(`/tasks/${t.id}`)}
                      style={{ cursor: "pointer" }}
                    >
                      <TaskCard
                        task={t}
                        isOverdue={isOverdue(t)}
                        draggable
                        onDragStart={() => handleDragStart(t)}
                        onDragEnd={handleDragEnd}
                        canDelete={can("tasks.delete")}
                        onDelete={async (task) => {
                          const confirmed = window.confirm(
                            `Voulez-vous vraiment supprimer la tâche « ${task.title} » ?`,
                          );
                          if (!confirmed) return;
                          try {
                            await tasksAPI.remove(task.id);
                            toast.success("Tâche supprimée");
                            loadTasks();
                          } catch (err) {
                            const details = formatErrorMessage(err);
                            details.forEach((d) => toast.error(d.message));
                          }
                        }}
                      />
                    </div>
                  ))}
                  {items.length === 0 && (
                    <div className="border-2 border-dashed border-surface-300 rounded-xl flex items-center justify-center h-24 text-body-sm text-ink-400">
                      Aucune tâche
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <Card padding={false}>
          <table className="w-full">
            <thead>
              <tr className="border-b border-surface-200">
                <th className="text-left text-label text-ink-500 font-medium px-5 py-3">
                  Titre
                </th>
                <th className="text-left text-label text-ink-500 font-medium px-5 py-3">
                  Statut
                </th>
                <th className="text-left text-label text-ink-500 font-medium px-5 py-3">
                  Priorité
                </th>
                <th className="text-left text-label text-ink-500 font-medium px-5 py-3">
                  Échéance
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-200">
              {tasks.length === 0 ? (
                <tr>
                  <td
                    colSpan={4}
                    className="px-5 py-12 text-center text-body-sm text-ink-400"
                  >
                    Aucune tâche trouvée
                  </td>
                </tr>
              ) : (
                tasks
                  .slice()
                  .sort(
                    (a, b) =>
                      new Date(b.created_at || b.updated_at || 0) -
                      new Date(a.created_at || a.updated_at || 0),
                  )
                  .map((t) => {
                    const displayStatus = normalizeStatus(t.status);
                    const s = TASK_STATUS[displayStatus] || {
                      label: t.status,
                      color: "neutral",
                    };
                    const p = PRIORITY[t.priority] || {
                      label: t.priority,
                      color: "neutral",
                    };
                    const over = isOverdue(t);
                    return (
                      <tr
                        key={t.id}
                        className="hover:bg-surface-50 transition-default cursor-pointer"
                        onClick={() => navigate(`/tasks/${t.id}`)}
                      >
                        <td className="px-5 py-3 text-body-sm font-medium text-ink-900">
                          <div className="flex items-center gap-2">
                            <span>{t.title}</span>
                            <span
                              className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium ${t.context === "event"
                                ? "bg-info-50 text-info-700 border border-info-100"
                                : "bg-surface-50 text-ink-600 border border-surface-200"
                                }`}
                            >
                              {t.context === "event" ? "Événement" : "Projet"}
                            </span>
                          </div>
                        </td>
                        <td className="px-5 py-3">
                          <Badge color={s.color} dot size="sm">
                            {s.label}
                          </Badge>
                        </td>
                        <td className="px-5 py-3">
                          <Badge color={p.color} size="sm">
                            {p.label}
                          </Badge>
                        </td>
                        <td
                          className={`px-5 py-3 text-body-sm ${over ? "text-danger-600 font-medium" : "text-ink-500"}`}
                        >
                          {t.due_date ? formatDate(t.due_date) : "—"}
                          {over && (
                            <AlertTriangle className="inline w-3.5 h-3.5 ml-1 -mt-0.5" />
                          )}
                        </td>
                      </tr>
                    );
                  })
              )}
            </tbody>
          </table>
        </Card>
      )}

      {showCreate && (
        <CreateTaskModal
          projects={projects}
          events={events}
          isInternal={isInternal}
          onClose={() => setShowCreate(false)}
          onCreated={() => {
            setShowCreate(false);
            loadTasks();
          }}
        />
      )}
    </div>
  );
}

function TaskCard({ task: t, isOverdue, draggable, onDragStart, onDragEnd, canDelete, onDelete }) {
  return (
    <div
      className={`bg-white rounded-xl border border-2 p-3.5 shadow-card hover:shadow-card-hover transition-shadow ${isOverdue
        ? "border-red-500"
        : "border-green-600"
        } ${t.context === "event" ? "bg-blue-300/10" : "bg-orange-300/10"}`}
      draggable={draggable}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      style={draggable ? { cursor: "grab" } : {}}
    >
      <div className="flex items-center justify-between mb-1.5">
        <p className="text-body-md font-medium text-ink-900">{t.title}</p>
        {canDelete && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onDelete?.(t);
            }}
            className="p-1.5 rounded-full text-ink-300 hover:text-danger-600 hover:bg-danger-50 transition-colors"
            aria-label="Supprimer la tâche"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>
      {t.description && (
        <p className="text-body-sm text-ink-400 line-clamp-2 mb-2.5">
          {t.description}
        </p>
      )}
      {!t.is_configured && (
        <p className="text-[11px] text-warning-700 font-medium mb-1">
          À paramétrer
        </p>
      )}
      <div className="flex items-center justify-between">
        <Badge color={PRIORITY[t.priority]?.color || "neutral"} size="xs">
          {PRIORITY[t.priority]?.label || t.priority}
        </Badge>
        <div className="flex items-center gap-2 text-body-sm text-ink-400">
          {t.due_date && (
            <span
              className={`flex items-center gap-1 ${isOverdue ? "text-danger-600 font-medium" : ""}`}
            >
              <Clock className="w-3.5 h-3.5" />
              {formatDate(t.due_date)}
            </span>
          )}
        </div>
      </div>
      {t.Assignee && (
        <div className="flex items-center gap-2 mt-2.5 pt-2 border-t border-surface-200">
          <Avatar
            name={`${t.Assignee.first_name} ${t.Assignee.last_name}`}
            size="xs"
          />
          <span className="text-body-sm text-ink-500">
            {t.Assignee.first_name} {t.Assignee.last_name}
          </span>
        </div>
      )}
    </div>
  );
}

function CreateTaskModal({ projects, events, isInternal, onClose, onCreated }) {
  const [form, setForm] = useState({
    title: "",
    description: "",
    project_id: "",
    context: "project",
    event_id: "",
    priority: "normal",
    due_date: "",
    assigned_to: "",
    supervisor_id: "",
    publication_date: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [users, setUsers] = useState([]);
  const [validators, setValidators] = useState([]);
  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  useEffect(() => {
    const loadUsers = async () => {
      try {
        let allUsers;
        if (isInternal) {
          allUsers = await usersAPI.listMembers({ limit: 100 });
        } else {
          allUsers = await usersAPI.listClients({ limit: 100 });
        }
        const validators = await usersAPI.listClients({ limit: 100, role: "client_validator" });
        setUsers(extractList(allUsers.data.data).items);
        setValidators(extractList(validators.data.data).items);
      } catch {
        setUsers([]);
        setValidators([]);
      }
    };
    loadUsers();
  }, [isInternal]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title) {
      return toast.error("Titre requis");
    }
    if (form.context === "project" && !form.project_id) {
      return toast.error("Projet requis pour une tâche de projet");
    }
    if (form.context === "event" && !form.event_id) {
      return toast.error("Événement requis pour une tâche d’événement");
    }
    setSubmitting(true);
    try {
      const payload = { ...form };
      if (!payload.assigned_to) delete payload.assigned_to;
      if (!payload.due_date) delete payload.due_date;
      if (!payload.supervisor_id) delete payload.supervisor_id;
      if (!payload.publication_date) delete payload.publication_date;
      if (!payload.event_id) delete payload.event_id;
      await tasksAPI.create(payload);
      toast.success("Tâche créée");
      onCreated();
    } catch (err) {
      const details = formatErrorMessage(err);
      details.forEach((detail) => toast.error(detail.message));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal open onClose={onClose} title="Nouvelle tâche" size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Nom *"
          value={form.title}
          onChange={(e) => set("title", e.target.value)}
          placeholder="Titre de la tâche"
        />
        <Textarea
          label="Description"
          value={form.description}
          onChange={(e) => set("description", e.target.value)}
          rows={3}
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Select
            label="Type de tâche"
            value={form.context}
            onChange={(e) => set("context", e.target.value)}
            options={[
              { value: "project", label: "Pour un projet" },
              { value: "event", label: "Pour un événement" },
            ]}
          />
          <Select
            label={form.context === "project" ? "Projet *" : "Événement *"}
            value={form.context === "project" ? form.project_id : form.event_id}
            onChange={(e) => {
              const value = e.target.value;
              if (form.context === "project") set("project_id", value);
              else set("event_id", value);
            }}
            options={
              form.context === "event"
                ? events.map((ev) => ({ value: ev.id, label: ev.title }))
                : projects.map((p) => ({ value: p.id, label: p.title }))
            }
          />
        </div>
        <div className="grid grid-cols-3 gap-4">
          <Select
            label="Priorité"
            value={form.priority}
            onChange={(e) => set("priority", e.target.value)}
            options={Object.entries(PRIORITY).map(([k, v]) => ({
              value: k,
              label: v.label,
            }))}
          />
          <Input
            label="Date limite"
            type="date"
            value={form.due_date}
            onChange={(e) => set("due_date", e.target.value)}
          />
          <Input
            label="Date de publication"
            type="date"
            value={form.publication_date}
            onChange={(e) => set("publication_date", e.target.value)}
          />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Select
            label="Assigné à"
            value={form.assigned_to}
            onChange={(e) => set("assigned_to", e.target.value)}
            options={[...users.map((u) => ({
              value: u.id,
              label: `${u.first_name || ""} ${u.last_name || ""}`.trim() || u.email,
            })),
            ]}
          />
          <Select
            label="Superviseur côté ministère"
            value={form.supervisor_id}
            onChange={(e) => set("supervisor_id", e.target.value)}
            options={[...validators.map((u) => ({
              value: u.id,
              label: `${u.first_name || ""} ${u.last_name || ""}`.trim() || u.email,
            })),
            ]}
          />
        </div>
        <div className="flex justify-end gap-3 pt-2">
          <Button variant="secondary" onClick={onClose}>
            Annuler
          </Button>
          <Button type="submit" loading={submitting}>
            Créer la tâche
          </Button>
        </div>
      </form>
    </Modal>
  );
}
