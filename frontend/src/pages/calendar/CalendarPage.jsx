import { useState, useEffect, useCallback, useMemo } from 'react';
import { Calendar as BigCalendar, dateFnsLocalizer } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay, addMonths, subMonths } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
  Calendar as CalendarIcon, ChevronLeft, ChevronRight, Plus, Filter,
} from 'lucide-react';
import {
  Card, Button, Badge, Modal, Input, Select, Textarea, EmptyState, Skeleton,
} from '../../components/ui';
import { calendarAPI, projectsAPI } from '../../api/services';
import { formatDate, CALENDAR_EVENT_TYPES, extractList } from '../../utils/helpers';
import { usePermissions } from '../../hooks';
import toast from 'react-hot-toast';
import 'react-big-calendar/lib/css/react-big-calendar.css';

const locales = { fr };
const localizer = dateFnsLocalizer({ format, parse, startOfWeek, getDay, locales });

const eventTypeColors = {
  publication: { bg: 'bg-primary-100', text: 'text-primary-700', border: 'border-l-primary-500' },
  deadline:    { bg: 'bg-danger-100',  text: 'text-danger-700',  border: 'border-l-danger-500' },
  meeting:     { bg: 'bg-info-100',    text: 'text-info-700',    border: 'border-l-info-500' },
  reminder:    { bg: 'bg-warning-100', text: 'text-warning-700', border: 'border-l-warning-500' },
  other:       { bg: 'bg-surface-200', text: 'text-ink-700',     border: 'border-l-ink-400' },
};

