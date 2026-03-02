'use client';

import { Megaphone } from 'lucide-react';
import { usePermissions } from '../../hooks';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import EditorialCalendarTab from './components/EditorialCalendarTab';

export default function EditorialCalendarPage() {
  const { canCreateEvent } = usePermissions();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-display-lg">Calendrier éditorial</h1>
        <p className="text-body-md text-ink-400 mt-1">
          Publications de tâches et diffusion sur les différents réseaux.
        </p>
      </div>

      <div className="flex items-center gap-2 text-ink-500 text-body-sm">
        <Megaphone className="w-4 h-4" />
        <span>Vue dédiée aux publications éditoriales.</span>
      </div>

      <EditorialCalendarTab canCreateEvent={canCreateEvent} />
    </div>
  );
}

