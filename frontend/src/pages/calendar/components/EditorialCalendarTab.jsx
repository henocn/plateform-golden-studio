import { useMemo, useState, useEffect, useRef } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Upload,
  Download,
  Trash2,
  Pencil,
  X,
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
import { BigCalendar, localizer, calendarMessages, eventStyleGetter, toCalendarItems } from "./calendarShared";
import toast from "react-hot-toast";

const PUBLICATION_STATUS = [
  { value: "scheduled", label: "Planifiée" },
  { value: "published", label: "Publiée" },
  { value: "draft", label: "Brouillon" },
  { value: "archived", label: "Archivée" },
];

const STATUS_COLORS = {
  scheduled: { bg: "#dc2626", border: "#b91c1c", label: "Planifiée" },
  published: { bg: "#16a34a", border: "#15803d", label: "Publiée" },
  draft:     { bg: "#6b7280", border: "#4b5563", label: "Brouillon" },
  archived:  { bg: "#d97706", border: "#b45309", label: "Archivée" },
};

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


/* Badge affiché sur le calendrier — bg commun + border-left selon statut */
function EditorialEventBadge({ event }) {
  const colors = STATUS_COLORS[event.status] || STATUS_COLORS.scheduled;
  return (
    <div
      className="px-2 py-1 rounded text-xs font-semibold truncate shadow-sm"
      style={{
        backgroundColor: "#1e293be3",
        color: "#f1f5f9",
        borderLeft: `6px solid ${colors.border}`,
        maxWidth: "100%",
        overflow: "hidden",
        textOverflow: "ellipsis",
        whiteSpace: "nowrap",
      }}
      title={event.title}
    >
      {event.title}
    </div>
  );
}


/* Section réseaux sociaux réutilisable (création + édition) */
function NetworksSection({ selectedNetworks, networkLinks, onChange }) {
  const setNetworks = (nets) => onChange({ selectedNetworks: nets, networkLinks });
  const setLink = (network, value) => onChange({ selectedNetworks, networkLinks: { ...networkLinks, [network]: value } });

  return (
    <div className="space-y-2">
      <p className="text-label text-ink-700">Réseaux sociaux</p>
      <div className="flex flex-wrap gap-3">
        {NETWORK_OPTIONS.map((network) => (
          <Checkbox
            key={network.value}
            label={network.label}
            checked={selectedNetworks.includes(network.value)}
            onChange={(checked) => {
              const next = checked
                ? [...selectedNetworks, network.value]
                : selectedNetworks.filter((n) => n !== network.value);
              const nextLinks = { ...networkLinks };
              if (!checked) delete nextLinks[network.value];
              onChange({ selectedNetworks: next, networkLinks: nextLinks });
            }}
          />
        ))}
      </div>
      {selectedNetworks.map((network) => (
        <Input
          key={network}
          label={`Lien ${NETWORK_OPTIONS.find((n) => n.value === network)?.label || network}`}
          value={networkLinks[network] || ""}
          onChange={(e) => setLink(network, e.target.value)}
          placeholder="https://..."
        />
      ))}
    </div>
  );
}