export default function CalendarPage() {
  const { canCreateEvent } = usePermissions();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [date, setDate] = useState(new Date());
  const [view, setView] = useState('month');
  const [typeFilter, setTypeFilter] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [projects, setProjects] = useState([]);

  useEffect(() => { loadProjects(); }, []);
  useEffect(() => { loadEvents(); }, [date, typeFilter]);

  const loadEvents = async () => {
    setLoading(true);
    try {
      const params = {};
      if (typeFilter) params.event_type = typeFilter;
      const { data } = await calendarAPI.list(params);
      const raw = extractList(data.data).items;
      setEvents(raw.map((e) => ({
        ...e,
        title: e.title,
        start: new Date(e.start_date || e.event_date),
        end: new Date(e.end_date || e.start_date || e.event_date),
        allDay: !e.end_date,
      })));
    } catch {
      toast.error('Erreur lors du chargement du calendrier');
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
  const handleViewChange = useCallback((v) => setView(v), []);
  const handleSelectEvent = useCallback((event) => setSelectedEvent(event), []);

  const eventStyleGetter = useCallback((event) => {
    const colors = eventTypeColors[event.event_type] || eventTypeColors.other;
    return {
      style: {
        backgroundColor: 'transparent',
        border: 'none',
        padding: 0,
      },
    };
  }, []);

  const EventComponent = ({ event }) => {
    const colors = eventTypeColors[event.event_type] || eventTypeColors.other;
    return (
      <div className={`px-2 py-0.5 rounded text-body-sm font-medium border-l-2 ${colors.bg} ${colors.text} ${colors.border} truncate`}>
        {event.title}
      </div>
    );
  };

  const messages = {
    today: "Aujourd'hui",
    previous: 'Précédent',
    next: 'Suivant',
    month: 'Mois',
    week: 'Semaine',
    day: 'Jour',
    agenda: 'Agenda',
    noEventsInRange: 'Aucun événement dans cette période',
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-display-lg">Calendrier</h1>
          <p className="text-body-md text-ink-400 mt-1">{events.length} événement{events.length !== 1 ? 's' : ''}</p>
        </div>
        {canCreateEvent && <Button onClick={() => setShowCreate(true)} icon={Plus}>Nouvel événement</Button>}
      </div>

      {/* Filters + Navigation */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button onClick={() => setDate(subMonths(date, 1))} className="p-2 hover:bg-surface-100 rounded-lg transition-default">
            <ChevronLeft className="w-5 h-5 text-ink-500" />
          </button>
          <h2 className="text-body-lg font-semibold text-ink-700 min-w-[180px] text-center capitalize">
            {format(date, 'MMMM yyyy', { locale: fr })}
          </h2>
          <button onClick={() => setDate(addMonths(date, 1))} className="p-2 hover:bg-surface-100 rounded-lg transition-default">
            <ChevronRight className="w-5 h-5 text-ink-500" />
          </button>
          <Button variant="ghost" size="sm" onClick={() => setDate(new Date())} className="ml-2">Aujourd'hui</Button>
        </div>

        <div className="flex items-center gap-3">
          <Select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="w-40">
            <option value="">Tous les types</option>
            {Object.entries(CALENDAR_EVENT_TYPES).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
          </Select>
          <div className="flex items-center bg-surface-100 rounded-lg p-0.5">
            {['month', 'week', 'day'].map((v) => (
              <button
                key={v}
                onClick={() => handleViewChange(v)}
                className={`px-3 py-1 text-body-sm rounded-md transition-default ${view === v ? 'bg-white shadow-sm text-ink-700 font-medium' : 'text-ink-400'}`}
              >
                {v === 'month' ? 'Mois' : v === 'week' ? 'Semaine' : 'Jour'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-4">
        {Object.entries(eventTypeColors).map(([type, colors]) => (
          <div key={type} className="flex items-center gap-1.5 text-body-sm text-ink-500">
            <div className={`w-3 h-3 rounded-sm ${colors.bg} border-l-2 ${colors.border}`} />
            <span className="capitalize">{CALENDAR_EVENT_TYPES[type]?.label || type}</span>
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
              view={view}
              onNavigate={handleNavigate}
              onView={handleViewChange}
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

      {selectedEvent && <EventDetailModal event={selectedEvent} onClose={() => setSelectedEvent(null)} />}
      {showCreate && <CreateEventModal projects={projects} onClose={() => setShowCreate(false)} onCreated={() => { setShowCreate(false); loadEvents(); }} />}
    </div>
  );
}

function EventDetailModal({ event: ev, onClose }) {
  const colors = eventTypeColors[ev.event_type] || eventTypeColors.other;
  return (
    <Modal open onClose={onClose} title="Détail de l'événement" size="md">
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <div className={`w-3 h-3 rounded-sm ${colors.bg} border-l-2 ${colors.border}`} />
          <h3 className="text-display-sm">{ev.title}</h3>
        </div>
        {ev.description && <p className="text-body-md text-ink-500">{ev.description}</p>}
        <div className="grid grid-cols-2 gap-3 text-body-sm">
          <div><span className="text-ink-400">Type:</span> <span className="text-ink-700 ml-1 capitalize">{CALENDAR_EVENT_TYPES[ev.event_type]?.label || ev.event_type}</span></div>
          <div><span className="text-ink-400">Date:</span> <span className="text-ink-700 ml-1">{formatDate(ev.start)}</span></div>
          {ev.Project && <div><span className="text-ink-400">Projet:</span> <span className="text-ink-700 ml-1">{ev.Project.title}</span></div>}
        </div>
      </div>
    </Modal>
  );
}

function CreateEventModal({ projects, onClose, onCreated }) {
  const [form, setForm] = useState({ title: '', description: '', event_type: 'meeting', event_date: '', project_id: '' });
  const [submitting, setSubmitting] = useState(false);
  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title || !form.event_date) return toast.error('Titre et date requis');
    setSubmitting(true);
    try {
      const payload = { ...form };
      if (!payload.project_id) delete payload.project_id;
      await calendarAPI.create(payload);
      toast.success('Événement créé');
      onCreated();
    } catch (err) {
      toast.error(err.response?.data?.error?.message || 'Erreur');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal open onClose={onClose} title="Nouvel événement" size="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input label="Titre *" value={form.title} onChange={(e) => set('title', e.target.value)} />
        <Textarea label="Description" value={form.description} onChange={(e) => set('description', e.target.value)} rows={2} />
        <div className="grid grid-cols-2 gap-4">
          <Select label="Type" value={form.event_type} onChange={(e) => set('event_type', e.target.value)}>
            {Object.entries(CALENDAR_EVENT_TYPES).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
          </Select>
          <Input label="Date *" type="date" value={form.event_date} onChange={(e) => set('event_date', e.target.value)} />
        </div>
        <Select label="Projet (optionnel)" value={form.project_id} onChange={(e) => set('project_id', e.target.value)}>
          <option value="">Aucun projet</option>
          {projects.map((p) => <option key={p.id} value={p.id}>{p.title}</option>)}
        </Select>
        <div className="flex justify-end gap-3 pt-2">
          <Button variant="secondary" onClick={onClose}>Annuler</Button>
          <Button type="submit" loading={submitting}>Créer</Button>
        </div>
      </form>
    </Modal>
  );
}
