import { useState, useEffect } from "react";
import { FolderPlus } from "lucide-react";
import { Modal, Input, Button, Select } from "../../components/ui";
import { foldersAPI } from "../../api/services";
import toast from "react-hot-toast";

export default function CreateFolderModal({
  isRoot,
  parentId,
  organizationId,
  organizationName,
  isSuperAdmin,
  onClose,
  onCreated,
}) {
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedOrgId] = useState(organizationId || "");

  const handleSubmit = async (e) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      toast.error("Le nom du dossier est requis.");
      return;
    }

    setLoading(true);
    try {
      const payload = {
        name: trimmed,
        parent_id: isRoot ? null : parentId,
      };
      // En mode mono-organisation, le backend positionne organization_id automatiquement
      await foldersAPI.create(payload);
      toast.success("Dossier créé.");
      onCreated();
    } catch (err) {
      const msg = err.response?.data?.error?.message || "Erreur lors de la création.";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal open onClose={onClose} title="Nouveau dossier" size="sm">
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="flex items-center gap-3 p-3 rounded-xl bg-primary-50 border border-primary-100">
          <div className="w-10 h-10 rounded-lg bg-primary-100 text-primary-600 flex items-center justify-center shrink-0">
            <FolderPlus className="w-5 h-5" />
          </div>
          <p className="text-body-sm text-ink-700">
            {isRoot
              ? "Créer un dossier à la racine de la médiathèque."
              : `Créer un sous-dossier dans "${organizationName || "ce dossier"}".`}
          </p>
        </div>

        <Input
          label="Nom du dossier"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Ex. Campagne 2024"
          required
          autoFocus
        />

        <div className="flex justify-end gap-3 pt-2 border-t border-surface-200">
          <Button type="button" variant="secondary" onClick={onClose}>
            Annuler
          </Button>
          <Button type="submit" loading={loading} icon={FolderPlus}>
            Créer le dossier
          </Button>
        </div>
      </form>
    </Modal>
  );
}
