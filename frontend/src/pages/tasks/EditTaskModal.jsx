import { useState, useEffect } from "react";
import {
  Modal,
  Button,
  Input,
  Textarea,
  Select,
} from "../../components/ui";
import { tasksAPI, usersAPI, calendarAPI } from "../../api/services";
import { extractList, formatErrorMessage, TASK_STATUS, PRIORITY } from "../../utils/helpers";
import toast from "react-hot-toast";

const STATUS_OPTIONS = Object.entries(TASK_STATUS).map(([value, { label }]) => ({
  value,
  label,
}));

const PRIORITY_OPTIONS = Object.entries(PRIORITY).map(([value, { label }]) => ({
  value,
  label,
}));

export default function EditTaskModal({ task, isInternal, onClose, onSaved }) {
  const [form, setForm] = useState({
    title: "",
    description: "",
    due_date: "",
    priority: "normal",
    assigned_to: "",
    status: "todo",
    publication_date: "",
    context: "project",
    event_id: "",
    supervisor_id: "",
  });
  const [users, setUsers] = useState([]);
  const [validators, setValidators] = useState([]);
  const [events, setEvents] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!task) return;
    setForm({
      title: task.title || "",
      description: task.description || "",
      due_date: task.due_date ? task.due_date.slice(0, 10) : "",
      priority: task.priority || "normal",
      assigned_to: task.assigned_to || task.assignee?.id || "",
      status: task.status || "todo",
      publication_date: task.publication_date ? task.publication_date.slice(0, 10) : "",
      context: task.context || "project",
      event_id: task.event_id || "",
      supervisor_id: task.supervisor_id || "",
    });
  }, [task]);

  /* Charge les utilisateurs internes (assignation) + validateurs clients (superviseurs) */
  useEffect(() => {
    if (!isInternal) return;
    const loadUsers = async () => {
      try {
        const [internalRes, clientValidatorsRes] = await Promise.all([
          usersAPI.listInternal({ limit: 100 }),
          usersAPI.listClients({ limit: 100, role: "client_validator" }),
        ]);
        setUsers(extractList(internalRes.data.data).items);
        setValidators(extractList(clientValidatorsRes.data.data).items);
      } catch {
        setUsers([]);
        setValidators([]);
      }
    };
    loadUsers();
  }, [isInternal]);

  useEffect(() => {
    const loadEvents = async () => {
      try {
        const { data } = await calendarAPI.listEvents({ page: 1, limit: 100 });
        const { items } = extractList(data.data);
        setEvents(items || []);
      } catch {
        setEvents([]);
      }
    };
    loadEvents();
  }, []);

  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title?.trim()) return toast.error("Le titre est requis");
    setSubmitting(true);
    try {
      const payload = {
        title: form.title.trim(),
        description: form.description?.trim() || null,
        due_date: form.due_date || null,
        priority: form.priority,
        publication_date: form.publication_date || null,
        context: form.context,
      };
      if (isInternal) {
        if (form.assigned_to) payload.assigned_to = form.assigned_to;
        else payload.assigned_to = null;
      }

      if (form.supervisor_id) payload.supervisor_id = form.supervisor_id;
      else payload.supervisor_id = null;

      if (form.context === "event") {
        payload.event_id = form.event_id || null;
      } else {
        payload.event_id = null;
      }

      await tasksAPI.update(task.id, payload);
      if (form.status !== task.status) {
        await tasksAPI.patchStatus(task.id, { status: form.status });
      }
      toast.success("Tâche mise à jour");
      onSaved();
      onClose();
    } catch (err) {
      const details = formatErrorMessage(err);
      details.forEach((d) => toast.error(d.message));
    } finally {
      setSubmitting(false);
    }
  };

  if (!task) return null;

  return (
    <Modal open onClose={onClose} title="Modifier la tâche" size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Titre *"
          value={form.title}
          onChange={(e) => set("title", e.target.value)}
          placeholder="Titre de la tâche"
        />
        <Textarea
          label="Description"
          value={form.description}
          onChange={(e) => set("description", e.target.value)}
          rows={3}
        />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Select
            label="Type de tâche"
            value={form.context}
            onChange={(e) => set("context", e.target.value)}
            options={[
              { value: "project", label: "Pour un projet" },
              { value: "event", label: "Pour un événement" },
            ]}
          />
          <Select
            label={form.context === "project" ? "Projet" : "Événement"}
            value={form.context === "project" ? (task.project_id || task.project?.id || "") : form.event_id}
            onChange={(e) => {
              if (form.context === "event") {
                set("event_id", e.target.value);
              }
            }}
            options={
              form.context === "event"
                ? [{ value: "", label: "—" }, ...events.map((ev) => ({ value: ev.id, label: ev.title }))]
                : [{ value: task.project_id || task.project?.id || "", label: task.project?.title || "Projet parent" }]
            }
          />
          <Select
            label="Statut"
            value={form.status}
            onChange={(e) => set("status", e.target.value)}
            options={STATUS_OPTIONS}
          />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Select
            label="Priorité"
            value={form.priority}
            onChange={(e) => set("priority", e.target.value)}
            options={PRIORITY_OPTIONS}
          />
          <Input
            label="Date limite"
            type="date"
            value={form.due_date}
            onChange={(e) => set("due_date", e.target.value)}
          />
          <Input
            label="Date de publication"
            type="date"
            value={form.publication_date}
            onChange={(e) => set("publication_date", e.target.value)}
          />
        </div>
        <div className={isInternal ? "grid grid-cols-1 sm:grid-cols-2 gap-4" : ""}>
          {isInternal && (
            <Select
              label="Assigné à"
              value={form.assigned_to}
              onChange={(e) => set("assigned_to", e.target.value)}
              options={[
                { value: "", label: "Non assigné" },
                ...users.map((u) => ({
                  value: u.id,
                  label: `${u.first_name || ""} ${u.last_name || ""}`.trim() || u.email,
                })),
              ]}
            />
          )}
          {isInternal && (
            <Select
              label="Superviseur (validateur client)"
              value={form.supervisor_id}
              onChange={(e) => set("supervisor_id", e.target.value)}
              options={[
                { value: "", label: "Aucun superviseur" },
                ...validators.map((u) => ({
                  value: u.id,
                  label: `${u.first_name || ""} ${u.last_name || ""}`.trim() || u.email,
                })),
              ]}
            />
          )}
        </div>
        <div className="flex justify-end gap-3 pt-2 border-t border-surface-200">
          <Button type="button" variant="secondary" onClick={onClose}>
            Annuler
          </Button>
          <Button type="submit" loading={submitting}>
            Enregistrer
          </Button>
        </div>
      </form>
    </Modal>
  );
}
