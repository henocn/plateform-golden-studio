import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Image,
  Upload,
  Grid3X3,
  List,
  Tag,
  FileImage,
  FileVideo,
  FileText,
  Download,
  Trash2,
  Eye,
  X,
  Globe,
  Building2,
  User,
} from "lucide-react";
import {
  Card,
  Button,
  Modal,
  Select,
  SearchInput,
  Pagination,
  EmptyState,
  Skeleton,
  ConfirmDialog,
} from "../../components/ui";
import { mediaAPI } from "../../api/services";
import {
  formatDate,
  formatFileSize,
  extractList,
  formatErrorMessage,
  MEDIA_TYPES,
} from "../../utils/helpers";
import { usePermissions } from "../../hooks";
import toast from "react-hot-toast";
import UploadModal from "./UploadModal";

// ── Helpers ────────────────────────────────────────────────────────────────────

const API_BASE = import.meta.env.VITE_API_URL ?? "";

/** Construit l'URL publique depuis file_path */
const buildUrl = (filePath) => (filePath ? `${API_BASE}/${filePath}` : null);

/** Détermine la catégorie d'affichage à partir du mime_type */
const getFileType = (mime) => {
  if (!mime) return "document";
  if (mime.startsWith("image/")) return "image";
  if (mime.startsWith("video/")) return "video";
  return "document";
};

const typeIcons = {
  image: FileImage,
  video: FileVideo,
  document: FileText,
};

const typeColors = {
  image: "bg-info-100 text-info-600",
  video: "bg-danger-100 text-danger-600",
  document: "bg-warning-100 text-warning-600",
};

// ── Page ───────────────────────────────────────────────────────────────────────

