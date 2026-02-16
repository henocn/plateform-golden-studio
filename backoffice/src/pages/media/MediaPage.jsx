import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Image, Upload, Grid3X3, List, Search, Tag, FileImage, FileVideo, FileText,
  Download, Trash2, Eye, X, FolderUp,
} from 'lucide-react';
import {
  Card, Button, Badge, Modal, Input, Select, SearchInput,
  Pagination, EmptyState, Skeleton, ConfirmDialog,
} from '../../components/ui';
import { mediaAPI } from '../../api/services';
import { formatDate, formatFileSize, extractList } from '../../utils/helpers';
import { useAuthStore } from '../../store/authStore';
import toast from 'react-hot-toast';

const typeIcons = {
  image: FileImage,
  video: FileVideo,
  document: FileText,
};

const typeColors = {
  image: 'bg-info-100 text-info-600',
  video: 'bg-danger-100 text-danger-600',
  document: 'bg-warning-100 text-warning-600',
};

export default function MediaPage() {
  const { user: currentUser } = useAuthStore();
  const canUpload = currentUser?.user_type === 'internal' || ['client_admin', 'client_contributor'].includes(currentUser?.role);
  const [searchParams, setSearchParams] = useSearchParams();
  const [files, setFiles] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('grid');
  const [showUpload, setShowUpload] = useState(false);
  const [preview, setPreview] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const page = parseInt(searchParams.get('page') || '1');
  const typeFilter = searchParams.get('type') || '';
  const search = searchParams.get('q') || '';
  const tag = searchParams.get('tag') || '';

  useEffect(() => { loadMedia(); }, [page, typeFilter, search, tag]);

  const loadMedia = async () => {
    setLoading(true);
    try {
      const params = { page, limit: 24 };
      if (typeFilter) params.type = typeFilter;
      if (search) params.search = search;
      if (tag) params.tag = tag;
      const { data } = await mediaAPI.list(params);
      const { items, total: t } = extractList(data.data);
      setFiles(items);
      setTotal(t);
    } catch {
      toast.error('Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  const updateParam = (key, value) => {
    const p = new URLSearchParams(searchParams);
    if (value) p.set(key, value); else p.delete(key);
    if (key !== 'page') p.set('page', '1');
    setSearchParams(p);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await mediaAPI.delete(deleteTarget.id);
      toast.success('Fichier supprimé');
      setDeleteTarget(null);
      loadMedia();
    } catch (err) {
      toast.error(err.response?.data?.error?.message || 'Erreur');
    }
  };

  const getFileType = (mime) => {
    if (!mime) return 'document';
    if (mime.startsWith('image/')) return 'image';
    if (mime.startsWith('video/')) return 'video';
    return 'document';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-display-lg">Médiathèque</h1>
          <p className="text-body-md text-ink-400 mt-1">{total} fichier{total !== 1 ? 's' : ''}</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-surface-100 rounded-lg p-0.5">
            <button onClick={() => setView('grid')} className={`p-1.5 rounded-md ${view === 'grid' ? 'bg-white shadow-sm text-ink-700' : 'text-ink-400'}`}>
              <Grid3X3 className="w-4 h-4" />
            </button>
            <button onClick={() => setView('list')} className={`p-1.5 rounded-md ${view === 'list' ? 'bg-white shadow-sm text-ink-700' : 'text-ink-400'}`}>
              <List className="w-4 h-4" />
            </button>
          </div>
          {canUpload && <Button onClick={() => setShowUpload(true)} icon={Upload}>Uploader</Button>}
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <SearchInput value={search} onChange={(v) => updateParam('q', v)} placeholder="Rechercher un fichier…" className="w-64" />
        <Select value={typeFilter} onChange={(e) => updateParam('type', e.target.value)} className="w-40">
          <option value="">Tous les types</option>
          <option value="image">Images</option>
          <option value="video">Vidéos</option>
          <option value="document">Documents</option>
        </Select>
        {tag && (
          <div className="flex items-center gap-1 bg-primary-50 text-primary-700 px-2.5 py-1 rounded-lg text-body-sm">
            <Tag className="w-3.5 h-3.5" /> {tag}
            <button onClick={() => updateParam('tag', '')} className="ml-1 hover:text-primary-900"><X className="w-3.5 h-3.5" /></button>
          </div>
        )}
      </div>

      {/* Content */}
      {loading ? (
        view === 'grid' ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6 gap-4">
            {[...Array(12)].map((_, i) => <Skeleton key={i} className="aspect-square rounded-xl" />)}
          </div>
        ) : (
          <div className="space-y-2">{[1,2,3,4].map((i) => <Skeleton key={i} className="h-16 rounded-xl" />)}</div>
        )
      ) : files.length === 0 ? (
        <EmptyState icon={Image} title="Médiathèque vide" description="Aucun fichier uploadé pour le moment" action={canUpload ? <Button onClick={() => setShowUpload(true)} icon={Upload}>Uploader un fichier</Button> : null} />
      ) : view === 'grid' ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6 gap-4">
          {files.map((f) => {
            const ft = getFileType(f.mime_type);
            const Icon = typeIcons[ft] || FileText;
            return (
              <div key={f.id} className="group relative bg-white rounded-xl border border-surface-300 overflow-hidden shadow-card hover:shadow-card-hover transition-shadow">
                {/* Thumbnail area */}
                <div className="aspect-square bg-surface-50 flex items-center justify-center relative overflow-hidden">
                  {ft === 'image' && f.url ? (
                    <img src={f.url} alt={f.file_name} className="w-full h-full object-cover" />
                  ) : (
                    <div className={`w-12 h-12 rounded-xl ${typeColors[ft] || 'bg-surface-200 text-ink-400'} flex items-center justify-center`}>
                      <Icon className="w-6 h-6" />
                    </div>
                  )}
                  {/* Hover overlay */}
                  <div className="absolute inset-0 bg-ink-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <button onClick={() => setPreview(f)} className="p-2 bg-white/20 rounded-lg hover:bg-white/30 transition-default">
                      <Eye className="w-4 h-4 text-white" />
                    </button>
                    <a href={f.url} download className="p-2 bg-white/20 rounded-lg hover:bg-white/30 transition-default">
                      <Download className="w-4 h-4 text-white" />
                    </a>
                    <button onClick={() => setDeleteTarget(f)} className="p-2 bg-white/20 rounded-lg hover:bg-white/30 transition-default">
                      <Trash2 className="w-4 h-4 text-white" />
                    </button>
                  </div>
                </div>
                {/* File info */}
                <div className="px-2.5 py-2">
                  <p className="text-body-sm font-medium text-ink-700 truncate">{f.file_name}</p>
                  <p className="text-body-sm text-ink-400">{formatFileSize(f.file_size)}</p>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <Card padding={false}>
          <table className="w-full">
            <thead>
              <tr className="border-b border-surface-200">
                <th className="text-left text-label text-ink-500 font-medium px-5 py-3">Fichier</th>
                <th className="text-left text-label text-ink-500 font-medium px-5 py-3">Type</th>
                <th className="text-left text-label text-ink-500 font-medium px-5 py-3">Taille</th>
                <th className="text-left text-label text-ink-500 font-medium px-5 py-3">Tags</th>
                <th className="text-left text-label text-ink-500 font-medium px-5 py-3">Date</th>
                <th className="text-right text-label text-ink-500 font-medium px-5 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-200">
              {files.map((f) => {
                const ft = getFileType(f.mime_type);
                const Icon = typeIcons[ft] || FileText;
                return (
                  <tr key={f.id} className="hover:bg-surface-50 transition-default">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-lg ${typeColors[ft] || 'bg-surface-200 text-ink-400'} flex items-center justify-center shrink-0`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <span className="text-body-sm font-medium text-ink-700 truncate max-w-xs">{f.file_name}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-body-sm text-ink-500 capitalize">{ft}</td>
                    <td className="px-5 py-3 text-body-sm text-ink-500">{formatFileSize(f.file_size)}</td>
                    <td className="px-5 py-3">
                      <div className="flex gap-1">
                        {(f.tags || []).slice(0, 3).map((tg) => (
                          <button key={tg} onClick={() => updateParam('tag', tg)}
                            className="text-body-sm px-1.5 py-0.5 bg-surface-100 rounded text-ink-500 hover:bg-primary-50 hover:text-primary-600 transition-default">
                            {tg}
                          </button>
                        ))}
                      </div>
                    </td>
                    <td className="px-5 py-3 text-body-sm text-ink-400">{formatDate(f.created_at)}</td>
                    <td className="px-5 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => setPreview(f)} className="p-1.5 hover:bg-surface-100 rounded-lg"><Eye className="w-4 h-4 text-ink-400" /></button>
                        <a href={f.url} download className="p-1.5 hover:bg-surface-100 rounded-lg"><Download className="w-4 h-4 text-ink-400" /></a>
                        <button onClick={() => setDeleteTarget(f)} className="p-1.5 hover:bg-danger-50 rounded-lg"><Trash2 className="w-4 h-4 text-ink-400 hover:text-danger-500" /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Card>
      )}

      <Pagination page={page} totalPages={Math.ceil(total / 24) || 1} total={total} limit={24} onPageChange={(p) => updateParam('page', String(p))} />

      {/* Upload Modal */}
      {showUpload && <UploadModal onClose={() => setShowUpload(false)} onUploaded={() => { setShowUpload(false); loadMedia(); }} />}

      {/* Preview Modal */}
      {preview && (
        <Modal open onClose={() => setPreview(null)} title={preview.file_name} size="lg">
          <div className="space-y-4">
            {getFileType(preview.mime_type) === 'image' && preview.url ? (
              <img src={preview.url} alt={preview.file_name} className="w-full rounded-lg max-h-[500px] object-contain bg-surface-50" />
            ) : (
              <div className="h-64 bg-surface-50 rounded-lg flex items-center justify-center">
                <p className="text-body-md text-ink-400">Aperçu non disponible</p>
              </div>
            )}
            <div className="grid grid-cols-2 gap-3 text-body-sm">
              <div><span className="text-ink-400">Taille:</span> <span className="text-ink-700 ml-1">{formatFileSize(preview.file_size)}</span></div>
              <div><span className="text-ink-400">Type:</span> <span className="text-ink-700 ml-1">{preview.mime_type}</span></div>
              <div><span className="text-ink-400">Uploadé le:</span> <span className="text-ink-700 ml-1">{formatDate(preview.created_at)}</span></div>
            </div>
          </div>
        </Modal>
      )}

      {/* Delete Confirm */}
      <ConfirmDialog
        open={!!deleteTarget}
        title="Supprimer le fichier"
        message={`Supprimer "${deleteTarget?.file_name}" ? Cette action est irréversible.`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}

function UploadModal({ onClose, onUploaded }) {
  const [files, setFiles] = useState([]);
  const [tags, setTags] = useState('');
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setDragOver(false);
    const dropped = Array.from(e.dataTransfer.files);
    setFiles((prev) => [...prev, ...dropped]);
  }, []);

  const handleFileSelect = (e) => {
    const selected = Array.from(e.target.files);
    setFiles((prev) => [...prev, ...selected]);
  };

  const removeFile = (idx) => setFiles((prev) => prev.filter((_, i) => i !== idx));

  const handleUpload = async () => {
    if (files.length === 0) return toast.error('Sélectionnez au moins un fichier');
    setUploading(true);
    try {
      for (const file of files) {
        const fd = new FormData();
        fd.append('file', file);
        if (tags) fd.append('tags', tags);
        await mediaAPI.upload(fd);
      }
      toast.success(`${files.length} fichier(s) uploadé(s)`);
      onUploaded();
    } catch (err) {
      toast.error(err.response?.data?.error?.message || 'Erreur lors de l\'upload');
    } finally {
      setUploading(false);
    }
  };

  return (
    <Modal open onClose={onClose} title="Uploader des fichiers" size="lg">
      <div className="space-y-4">
        {/* Drop zone */}
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-xl p-8 text-center transition-all ${dragOver ? 'border-primary-400 bg-primary-50' : 'border-surface-300 bg-surface-50'}`}
        >
          <FolderUp className={`w-10 h-10 mx-auto mb-3 ${dragOver ? 'text-primary-500' : 'text-ink-300'}`} />
          <p className="text-body-md text-ink-500 mb-1">Glissez-déposez vos fichiers ici</p>
          <p className="text-body-sm text-ink-400 mb-3">ou</p>
          <label className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-surface-400 rounded-lg text-body-sm font-medium text-ink-700 cursor-pointer hover:bg-surface-50 transition-default">
            <Upload className="w-4 h-4" /> Parcourir
            <input type="file" multiple onChange={handleFileSelect} className="hidden" />
          </label>
        </div>

        {/* File list */}
        {files.length > 0 && (
          <div className="space-y-1.5">
            {files.map((f, idx) => (
              <div key={idx} className="flex items-center justify-between px-3 py-2 bg-surface-50 rounded-lg">
                <div className="flex items-center gap-2 min-w-0">
                  <FileText className="w-4 h-4 text-ink-400 shrink-0" />
                  <span className="text-body-sm text-ink-700 truncate">{f.name}</span>
                  <span className="text-body-sm text-ink-400 shrink-0">{formatFileSize(f.size)}</span>
                </div>
                <button onClick={() => removeFile(idx)} className="p-1 hover:bg-danger-50 rounded"><X className="w-3.5 h-3.5 text-ink-400" /></button>
              </div>
            ))}
          </div>
        )}

        <Input label="Tags (séparés par des virgules)" value={tags} onChange={(e) => setTags(e.target.value)} placeholder="branding, logo, 2024" />

        <div className="flex justify-end gap-3 pt-2">
          <Button variant="secondary" onClick={onClose}>Annuler</Button>
          <Button onClick={handleUpload} loading={uploading} icon={Upload}>Uploader ({files.length})</Button>
        </div>
      </div>
    </Modal>
  );
}
