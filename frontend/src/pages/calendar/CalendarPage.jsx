import { useState, useEffect, useCallback, useMemo } from "react";
import { Calendar as BigCalendar, dateFnsLocalizer } from "react-big-calendar";
import {
  format,
  parse,
  startOfWeek,
  getDay,
  addMonths,
  subMonths,
} from "date-fns";
import { fr } from "date-fns/locale";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import {
  Card,
  Button,
  Modal,
  Input,
  Select,
  Textarea,
  Skeleton,
  Autocomplete,
} from "../../components/ui";
import { calendarAPI, projectsAPI } from "../../api/services";
import {
  formatDate,
  CALENDAR_EVENT_TYPES,
  extractList,
  formatErrorMessage,
} from "../../utils/helpers";
import { usePermissions } from "../../hooks";
import toast from "react-hot-toast";
import "react-big-calendar/lib/css/react-big-calendar.css";

const locales = { fr };
const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});



export default function CalendarPage() {
  const handleSelectEvent = useCallback((event) => setSelectedEvent(event), []);
  const { canCreateEvent } = usePermissions();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [date, setDate] = useState(new Date());
  const [typeFilter, setTypeFilter] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [projects, setProjects] = useState([]);

  useEffect(() => {
    loadProjects();
  }, []);
  useEffect(() => {
    loadEvents();
  }, [date, typeFilter]);

  const loadEvents = async () => {
    setLoading(true);
    try {
      const params = {};
      if (typeFilter) params.event_type = typeFilter;
      const { data } = await calendarAPI.list(params);
      const raw = extractList(data.data).items;
      setEvents(
        raw.map((e) => {
          let start = e.start_date
            ? new Date(e.start_date)
            : e.event_date
              ? new Date(e.event_date)
              : null;
          let end = e.end_date
            ? new Date(e.end_date)
            : e.start_date
              ? new Date(e.start_date)
              : e.event_date
                ? new Date(e.event_date)
                : null;
          if (start && end && start.toDateString() !== end.toDateString()) {
            end = new Date(
              end.getFullYear(),
              end.getMonth(),
              end.getDate() + 1,
            );
          }
          return {
            ...e,
            title: e.title,
            start,
            end,
            allDay: !e.end_date,
          };
        }),
      );
    } catch {
      toast.error("Erreur lors du chargement du calendrier");
    } finally {
      setLoading(false);
    }
  };

  const loadProjects = async () => {
    try {
      const { data } = await projectsAPI.list({ page: 1, limit: 100 });
      setProjects(extractList(data.data).items);
    } catch {}
  };

  const handleNavigate = useCallback((newDate) => setDate(newDate), []);

  const eventStyleGetter = useCallback((event) => {
    const colors = CALENDAR_EVENT_TYPES[event.event_type] || CALENDAR_EVENT_TYPES.other;
    return {
      style: {
        backgroundColor: "transparent",
        border: "none",
        padding: 0,
      },
    };
  }, []);

  const EventComponent = ({ event }) => {
    const colors = CALENDAR_EVENT_TYPES[event.type];
    return (
      <div
        className={`px-2 py-1 rounded text-base font-bold border-l-4 ${colors.bg} ${colors.text} ${colors.border} truncate shadow-sm`}
        style={{
          maxWidth: "100%",
          maxHeight: 40,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
          borderColor: colors.border,
          borderWidth: 1,
          display: "block",
          backgroundColor: "rgba(0,0,0,0.34)",
          borderLeftWidth: 4,
        }}
        title={event.title}
      >
        {event.title}
      </div>
    );
  };

  const messages = {
    today: "Aujourd'hui",
    previous: "Précédent",
    next: "Suivant",
    month: "Mois",
    week: "Semaine",
    day: "Jour",
    agenda: "Agenda",
    noEventsInRange: "Aucun événement dans cette période",
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-display-lg">Calendrier</h1>
          <p className="text-body-md text-ink-400 mt-1">
            {events.length} événement{events.length !== 1 ? "s" : ""}
          </p>
        </div>
        {canCreateEvent && (
          <Button onClick={() => setShowCreate(true)} icon={Plus}>
            Nouvel événement
          </Button>
        )}
      </div>

      {/* Filters + Navigation */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setDate(subMonths(date, 1))}
            className="p-2 hover:bg-surface-100 rounded-lg transition-default"
          >
            <ChevronLeft className="w-5 h-5 text-ink-500" />
          </button>
          <h2 className="text-body-lg font-semibold text-ink-700 min-w-[180px] text-center capitalize">
            {format(date, "MMMM yyyy", { locale: fr })}
          </h2>
          <button
            onClick={() => setDate(addMonths(date, 1))}
            className="p-2 hover:bg-surface-100 rounded-lg transition-default"
          >
            <ChevronRight className="w-5 h-5 text-ink-500" />
          </button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setDate(new Date())}
            className="ml-2"
          >
            Aujourd'hui
          </Button>
        </div>

        <div className="flex items-center gap-3">
          <Select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="w-40"
            options={Object.entries(CALENDAR_EVENT_TYPES).map(([k, v]) => ({
              value: k,
              label: v.label,
            }))}
          />
          {/* Boutons semaine/jour supprimés, vue fixée à mois */}
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-4">
        {Object.entries(CALENDAR_EVENT_TYPES).map(([type, colors]) => (
          <div
            key={type}
            className="flex items-center gap-1.5 text-body-sm text-ink-500"
          >
            <div
              className={`w-3 h-3 rounded-sm ${colors.bg} border-l-2 ${colors.border}`}
            />
            <span className="capitalize">
              {CALENDAR_EVENT_TYPES[type]?.label || type}
            </span>
          </div>
        ))}
      </div>

      {/* Calendar */}
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
              onNavigate={handleNavigate}
              onSelectEvent={handleSelectEvent}
              eventPropGetter={eventStyleGetter}
              components={{ event: EventComponent }}
              messages={messages}
              culture="fr"
              style={{ height: 600 }}
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
        />
      )}
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

