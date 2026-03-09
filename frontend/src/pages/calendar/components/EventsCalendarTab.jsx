import { useMemo, useState, useEffect, useRef } from "react";
import { ChevronLeft, ChevronRight, Plus, Upload, Download, Trash2, Edit3, X } from "lucide-react";
import { addMonths, subMonths, format } from "date-fns";
import { fr } from "date-fns/locale";
import { Card, Button, Modal, Input, Select, Textarea, Skeleton, Badge } from "../../../components/ui";
import { calendarAPI, agenciesAPI, directionsAPI, usersAPI } from "../../../api/services";
import { extractList, formatDate, formatErrorMessage, downloadBlob } from "../../../utils/helpers";
import { BigCalendar, localizer, calendarMessages, eventStyleGetter, toCalendarItems } from "./calendarShared";
import { usePermissions } from "../../../hooks";
import toast from "react-hot-toast";

const EVENT_STATUS_CONFIG = {
  pending: { label: "En attente", color: "warning" },
  in_progress: { label: "En cours", color: "info" },
  done: { label: "Terminée", color: "success" },
  cancelled: { label: "Annulée", color: "danger" },
};

const EVENT_STATUS_OPTIONS = [
  { value: "", label: "Tous les statuts" },
  { value: "pending", label: EVENT_STATUS_CONFIG.pending.label },
  { value: "in_progress", label: EVENT_STATUS_CONFIG.in_progress.label },
  { value: "done", label: EVENT_STATUS_CONFIG.done.label },
  { value: "cancelled", label: EVENT_STATUS_CONFIG.cancelled.label },
];

const TASK_STATUS_OPTIONS = [
  { value: "pending", label: "En attente" },
  { value: "in_progress", label: "En cours" },
  { value: "done", label: "Terminée" },
];

function getEventStatusLabel(status) {
  return EVENT_STATUS_CONFIG[status]?.label || status || "—";
}

function getEventStatusColor(status) {
  return EVENT_STATUS_CONFIG[status]?.color || "neutral";
}

