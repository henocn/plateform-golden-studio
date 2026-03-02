'use client';

import { Calendar } from 'lucide-react';
import { usePermissions } from '../../hooks';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import EventsCalendarTab from './components/EventsCalendarTab';

export default function EventsCalendarPage() {
  const { canCreateEvent } = usePermissions();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-display-lg">Calendrier des événements</h1>
        <p className="text-body-md text-ink-400 mt-1">
          Événements, réunions et autres temps forts liés aux projets.
        </p>
      </div>

      <div className="flex items-center gap-2 text-ink-500 text-body-sm">
        <Calendar className="w-4 h-4" />
        <span>Vue dédiée aux événements et réunions.</span>
      </div>

      <EventsCalendarTab canCreateEvent={canCreateEvent} />
    </div>
  );
}