function EventDetailModal({ event: ev, onClose }) {
  const colors = CALENDAR_EVENT_TYPES[ev.type];
  return (
    <Modal open onClose={onClose} title="Détail de l'événement" size="md">
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <div
            className={`w-3 h-3 rounded-sm ${colors.bg} border-l-2 ${colors.border}`}
          />
          <h3 className="text-display-sm">{ev.title}</h3>
        </div>
        <div>
          <span className="text-ink-400">Auteur:</span>{" "}
          <span className="text-ink-700 ml-1">
            {ev.creator.first_name} {ev.creator.last_name}
          </span>
        </div>
        {ev.description && (
          <p className="text-body-md text-ink-500">{ev.description}</p>
        )}
        <div className="grid grid-cols-2 gap-3 text-body-sm">
          <div>
            <span className="text-ink-400">Type:</span>{" "}
            <span className="text-ink-700 ml-1 capitalize">
              {CALENDAR_EVENT_TYPES[ev.event_type]?.label || ev.type}
            </span>
          </div>
          <div>
            <span className="text-ink-400">Date:</span>{" "}
            <span className="text-ink-700 ml-1">
              {formatDate(ev.start_date)}
            </span>{" "}
            au
            <span className="text-ink-700 mx-1">{formatDate(ev.end_date)}</span>
          </div>
          {ev.Project && (
            <div>
              <span className="text-ink-400">Projet:</span>{" "}
              <span className="text-ink-700 ml-1">{ev.Project.title}</span>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}

function CreateEventModal({ projects, onClose, onCreated }) {
  const organizationId =
    projects.length > 0 ? projects[0].organization_id : null;
  const [form, setForm] = useState({
    title: "",
    description: "",
    type: "meeting",
    start_date: "",
    end_date: "",
    project_id: null,
    organization_id: organizationId,
    visibility: "client_visible",
  });
  const [submitting, setSubmitting] = useState(false);
  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = { ...form };
      if (!payload.project_id) delete payload.project_id;
      await calendarAPI.create(payload);
      toast.success("Événement créé");
      onCreated();
    } catch (err) {
      const details = formatErrorMessage(err);
      details.forEach((detail) => toast.error(detail.message));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal open onClose={onClose} title="Nouvel événement" size="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Titre *"
          value={form.title}
          onChange={(e) => set("title", e.target.value)}
        />
        <Textarea
          label="Description"
          value={form.description}
          onChange={(e) => set("description", e.target.value)}
          rows={2}
        />
        <Select
          label="Type"
          value={form.event_type}
          onChange={(e) => set("event_type", e.target.value)}
          options={Object.entries(CALENDAR_EVENT_TYPES).map(([k, v]) => ({
            value: k,
            label: v.label,
          }))}
        />
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Date de début *"
            type="date"
            value={form.start_date}
            onChange={(e) => set("start_date", e.target.value)}
          />
          <Input
            label="Date de fin (optionnelle)"
            type="date"
            value={form.end_date}
            onChange={(e) => set("end_date", e.target.value)}
          />
        </div>
        <Autocomplete
          label={null}
          value={form.project_id}
          onChange={(v) => set("project_id", v)}
          options={[
            { value: "", label: "Tous les projets" },
            ...projects.map((p) => ({ value: p.id, label: p.title })),
          ]}
          placeholder="Projet..."
          className="w-52"
        />
        <div className="flex justify-end gap-3 pt-2">
          <Button variant="secondary" onClick={onClose}>
            Annuler
          </Button>
          <Button type="submit" loading={submitting}>
            Créer
          </Button>
        </div>
      </form>
    </Modal>
  );
}
