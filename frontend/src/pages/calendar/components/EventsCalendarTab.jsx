import { useMemo, useState, useEffect, useRef } from "react";
import { ChevronLeft, ChevronRight, Plus, Upload, Download } from "lucide-react";
import { addMonths, subMonths, format } from "date-fns";
import { fr } from "date-fns/locale";
import { Card, Button, Modal, Input, Select, Textarea, Skeleton, Autocomplete } from "../../../components/ui";
import { calendarAPI, projectsAPI } from "../../../api/services";
import { extractList, formatDate, formatErrorMessage, CALENDAR_EVENT_TYPES, downloadBlob } from "../../../utils/helpers";
import { BigCalendar, localizer, calendarMessages, eventStyleGetter, EventBadge, toCalendarItems } from "./calendarShared";
import toast from "react-hot-toast";

const EVENT_TYPE_OPTIONS = [
  { value: "event_coverage", label: "Événement" },
  { value: "meeting", label: "Réunion" },
  { value: "other", label: "Autre" },
];

export default function EventsCalendarTab({ canCreateEvent }) {
  const [date, setDate] = useState(new Date());
  const [events, setEvents] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState("");
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const importInputRef = useRef(null);

  useEffect(() => {
    loadProjects();
  }, []);

  useEffect(() => {
    loadEvents();
  }, [typeFilter]);

  const loadProjects = async () => {
    try {
      const { data } = await projectsAPI.list({ page: 1, limit: 200 });
      setProjects(extractList(data.data).items);
    } catch {
      setProjects([]);
    }
  };

  const loadEvents = async () => {
    setLoading(true);
    try {
      const params = {};
      if (typeFilter) params.type = typeFilter;
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
      const { data } = await calendarAPI.exportEventsExcel(typeFilter ? { type: typeFilter } : {});
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
          <Button variant="secondary" icon={Upload} onClick={() => importInputRef.current?.click()}>
            Import Excel
          </Button>
          <Button variant="secondary" icon={Download} onClick={handleExport}>
            Export Excel
          </Button>
          {canCreateEvent && (
            <Button icon={Plus} onClick={() => setShowCreate(true)}>
              Nouvel événement
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
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="w-48"
          options={[
            { value: "", label: "Tous les types" },
            ...EVENT_TYPE_OPTIONS,
          ]}
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
              components={{ event: EventBadge }}
              messages={calendarMessages}
              culture="fr"
              style={{ height: 620 }}
              toolbar={false}
              popup
            />
          </div>
        </Card>
      )}

      {selectedEvent && <EventDetailModal event={selectedEvent} onClose={() => setSelectedEvent(null)} />}
      {showCreate && (
        <CreateEventModal
          projects={projects}
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

function EventDetailModal({ event, onClose }) {
  return (
    <Modal open onClose={onClose} title="Détail événement" size="md">
      <div className="space-y-3">
        <p className="text-body-md text-ink-700">{event.title}</p>
        <p><span className="text-ink-400">Type:</span> <span className="text-ink-700">{CALENDAR_EVENT_TYPES[event.type]?.label || event.type}</span></p>
        <p><span className="text-ink-400">Date:</span> <span className="text-ink-700">{formatDate(event.start_date)}</span></p>
        <p><span className="text-ink-400">Projet:</span> <span className="text-ink-700">{event.project?.title || "—"}</span></p>
        <p><span className="text-ink-400">Description:</span> <span className="text-ink-700">{event.description || "—"}</span></p>
      </div>
    </Modal>
  );
}

function CreateEventModal({ projects, onClose, onCreated }) {
  const [form, setForm] = useState({
    title: "",
    description: "",
    type: "meeting",
    start_date: "",
    end_date: "",
    project_id: "",
    organization_id: projects[0]?.organization_id || "",
    visibility: "client_visible",
  });
  const [submitting, setSubmitting] = useState(false);
  const setField = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = { ...form };
      if (!payload.project_id) payload.project_id = null;
      if (!payload.end_date) payload.end_date = null;
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
        <Input label="Titre *" value={form.title} onChange={(e) => setField("title", e.target.value)} />
        <Textarea label="Description" value={form.description} onChange={(e) => setField("description", e.target.value)} rows={2} />
        <Select
          label="Type"
          value={form.type}
          onChange={(e) => setField("type", e.target.value)}
          options={EVENT_TYPE_OPTIONS}
        />
        <div className="grid grid-cols-2 gap-4">
          <Input label="Date de début *" type="date" value={form.start_date} onChange={(e) => setField("start_date", e.target.value)} />
          <Input label="Date de fin" type="date" value={form.end_date} onChange={(e) => setField("end_date", e.target.value)} />
        </div>
        <Autocomplete
          label="Projet lié"
          value={form.project_id}
          onChange={(v) => setField("project_id", v)}
          options={[
            { value: "", label: "Aucun projet" },
            ...projects.map((p) => ({ value: p.id, label: p.title })),
          ]}
          placeholder="Projet..."
        />
        <div className="flex justify-end gap-3 pt-2">
          <Button variant="secondary" onClick={onClose}>Annuler</Button>
          <Button type="submit" loading={submitting}>Créer</Button>
        </div>
      </form>
    </Modal>
  );
}

