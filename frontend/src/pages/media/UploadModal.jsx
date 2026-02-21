import { useState, useCallback } from "react";
import { Upload, FileText, X, FolderOpen } from "lucide-react";
import { Button, Modal, Input, Select } from "../../components/ui";
import { mediaAPI } from "../../api/services";
import { formatFileSize, formatErrorMessage, MEDIA_TYPES } from "../../utils/helpers";
import toast from "react-hot-toast";

export default function UploadModal({ folderId, folderName, onClose, onUploaded }) {
  const [file, setFile] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState({
    name: "",
    type: "other",
    tags: "",
  });

  const set = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const onFileSelect = useCallback((f) => {
    if (!f) return;
    setFile(f);
    set("name", f.name.replace(/\.[^/.]+$/, "") || f.name);
    if (f.type.startsWith("image/")) set("type", "photo");
    else if (f.type.startsWith("video/")) set("type", "video");
    else set("type", "document");
  }, []);

  const handleDrop = useCallback(
    (e) => {
      e.preventDefault();
      setDragOver(false);
      const f = e.dataTransfer.files[0];
      if (f) onFileSelect(f);
    },
    [onFileSelect]
  );

  const handleFileInput = (e) => {
    const f = e.target.files?.[0];
    if (f) onFileSelect(f);
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) {
      toast.error("Sélectionnez un fichier.");
      return;
    }
    const name = form.name.trim();
    if (!name) {
      toast.error("Le nom est requis.");
      return;
    }

    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("name", name);
      fd.append("type", form.type);
      if (folderId) fd.append("folder_id", folderId);

      const tagList = (form.tags || "")
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);
      tagList.forEach((t) => fd.append("tags[]", t));

      await mediaAPI.upload(fd);
      toast.success("Fichier déposé.");
      onUploaded();
    } catch (err) {
      formatErrorMessage(err).forEach((d) => toast.error(d.message || "Erreur lors de l’upload."));
    } finally {
      setUploading(false);
    }
  };

  const typeOptions = [
    { value: "", label: "Sélectionner un type" },
    ...Object.entries(MEDIA_TYPES).map(([k, v]) => ({ value: k, label: v.label })),
  ];

  return (
    <Modal open onClose={onClose} title="Déposer un fichier" size="lg">
      <form onSubmit={handleUpload} className="space-y-5">
        {folderName && (
          <div className="flex items-center gap-2 text-body-sm text-ink-500">
            <FolderOpen className="w-4 h-4" />
            <span>Dossier de destination : <strong className="text-ink-700">{folderName}</strong></span>
          </div>
        )}

        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          className={`rounded-xl border-2 border-dashed transition-all flex flex-col items-center justify-center min-h-[160px] p-6 ${
            dragOver ? "border-primary-400 bg-primary-50" : "border-surface-300 bg-surface-50"
          }`}
        >
          {file ? (
            <div className="flex items-center gap-3 w-full max-w-md">
              <div className="w-12 h-12 rounded-xl bg-primary-100 text-primary-600 flex items-center justify-center shrink-0">
                <FileText className="w-6 h-6" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-body-md font-medium text-ink-700 truncate">{file.name}</p>
                <p className="text-body-sm text-ink-400">{formatFileSize(file.size)}</p>
              </div>
              <button
                type="button"
                onClick={() => { setFile(null); set("name", ""); }}
                className="p-2 rounded-lg hover:bg-danger-50 text-ink-400 hover:text-danger-500 transition-default"
                aria-label="Retirer le fichier"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <>
              <Upload className={`w-10 h-10 mb-3 ${dragOver ? "text-primary-500" : "text-ink-300"}`} />
              <p className="text-body-md text-ink-600 mb-1">Glissez-déposez votre fichier ici</p>
              <p className="text-body-sm text-ink-400 mb-3">ou</p>
              <label className="inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-surface-400 rounded-lg text-body-sm font-medium text-ink-700 cursor-pointer hover:bg-surface-50 transition-default shadow-card">
                <Upload className="w-4 h-4" /> Parcourir
                <input type="file" onChange={handleFileInput} className="hidden" />
              </label>
            </>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Nom du fichier"
            value={form.name}
            onChange={(e) => set("name", e.target.value)}
            placeholder="Nom affiché"
            required
          />
          <Select
            label="Type"
            value={form.type}
            onChange={(e) => set("type", e.target.value)}
            options={typeOptions}
          />
        </div>

        <Input
          label="Tags (séparés par des virgules)"
          value={form.tags}
          onChange={(e) => set("tags", e.target.value)}
          placeholder="Ex. branding, logo, 2024"
        />

        <div className="flex justify-end gap-3 pt-2 border-t border-surface-200">
          <Button type="button" variant="secondary" onClick={onClose}>
            Annuler
          </Button>
          <Button type="submit" loading={uploading} disabled={!file} icon={Upload}>
            Déposer
          </Button>
        </div>
      </form>
    </Modal>
  );
}
