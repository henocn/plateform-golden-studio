import { useState } from "react";
import { Modal, Input, Textarea, Button } from "../../components/ui";
import { proposalsAPI } from "../../api/services";
import { formatErrorMessage } from "../../utils/helpers";
import toast from "react-hot-toast";

/**
 * Création d'une proposition liée à une tâche.
 * project_id et task_id sont pré-remplis (invisibles pour l'utilisateur).
 */
export default function CreateProposalModal({ task, onClose, onCreated }) {
  const [form, setForm] = useState({
    title: "",
    description: "",
    file: null,
  });
  const [submitting, setSubmitting] = useState(false);
  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const projectId = task?.project?.id || task?.project_id;
  const taskId = task?.id;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title?.trim()) {
      toast.error("Le titre est requis");
      return;
    }
    if (!projectId) {
      toast.error("Projet introuvable");
      return;
    }
    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append("title", form.title.trim());
      fd.append("description", form.description || "");
      if (taskId) fd.append("task_id", taskId);
      if (form.file) fd.append("file", form.file);
      await proposalsAPI.create(projectId, fd);
      toast.success("Proposition créée");
      onCreated();
    } catch (err) {
      formatErrorMessage(err).forEach((d) => toast.error(d.message));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal open onClose={onClose} title="Nouvelle proposition" size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        {task && (
          <p className="text-body-sm text-ink-500 rounded-lg bg-surface-100 border border-surface-200 px-3 py-2">
            Tâche : <strong className="text-ink-700">{task.title}</strong>
            {task.project?.title && (
              <> · Projet : <strong className="text-ink-700">{task.project.title}</strong></>
            )}
          </p>
        )}
        <Input
          label="Titre *"
          value={form.title}
          onChange={(e) => set("title", e.target.value)}
          placeholder="Titre de la proposition"
        />
        <Textarea
          label="Description"
          value={form.description}
          onChange={(e) => set("description", e.target.value)}
          rows={3}
          placeholder="Description optionnelle"
        />
        <div>
          <label className="block text-label text-ink-700 mb-1">Fichier</label>
          <input
            type="file"
            onChange={(e) => set("file", e.target.files?.[0] ?? null)}
            className="block w-full text-body-sm text-ink-600 file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border file:border-surface-300 file:bg-white file:text-ink-700 hover:file:bg-surface-50"
          />
        </div>
        <div className="flex justify-end gap-3 pt-2 border-t border-surface-200">
          <Button type="button" variant="secondary" onClick={onClose}>
            Annuler
          </Button>
          <Button type="submit" loading={submitting}>
            Créer la proposition
          </Button>
        </div>
      </form>
    </Modal>
  );
}
