import { useState, useEffect, useCallback } from "react";
import {
  FolderOpen,
  FolderPlus,
  Upload,
  Grid3X3,
  List,
  FileImage,
  FileVideo,
  FileText,
  Download,
  Trash2,
  Eye,
  ChevronRight,
  Image,
} from "lucide-react";
import {
  Button,
  Modal,
  Select,
  SearchInput,
  EmptyState,
  Skeleton,
  ConfirmDialog,
} from "../../components/ui";
import { mediaAPI, foldersAPI } from "../../api/services";
import { useOrganizationStore } from "../../store/organizationStore";
import {
  formatDate,
  formatFileSize,
  extractList,
  formatErrorMessage,
  MEDIA_TYPES,
} from "../../utils/helpers";
import { useAuthStore } from "../../store/authStore";
import { usePermissions } from "../../hooks";
import toast from "react-hot-toast";
import UploadModal from "./UploadModal";
import CreateFolderModal from "./CreateFolderModal";

const API_BASE = import.meta.env.VITE_API_URL ?? "";

const buildUrl = (filePath) => (filePath ? `${API_BASE}/${filePath}` : null);

const getFileCategory = (mime) => {
  if (!mime) return "document";
  if (mime.startsWith("image/")) return "image";
  if (mime.startsWith("video/")) return "video";
  return "document";
};

const fileIcons = { image: FileImage, video: FileVideo, document: FileText };
const fileIconColors = {
  image: "bg-info-100 text-info-600",
  video: "bg-primary-100 text-primary-600",
  document: "bg-surface-200 text-ink-500",
};

