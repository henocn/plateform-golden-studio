import {
  FileText, Download, Save, CheckCircle2, XCircle,
  RefreshCw, Hourglass, Paperclip, Clock, User,
} from "lucide-react";
import { Card, Badge, Avatar, Button, Textarea } from "../../components/ui";
import { tasksAPI, proposalsAPI } from "../../api/services";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { formatDate, formatDateTime, PROPOSAL_STATUS, formatErrorMessage } from "../../utils/helpers";
import { usePermissions } from "../../hooks";

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
      active: "bg-success-50 border-success-400 text-success-700",
      idle:   "border-surface-300 text-ink-500 hover:bg-success-50 hover:border-success-300 hover:text-success-600",
    },
    {
      value: "needs_revision",
      label: "Demander révision",
      icon: RefreshCw,
      active: "bg-amber-50 border-amber-400 text-amber-700",
      idle:   "border-surface-300 text-ink-500 hover:bg-amber-50 hover:border-amber-300 hover:text-amber-600",
    },
    {
      value: "rejected",
      label: "Rejeter",
      icon: XCircle,
      active: "bg-danger-50 border-danger-400 text-danger-700",
      idle:   "border-surface-300 text-ink-500 hover:bg-danger-50 hover:border-danger-300 hover:text-danger-600",
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

/* ─── Carte "dernière version" ───────────────────────────────────────────── */
function LatestProposalCard({ proposal, canValidate, onRefresh }) {
  const status = PROPOSAL_STATUS[proposal.status] ?? { label: proposal.status, color: "neutral" };
  const isApproved = proposal.status === "approved";
  const canDecide = canValidate && !isApproved;

  const handleSave = () => {
    if (proposal.file_path) {
      window.open(proposal.file_path, "_blank");
    }
  };

  return (
    <div className="rounded-2xl border-2 border-primary-200 bg-gradient-to-br from-primary-50/60 via-white to-surface-50 overflow-hidden shadow-sm">
      {/* Header coloré */}
      <div className="px-5 py-3 border-b border-primary-100 flex items-center justify-between">
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
        <div className="flex items-center gap-2 pt-1">
          {proposal.file_path && (
            <a
              href={proposal.file_path}
              download
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-surface-300 text-body-sm text-ink-600 hover:bg-surface-100 transition-default"
            >
              <Download className="w-3.5 h-3.5" />
              Télécharger
            </a>
          )}
          {isApproved && proposal.file_path && (
            <Button size="sm" icon={Save} onClick={handleSave}>
              Sauvegarder
            </Button>
          )}
        </div>

        {/* Bloc validation */}
        {canDecide && (
          <ValidationActions proposal={proposal} onRefresh={onRefresh} />
        )}
      </div>
    </div>
  );
}

/* ─── Entrée de la timeline (versions précédentes) ───────────────────────── */
function TimelineEntry({ proposal, isLast }) {
  const status = PROPOSAL_STATUS[proposal.status] ?? { label: proposal.status, color: "neutral" };

  const dotStyles = {
    approved:              "border-success-400 bg-success-50 text-success-500",
    rejected:              "border-danger-300 bg-danger-50 text-danger-400",
    needs_revision:        "border-amber-300 bg-amber-50 text-amber-500",
    pending_client_validation: "border-warning-300 bg-warning-50 text-warning-500",
    submitted:             "border-info-300 bg-info-50 text-info-500",
    draft:                 "border-surface-300 bg-surface-100 text-ink-300",
  };

  return (
    <div className="flex gap-4">
      {/* Ligne verticale + point */}
      <div className="flex flex-col items-center shrink-0 pt-0.5">
        <div className={`w-7 h-7 rounded-full border-2 flex items-center justify-center shrink-0 ${dotStyles[proposal.status] ?? dotStyles.draft}`}>
          <StatusIcon status={proposal.status} className="w-3.5 h-3.5" />
        </div>
        {!isLast && <div className="w-px flex-1 bg-surface-200 my-1 min-h-[20px]" />}
      </div>

      {/* Contenu */}
      <div className={`flex-1 ${!isLast ? "pb-5" : ""}`}>
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[11px] font-bold text-ink-300 uppercase tracking-widest">
                V{proposal.version_number}
              </span>
              <span className="text-body-sm font-medium text-ink-700">{proposal.title}</span>
              <Badge color={status.color} size="sm">{status.label}</Badge>
            </div>
            {proposal.description && (
              <p className="text-xs text-ink-400 line-clamp-2">{proposal.description}</p>
            )}
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-ink-400 pt-1">
              {proposal.author && (
                <span className="flex items-center gap-1">
                  <User className="w-3 h-3" />
                  {proposal.author.first_name} {proposal.author.last_name}
                </span>
              )}
              {proposal.submitted_at && (
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {formatDate(proposal.submitted_at)}
                </span>
              )}
            </div>
          </div>

          {/* Télécharger si fichier */}
          {proposal.file_path && (
            <a
              href={proposal.file_path}
              download
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-xs text-ink-400 hover:text-primary-500 hover:underline shrink-0"
            >
              <Download className="w-3 h-3" />
              Fichier
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── Composant principal ────────────────────────────────────────────────── */
export default function ProposalsTab({ taskId }) {
  const [proposals, setProposals] = useState([]);
  const [loading, setLoading] = useState(true);
  const { canValidateProposal } = usePermissions();

  const fetchProposals = async () => {
    setLoading(true);
    try {
      const response = await tasksAPI.getProposals(taskId);
      // L'ordre vient du backend : première entrée = dernière version
      setProposals(Array.isArray(response.data.data) ? response.data.data : []);
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
      {/* Compteur */}
      <p className="text-body-sm text-ink-400 px-1">
        <span className="font-semibold text-ink-700">{proposals.length}</span>{" "}
        proposition{proposals.length > 1 ? "s" : ""}
      </p>

      {/* Dernière version — hero */}
      {latest && (
        <LatestProposalCard
          proposal={latest}
          canValidate={canValidateProposal}
          onRefresh={fetchProposals}
        />
      )}

      {/* Timeline versions précédentes */}
      {previous.length > 0 && (
        <Card className="p-5">
          <p className="text-xs font-semibold text-ink-400 uppercase tracking-wider mb-5">
            Historique des versions
          </p>
          {previous.map((p, idx) => (
            <TimelineEntry
              key={p.id}
              proposal={p}
              isLast={idx === previous.length - 1}
            />
          ))}
        </Card>
      )}
    </div>
  );
}