export default function EventsCalendarTab({ canCreateEvent }) {
  const [date, setDate] = useState(new Date());
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const importInputRef = useRef(null);
  const [assignableUsers, setAssignableUsers] = useState([]);
  const [templates, setTemplates] = useState([]);
  const { userType } = usePermissions();
  const isInternal = userType === "internal";

  useEffect(() => {
    // Charge les utilisateurs disponibles pour l'assignation des tâches
    const loadUsers = async () => {
      try {
        if (isInternal) {
          const [internalRes, clientRes] = await Promise.all([
            usersAPI.listMembers({ type: "internal", page: 1, limit: 100 }),
            usersAPI.listClients({ page: 1, limit: 100 }),
          ]);
          const internalItems = extractList(internalRes.data.data).items || [];
          const clientItems = extractList(clientRes.data.data).items || [];
          setAssignableUsers([...internalItems, ...clientItems]);
        } else {
          const { data } = await usersAPI.listClients({ page: 1, limit: 100 });
          const clientItems = extractList(data.data).items || [];
          setAssignableUsers(clientItems);
        }
      } catch {
        setAssignableUsers([]);
      }
    };
    loadUsers();
  }, [isInternal]);

  useEffect(() => {
    // Charge les templates d'événements pour la création rapide
    const loadTemplates = async () => {
      try {
        const { data } = await calendarAPI.listEventTemplates();
        const items = Array.isArray(data?.data) ? data.data : data || [];
        setTemplates(items);
      } catch {
        setTemplates([]);
      }
    };
    loadTemplates();
  }, []);

  useEffect(() => {
    loadEvents();
  }, [statusFilter]);

  const loadEvents = async () => {
    setLoading(true);
    try {
      const params = {};
      if (statusFilter) params.status = statusFilter;
      const { data } = await calendarAPI.listEvents(params);
      const items = extractList(data.data).items;
      setEvents(toCalendarItems(items, (item) => item.title));
    } catch {
      toast.error("Erreur lors du chargement du calendrier des événements");
    } finally {
      setLoading(false);
    }
  };

  const handleImport = async (file) => {
    if (!file) return;
    const formData = new FormData();
    formData.append("file", file);
    try {
      const { data } = await calendarAPI.importEventsExcel(formData);
      const imported = data?.data?.imported ?? 0;
      const skipped = data?.data?.skipped ?? 0;
      toast.success(`Import événements: ${imported} importé(s), ${skipped} ignoré(s)`);
      loadEvents();
    } catch (err) {
      const details = formatErrorMessage(err);
      details.forEach((d) => toast.error(d.message));
    } finally {
      if (importInputRef.current) importInputRef.current.value = "";
    }
  };

  const handleExport = async () => {
    try {
      const params = statusFilter ? { status: statusFilter } : {};
      const { data } = await calendarAPI.exportEventsExcel(params);
      downloadBlob(data, "calendrier-evenements.xlsx");
    } catch {
      toast.error("Erreur lors de l'export du calendrier des événements");
    }
  };

  const eventCount = useMemo(() => events.length, [events]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-display-md">Calendrier des événements</h2>
          <p className="text-body-md text-ink-400 mt-1">
            {eventCount} événement{eventCount > 1 ? "s" : ""}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <input
            ref={importInputRef}
            type="file"
            accept=".xlsx,.xls"
            className="hidden"
            onChange={(e) => handleImport(e.target.files?.[0])}
          />
          <Button variant="secondary" icon={Upload} onClick={handleExport}>
            Export
          </Button>
          {/* TODO: Uncomment this when the import feature is implemented */}
          {/* <Button variant="secondary" icon={Download} onClick={() => importInputRef.current?.click()}>
            Import
          </Button> */}
          {canCreateEvent && (
            <Button icon={Plus} onClick={() => setShowCreate(true)}>
              Evénement
            </Button>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button onClick={() => setDate(subMonths(date, 1))} className="p-2 hover:bg-surface-100 rounded-lg transition-default">
            <ChevronLeft className="w-5 h-5 text-ink-500" />
          </button>
          <h3 className="text-body-lg font-semibold text-ink-700 min-w-[180px] text-center capitalize">
            {format(date, "MMMM yyyy", { locale: fr })}
          </h3>
          <button onClick={() => setDate(addMonths(date, 1))} className="p-2 hover:bg-surface-100 rounded-lg transition-default">
            <ChevronRight className="w-5 h-5 text-ink-500" />
          </button>
          <Button variant="ghost" size="sm" onClick={() => setDate(new Date())}>
            Aujourd'hui
          </Button>
        </div>

        <Select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="w-48"
          options={EVENT_STATUS_OPTIONS}
        />
      </div>

      {loading ? (
        <Skeleton className="h-[600px] rounded-xl" />
      ) : (
        <Card padding={false}>
          <div className="p-4 calendar-wrapper">
            <BigCalendar
              localizer={localizer}
              events={events}
              startAccessor="start"
              endAccessor="end"
              date={date}
              defaultView="month"
              onNavigate={setDate}
              onSelectEvent={setSelectedEvent}
              eventPropGetter={eventStyleGetter}
              components={{ event: EventStatusBadge }}
              messages={calendarMessages}
              culture="fr"
              style={{ height: 620 }}
              toolbar={false}
              popup
            />
          </div>
        </Card>
      )}

      {selectedEvent && (
        <EventDetailModal
          event={selectedEvent}
          onClose={() => setSelectedEvent(null)}
          assignableUsers={assignableUsers}
          onUpdated={() => {
            setSelectedEvent(null);
            loadEvents();
          }}
          onDeleted={() => {
            setSelectedEvent(null);
            loadEvents();
          }}
        />
      )}
      {showCreate && (
        <CreateEventModal
          templates={templates}
          assignableUsers={assignableUsers}
          onClose={() => setShowCreate(false)}
          onCreated={() => {
            setShowCreate(false);
            loadEvents();
          }}
        />
      )}
    </div>
  );
}

function EventStatusBadge({ event }) {
  const statusConfig = EVENT_STATUS_CONFIG[event.status] || EVENT_STATUS_CONFIG.pending;
  const accentColors = {
    pending: "#F59E0B",
    in_progress: "#3B82F6",
    done: "#10B981",
    cancelled: "#EF4444",
  };
  const accent = accentColors[event.status] || "#6B7280";

  return (
    <div
      className="px-2 py-1 rounded text-xs font-medium truncate flex items-center gap-2 shadow-sm bg-gray-800/90 border border-gray-900 border-l-4"
      style={{ borderLeftColor: accent }}
      title={event.title}
    >
      <span
        className="inline-flex h-2.5 w-2.5 rounded-full"
        style={{ backgroundColor: accent }}
      />
      <span className="truncate text-white">{event.title}</span>
    </div>
  );
}

function CreateEventModal({ onClose, onCreated, assignableUsers, templates }) {
  const [form, setForm] = useState({
    title: "",
    description: "",
    start_date: "",
    end_date: "",
    status: "pending",
    agency_id: "",
    direction_id: "",
    tasks: [],
  });
  const [agencies, setAgencies] = useState([]);
  const [directions, setDirections] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const agencyIdRef = useRef("");
  const [selectedTemplateId, setSelectedTemplateId] = useState("");

  useEffect(() => {
    agenciesAPI
      .list()
      .then(({ data }) => setAgencies(Array.isArray(data?.data) ? data.data : data || []))
      .catch(() => setAgencies([]));

    agencyIdRef.current = "";
    directionsAPI
      .list({ agency_id: "null" })
      .then(({ data }) => setDirections(Array.isArray(data?.data) ? data.data : data || []))
      .catch(() => setDirections([]));
  }, []);

  useEffect(() => {
    if (form.agency_id === agencyIdRef.current) return;
    agencyIdRef.current = form.agency_id;
    const params = form.agency_id ? { agency_id: form.agency_id } : { agency_id: "null" };
    directionsAPI
      .list(params)
      .then(({ data }) => setDirections(Array.isArray(data?.data) ? data.data : data || []))
      .catch(() => setDirections([]));
  }, [form.agency_id]);

  const setField = (key, value) =>
    setForm((prev) => {
      const next = { ...prev, [key]: value };
      if (key === "agency_id") next.direction_id = "";
      return next;
    });

  const handleAddTask = () => {
    setForm((prev) => ({
      ...prev,
      tasks: [...prev.tasks, { title: "", status: "pending", responsible_user_id: "" }],
    }));
  };

  const handleTaskChange = (index, key, value) => {
    setForm((prev) => {
      const tasks = prev.tasks.slice();
      tasks[index] = { ...tasks[index], [key]: value };
      return { ...prev, tasks };
    });
  };

  const handleRemoveTask = (index) => {
    setForm((prev) => {
      const tasks = prev.tasks.slice();
      tasks.splice(index, 1);
      return { ...prev, tasks };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = { ...form };
      if (!payload.end_date) payload.end_date = null;
      if (!payload.agency_id) delete payload.agency_id;
      if (!payload.direction_id) delete payload.direction_id;
      payload.tasks = (payload.tasks || []).filter((t) => t.title?.trim());
      await calendarAPI.createEvent(payload);
      toast.success("Événement créé");
      onCreated();
    } catch (err) {
      const details = formatErrorMessage(err);
      details.forEach((d) => toast.error(d.message));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal open onClose={onClose} title="Nouvel événement" size="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        {Array.isArray(templates) && templates.length > 0 && (
          <Select
            label="Type d’événement (template)"
            value={selectedTemplateId}
            onChange={(e) => {
              const id = e.target.value;
              setSelectedTemplateId(id);
              const tpl = templates.find((t) => t.id === id);
              if (tpl && Array.isArray(tpl.tasks)) {
                setField(
                  "tasks",
                  tpl.tasks.map((t) => ({
                    title: t.title || "",
                    status: t.status || "pending",
                    responsible_user_id: t.responsible_user_id || "",
                  })),
                );
              } else {
                setField("tasks", []);
              }
            }}
            options={[
              { value: "", label: "Aucun template" },
              ...templates.map((t) => ({ value: t.id, label: t.name })),
            ]}
          />
        )}
        <Input label="Titre *" value={form.title} onChange={(e) => setField("title", e.target.value)} />
        <Textarea label="Description" value={form.description} onChange={(e) => setField("description", e.target.value)} rows={2} />
        <div className="grid grid-cols-2 gap-4">
          <Input label="Date de début *" type="date" value={form.start_date} onChange={(e) => setField("start_date", e.target.value)} />
          <Input label="Date de fin" type="date" value={form.end_date} onChange={(e) => setField("end_date", e.target.value)} />
        </div>
        <Select
          label="Statut"
          value={form.status}
          onChange={(e) => setField("status", e.target.value)}
          options={EVENT_STATUS_OPTIONS.filter((opt) => opt.value)}
        />
        <div className="grid grid-cols-2 gap-4">
          <Select
            label="Agence"
            value={form.agency_id}
            onChange={(e) => setField("agency_id", e.target.value)}
            placeholder="Ministère (aucune)"
            options={[
              { value: "", label: "Ministère (aucune)" },
              ...agencies.map((a) => ({ value: a.id, label: a.name })),
            ]}
          />
          <Select
            label="Direction"
            value={form.direction_id}
            onChange={(e) => setField("direction_id", e.target.value)}
            placeholder="Sélectionner une direction"
            options={[
              { value: "", label: "—" },
              ...directions.map((d) => ({ value: d.id, label: d.name })),
            ]}
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-label text-ink-700">Tâches liées</p>
            <Button type="button" variant="ghost" size="sm" onClick={handleAddTask}>
              Ajouter une tâche
            </Button>
          </div>
          {form.tasks.length === 0 && (
            <p className="text-body-sm text-ink-400">
              Aucune tâche définie. Vous pouvez en ajouter pour détailler les actions liées à l'événement.
            </p>
          )}
          {form.tasks.map((task, index) => (
            <div key={index} className="grid grid-cols-[minmax(0,2fr)_minmax(0,1.2fr)_minmax(0,1.5fr)_auto] gap-2 items-center">
              <Input
                label={index === 0 ? "Titre" : undefined}
                value={task.title}
                onChange={(e) => handleTaskChange(index, "title", e.target.value)}
                placeholder="Intitulé de la tâche"
              />
              <Select
                label={index === 0 ? "Statut" : undefined}
                value={task.status}
                onChange={(e) => handleTaskChange(index, "status", e.target.value)}
                options={TASK_STATUS_OPTIONS}
              />
              <Select
                label={index === 0 ? "Responsable" : undefined}
                value={task.responsible_user_id || ""}
                onChange={(e) => handleTaskChange(index, "responsible_user_id", e.target.value)}
                options={[
                  { value: "", label: "Aucun responsable" },
                  ...assignableUsers.map((u) => ({
                    value: u.id,
                    label: `${u.first_name} ${u.last_name}`,
                  })),
                ]}
              />
              <button
                type="button"
                onClick={() => handleRemoveTask(index)}
                className="mt-4 p-2 rounded-lg text-ink-400 hover:bg-surface-200"
                aria-label="Supprimer la tâche"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <Button variant="secondary" type="button" onClick={onClose}>Annuler</Button>
          <Button type="submit" loading={submitting}>Créer</Button>
        </div>
      </form>
    </Modal>
  );
}

function EventDetailModal({ event, onClose, onUpdated, onDeleted, assignableUsers }) {
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [current, setCurrent] = useState(event);
  const [form, setForm] = useState({
    title: event.title || "",
    description: event.description || "",
    start_date: event.start_date ? event.start_date.slice(0, 10) : "",
    end_date: event.end_date ? event.end_date.slice(0, 10) : "",
    status: event.status || "pending",
    agency_id: event.agency_id || "",
    direction_id: event.direction_id || "",
    tasks: Array.isArray(event.tasks) ? event.tasks : [],
  });
  const [agencies, setAgencies] = useState([]);
  const [directions, setDirections] = useState([]);
  const agencyIdRef = useRef("");

  useEffect(() => {
    let isMounted = true;
    const fetchDetail = async () => {
      try {
        const { data } = await calendarAPI.getEventById(event.id);
        if (!isMounted) return;
        const full = data?.data || data;
        setCurrent(full);
        setForm({
          title: full.title || "",
          description: full.description || "",
          start_date: full.start_date ? full.start_date.slice(0, 10) : "",
          end_date: full.end_date ? full.end_date.slice(0, 10) : "",
          status: full.status || "pending",
          agency_id: full.agency_id || "",
          direction_id: full.direction_id || "",
          tasks: Array.isArray(full.tasks) ? full.tasks : [],
        });
      } catch {
        // garder la version locale
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    fetchDetail();
    return () => {
      isMounted = false;
    };
  }, [event.id]);

  useEffect(() => {
    agenciesAPI
      .list()
      .then(({ data }) => setAgencies(Array.isArray(data?.data) ? data.data : data || []))
      .catch(() => setAgencies([]));

    agencyIdRef.current = current.agency_id || "";
    const params = agencyIdRef.current ? { agency_id: agencyIdRef.current } : { agency_id: "null" };
    directionsAPI
      .list(params)
      .then(({ data }) => setDirections(Array.isArray(data?.data) ? data.data : data || []))
      .catch(() => setDirections([]));
  }, [current.agency_id]);

  useEffect(() => {
    if (form.agency_id === agencyIdRef.current) return;
    agencyIdRef.current = form.agency_id;
    const params = form.agency_id ? { agency_id: form.agency_id } : { agency_id: "null" };
    directionsAPI
      .list(params)
      .then(({ data }) => setDirections(Array.isArray(data?.data) ? data.data : data || []))
      .catch(() => setDirections([]));
  }, [form.agency_id]);

  const setField = (key, value) =>
    setForm((prev) => {
      const next = { ...prev, [key]: value };
      if (key === "agency_id") next.direction_id = "";
      return next;
    });

  const handleAddTask = () => {
    setForm((prev) => ({
      ...prev,
      tasks: [...(prev.tasks || []), { title: "", status: "pending", responsible_user_id: "" }],
    }));
  };

  const handleTaskChange = (index, key, value) => {
    setForm((prev) => {
      const tasks = (prev.tasks || []).slice();
      tasks[index] = { ...tasks[index], [key]: value };
      return { ...prev, tasks };
    });
  };

  const handleRemoveTask = (index) => {
    setForm((prev) => {
      const tasks = (prev.tasks || []).slice();
      tasks.splice(index, 1);
      return { ...prev, tasks };
    });
  };

  const handleDelete = async () => {
    if (!confirm("Supprimer cet événement ? Cette action est irréversible.")) return;
    try {
      await calendarAPI.removeEvent(event.id);
      toast.success("Événement supprimé");
      onDeleted?.();
    } catch (err) {
      const details = formatErrorMessage(err);
      if (details.length > 0) details.forEach((d) => toast.error(d.message));
      else toast.error("Erreur lors de la suppression de l'événement");
    }
  };

  const handleSave = async () => {
    try {
      const payload = { ...form };
      if (!payload.end_date) payload.end_date = null;
      if (!payload.agency_id) delete payload.agency_id;
      if (!payload.direction_id) delete payload.direction_id;
      payload.tasks = (payload.tasks || []).filter((t) => t.title?.trim());
      const { data } = await calendarAPI.updateEvent(event.id, payload);
      const updated = data?.data || data;
      setCurrent(updated);
      setEditMode(false);
      toast.success("Événement mis à jour");
      onUpdated?.();
    } catch (err) {
      const details = formatErrorMessage(err);
      if (details.length > 0) details.forEach((d) => toast.error(d.message));
      else toast.error("Erreur lors de la mise à jour de l'événement");
    }
  };

  const displayed = current;

  return (
    <Modal
      open
      onClose={onClose}
      title="Détail de l'événement"
      size="lg"
      footer={
        <div className="flex justify-between w-full">
          <div className="flex items-center gap-2">
            <Button type="button" variant="ghost" onClick={handleDelete}>
              <Trash2 className="w-4 h-4 mr-1" /> Supprimer
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant={editMode ? "secondary" : "primary"}
              onClick={() => setEditMode((v) => !v)}
            >
              {editMode ? (
                <>
                  <X className="w-4 h-4 mr-1" /> Annuler la modification
                </>
              ) : (
                <>
                  <Edit3 className="w-4 h-4 mr-1" /> Modifier
                </>
              )}
            </Button>
            {editMode && (
              <Button type="button" onClick={handleSave}>
                Enregistrer
              </Button>
            )}
            <Button type="button" variant="ghost" onClick={onClose}>
              Fermer
            </Button>
          </div>
        </div>
      }
    >
      {loading && (
        <div className="space-y-3">
          <Skeleton className="h-5 w-2/3" />
          <Skeleton className="h-5 w-1/3" />
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      )}

      {!loading && !editMode && (
        <div className="space-y-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="text-title-lg text-ink-900">{displayed.title}</h3>
              <div className="mt-2 flex flex-wrap items-center gap-2 text-body-sm text-ink-500">
                <span>{formatDate(displayed.start_date)}</span>
                {displayed.end_date && (
                  <>
                    <span>•</span>
                    <span>au {formatDate(displayed.end_date)}</span>
                  </>
                )}
              </div>
            </div>
            <Badge color={getEventStatusColor(displayed.status)} size="sm">
              {getEventStatusLabel(displayed.status)}
            </Badge>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <p className="text-label text-ink-500">Agence en charge</p>
                <p className="text-body-md text-ink-900">
                  {displayed.agency?.name || "Ministère / non renseigné"}
                </p>
              </div>
              <div>
                <p className="text-label text-ink-500">Direction en charge</p>
                <p className="text-body-md text-ink-900">
                  {displayed.direction?.name || "—"}
                </p>
              </div>
              <div>
                <p className="text-label text-ink-500">Créé par</p>
                <p className="text-body-md text-ink-900">
                  {displayed.creator
                    ? `${displayed.creator.first_name} ${displayed.creator.last_name}`
                    : "—"}
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-label text-ink-500">Description</p>
              <p className="text-body-md text-ink-800 whitespace-pre-line min-h-[64px]">
                {displayed.description || "Aucune description fournie."}
              </p>
            </div>
          </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-label text-ink-500">Tâches liées</p>
              </div>
              {!(displayed.tasks && displayed.tasks.length) && (
                <p className="text-body-sm text-ink-400">
                  Aucune tâche renseignée pour cet événement.
                </p>
              )}
              <div className="space-y-2">
                {(displayed.tasks || []).map((task, index) => {
                  const user =
                    task.responsible_user_id &&
                    assignableUsers.find((u) => u.id === task.responsible_user_id);
                  const responsibleLabel = user
                    ? `${user.first_name} ${user.last_name}`
                    : "—";
                  return (
                    <div
                      key={index}
                      className="flex items-start justify-between gap-3 rounded-lg border border-surface-200 bg-surface-50 px-3 py-2"
                    >
                      <div className="flex-1">
                        <p className="text-body-md font-medium text-ink-900">{task.title}</p>
                        <p className="text-body-sm text-ink-500 mt-0.5">
                          Responsable : {responsibleLabel}
                        </p>
                      </div>
                      <Badge color={getEventStatusColor(task.status)} size="sm">
                        {getEventStatusLabel(task.status)}
                      </Badge>
                    </div>
                  );
                })}
              </div>
            </div>
        </div>
      )}

      {!loading && editMode && (
        <div className="space-y-4">
          <Input
            label="Titre"
            required
            value={form.title}
            onChange={(e) => setField("title", e.target.value)}
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Date de début"
              type="date"
              value={form.start_date}
              onChange={(e) => setField("start_date", e.target.value)}
            />
            <Input
              label="Date de fin"
              type="date"
              value={form.end_date}
              onChange={(e) => setField("end_date", e.target.value)}
            />
          </div>
          <Select
            label="Statut"
            value={form.status}
            onChange={(e) => setField("status", e.target.value)}
            options={EVENT_STATUS_OPTIONS.filter((opt) => opt.value)}
          />
          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Agence"
              value={form.agency_id}
              onChange={(e) => setField("agency_id", e.target.value)}
              placeholder="Ministère (aucune)"
              options={[
                { value: "", label: "Ministère (aucune)" },
                ...agencies.map((a) => ({ value: a.id, label: a.name })),
              ]}
            />
            <Select
              label="Direction"
              value={form.direction_id}
              onChange={(e) => setField("direction_id", e.target.value)}
              placeholder="Sélectionner une direction"
              options={[
                { value: "", label: "—" },
                ...directions.map((d) => ({ value: d.id, label: d.name })),
              ]}
            />
          </div>
          <Textarea
            label="Description"
            value={form.description}
            onChange={(e) => setField("description", e.target.value)}
            rows={3}
          />

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-label text-ink-700">Tâches liées</p>
              <Button type="button" variant="ghost" size="sm" onClick={handleAddTask}>
                Ajouter une tâche
              </Button>
            </div>
            {(form.tasks || []).length === 0 && (
              <p className="text-body-sm text-ink-400">
                Aucune tâche définie. Ajoutez des tâches pour détailler le travail autour de l'événement.
              </p>
            )}
            {(form.tasks || []).map((task, index) => (
              <div
                key={index}
                className="grid grid-cols-[minmax(0,2fr)_minmax(0,1.2fr)_minmax(0,1.5fr)_auto] gap-2 items-center"
              >
                <Input
                  label={index === 0 ? "Titre" : undefined}
                  value={task.title}
                  onChange={(e) => handleTaskChange(index, "title", e.target.value)}
                  placeholder="Intitulé de la tâche"
                />
                <Select
                  label={index === 0 ? "Statut" : undefined}
                  value={task.status}
                  onChange={(e) => handleTaskChange(index, "status", e.target.value)}
                  options={TASK_STATUS_OPTIONS}
                />
                <Select
                  label={index === 0 ? "Responsable" : undefined}
                  value={task.responsible_user_id || ""}
                  onChange={(e) => handleTaskChange(index, "responsible_user_id", e.target.value)}
                  options={[
                    { value: "", label: "Aucun responsable" },
                    ...assignableUsers.map((u) => ({
                      value: u.id,
                      label: `${u.first_name} ${u.last_name}`,
                    })),
                  ]}
                />
                <button
                  type="button"
                  onClick={() => handleRemoveTask(index)}
                  className="mt-4 p-2 rounded-lg text-ink-400 hover:bg-surface-200"
                  aria-label="Supprimer la tâche"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </Modal>
  );
}