export default function MediaPage() {
  const { user } = useAuthStore();
  const { current: currentOrg, fetchCurrent } = useOrganizationStore();
  const {
    canUploadMedia: canUpload,
    canViewFolder,
    canCreateFolder,
    canDeleteFolder,
    isInternal,
    isSuperAdmin,
  } = usePermissions();

  const currentOrgId = currentOrg?.id ?? user?.organization_id ?? null;

  const [breadcrumb, setBreadcrumb] = useState([]);
  const [subfolders, setSubfolders] = useState([]);
  const [media, setMedia] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState("grid");
  const [search, setSearch] = useState("");
  const [showUpload, setShowUpload] = useState(false);
  const [showCreateFolder, setShowCreateFolder] = useState(false);
  const [previewFile, setPreviewFile] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteFolderTarget, setDeleteFolderTarget] = useState(null);

  const currentFolderId = breadcrumb.length > 0 ? breadcrumb[breadcrumb.length - 1]?.id ?? null : null;
  const isAtRoot = breadcrumb.length <= 1;

  useEffect(() => {
    if (!currentOrgId && !currentOrg) fetchCurrent();
  }, [currentOrgId, currentOrg, fetchCurrent]);

  const loadContent = useCallback(async () => {
    setLoading(true);
    try {
      if (!currentFolderId) {
        const [rootsRes, mediaRes] = await Promise.all([
          foldersAPI.getRootFolders(),
          mediaAPI.list({
            limit: 100,
            folder_id: '', // racine : médias sans dossier
          }),
        ]);
        const rootsData = rootsRes?.data?.data ?? rootsRes?.data;
        const roots = Array.isArray(rootsData) ? rootsData : [];
        const payload = mediaRes?.data?.data ?? mediaRes?.data;
        const { items: mediaList } = extractList(payload);
        setSubfolders(roots);
        setMedia(mediaList ?? []);
      } else {
        const res = await foldersAPI.explore(currentFolderId);
        const data = res?.data?.data ?? res?.data;
        const result = data && typeof data === 'object' ? data : {};
        setSubfolders(Array.isArray(result?.subfolders) ? result.subfolders : []);
        setMedia(Array.isArray(result?.media) ? result.media : []);
      }
    } catch (err) {
      toast.error("Erreur lors du chargement");
      setSubfolders([]);
      setMedia([]);
    } finally {
      setLoading(false);
    }
  }, [currentFolderId]);

  useEffect(() => {
    loadContent();
  }, [loadContent]);

  useEffect(() => {
    if (isAtRoot) {
      setBreadcrumb([{ id: null, name: "Racine", isRoot: true }]);
    }
  }, [isAtRoot]);

  const openFolder = (folder) => {
    setBreadcrumb((prev) => {
      const upToRoot = prev.findIndex((b) => b.isRoot);
      const base = upToRoot >= 0 ? prev.slice(0, upToRoot + 1) : prev;
      return [...base, { id: folder.id, name: folder.name, isRoot: false }];
    });
  };

  const goToBreadcrumb = (index) => {
    setBreadcrumb((prev) => prev.slice(0, index + 1));
  };

  const handleCreateFolder = () => {
    setShowCreateFolder(true);
  };

  const handleFolderCreated = () => {
    setShowCreateFolder(false);
    loadContent();
  };

  const handleUploaded = () => {
    setShowUpload(false);
    loadContent();
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await mediaAPI.remove(deleteTarget.id);
      toast.success("Fichier supprimé");
      setDeleteTarget(null);
      loadContent();
    } catch (err) {
      formatErrorMessage(err).forEach((d) => toast.error(d.message));
    }
  };

  const handleDeleteFolder = async () => {
    if (!deleteFolderTarget) return;
    try {
      await foldersAPI.remove(deleteFolderTarget.id);
      toast.success("Dossier supprimé");
      setDeleteFolderTarget(null);
      loadContent();
    } catch (err) {
      formatErrorMessage(err).forEach((d) => toast.error(d.message));
    }
  };

  const currentOrgName = currentOrg?.name || currentOrg?.short_name || user?.organization_name || "Médiathèque";
  const filteredFolders = search
    ? subfolders.filter((f) => f.name?.toLowerCase().includes(search.toLowerCase()))
    : subfolders;
  const filteredMedia = search
    ? media.filter(
        (m) =>
          m.name?.toLowerCase().includes(search.toLowerCase()) ||
          m.file_name?.toLowerCase().includes(search.toLowerCase())
      )
    : media;

  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-display-lg text-ink-900">Médiathèque</h1>
          <p className="text-body-md text-ink-500 mt-0.5">
            Fichiers de votre organisation. Les fichiers enregistrés depuis une proposition se trouvent dans le dossier que vous avez choisi lors de la sauvegarde.
          </p>
        </div>
      </div>

      <div className="flex gap-6 flex-1 min-h-0">
        <main className="flex-1 flex flex-col min-w-0 rounded-xl border border-surface-300 bg-white shadow-card overflow-hidden">
          {/* Fil d'Ariane */}
          <div className="px-5 py-3 border-b border-surface-200 bg-surface-50 flex items-center gap-2 flex-wrap">
            <span className="text-body-sm text-ink-500">Médiathèque</span>
            {breadcrumb.map((item, i) => (
              <span key={i} className="flex items-center gap-2">
                <ChevronRight className="w-4 h-4 text-ink-300" />
                <button
                  onClick={() => goToBreadcrumb(i)}
                  className={`text-body-sm font-medium transition-default ${
                    i === breadcrumb.length - 1
                      ? "text-primary-600"
                      : "text-ink-600 hover:text-primary-600"
                  }`}
                >
                  {item.name}
                </button>
              </span>
            ))}
          </div>

          {/* Barre d’outils */}
          <div className="px-5 py-3 border-b border-surface-200 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3 flex-wrap">
              <SearchInput
                value={search}
                onChange={setSearch}
                placeholder="Rechercher dans ce dossier…"
                className="w-56"
              />
              {canCreateFolder && (
                <Button
                  variant="secondary"
                  size="sm"
                  icon={FolderPlus}
                  onClick={handleCreateFolder}
                >
                  Nouveau dossier
                </Button>
              )}
              {canUpload && (
                <Button size="sm" icon={Upload} onClick={() => setShowUpload(true)}>
                  Déposer un fichier
                </Button>
              )}
            </div>
            <div className="flex items-center bg-surface-100 rounded-lg p-0.5">
              <button
                onClick={() => setView("grid")}
                className={`p-1.5 rounded-md transition-default ${
                  view === "grid" ? "bg-white shadow-sm text-primary-600" : "text-ink-400 hover:text-ink-600"
                }`}
                aria-label="Vue grille"
              >
                <Grid3X3 className="w-4 h-4" />
              </button>
              <button
                onClick={() => setView("list")}
                className={`p-1.5 rounded-md transition-default ${
                  view === "list" ? "bg-white shadow-sm text-primary-600" : "text-ink-400 hover:text-ink-600"
                }`}
                aria-label="Vue liste"
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Contenu */}
          <div className="flex-1 overflow-auto p-5">
            {loading ? (
              <div className={view === "grid" ? "grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-4" : "space-y-2"}>
                {view === "grid"
                  ? [...Array(10)].map((_, i) => (
                      <Skeleton key={i} className="aspect-square rounded-xl" />
                    ))
                  : [...Array(6)].map((_, i) => (
                      <Skeleton key={i} className="h-14 rounded-lg" />
                    ))}
              </div>
            ) : !currentOrgId ? (
              <EmptyState
                icon={FolderOpen}
                title="Chargement…"
                description="Préparation de la médiathèque."
              />
            ) : filteredFolders.length === 0 && filteredMedia.length === 0 ? (
              <EmptyState
                icon={FolderOpen}
                title="Dossier vide"
                description="Aucun fichier ni sous-dossier. Créez un dossier ou déposez un fichier."
                action={
                  (canCreateFolder || canUpload) ? (
                    <div className="flex flex-wrap justify-center gap-3">
                      {canCreateFolder && (
                        <Button variant="secondary" icon={FolderPlus} onClick={handleCreateFolder}>
                          Créer un dossier
                        </Button>
                      )}
                      {canUpload && (
                        <Button icon={Upload} onClick={() => setShowUpload(true)}>
                          Déposer un fichier
                        </Button>
                      )}
                    </div>
                  ) : null
                }
              />
            ) : (
              <>
                {view === "grid" ? (
                  <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-4">
                    {filteredFolders.map((folder) => (
                      <div
                        key={folder.id}
                        className="group relative flex flex-col items-center p-4 rounded-xl border border-surface-300 bg-surface-50 hover:bg-primary-50 hover:border-primary-200 transition-default text-center"
                      >
                        <button
                          type="button"
                          onClick={() => openFolder(folder)}
                          className="flex flex-col items-center w-full"
                        >
                          <div className="w-14 h-14 rounded-xl bg-primary-100 text-primary-600 flex items-center justify-center mb-2 group-hover:bg-primary-200 transition-default">
                            <FolderOpen className="w-7 h-7" />
                          </div>
                          <span className="text-body-sm font-medium text-ink-700 truncate w-full">
                            {folder.name}
                          </span>
                        </button>
                        {canDeleteFolder && (
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); setDeleteFolderTarget(folder); }}
                            className="absolute top-2 right-2 p-1.5 rounded-lg bg-white/90 hover:bg-danger-50 text-ink-400 hover:text-danger-500 transition-default shadow-sm"
                            title="Supprimer le dossier"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    ))}
                    {filteredMedia.map((f) => {
                      const cat = getFileCategory(f.mime_type);
                      const Icon = fileIcons[cat] || FileText;
                      const url = buildUrl(f.file_path);
                      return (
                        <div
                          key={f.id}
                          className="group relative flex flex-col rounded-xl border border-surface-300 bg-white overflow-hidden shadow-card hover:shadow-card-hover transition-all"
                        >
                          <div className="aspect-square bg-surface-100 flex items-center justify-center relative overflow-hidden">
                            {cat === "image" && url ? (
                              <img
                                src={url}
                                alt={f.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div
                                className={`w-12 h-12 rounded-xl flex items-center justify-center ${fileIconColors[cat]}`}
                              >
                                <Icon className="w-6 h-6" />
                              </div>
                            )}
                            <div className="absolute inset-0 bg-ink-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5">
                              <button
                                onClick={() => setPreviewFile(f)}
                                className="p-2 rounded-lg bg-white/20 hover:bg-white/30"
                              >
                                <Eye className="w-4 h-4 text-white" />
                              </button>
                              {url && (
                                <a
                                  href={url}
                                  download={f.file_name}
                                  className="p-2 rounded-lg bg-white/20 hover:bg-white/30"
                                >
                                  <Download className="w-4 h-4 text-white" />
                                </a>
                              )}
                              <button
                                onClick={() => setDeleteTarget(f)}
                                className="p-2 rounded-lg bg-white/20 hover:bg-white/30"
                              >
                                <Trash2 className="w-4 h-4 text-white" />
                              </button>
                            </div>
                          </div>
                          <div className="px-2.5 py-2">
                            <p className="text-body-sm font-medium text-ink-700 truncate" title={f.name}>
                              {f.name}
                            </p>
                            <p className="text-body-sm text-ink-400">{formatFileSize(f.file_size)}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="space-y-1">
                    {filteredFolders.map((folder) => (
                      <div
                        key={folder.id}
                        className="w-full flex items-center gap-4 px-4 py-3 rounded-lg border border-surface-200 bg-white hover:bg-primary-50 hover:border-primary-200 transition-default"
                      >
                        <button
                          type="button"
                          onClick={() => openFolder(folder)}
                          className="flex items-center gap-4 flex-1 min-w-0 text-left"
                        >
                          <div className="w-10 h-10 rounded-lg bg-primary-100 text-primary-600 flex items-center justify-center shrink-0">
                            <FolderOpen className="w-5 h-5" />
                          </div>
                          <span className="text-body-md font-medium text-ink-700 flex-1 truncate">
                            {folder.name}
                          </span>
                          <ChevronRight className="w-4 h-4 text-ink-400 shrink-0" />
                        </button>
                        {canDeleteFolder && (
                          <button
                            type="button"
                            onClick={() => setDeleteFolderTarget(folder)}
                            className="p-2 rounded-lg hover:bg-danger-50 text-ink-500 hover:text-danger-500 shrink-0"
                            title="Supprimer le dossier"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    ))}
                    {filteredMedia.map((f) => {
                      const cat = getFileCategory(f.mime_type);
                      const Icon = fileIcons[cat] || FileText;
                      const url = buildUrl(f.file_path);
                      return (
                        <div
                          key={f.id}
                          className="w-full flex items-center gap-4 px-4 py-3 rounded-lg border border-surface-200 bg-white hover:bg-surface-50 transition-default"
                        >
                          <div
                            className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${fileIconColors[cat]}`}
                          >
                            <Icon className="w-5 h-5" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-body-md font-medium text-ink-700 truncate">{f.name}</p>
                            <p className="text-body-sm text-ink-400">
                              {formatFileSize(f.file_size)} · {formatDate(f.createdAt)}
                            </p>
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              onClick={() => setPreviewFile(f)}
                              className="p-2 rounded-lg hover:bg-surface-200 text-ink-500"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            {url && (
                              <a
                                href={url}
                                download={f.file_name}
                                className="p-2 rounded-lg hover:bg-surface-200 text-ink-500"
                              >
                                <Download className="w-4 h-4" />
                              </a>
                            )}
                            <button
                              onClick={() => setDeleteTarget(f)}
                              className="p-2 rounded-lg hover:bg-danger-50 text-ink-500 hover:text-danger-500"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </>
            )}
          </div>
        </main>
      </div>

      {showCreateFolder && (
        <CreateFolderModal
          isRoot={isAtRoot}
          parentId={currentFolderId}
          organizationId={currentOrgId}
          organizationName={currentOrgName}
          isSuperAdmin={isSuperAdmin}
          onClose={() => setShowCreateFolder(false)}
          onCreated={handleFolderCreated}
        />
      )}

      {showUpload && (
        <UploadModal
          folderId={currentFolderId}
          folderName={breadcrumb[breadcrumb.length - 1]?.name}
          onClose={() => setShowUpload(false)}
          onUploaded={handleUploaded}
        />
      )}

      {previewFile && (
        <PreviewModal file={previewFile} onClose={() => setPreviewFile(null)} />
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        title="Supprimer le fichier"
        message={`Supprimer « ${deleteTarget?.name} » ? Cette action est irréversible.`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />

      <ConfirmDialog
        open={!!deleteFolderTarget}
        title="Supprimer le dossier"
        message={`Supprimer le dossier « ${deleteFolderTarget?.name} » ? Cette action est irréversible.`}
        onConfirm={handleDeleteFolder}
        onCancel={() => setDeleteFolderTarget(null)}
      />
    </div>
  );
}

function PreviewModal({ file, onClose }) {
  const cat = getFileCategory(file?.mime_type);
  const url = buildUrl(file?.file_path);
  const Icon = fileIcons[cat] || FileText;

  return (
    <Modal open onClose={onClose} title={file?.name} size="xl">
      <div className="space-y-5">
        <div className="rounded-xl overflow-hidden bg-surface-100 flex items-center justify-center min-h-[280px]">
          {cat === "image" && url ? (
            <img src={url} alt={file.name} className="max-h-[480px] w-full object-contain" />
          ) : cat === "video" && url ? (
            <video src={url} controls className="max-h-[480px] w-full" />
          ) : file?.mime_type === "application/pdf" && url ? (
            <iframe src={url} title={file.name} className="w-full h-[480px] border-0" />
          ) : (
            <div className="flex flex-col items-center gap-3 py-12 text-ink-400">
              <Icon className="w-14 h-14" />
              <p className="text-body-md">Aperçu non disponible</p>
            </div>
          )}
        </div>
        <div className="grid grid-cols-2 gap-x-8 gap-y-3 text-body-sm">
          <div>
            <span className="text-ink-400 block">Taille</span>
            <span className="text-ink-700 font-medium">{formatFileSize(file?.file_size)}</span>
          </div>
          <div>
            <span className="text-ink-400 block">Date</span>
            <span className="text-ink-700 font-medium">{formatDate(file?.createdAt)}</span>
          </div>
        </div>
        <div className="flex justify-end gap-3 pt-2 border-t border-surface-200">
          <Button variant="secondary" onClick={onClose}>Fermer</Button>
          {url && (
            <a
              href={url}
              download={file?.file_name}
              className="inline-flex items-center justify-center gap-2 h-9 px-4 text-body-md font-medium rounded-lg bg-primary-500 text-white hover:bg-primary-600 transition-default"
            >
              <Download className="w-4 h-4" /> Télécharger
            </a>
          )}
        </div>
      </div>
    </Modal>
  );
}
