import { useState } from "react";
import { Modal, Input, Button } from "../../components/ui";
import { mediaAPI } from "../../api/services";
import toast from "react-hot-toast";

function CreateFolderModal({ parentId, onClose, onCreated }) {
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    if (!name.trim()) return toast.error("Le nom du dossier est requis");
    setLoading(true);
    try {
      await mediaAPI.createFolder({ name: name.trim(), parent_id: parentId || null });
      toast.success("Dossier créé");
      onCreated();
    } catch (err) {
      toast.error("Erreur lors de la création du dossier");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal open onClose={onClose} title="Créer un dossier" size="sm">
      <div className="space-y-5">
        <Input
          label="Nom du dossier *"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Nom du dossier"
        />
        <div className="flex justify-end gap-3 pt-2">
          <Button variant="secondary" onClick={onClose}>
            Annuler
          </Button>
          <Button onClick={handleCreate} loading={loading}>
            Créer
          </Button>
        </div>
      </div>
    </Modal>
  );
}

export default CreateFolderModal;
