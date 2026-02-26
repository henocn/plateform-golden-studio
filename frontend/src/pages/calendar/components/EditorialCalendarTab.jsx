import { useMemo, useState, useEffect, useRef } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Upload,
  Download,
  Facebook,
  Linkedin,
  Instagram,
  Youtube,
  MessageCircle,
  MessageSquare,
  Music2,
  Globe,
  ExternalLink,
} from "lucide-react";
import { addMonths, subMonths, format } from "date-fns";
import { fr } from "date-fns/locale";
import { Card, Button, Modal, Input, Select, Textarea, Skeleton, Checkbox } from "../../../components/ui";
import { calendarAPI, tasksAPI } from "../../../api/services";
import { extractList, formatDate, formatErrorMessage, downloadBlob } from "../../../utils/helpers";
import { BigCalendar, localizer, calendarMessages, eventStyleGetter, EventBadge, toCalendarItems } from "./calendarShared";
import toast from "react-hot-toast";

const PUBLICATION_STATUS = [
  { value: "scheduled", label: "Planifiée" },
  { value: "published", label: "Publiée" },
  { value: "draft", label: "Brouillon" },
  { value: "archived", label: "Archivée" },
];

const NETWORK_OPTIONS = [
  { value: "facebook", label: "Facebook" },
  { value: "linkedin", label: "LinkedIn" },
  { value: "instagram", label: "Instagram" },
  { value: "youtube", label: "YouTube" },
  { value: "x", label: "X" },
  { value: "tiktok", label: "TikTok" },
  { value: "whatsapp", label: "WhatsApp" },
  { value: "messenger", label: "Messenger" },
  { value: "other", label: "Autre" },
];

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

