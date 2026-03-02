import { useState } from "react";
import { Calendar, Megaphone } from "lucide-react";
import Tabs from "../../components/ui/Tabs";
import { usePermissions } from "../../hooks";
import "react-big-calendar/lib/css/react-big-calendar.css";
import EventsCalendarTab from "./components/EventsCalendarTab";
import EditorialCalendarTab from "./components/EditorialCalendarTab";

export default function CalendarPage() {
  const { canCreateEvent } = usePermissions();
  const [activeTab, setActiveTab] = useState("editorial");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-display-lg">Calendriers</h1>
        <p className="text-body-md text-ink-400 mt-1">
          Éditorial (publications de tâches) et événements (réunions, autres).
        </p>
      </div>

      <Tabs
        activeTab={activeTab}
        onChange={setActiveTab}
        tabs={[
          { id: "editorial", label: "Calendrier éditorial", icon: Megaphone },
          { id: "events", label: "Calendrier des événements", icon: Calendar },
        ]}
      />

      {activeTab === "editorial" ? (
        <EditorialCalendarTab canCreateEvent={canCreateEvent} />
      ) : (
        <EventsCalendarTab canCreateEvent={canCreateEvent} />
      )}
    </div>
  );
}