export default function MediaPage() {
  const { canUploadMedia: canUpload, canViewFolder, canCreateFolder } = usePermissions();
  const [folders, setFolders] = useState([]);
  const [currentFolder, setCurrentFolder] = useState(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const [files, setFiles] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState("grid");
  const [showUpload, setShowUpload] = useState(false);
  const [preview, setPreview] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const page = parseInt(searchParams.get("page") || "1");
  const typeFilter = searchParams.get("type") || "";
  const search = searchParams.get("q") || "";
  const tag = searchParams.get("tag") || "";
  const folderId = searchParams.get("folder_id") || null;

  useEffect(() => {
    loadMedia();
    if (canViewFolder) loadFolders();
  }, [page, typeFilter, search, tag, folderId]);

  const loadMedia = async () => {
    setLoading(true);
    try {
      const params = { page, limit: 24 };
      if (typeFilter) params.type = typeFilter;
      if (search) params.search = search;
      if (tag) params.tag = tag;
      if (folderId) params.folder_id = folderId;
      const { data } = await mediaAPI.list(params);
      const { items, total: t } = extractList(data.data);
      setFiles(items);
      setTotal(t);
    } catch {
      toast.error("Erreur lors du chargement");
    } finally {
      setLoading(false);
    }
  };

  const loadFolders = async () => {
    try {
      // Charger les dossiers racine ou enfants du dossier courant
      const params = {};
      if (folderId) params.parent_id = folderId;
      const { data } = await mediaAPI.folders(params);
      setFolders(extractList(data.data).items);
      setCurrentFolder(folderId);
    } catch {
      setFolders([]);
    }
  };

  const updateParam = (key, value) => {
    const p = new URLSearchParams(searchParams);
    if (value) p.set(key, value);
    else p.delete(key);
    if (key !== "page") p.set("page", "1");
    setSearchParams(p);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await mediaAPI.delete(deleteTarget.id);
      toast.success("Fichier supprimé");
      setDeleteTarget(null);
      loadMedia();
    } catch (err) {
      formatErrorMessage(err).forEach((d) => toast.error(d.message));
    }
  };

  return (
    <div className="space-y-6">
      {/* Navigation dossiers */}
      {canViewFolder && (
        <div className="flex items-center gap-2 mb-2">
          <Button
            variant="secondary"
            disabled={!folderId}
            onClick={() => updateParam("folder_id", null)}
          >
            Racine
          </Button>
          {folders.map((folder) => (
            <Button
              key={folder.id}
              variant={folder.id === folderId ? "primary" : "secondary"}
              onClick={() => updateParam("folder_id", folder.id)}
            >
              {folder.name}
            </Button>
          ))}
        </div>
      )}
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-display-lg">Médiathèque</h1>
          <p className="text-body-md text-ink-400 mt-1">
            {total} fichier{total !== 1 ? "s" : ""}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-surface-100 rounded-lg p-0.5">
            <button
              onClick={() => setView("grid")}
              className={`p-1.5 rounded-md ${view === "grid" ? "bg-white shadow-sm text-ink-700" : "text-ink-400"}`}
            >
              <Grid3X3 className="w-4 h-4" />
            </button>
            <button
              onClick={() => setView("list")}
              className={`p-1.5 rounded-md ${view === "list" ? "bg-white shadow-sm text-ink-700" : "text-ink-400"}`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
          {canUpload && (
            <Button onClick={() => setShowUpload(true)} icon={Upload}>
              Uploader
            </Button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <SearchInput
          value={search}
          onChange={(v) => updateParam("q", v)}
          placeholder="Rechercher un fichier…"
          className="w-64"
        />
        <Select
          value={typeFilter}
          onChange={(e) => updateParam("type", e.target.value)}
          options={Object.entries(MEDIA_TYPES).map(([k, v]) => ({
            value: k,
            label: v.label,
          }))}
        />
        {tag && (
          <div className="flex items-center gap-1 bg-primary-50 text-primary-700 px-2.5 py-1 rounded-lg text-body-sm">
            <Tag className="w-3.5 h-3.5" /> {tag}
            <button
              onClick={() => updateParam("tag", "")}
              className="ml-1 hover:text-primary-900"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* Content */}
      {loading ? (
        view === "grid" ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6 gap-4">
            {[...Array(12)].map((_, i) => (
              <Skeleton key={i} className="aspect-square rounded-xl" />
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-16 rounded-xl" />
            ))}
          </div>
        )
      ) : files.length === 0 ? (
        <EmptyState
          icon={Image}
          title="Médiathèque vide"
          description="Aucun fichier uploadé pour le moment"
          action={
            canUpload ? (
              <Button onClick={() => setShowUpload(true)} icon={Upload}>
                Uploader un fichier
              </Button>
            ) : null
          }
        />
      ) : view === "grid" ? (
        // ── Vue grille ─────────────────────────────────────────────────────────
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6 gap-4">
          {files.map((f) => {
            const ft = getFileType(f.mime_type);
            const url = buildUrl(f.file_path);
            const Icon = typeIcons[ft] || FileText;
            return (
              <div
                key={f.id}
                className="group relative bg-white rounded-xl border border-surface-300 overflow-hidden shadow-card hover:shadow-card-hover transition-shadow"
              >
                <div className="aspect-square bg-surface-50 flex items-center justify-center relative overflow-hidden">
                  {ft === "image" && url ? (
                    <img
                      src={url}
                      alt={f.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div
                      className={`w-12 h-12 rounded-xl ${typeColors[ft] || "bg-surface-200 text-ink-400"} flex items-center justify-center`}
                    >
                      <Icon className="w-6 h-6" />
                    </div>
                  )}
                  {/* Hover overlay */}
                  <div className="absolute inset-0 bg-ink-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <button
                      onClick={() => setPreview(f)}
                      className="p-2 bg-white/20 rounded-lg hover:bg-white/30 transition-default"
                    >
                      <Eye className="w-4 h-4 text-white" />
                    </button>
                    {url && (
                      <a
                        href={url}
                        download={f.file_name}
                        className="p-2 bg-white/20 rounded-lg hover:bg-white/30 transition-default"
                      >
                        <Download className="w-4 h-4 text-white" />
                      </a>
                    )}
                    <button
                      onClick={() => setDeleteTarget(f)}
                      className="p-2 bg-white/20 rounded-lg hover:bg-white/30 transition-default"
                    >
                      <Trash2 className="w-4 h-4 text-white" />
                    </button>
                  </div>
                </div>
                <div className="px-2.5 py-2">
                  <p
                    className="text-body-sm font-medium text-ink-700 truncate"
                    title={f.name}
                  >
                    {f.name}
                  </p>
                  <p className="text-body-sm text-ink-400">
                    {formatFileSize(f.file_size)}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        // ── Vue liste ──────────────────────────────────────────────────────────
        <Card padding={false}>
          <table className="w-full">
            <thead>
              <tr className="border-b border-surface-200">
                <th className="text-left text-label text-ink-500 font-medium px-5 py-3">
                  Fichier
                </th>
                <th className="text-left text-label text-ink-500 font-medium px-5 py-3">
                  Type
                </th>
                <th className="text-left text-label text-ink-500 font-medium px-5 py-3">
                  Taille
                </th>
                <th className="text-left text-label text-ink-500 font-medium px-5 py-3">
                  Tags
                </th>
                <th className="text-left text-label text-ink-500 font-medium px-5 py-3">
                  Visibilité
                </th>
                <th className="text-left text-label text-ink-500 font-medium px-5 py-3">
                  Date
                </th>
                <th className="text-right text-label text-ink-500 font-medium px-5 py-3">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-200">
              {files.map((f) => {
                const ft = getFileType(f.mime_type);
                const url = buildUrl(f.file_path);
                const Icon = typeIcons[ft] || FileText;
                return (
                  <tr
                    key={f.id}
                    className="hover:bg-surface-50 transition-default"
                  >
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-8 h-8 rounded-lg ${typeColors[ft] || "bg-surface-200 text-ink-400"} flex items-center justify-center shrink-0`}
                        >
                          <Icon className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-body-sm font-medium text-ink-700 truncate max-w-xs">
                            {f.name}
                          </p>
                          <p className="text-body-sm text-ink-400 truncate max-w-xs">
                            {f.file_name}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-body-sm text-ink-500">
                      {MEDIA_TYPES[f.type]?.label ?? f.type}
                    </td>
                    <td className="px-5 py-3 text-body-sm text-ink-500">
                      {formatFileSize(f.file_size)}
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex flex-wrap gap-1">
                        {(f.tags || []).slice(0, 3).map((tg) => (
                          <button
                            key={tg}
                            onClick={() => updateParam("tag", tg)}
                            className="text-body-sm px-1.5 py-0.5 bg-surface-100 rounded text-ink-500 hover:bg-primary-50 hover:text-primary-600 transition-default"
                          >
                            {tg}
                          </button>
                        ))}
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      {f.is_global ? (
                        <span className="inline-flex items-center gap-1 text-body-sm text-success-600">
                          <Globe className="w-3.5 h-3.5" /> Global
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-body-sm text-ink-500">
                          <Building2 className="w-3.5 h-3.5" />
                          {f.organization?.name ?? "—"}
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3 text-body-sm text-ink-400">
                      {formatDate(f.createdAt)}
                    </td>
                    <td className="px-5 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => setPreview(f)}
                          className="p-1.5 hover:bg-surface-100 rounded-lg"
                        >
                          <Eye className="w-4 h-4 text-ink-400" />
                        </button>
                        {url && (
                          <a
                            href={url}
                            download={f.file_name}
                            className="p-1.5 hover:bg-surface-100 rounded-lg"
                          >
                            <Download className="w-4 h-4 text-ink-400" />
                          </a>
                        )}
                        <button
                          onClick={() => setDeleteTarget(f)}
                          className="p-1.5 hover:bg-danger-50 rounded-lg"
                        >
                          <Trash2 className="w-4 h-4 text-ink-400 hover:text-danger-500" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Card>
      )}

      <Pagination
        page={page}
        totalPages={Math.ceil(total / 24) || 1}
        total={total}
        limit={24}
        onPageChange={(p) => updateParam("page", String(p))}
      />

      {/* Modals */}
      {showUpload && (
        <UploadModal
          onClose={() => setShowUpload(false)}
          onUploaded={() => {
            setShowUpload(false);
            loadMedia();
          }}
        />
      )}

      {preview && (
        <PreviewModal file={preview} onClose={() => setPreview(null)} />
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        title="Supprimer le fichier"
        message={`Supprimer "${deleteTarget?.name}" ? Cette action est irréversible.`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}

// ── Preview Modal ──────────────────────────────────────────────────────────────

function PreviewModal({ file: f, onClose }) {
  const ft = getFileType(f.mime_type);
  const url = buildUrl(f.file_path);
  const Icon = typeIcons[ft] || FileText;

  return (
    <Modal open onClose={onClose} title={f.name} size="xl">
      <div className="space-y-5">
        {/* Aperçu */}
        <div className="rounded-xl overflow-hidden bg-surface-100 flex items-center justify-center min-h-[280px]">
          {ft === "image" && url ? (
            <img
              src={url}
              alt={f.name}
              className="max-h-[480px] w-full object-contain"
            />
          ) : ft === "video" && url ? (
            <video src={url} controls className="max-h-[480px] w-full" />
          ) : f.mime_type === "application/pdf" && url ? (
            <iframe
              src={url}
              title={f.name}
              className="w-full h-[480px] border-0"
            />
          ) : (
            <div className="flex flex-col items-center gap-3 py-12 text-ink-400">
              <Icon className="w-14 h-14" />
              <p className="text-body-md">Aperçu non disponible</p>
            </div>
          )}
        </div>

        {/* Métadonnées */}
        <div className="grid grid-cols-2 gap-x-8 gap-y-3 text-body-sm">
          <div className="flex flex-col gap-0.5">
            <span className="text-ink-400">Nom du fichier</span>
            <span className="text-ink-700 font-medium truncate">
              {f.file_name}
            </span>
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="text-ink-400">Type</span>
            <span className="text-ink-700">
              {MEDIA_TYPES[f.type]?.label ?? f.type} —{" "}
              <span className="text-ink-400">{f.mime_type}</span>
            </span>
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="text-ink-400">Taille</span>
            <span className="text-ink-700">{formatFileSize(f.file_size)}</span>
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="text-ink-400">Visibilité</span>
            {f.is_global ? (
              <span className="inline-flex items-center gap-1 text-success-600 font-medium">
                <Globe className="w-3.5 h-3.5" /> Global
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-ink-700">
                <Building2 className="w-3.5 h-3.5 text-ink-400" />
                {f.organization?.name ?? "—"}
              </span>
            )}
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="text-ink-400">Uploadé par</span>
            <span className="inline-flex items-center gap-1 text-ink-700">
              <User className="w-3.5 h-3.5 text-ink-400" />
              {f.uploader
                ? `${f.uploader.first_name} ${f.uploader.last_name}`
                : "—"}
            </span>
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="text-ink-400">Date d'upload</span>
            <span className="text-ink-700">{formatDate(f.createdAt)}</span>
          </div>
        </div>

        {/* Tags */}
        {f.tags?.length > 0 && (
          <div className="flex flex-col gap-1.5">
            <span className="text-body-sm text-ink-400">Tags</span>
            <div className="flex flex-wrap gap-1.5">
              {f.tags.map((tg) => (
                <span
                  key={tg}
                  className="px-2 py-0.5 bg-surface-100 rounded text-body-sm text-ink-600"
                >
                  {tg}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-1 border-t border-surface-200">
          <Button variant="secondary" onClick={onClose}>
            Fermer
          </Button>
          {url && (
            <Button icon={Download} as="a" href={url} download={f.file_name}>
              Télécharger
            </Button>
          )}
        </div>
      </div>
    </Modal>
  );
}
