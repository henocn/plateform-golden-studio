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
} from "lucide-react";
import { addMonths, subMonths, format } from "date-fns";
import { fr } from "date-fns/locale";
import { Card, Button, Modal, Input, Select, Textarea, Skeleton } from "../../../components/ui";
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

  /* Charge les entrées et affiche le titre sur le calendrier */
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
  const [editing, setEditing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    publication_title: entry.publication_title || "",
    publication_date: entry.publication_date ? format(new Date(entry.publication_date), "yyyy-MM-dd") : "",
    status: entry.status || "scheduled",
    task_id: entry.task_id || "",
    notes: entry.notes || "",
  });
  const setField = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  /* Supprime la publication */
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

  /* Met à jour la publication */
  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = {
        publication_title: form.publication_title || null,
        publication_date: form.publication_date || null,
        status: form.status,
        task_id: form.task_id || null,
        notes: form.notes || null,
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
                entry.status === "scheduled" ? "bg-primary-100 text-primary-700" :
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
        <Textarea label="Notes" value={form.notes} onChange={(e) => setField("notes", e.target.value)} rows={2} />
        <div className="flex justify-end gap-3 pt-2">
          <Button variant="secondary" onClick={onClose}>Annuler</Button>
          <Button type="submit" loading={submitting}>Créer</Button>
        </div>
      </form>
    </Modal>
  );
}
