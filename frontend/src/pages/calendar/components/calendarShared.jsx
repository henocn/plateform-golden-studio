import { Calendar as BigCalendar, dateFnsLocalizer } from "react-big-calendar";
import { format, parse, startOfWeek, getDay } from "date-fns";
import { fr } from "date-fns/locale";
import { CALENDAR_EVENT_TYPES } from "../../../utils/helpers";

const locales = { fr };
const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

const calendarMessages = {
  today: "Aujourd'hui",
  previous: "Précédent",
  next: "Suivant",
  month: "Mois",
  week: "Semaine",
  day: "Jour",
  agenda: "Agenda",
  noEventsInRange: "Aucun élément dans cette période",
};

const eventStyleGetter = () => ({
  style: {
    backgroundColor: "transparent",
    border: "none",
    padding: 0,
  },
});

function EventBadge({ event }) {
  const colors = CALENDAR_EVENT_TYPES[event.type] || CALENDAR_EVENT_TYPES.other;
  return (
    <div
      className={`px-2 py-1 rounded text-base font-bold border-l-4 ${colors.bg} ${colors.text} ${colors.border} truncate shadow-sm`}
      style={{
        maxWidth: "100%",
        overflow: "hidden",
        textOverflow: "ellipsis",
        whiteSpace: "nowrap",
        borderWidth: 1,
        backgroundColor: "rgba(0,0,0,0.22)",
        borderLeftWidth: 4,
      }}
      title={event.title}
    >
      {event.title}
    </div>
  );
}

const toCalendarItems = (items, titleResolver) =>
  items.map((entry) => {
    const start = entry.start_date
      ? new Date(entry.start_date)
      : entry.publication_date
        ? new Date(entry.publication_date)
        : null;
    let end = entry.end_date
      ? new Date(entry.end_date)
      : entry.start_date
        ? new Date(entry.start_date)
        : entry.publication_date
          ? new Date(entry.publication_date)
          : null;

    if (start && end && start.toDateString() !== end.toDateString()) {
      end = new Date(end.getFullYear(), end.getMonth(), end.getDate() + 1);
    }

    return {
      ...entry,
      title: titleResolver(entry),
      start,
      end,
      allDay: !entry.end_date,
    };
  });

export {
  BigCalendar,
  localizer,
  calendarMessages,
  eventStyleGetter,
  EventBadge,
  toCalendarItems,
};