/* Affichage lecture des réseaux sociaux */
function NetworksDisplay({ networks, networkLinks }) {
  const links = Object.entries(networkLinks || {});
  if (!networks?.length && !links.length) return null;

  return (
    <div>
      <p className="text-body-sm text-ink-400 mb-1">Réseaux sociaux</p>
      {links.length > 0 ? (
        <div className="space-y-1.5">
          {links.map(([network, link]) => {
            const Icon = NETWORK_ICON_MAP[network] || Globe;
            return (
              <a
                key={network}
                href={link}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 rounded-lg border border-surface-200 bg-surface-50 px-3 py-2 hover:border-primary-300 hover:bg-primary-50 transition-default"
              >
                <Icon className="w-4 h-4 text-primary-500 shrink-0" />
                <span className="text-body-sm font-medium text-ink-700 capitalize">{network}</span>
                <span className="text-primary-600 text-body-sm truncate ml-auto max-w-[200px]">{link}</span>
                <ExternalLink className="w-3.5 h-3.5 text-primary-500 shrink-0" />
              </a>
            );
          })}
        </div>
      ) : (
        <p className="text-body-md text-ink-700">{(networks || []).join(", ")}</p>
      )}
    </div>
  );
}


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
      const list = extractList(data?.data);
      setTasks(list.items || []);
    } catch (err) {
      console.error("[EditorialCalendarTab] loadTasks error:", err);
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
      setEntries(toCalendarItems(items, (entry) => entry.publication_title || entry.task?.title || "Publication"));
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

      {/* Légende des statuts */}
      <div className="flex items-center gap-4 flex-wrap">
        {Object.entries(STATUS_COLORS).map(([key, val]) => (
          <div key={key} className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm" style={{ backgroundColor: val.bg }} />
            <span className="text-body-sm text-ink-500">{val.label}</span>
          </div>
        ))}
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
              components={{ event: EditorialEventBadge }}
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
  const [editing, setEditing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    publication_title: entry.publication_title || "",
    publication_date: entry.publication_date ? format(new Date(entry.publication_date), "yyyy-MM-dd") : "",
    status: entry.status || "scheduled",
    task_id: entry.task_id || "",
    notes: entry.notes || "",
    selectedNetworks: Array.isArray(entry.networks) ? entry.networks : [],
    networkLinks: entry.network_links && typeof entry.network_links === "object" ? { ...entry.network_links } : {},
  });
  const setField = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await calendarAPI.removeEditorial(entry.id);
      toast.success("Publication supprimée");
      onUpdated();
    } catch (err) {
      const details = formatErrorMessage(err);
      details.forEach((d) => toast.error(d.message));
    } finally {
      setDeleting(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = {
        publication_title: form.publication_title || null,
        publication_date: form.publication_date || null,
        status: form.status,
        task_id: form.task_id || null,
        notes: form.notes || null,
        networks: form.selectedNetworks,
        network_links: form.networkLinks,
      };
      await calendarAPI.updateEditorial(entry.id, payload);
      toast.success("Publication mise à jour");
      onUpdated();
    } catch (err) {
      const details = formatErrorMessage(err);
      details.forEach((d) => toast.error(d.message));
    } finally {
      setSaving(false);
    }
  };

  const statusLabel = PUBLICATION_STATUS.find((s) => s.value === entry.status)?.label || entry.status;
  const taskLabel = tasks.find((t) => t.id === entry.task_id)?.title || entry.task?.title;

  return (
    <Modal open onClose={onClose} title="Publication éditoriale" size="md">
      {!editing ? (
        <div className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-body-sm text-ink-400">Titre</p>
                <p className="text-body-md text-ink-800 font-medium">{entry.publication_title || "—"}</p>
              </div>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                entry.status === "published" ? "bg-success-100 text-success-700" :
                entry.status === "scheduled" ? "bg-red-100 text-red-700" :
                entry.status === "draft" ? "bg-surface-200 text-ink-500" :
                "bg-warning-100 text-warning-700"
              }`}>
                {statusLabel}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-body-sm text-ink-400">Date de publication</p>
                <p className="text-body-md text-ink-700">{formatDate(entry.publication_date) || "—"}</p>
              </div>
              <div>
                <p className="text-body-sm text-ink-400">Publicateur</p>
                <p className="text-body-md text-ink-700">{entry.publisher_name || "—"}</p>
              </div>
            </div>

            <div>
              <p className="text-body-sm text-ink-400">Tâche liée</p>
              <p className="text-body-md text-ink-700">{taskLabel || "Aucune tâche assignée"}</p>
            </div>

            {entry.project?.title && (
              <div>
                <p className="text-body-sm text-ink-400">Projet</p>
                <p className="text-body-md text-ink-700">{entry.project.title}</p>
              </div>
            )}

            <NetworksDisplay networks={entry.networks} networkLinks={entry.network_links} />

            <div>
              <p className="text-body-sm text-ink-400">Notes</p>
              <p className="text-body-md text-ink-700 whitespace-pre-wrap">{entry.notes || "—"}</p>
            </div>
          </div>

          <div className="flex justify-between pt-2 border-t border-surface-200">
            <Button variant="danger" icon={Trash2} onClick={handleDelete} loading={deleting} size="sm">
              Supprimer
            </Button>
            <div className="flex gap-2">
              <Button variant="secondary" onClick={onClose} size="sm">Fermer</Button>
              <Button icon={Pencil} onClick={() => setEditing(true)} size="sm">Modifier</Button>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <Input
            label="Titre"
            value={form.publication_title}
            onChange={(e) => setField("publication_title", e.target.value)}
            placeholder="Titre de la publication"
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Date de publication"
              type="date"
              value={form.publication_date}
              onChange={(e) => setField("publication_date", e.target.value)}
            />
            <Select
              label="Statut"
              value={form.status}
              onChange={(e) => setField("status", e.target.value)}
              options={PUBLICATION_STATUS}
            />
          </div>

          <Select
            label="Tâche liée"
            value={form.task_id}
            onChange={(e) => setField("task_id", e.target.value)}
            options={[
              { value: "", label: "Aucune tâche" },
              ...tasks.map((t) => ({ value: t.id, label: t.title })),
            ]}
          />

          <NetworksSection
            selectedNetworks={form.selectedNetworks}
            networkLinks={form.networkLinks}
            onChange={({ selectedNetworks, networkLinks }) =>
              setForm((prev) => ({ ...prev, selectedNetworks, networkLinks }))
            }
          />

          <Textarea
            label="Notes"
            value={form.notes}
            onChange={(e) => setField("notes", e.target.value)}
            rows={3}
          />

          <div className="flex justify-end gap-2 pt-2 border-t border-surface-200">
            <Button variant="secondary" icon={X} onClick={() => setEditing(false)} size="sm">Annuler</Button>
            <Button onClick={handleSave} loading={saving} size="sm">Mettre à jour</Button>
          </div>
        </div>
      )}
    </Modal>
  );
}


function CreateEditorialModal({ tasks, onClose, onCreated }) {
  const [form, setForm] = useState({
    publication_title: "",
    publication_date: "",
    task_id: "",
    status: "scheduled",
    notes: "",
    selectedNetworks: [],
    networkLinks: {},
  });
  const [submitting, setSubmitting] = useState(false);
  const setField = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = {
        publication_title: form.publication_title || null,
        publication_date: form.publication_date || null,
        task_id: form.task_id || null,
        status: form.status,
        notes: form.notes || null,
        networks: form.selectedNetworks,
        network_links: form.networkLinks,
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
        <Input
          label="Titre"
          value={form.publication_title}
          onChange={(e) => setField("publication_title", e.target.value)}
          placeholder="Titre de la publication"
        />
        <div className="grid grid-cols-2 gap-4">
          <Input label="Date de publication" type="date" value={form.publication_date} onChange={(e) => setField("publication_date", e.target.value)} />
          <Select label="Statut" value={form.status} onChange={(e) => setField("status", e.target.value)} options={PUBLICATION_STATUS} />
        </div>
        <Select
          label="Tâche liée"
          value={form.task_id}
          onChange={(e) => setField("task_id", e.target.value)}
          options={[
            { value: "", label: "Aucune tâche" },
            ...tasks.map((t) => ({ value: t.id, label: t.title })),
          ]}
        />

        <NetworksSection
          selectedNetworks={form.selectedNetworks}
          networkLinks={form.networkLinks}
          onChange={({ selectedNetworks, networkLinks }) =>
            setForm((prev) => ({ ...prev, selectedNetworks, networkLinks }))
          }
        />

        <Textarea label="Notes" value={form.notes} onChange={(e) => setField("notes", e.target.value)} rows={2} />
        <div className="flex justify-end gap-3 pt-2">
          <Button variant="secondary" onClick={onClose}>Annuler</Button>
          <Button type="submit" loading={submitting}>Créer</Button>
        </div>
      </form>
    </Modal>
  );
}
