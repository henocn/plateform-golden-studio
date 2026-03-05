import {
  FileText, Download, Save, CheckCircle2, XCircle,
  RefreshCw, Hourglass, Paperclip, Clock, User,
  FolderOpen, FolderPlus, ChevronRight,
} from "lucide-react";
import { Card, Badge, Avatar, Button, Textarea, Modal } from "../../components/ui";
import { tasksAPI, proposalsAPI, foldersAPI } from "../../api/services";
import { useEffect, useState, useCallback } from "react";
import toast from "react-hot-toast";
import { formatDate, formatDateTime, PROPOSAL_STATUS, formatErrorMessage } from "../../utils/helpers";
import { usePermissions } from "../../hooks";
import CreateFolderModal from "../media/CreateFolderModal";

/* ─── Helpers ────────────────────────────────────────────────────────────── */

function StatusIcon({ status, className = "w-4 h-4" }) {
  const cfg = PROPOSAL_STATUS[status];
  if (!cfg) return null;
  const Icon = cfg.icon;
  return <Icon className={className} />;
}

/* ─── Bloc d'actions de validation (approuver / révision / rejeter) ──────── */
function ValidationActions({ proposal, onRefresh }) {
  const [decision, setDecision] = useState("");
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!decision) return toast.error("Veuillez choisir une décision");
    setSubmitting(true);
    try {
      const projectId = proposal.project_id || proposal.project?.id;
      await proposalsAPI.validate(projectId, proposal.id, {
        status: decision,
        comments: comment,
      });
      toast.success("Décision enregistrée");
      onRefresh();
    } catch (err) {
      const details = formatErrorMessage(err);
      details.forEach((d) => toast.error(d.message));
    } finally {
      setSubmitting(false);
    }
  };

  const btnBase = "flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-body-sm font-medium border transition-default";
  const choices = [
    {
      value: "approved",
      label: "Approuver",
      icon: CheckCircle2,
      active: "bg-green-300 border-green-800 text-gray-800",
      idle:   "border-gray-600 bg-gray-50 text-gray-600",
    },
    {
      value: "needs_revision",
      label: "Demander révision",
      icon: RefreshCw,
      active: "bg-yellow-300 border-yellow-800 text-gray-800",
      idle:   "border-gray-600 bg-gray-50 text-gray-600",
    },
    {
      value: "rejected",
      label: "Rejeter",
      icon: XCircle,
      active: "bg-red-300 border-red-800 text-gray-800",
      idle:   "border-gray-600 bg-gray-50 text-gray-600",
    },
  ];

  return (
    <div className="mt-4 rounded-xl border border-primary-200 bg-primary-50/40 p-4 space-y-3">
      <p className="text-xs font-semibold text-ink-500 uppercase tracking-wide">Décision</p>
      <div className="flex gap-2">
        {choices.map(({ value, label, icon: Icon, active, idle }) => (
          <button
            key={value}
            onClick={() => setDecision((d) => d === value ? "" : value)}
            className={`${btnBase} ${decision === value ? active : idle}`}
          >
            <Icon className="w-3.5 h-3.5" />
            {label}
          </button>
        ))}
      </div>
      <Textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder="Commentaire optionnel…"
        rows={2}
      />
      <div className="flex justify-end">
        <Button
          onClick={handleSubmit}
          loading={submitting}
          disabled={!decision}
          size="sm"
        >
          Confirmer
        </Button>
      </div>
    </div>
  );
}

/* Statuts pour lesquels la décision (approuver / révision / rejeter) est encore possible */
const AWAITING_DECISION_STATUSES = ["pending_client_validation", "submitted", "draft"];

/* ─── Téléchargement (un fichier ou ZIP) avec nom depuis Content-Disposition ─ */
async function downloadProposalFile(projectId, proposalId) {
  const res = await proposalsAPI.download(projectId, proposalId);
  const blob = res.data;
  const cd = res.headers?.["content-disposition"];
  const name = (cd && (cd.match(/filename\*?=(?:UTF-8'')?"?([^";\n]+)"?/)?.[1] || cd.match(/filename="?([^"]+)"?/)?.[1])) || "fichier";
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = decodeURIComponent(name.trim());
  a.click();
  URL.revokeObjectURL(url);
}

