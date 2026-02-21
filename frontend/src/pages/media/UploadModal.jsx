import { useState, useEffect, useCallback } from "react";
import { Upload, FileText, FolderUp, X } from "lucide-react";
import {
  Button,
  Modal,
  Input,
  Select,
  Autocomplete,
} from "../../components/ui";
import { mediaAPI, organizationsAPI } from "../../api/services";
import {
  formatFileSize,
  extractList,
  formatErrorMessage,
  MEDIA_TYPES,
} from "../../utils/helpers";
import toast from "react-hot-toast";

function UploadModal({ onClose, onUploaded }) {
  const [file, setFile] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [organizations, setOrganizations] = useState([]);

  const [folders, setFolders] = useState([]);
  const [form, setForm] = useState({
    name: "",
    type: "",
    tags: "",
    folder_id: null,
  });

  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));
  useEffect(() => {
    const load = async () => {
      try {
        // Charger tous les dossiers accessibles
        const { data } = await mediaAPI.folders({});
        setFolders(extractList(data.data).items);
      } catch {}
    };
    load();
  }, []);

  // Quand un fichier est choisi, on pré-remplit le nom et le type
  const applyFile = (f) => {
    if (!f) return;
    setFile(f);
    set("name", f.name.replace(/\.[^/.]+$/, ""));
    let detectedType = "";
    if (f.type.startsWith("image/")) detectedType = "image";
    else if (f.type.startsWith("video/")) detectedType = "video";
    else detectedType = "document";
    set("type", detectedType);
  };

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setDragOver(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped) applyFile(dropped);
  }, []);

  const handleFileSelect = (e) => {
    const selected = e.target.files[0];
    if (selected) applyFile(selected);
  };

  const handleUpload = async () => {
    if (!file) return toast.error("Sélectionnez un fichier");
    if (!form.name.trim()) return toast.error("Le nom est requis");
    if (!form.type) return toast.error("Le type est requis");
    if (!form.folder_id)
      return toast.error("Sélectionnez un dossier pour uploader");

    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("name", form.name.trim());
      fd.append("type", form.type);
      fd.append("folder_id", form.folder_id);

      // Tags : on split sur la virgule et on envoie chaque tag séparément
      const tagList = form.tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);
      tagList.forEach((t) => fd.append("tags[]", t));

      await mediaAPI.upload(fd);
      toast.success("Fichier uploadé");
      onUploaded();
    } catch (err) {
      const details = formatErrorMessage(err);
      details.forEach((detail) => toast.error(detail.message));
    } finally {
      setUploading(false);
    }
  };

  return (
    <Modal open onClose={onClose} title="Uploader un fichier" size="lg">
      <div className="space-y-5">
        {/* Drop zone */}
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-xl p-8 text-center transition-all ${
            dragOver
              ? "border-primary-400 bg-primary-50"
              : "border-surface-300 bg-surface-50"
          }`}
        >
          <FolderUp
            className={`w-10 h-10 mx-auto mb-3 ${dragOver ? "text-primary-500" : "text-ink-300"}`}
          />
          {file ? (
            <div className="flex items-center justify-center gap-2">
              <FileText className="w-4 h-4 text-ink-400 shrink-0" />
              <span className="text-body-sm font-medium text-ink-700 truncate max-w-xs">
                {file.name}
              </span>
              <span className="text-body-sm text-ink-400 shrink-0">
                {formatFileSize(file.size)}
              </span>
              <button
                onClick={() => setFile(null)}
                className="p-1 hover:bg-danger-50 rounded"
              >
                <X className="w-3.5 h-3.5 text-ink-400" />
              </button>
            </div>
          ) : (
            <>
              <p className="text-body-md text-ink-500 mb-1">
                Glissez-déposez votre fichier ici
              </p>
              <p className="text-body-sm text-ink-400 mb-3">ou</p>
              <label className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-surface-400 rounded-lg text-body-sm font-medium text-ink-700 cursor-pointer hover:bg-surface-50 transition-default">
                <Upload className="w-4 h-4" /> Parcourir
                <input
                  type="file"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </label>
            </>
          )}
        </div>

        {/* Nom + Type + Dossier obligatoire */}
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Nom *"
            value={form.name}
            onChange={(e) => set("name", e.target.value)}
            placeholder="Nom du fichier"
          />
          <Select
            label="Type *"
            value={form.type}
            onChange={(e) => set("type", e.target.value)}
            options={[
              { value: "", label: "Sélectionner un type" },
              ...Object.entries(MEDIA_TYPES).map(([k, v]) => ({
                value: k,
                label: v.label,
              })),
            ]}
          />
        </div>
        <Select
          label="Dossier *"
          value={form.folder_id || ""}
          onChange={(e) => set("folder_id", e.target.value)}
          options={[
            { value: "", label: "Sélectionner un dossier" },
            ...folders.map((f) => ({ value: f.id, label: f.name })),
          ]}
        />

        {/* Tags */}
        <Input
          label="Tags (séparés par des virgules)"
          value={form.tags}
          onChange={(e) => set("tags", e.target.value)}
          placeholder="branding, logo, 2024"
        />

        {/* Visibilité */}
        <div className="space-y-3">
          <label className="flex items-center gap-3 cursor-pointer select-none">
            <div
              onClick={() => {
                set("is_global", !form.is_global);
                if (!form.is_global) set("organization_id", null); // reset orga si on passe global
              }}
              className={`w-10 h-6 rounded-full transition-colors flex items-center px-0.5 ${
                form.is_global ? "bg-primary-500" : "bg-surface-400"
              }`}
            >
              <div
                className={`w-5 h-5 bg-white rounded-full shadow transition-transform ${
                  form.is_global ? "translate-x-4" : "translate-x-0"
                }`}
              />
            </div>
            <span className="text-body-sm font-medium text-ink-700">
              Global — visible par toutes les organisations
            </span>
          </label>

          {/* Autocomplete organisation — visible seulement si pas global */}
          {!form.is_global && (
            <div>
              <p className="text-label text-ink-500 mb-1">Organisation *</p>
              <Autocomplete
                value={form.organization_id}
                onChange={(v) => set("organization_id", v)}
                options={organizations.map((o) => ({
                  value: o.id,
                  label: o.name,
                }))}
                placeholder="Rechercher une organisation…"
              />
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-2">
          <Button variant="secondary" onClick={onClose}>
            Annuler
          </Button>
          <Button onClick={handleUpload} loading={uploading} icon={Upload}>
            Uploader
          </Button>
        </div>
      </div>
    </Modal>
  );
}

export default UploadModal;
