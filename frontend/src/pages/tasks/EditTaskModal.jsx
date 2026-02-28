import { useState, useEffect } from "react";
import {
  Modal,
  Button,
  Input,
  Textarea,
  Select,
  Autocomplete,
} from "../../components/ui";
import { tasksAPI, usersAPI } from "../../api/services";
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

export default function EditTaskModal({ task, onClose, onSaved }) {
  const [form, setForm] = useState({
    title: "",
    description: "",
    due_date: "",
    priority: "normal",
    assigned_to: "",
    visibility: "client_visible",
    status: "todo",
  });
  const [users, setUsers] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!task) return;
    setForm({
      title: task.title || "",
      description: task.description || "",
      due_date: task.due_date ? task.due_date.slice(0, 10) : "",
      priority: task.priority || "normal",
      assigned_to: task.assigned_to || task.assignee?.id || "",
      visibility: task.visibility || "client_visible",
      status: task.status || "todo",
    });
  }, [task]);

  useEffect(() => {
    const loadUsers = async () => {
      try {
        const [intRes, cliRes] = await Promise.all([
          usersAPI.listInternal({ limit: 100 }),
          usersAPI.listClients({ limit: 100 }),
        ]);
        const internal = extractList(intRes.data?.data).items;
        const clients = extractList(cliRes.data?.data).items;
        setUsers([...internal, ...clients]);
      } catch {}
    };
    loadUsers();
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
        visibility: form.visibility,
      };
      if (form.assigned_to) payload.assigned_to = form.assigned_to;
      else payload.assigned_to = null;

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
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Autocomplete
            label="Assigné à"
            value={form.assigned_to}
            onChange={(v) => set("assigned_to", v)}
            options={[
              { value: "", label: "Non assigné" },
              ...users.map((u) => ({
                value: u.id,
                label: `${u.first_name || ""} ${u.last_name || ""}`.trim() || u.email,
              })),
            ]}
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
          <Select
            label="Visibilité"
            value={form.visibility}
            onChange={(e) => set("visibility", e.target.value)}
            options={[
              { value: "client_visible", label: "Visible client" },
              { value: "internal_only", label: "Interne uniquement" },
            ]}
          />
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