function FileDownloadButton({ projectId, proposalId }) {
  const [loading, setLoading] = useState(false);
  const handleClick = async () => {
    setLoading(true);
    try {
      await downloadProposalFile(projectId, proposalId);
    } catch {
      toast.error("Erreur lors du téléchargement");
    } finally {
      setLoading(false);
    }
  };
  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={loading}
      className="inline-flex items-center gap-1.5 text-body-sm font-medium text-primary-600 hover:text-primary-700 hover:underline shrink-0 disabled:opacity-50"
    >
      <Download className="w-4 h-4" />
      Télécharger
    </button>
  );
}

/* ─── Modale Sauvegarder dans la médiathèque (explorateur de dossiers) ────── */
function SaveToMediaModal({ proposal, onClose, onSaved }) {
  const { canCreateFolder } = usePermissions();
  const projectId = proposal.project_id || proposal.project?.id;

  const [breadcrumb, setBreadcrumb] = useState([]);
  const [subfolders, setSubfolders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showCreateFolder, setShowCreateFolder] = useState(false);

  const currentFolderId = breadcrumb.length > 0 ? breadcrumb[breadcrumb.length - 1]?.id ?? null : null;
  const isAtRoot = breadcrumb.length <= 1;
  const selectedFolderId = currentFolderId;

  const loadContent = useCallback(async () => {
    setLoading(true);
    try {
      if (!currentFolderId) {
        const rootsRes = await foldersAPI.getRootFolders();
        const rootsData = rootsRes?.data?.data ?? rootsRes?.data;
        const roots = Array.isArray(rootsData) ? rootsData : [];
        setSubfolders(roots);
      } else {
        const res = await foldersAPI.explore(currentFolderId);
        const data = res?.data?.data ?? res?.data;
        const result = data && typeof data === 'object' ? data : {};
        setSubfolders(Array.isArray(result?.subfolders) ? result.subfolders : []);
      }
    } catch (err) {
      toast.error("Impossible de charger les dossiers");
      setSubfolders([]);
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

  const handleFolderCreated = () => {
    setShowCreateFolder(false);
    loadContent();
  };

  const handleSaveHere = async () => {
    if (!selectedFolderId || !projectId) {
      toast.error("Ouvrez un dossier ou créez-en un pour enregistrer les fichiers.");
      return;
    }
    setSaving(true);
    try {
      await proposalsAPI.saveToMedia(projectId, proposal.id, { folder_id: selectedFolderId });
      toast.success("Fichier(s) enregistré(s) dans la médiathèque");
      onSaved();
    } catch (err) {
      formatErrorMessage(err).forEach((m) => toast.error(m.message));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open onClose={onClose} title="Sauvegarder dans la médiathèque" size="lg">
      <div className="space-y-4">
        <p className="text-body-sm text-ink-500">
          Parcourez les dossiers, créez-en un si besoin, puis cliquez sur « Sauvegarder dans ce dossier ».
        </p>

        {/* Fil d'Ariane */}
        <div className="flex items-center gap-2 flex-wrap rounded-lg bg-surface-50 border border-surface-200 px-3 py-2">
          {breadcrumb.map((item, i) => (
            <span key={i} className="flex items-center gap-2">
              {i > 0 && <ChevronRight className="w-4 h-4 text-ink-300 shrink-0" />}
              <button
                type="button"
                onClick={() => goToBreadcrumb(i)}
                className={`text-body-sm font-medium transition-default ${
                  i === breadcrumb.length - 1 ? "text-primary-600" : "text-ink-600 hover:text-primary-600"
                }`}
              >
                {item.name}
              </button>
            </span>
          ))}
        </div>

        {/* Actions + liste de dossiers */}
        <div className="flex items-center justify-between gap-3 border-b border-surface-200 pb-3">
          {canCreateFolder && (
            <Button
              type="button"
              variant="secondary"
              size="sm"
              icon={FolderPlus}
              onClick={() => setShowCreateFolder(true)}
            >
              Nouveau dossier
            </Button>
          )}
        </div>

        <div className="min-h-[200px] max-h-[320px] overflow-y-auto rounded-xl border border-surface-200 bg-surface-50/50 p-3 space-y-2">
          {loading ? (
            <p className="text-body-sm text-ink-400 py-4">Chargement…</p>
          ) : subfolders.length === 0 ? (
            <p className="text-body-sm text-ink-500 py-4">
              {isAtRoot
                ? (canCreateFolder ? "Aucun dossier à la racine. Créez un dossier pour enregistrer les fichiers." : "Aucun dossier à la racine. Contactez un administrateur pour créer un dossier.")
                : "Aucun sous-dossier. Vous pouvez sauvegarder ici ou créer un sous-dossier."}
            </p>
          ) : (
            subfolders.map((folder) => (
              <button
                key={folder.id}
                type="button"
                onClick={() => openFolder(folder)}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-lg border border-surface-200 bg-white hover:bg-primary-50 hover:border-primary-200 transition-default text-left"
              >
                <div className="w-10 h-10 rounded-lg bg-primary-100 text-primary-600 flex items-center justify-center shrink-0">
                  <FolderOpen className="w-5 h-5" />
                </div>
                <span className="text-body-md font-medium text-ink-700 flex-1 truncate">{folder.name}</span>
                <ChevronRight className="w-4 h-4 text-ink-400 shrink-0" />
              </button>
            ))
          )}
        </div>

        <div className="flex items-center justify-between gap-3 pt-3 border-t border-surface-200">
          <p className="text-body-sm text-ink-500">
            {selectedFolderId
              ? "Fichiers enregistrés dans le dossier affiché."
              : "Ouvrez un dossier ou créez-en un pour choisir la destination."}
          </p>
          <div className="flex gap-2 shrink-0">
            <Button variant="secondary" onClick={onClose}>Annuler</Button>
            <Button
              onClick={handleSaveHere}
              loading={saving}
              disabled={!selectedFolderId}
              icon={Save}
            >
              Sauvegarder dans ce dossier
            </Button>
          </div>
        </div>
      </div>

      {showCreateFolder && (
        <CreateFolderModal
          isRoot={isAtRoot}
          parentId={currentFolderId}
          parentName={breadcrumb[breadcrumb.length - 1]?.name}
          onClose={() => setShowCreateFolder(false)}
          onCreated={handleFolderCreated}
        />
      )}
    </Modal>
  );
}

/* ─── Carte "dernière version" ───────────────────────────────────────────── */
export function LatestProposalCard({ proposal, canValidate, onRefresh }) {
  const [downloading, setDownloading] = useState(false);
  const status = PROPOSAL_STATUS[proposal.status] ?? { label: proposal.status, color: "neutral" };
  const isApproved = proposal.status === "approved";
  const canDecide =
    canValidate && AWAITING_DECISION_STATUSES.includes(proposal.status);

  const hasFile = Boolean(proposal.file_path) || (proposal.attachments && proposal.attachments.length > 0);
  const projectId = proposal.project_id || proposal.project?.id;
  const handleDownload = async () => {
    if (!hasFile || !projectId) return;
    setDownloading(true);
    try {
      await downloadProposalFile(projectId, proposal.id);
    } catch {
      toast.error("Erreur lors du téléchargement");
    } finally {
      setDownloading(false);
    }
  };
  const [showSaveToMedia, setShowSaveToMedia] = useState(false);

  const comments = proposal.comments || [];
  const validations = proposal.validations || [];

  return (
    <div className="rounded-2xl border-2 border-primary-300 bg-gradient-to-br from-primary-50/60 via-white to-surface-50 overflow-hidden shadow-card">
      {/* Header coloré */}
      <div className="px-5 py-3 border-b border-primary-200 flex items-center justify-between bg-primary-50/50">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-primary-400 animate-pulse" />
          <span className="text-xs font-semibold text-primary-500 uppercase tracking-widest">
            Dernière version · V{proposal.version_number}
          </span>
        </div>
        <Badge color={status.color} dot size="sm">
          <StatusIcon status={proposal.status} className="w-3 h-3 mr-1 inline" />
          {status.label}
        </Badge>
      </div>

      <div className="p-5 space-y-4">
        {/* Titre + description */}
        <div>
          <h3 className="text-body-lg font-semibold text-ink-900">{proposal.title}</h3>
          {proposal.description && (
            <p className="mt-1 text-body-sm text-ink-500 leading-relaxed">{proposal.description}</p>
          )}
        </div>

        {/* Meta */}
        <div className="flex flex-wrap gap-x-5 gap-y-2 text-xs text-ink-400">
          {proposal.author && (
            <span className="flex items-center gap-1.5">
              <Avatar
                firstName={proposal.author.first_name}
                lastName={proposal.author.last_name}
                src={proposal.author.avatar_url}
                size="xs"
              />
              <span>{proposal.author.first_name} {proposal.author.last_name}</span>
              {proposal.author.email && <span className="text-ink-300">· {proposal.author.email}</span>}
            </span>
          )}
          {proposal.submitted_at && (
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {formatDate(proposal.submitted_at)}
            </span>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center p-2 gap-2 pt-1">
          {hasFile && (
            <Button
              size="sm"
              variant="outline"
              icon={Download}
              loading={downloading}
              disabled={!projectId}
              onClick={handleDownload}
              className="border-1 border-gray-600 rounded-lg hover:bg-green-200"
            >
              Télécharger
            </Button>
          )}
          {hasFile && (
            <Button size="sm" variant="outline" icon={Save} onClick={() => setShowSaveToMedia(true)} className="border-1 border-gray-600 rounded-lg hover:bg-yellow-200">
              Sauvegarder
            </Button>
          )}
        </div>
        {showSaveToMedia && (
          <SaveToMediaModal
            proposal={proposal}
            onClose={() => setShowSaveToMedia(false)}
            onSaved={() => { setShowSaveToMedia(false); onRefresh(); }}
          />
        )}

        {/* Commentaires de la proposition */}
        {comments.length > 0 && (
          <div className="border-t border-surface-200 pt-4">
            <p className="text-label font-semibold text-ink-700 mb-2">Commentaires</p>
            <div className="space-y-2">
              {comments.map((c) => (
                <div
                  key={c.id}
                  className="rounded-lg border border-surface-200 bg-surface-50 px-3 py-2 text-body-sm"
                >
                  <span className="font-medium text-ink-800">
                    {c.author?.first_name} {c.author?.last_name}
                  </span>
                  {c.is_internal && (
                    <span className="ml-2 text-label text-warning-600 bg-warning-50 px-1.5 py-0.5 rounded">Interne</span>
                  )}
                  <p className="text-ink-600 mt-0.5 whitespace-pre-line">{c.content}</p>
                  <p className="text-body-sm text-ink-400 mt-1">{formatDateTime(c.createdAt)}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Décisions de validation (historique) */}
        {validations.length > 0 && (
          <div className="border-t border-surface-200 pt-4">
            <p className="text-label font-semibold text-ink-700 mb-2">Décisions</p>
            <div className="space-y-2">
              {validations.map((v) => (
                <div
                  key={v.id}
                  className={`rounded-lg border px-3 py-2 text-body-sm ${
                    v.status === "approved"
                      ? "border-success-300 bg-success-50"
                      : v.status === "rejected"
                        ? "border-danger-300 bg-danger-50"
                        : "border-warning-300 bg-warning-50"
                  }`}
                >
                  <span className="font-medium text-ink-800">
                    {v.validator?.first_name} {v.validator?.last_name}
                  </span>
                  <Badge
                    color={v.status === "approved" ? "success" : v.status === "rejected" ? "danger" : "warning"}
                    size="xs"
                    className="ml-2"
                  >
                    {v.status === "approved" ? "Validé" : v.status === "rejected" ? "Refusé" : "À modifier"}
                  </Badge>
                  {v.comments && <p className="text-ink-600 mt-1 whitespace-pre-line">{v.comments}</p>}
                  <p className="text-body-sm text-ink-400 mt-1">{formatDateTime(v.validated_at || v.createdAt)}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Bloc validation : affiché uniquement si la version est en attente de décision */}
        {canDecide && (
          <ValidationActions proposal={proposal} onRefresh={onRefresh} />
        )}
      </div>
    </div>
  );
}

/* ─── Entrée de la timeline (versions précédentes) ───────────────────────── */
export function TimelineEntry({ proposal, isLast }) {
  const status = PROPOSAL_STATUS[proposal.status] ?? { label: proposal.status, color: "neutral" };

  const dotStyles = {
    approved:              "border-success-400 bg-success-50 text-success-600",
    rejected:              "border-danger-400 bg-danger-50 text-danger-600",
    needs_revision:        "border-warning-400 bg-warning-50 text-warning-600",
    pending_client_validation: "border-warning-400 bg-warning-50 text-warning-600",
    submitted:             "border-primary-400 bg-primary-50 text-primary-600",
    draft:                 "border-surface-400 bg-surface-100 text-ink-500",
  };

  const comments = proposal.comments || [];
  const validations = proposal.validations || [];

  return (
    <div className="flex gap-4 rounded-xl border-2 border-surface-300 bg-white p-4 shadow-card">
      {/* Ligne verticale + point */}
      <div className="flex flex-col items-center shrink-0 pt-0.5">
        <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center shrink-0 ${dotStyles[proposal.status] ?? dotStyles.draft}`}>
          <StatusIcon status={proposal.status} className="w-4 h-4" />
        </div>
        {!isLast && <div className="w-px flex-1 bg-surface-300 my-1 min-h-[24px]" />}
      </div>

      {/* Contenu */}
      <div className={`flex-1 min-w-0 ${!isLast ? "pb-4" : ""}`}>
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-label font-bold text-ink-500 uppercase tracking-wide">
                V{proposal.version_number}
              </span>
              <span className="text-body-md font-medium text-ink-800">{proposal.title}</span>
              <Badge color={status.color} size="sm">{status.label}</Badge>
            </div>
            {proposal.description && (
              <p className="text-body-sm text-ink-500 line-clamp-2">{proposal.description}</p>
            )}
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-body-sm text-ink-500 pt-1">
              {proposal.author && (
                <span className="flex items-center gap-1">
                  <User className="w-3.5 h-3.5" />
                  {proposal.author.first_name} {proposal.author.last_name}
                </span>
              )}
              {proposal.submitted_at && (
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  {formatDate(proposal.submitted_at)}
                </span>
              )}
            </div>
          </div>

          {(proposal.file_path || (proposal.attachments && proposal.attachments.length > 0)) && (proposal.project_id || proposal.project?.id) && (
            <FileDownloadButton
              projectId={proposal.project_id || proposal.project?.id}
              proposalId={proposal.id}
            />
          )}
        </div>

        {/* Commentaires sous cette version */}
        {comments.length > 0 && (
          <div className="mt-4 pt-4 border-t border-surface-200">
            <p className="text-label font-semibold text-ink-700 mb-2">Commentaires</p>
            <div className="space-y-2">
              {comments.map((c) => (
                <div key={c.id} className="rounded-lg border border-surface-200 bg-surface-50 px-3 py-2 text-body-sm">
                  <span className="font-medium text-ink-800">{c.author?.first_name} {c.author?.last_name}</span>
                  {c.is_internal && <span className="ml-2 text-label text-warning-600 bg-warning-50 px-1.5 py-0.5 rounded">Interne</span>}
                  <p className="text-ink-600 mt-0.5 whitespace-pre-line">{c.content}</p>
                  <p className="text-body-sm text-ink-400 mt-1">{formatDateTime(c.createdAt)}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Décisions sous cette version */}
        {validations.length > 0 && (
          <div className="mt-3">
            <p className="text-label font-semibold text-ink-700 mb-2">Décisions</p>
            <div className="space-y-2">
              {validations.map((v) => (
                <div
                  key={v.id}
                  className={`rounded-lg border px-3 py-2 text-body-sm ${
                    v.status === "approved" ? "border-success-300 bg-success-50" : v.status === "rejected" ? "border-danger-300 bg-danger-50" : "border-warning-300 bg-warning-50"
                  }`}
                >
                  <span className="font-medium text-ink-800">{v.validator?.first_name} {v.validator?.last_name}</span>
                  <Badge color={v.status === "approved" ? "success" : v.status === "rejected" ? "danger" : "warning"} size="xs" className="ml-2">
                    {v.status === "approved" ? "Validé" : v.status === "rejected" ? "Refusé" : "À modifier"}
                  </Badge>
                  {v.comments && <p className="text-ink-600 mt-1 whitespace-pre-line">{v.comments}</p>}
                  <p className="text-body-sm text-ink-400 mt-1">{formatDateTime(v.validated_at || v.createdAt)}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Composant principal ────────────────────────────────────────────────── */
export default function ProposalsTab({ taskId, onProposalsLoaded }) {
  const [proposals, setProposals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showHistory, setShowHistory] = useState(false);
  const { canValidateProposal } = usePermissions();

  const fetchProposals = async () => {
    setLoading(true);
    try {
      const response = await tasksAPI.getProposals(taskId);
      const list = Array.isArray(response.data.data) ? response.data.data : [];
      setProposals(list);
      if (typeof onProposalsLoaded === "function") onProposalsLoaded(list.length);
    } catch {
      toast.error("Erreur lors du chargement des propositions");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProposals();
  }, [taskId]);

  const latest   = proposals[0] ?? null;
  const previous = proposals.slice(1);

  /* Loading */
  if (loading) {
    return (
      <div className="space-y-3">
        <div className="h-40 rounded-2xl bg-surface-100 animate-pulse" />
        <div className="h-16 rounded-2xl bg-surface-100 animate-pulse" />
      </div>
    );
  }

  /* Empty */
  if (proposals.length === 0) {
    return (
      <Card className="p-6">
        <div className="flex flex-col items-center justify-center py-20 text-center gap-3">
          <div className="w-14 h-14 rounded-2xl bg-surface-100 flex items-center justify-center">
            <FileText className="w-7 h-7 text-ink-300" />
          </div>
          <p className="text-body-md font-medium text-ink-500">Aucune proposition pour l'instant</p>
          <p className="text-body-sm text-ink-400">Les propositions liées à cette tâche apparaîtront ici.</p>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Une seule carte : dernière version */}
      {latest && (
        <LatestProposalCard
          proposal={latest}
          canValidate={canValidateProposal}
          onRefresh={fetchProposals}
        />
      )}

      {/* Bouton pour afficher l'historique des versions */}
      {previous.length > 0 && (
        <div className="flex justify-center">
          <button
            type="button"
            onClick={() => setShowHistory((v) => !v)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-surface-300 text-body-sm font-medium text-ink-600 hover:bg-surface-100 transition-default"
          >
            <Paperclip className="w-4 h-4 text-ink-400" />
            {showHistory ? "Masquer l'historique" : "Voir l'historique des versions"}
            <span className="bg-surface-200 text-ink-600 px-2 py-0.5 rounded-full text-xs">
              {previous.length}
            </span>
          </button>
        </div>
      )}

      {/* Historique (fil des versions) — visible au clic */}
      {showHistory && previous.length > 0 && (
        <Card className="p-5">
          <p className="text-xs font-semibold text-ink-400 uppercase tracking-wider mb-5">
            Historique des versions
          </p>
          <div className="space-y-4">
            {previous.map((p, idx) => (
              <TimelineEntry
                key={p.id}
                proposal={p}
                isLast={idx === previous.length - 1}
              />
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}