export default function EditorialCalendarTab({ canCreateEvent }) {
  const [date, setDate] = useState(new Date());
  const [entries, setEntries] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const [selectedEntry, setSelectedEntry] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const importInputRef = useRef(null);

  useEffect(() => {
    loadTasks();
  }, []);

  useEffect(() => {
    loadEntries();
  }, [statusFilter]);

  const loadTasks = async () => {
    try {
      const { data } = await tasksAPI.list({ limit: 100 });
      setTasks(extractList(data.data).items);
    } catch {
      setTasks([]);
    }
  };

  const loadEntries = async () => {
    setLoading(true);
    try {
      const params = {};
      if (statusFilter) params.status = statusFilter;
      const { data } = await calendarAPI.listEditorial(params);
      const items = extractList(data.data).items;
      setEntries(toCalendarItems(items, (entry) => entry.task?.title || entry.notes || "Publication"));
    } catch {
      toast.error("Erreur lors du chargement du calendrier éditorial");
    } finally {
      setLoading(false);
    }
  };

  const handleImport = async (file) => {
    if (!file) return;
    const formData = new FormData();
    formData.append("file", file);
    try {
      const { data } = await calendarAPI.importEditorialExcel(formData);
      const imported = data?.data?.imported ?? 0;
      const skipped = data?.data?.skipped ?? 0;
      toast.success(`Import éditorial: ${imported} importé(s), ${skipped} ignoré(s)`);
      loadEntries();
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
      const { data } = await calendarAPI.exportEditorialExcel(params);
      downloadBlob(data, "calendrier-editorial.xlsx");
    } catch {
      toast.error("Erreur lors de l'export du calendrier éditorial");
    }
  };

  const count = useMemo(() => entries.length, [entries]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-display-md">Calendrier éditorial</h2>
          <p className="text-body-md text-ink-400 mt-1">
            {count} publication{count > 1 ? "s" : ""} planifiée{count > 1 ? "s" : ""}
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
              Nouvelle publication
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
          options={[{ value: "", label: "Tous les statuts" }, ...PUBLICATION_STATUS]}
        />
      </div>

      {loading ? (
        <Skeleton className="h-[600px] rounded-xl" />
      ) : (
        <Card padding={false}>
          <div className="p-4 calendar-wrapper">
            <BigCalendar
              localizer={localizer}
              events={entries.map((entry) => ({ ...entry, type: "publication" }))}
              startAccessor="start"
              endAccessor="end"
              date={date}
              defaultView="month"
              onNavigate={setDate}
              onSelectEvent={setSelectedEntry}
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

      {selectedEntry && (
        <EditorialDetailModal
          entry={selectedEntry}
          tasks={tasks}
          onClose={() => setSelectedEntry(null)}
          onUpdated={() => {
            setSelectedEntry(null);
            loadEntries();
          }}
        />
      )}
      {showCreate && (
        <CreateEditorialModal
          tasks={tasks}
          onClose={() => setShowCreate(false)}
          onCreated={() => {
            setShowCreate(false);
            loadEntries();
          }}
        />
      )}
    </div>
  );
}

function EditorialDetailModal({ entry, tasks, onClose, onUpdated }) {
  const [taskId, setTaskId] = useState(entry.task_id || "");
  const [saving, setSaving] = useState(false);

  const handleAssign = async () => {
    if (!taskId) return;
    setSaving(true);
    try {
      await calendarAPI.assignEditorialTask(entry.id, taskId);
      toast.success("Tâche assignée");
      onUpdated();
    } catch (err) {
      const details = formatErrorMessage(err);
      details.forEach((d) => toast.error(d.message));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open onClose={onClose} title="Détail publication éditoriale" size="md">
      <div className="space-y-3">
        <p><span className="text-ink-400">Publicateur:</span> <span className="text-ink-700">{entry.publisher_name || "—"}</span></p>
        <p><span className="text-ink-400">Date de publication:</span> <span className="text-ink-700">{formatDate(entry.publication_date)}</span></p>
        <p><span className="text-ink-400">Tâche publiée:</span> <span className="text-ink-700">{entry.task?.title || "—"}</span></p>
        <p><span className="text-ink-400">Réseaux:</span> <span className="text-ink-700">{(entry.networks || []).join(", ") || "—"}</span></p>
        <div>
          <span className="text-ink-400">Liens réseaux:</span>
          <div className="mt-2 space-y-2">
            {Object.entries(entry.network_links || {}).length ? (
              Object.entries(entry.network_links || {}).map(([network, link]) => (
                <a
                  key={network}
                  href={link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between gap-3 rounded-lg border border-surface-200 bg-surface-50 px-3 py-2 hover:border-primary-300 hover:bg-primary-50 transition-default"
                >
                  <span className="flex items-center gap-2 min-w-0">
                    {(() => {
                      const Icon = NETWORK_ICON_MAP[String(network || "").toLowerCase()] || Globe;
                      return <Icon className="w-4 h-4 text-primary-500 shrink-0" />;
                    })()}
                    <span className="text-body-sm font-medium text-ink-700 capitalize">{network}</span>
                  </span>
                  <span className="flex items-center gap-1 text-primary-600 text-body-sm truncate">
                    <span className="truncate max-w-[220px]">{link}</span>
                    <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                  </span>
                </a>
              ))
            ) : (
              <p className="text-ink-700">—</p>
            )}
          </div>
        </div>
        <Select
          label="Tâche..."
          value={taskId}
          onChange={(e) => setTaskId(e.target.value)}
          options={[
            { value: "", label: "Tâche..." },
            ...tasks.map((t) => ({ value: t.id, label: t.title })),
          ]}
        />

        <div className="flex justify-end">
          <Button onClick={handleAssign} loading={saving} disabled={!taskId}>
            Assigner tâche
          </Button>
        </div>
      </div>
    </Modal>
  );
}

function CreateEditorialModal({ tasks, onClose, onCreated }) {
  const [form, setForm] = useState({
    publication_date: "",
    task_id: "",
    selectedNetworks: [],
    networkLinks: {},
    status: "scheduled",
    notes: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const setField = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.task_id) {
      toast.error("Veuillez sélectionner la tâche publiée");
      return;
    }
    setSubmitting(true);
    try {
      const payload = {
        publication_date: form.publication_date || null,
        task_id: form.task_id || null,
        networks: form.selectedNetworks,
        network_links: form.networkLinks,
        status: form.status,
        notes: form.notes || null,
      };
      await calendarAPI.createEditorial(payload);
      toast.success("Publication éditoriale créée");
      onCreated();
    } catch (err) {
      const details = formatErrorMessage(err);
      details.forEach((d) => toast.error(d.message));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal open onClose={onClose} title="Nouvelle publication éditoriale" size="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <Input label="Date de publication" type="date" value={form.publication_date} onChange={(e) => setField("publication_date", e.target.value)} />
          <Select label="Statut" value={form.status} onChange={(e) => setField("status", e.target.value)} options={PUBLICATION_STATUS} />
        </div>
        <Select
          label="Tâche publiée *"
          value={form.task_id}
          onChange={(e) => setField("task_id", e.target.value)}
          options={[
            { value: "", label: "Aucune tâche liée" },
            ...tasks.map((t) => ({ value: t.id, label: t.title })),
          ]}
        />
        <div className="space-y-2">
          <p className="text-label text-ink-700">Réseaux</p>
          <div className="flex flex-wrap gap-3">
            {NETWORK_OPTIONS.map((network) => (
              <Checkbox
                key={network.value}
                label={network.label}
                checked={form.selectedNetworks.includes(network.value)}
                onChange={(checked) => {
                  const next = checked
                    ? [...form.selectedNetworks, network.value]
                    : form.selectedNetworks.filter((n) => n !== network.value);
                  setField("selectedNetworks", next);
                  if (!checked) {
                    const nextLinks = { ...form.networkLinks };
                    delete nextLinks[network.value];
                    setField("networkLinks", nextLinks);
                  }
                }}
              />
            ))}
          </div>
          {form.selectedNetworks.map((network) => (
            <Input
              key={network}
              label={`Lien ${NETWORK_OPTIONS.find((n) => n.value === network)?.label || network}`}
              value={form.networkLinks[network] || ""}
              onChange={(e) =>
                setField("networkLinks", { ...form.networkLinks, [network]: e.target.value })
              }
              placeholder="https://..."
            />
          ))}
        </div>
        <Textarea label="Notes" value={form.notes} onChange={(e) => setField("notes", e.target.value)} rows={2} />
        <div className="flex justify-end gap-3 pt-2">
          <Button variant="secondary" onClick={onClose}>Annuler</Button>
          <Button type="submit" loading={submitting} disabled={!form.task_id}>Créer</Button>
        </div>
      </form>
    </Modal>
  );
}

