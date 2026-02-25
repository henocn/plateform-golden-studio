import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Send, ChevronDown, ChevronRight } from "lucide-react";
import {
  Card,
  Button,
  Badge,
  Modal,
  Select,
  Textarea,
  Pagination,
  EmptyState,
  Skeleton,
  Autocomplete,
} from "../../components/ui";
import { proposalsAPI, projectsAPI, tasksAPI } from "../../api/services";
import {
  formatDate,
  formatRelative,
  PROPOSAL_STATUS,
  extractList,
  formatErrorMessage,
} from "../../utils/helpers";
import { usePermissions } from "../../hooks";
import toast from "react-hot-toast";
import { TimelineEntry, LatestProposalCard } from "../tasks/ProposalsTab";

export default function ProposalsPage() {
  const { canValidateProposal } = usePermissions();
  const [searchParams, setSearchParams] = useSearchParams();
  const [proposals, setProposals] = useState([]);
  const [projects, setProjects] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [detail, setDetail] = useState(null);
  /** Clé de la tâche dont l'historique est déplié (task_id ou "no-task-{proposalId}") */
  const [expandedTaskKey, setExpandedTaskKey] = useState(null);
  /** Historique complet des propositions par task_id (après fetch au clic) */
  const [historyByTaskId, setHistoryByTaskId] = useState({});
  const [loadingHistory, setLoadingHistory] = useState(false);

  const page = parseInt(searchParams.get("page") || "1");
  const statusFilter = searchParams.get("status") || "";
  const projectId = searchParams.get("project") || "";

  useEffect(() => {
    loadProjects();
  }, []);
  useEffect(() => {
    if (projects.length > 0) loadProposals();
  }, [page, statusFilter, projectId, projects]);

  const loadProposals = async () => {
    setLoading(true);
    try {
      let allProposals = [];
      if (projectId) {
        // Single project selected
        const { data } = await proposalsAPI.list(projectId);
        allProposals = Array.isArray(data.data)
          ? data.data
          : extractList(data.data).items;
      } else {
        // All projects — fetch proposals for each
        const results = await Promise.allSettled(
          projects.map((p) => proposalsAPI.list(p.id)),
        );
        for (const r of results) {
          if (r.status === "fulfilled") {
            const items = Array.isArray(r.value.data.data)
              ? r.value.data.data
              : extractList(r.value.data.data).items;
            allProposals.push(...items);
          }
        }
      }

      // Client-side status filter
      if (statusFilter) {
        allProposals = allProposals.filter((p) => p.status === statusFilter);
      }
      // Grouper par tâche : une entrée par task_id (ou par proposition si pas de tâche)
      const byTask = {};
      allProposals.forEach((p) => {
        const key = p.task_id || `no-task-${p.id}`;
        if (!byTask[key]) byTask[key] = [];
        byTask[key].push(p);
      });
      Object.keys(byTask).forEach((key) => {
        byTask[key].sort(
          (a, b) => (b.version_number || 0) - (a.version_number || 0),
        );
      });
      const groupCount = Object.keys(byTask).length;
      setTotal(groupCount);
      setProposals(allProposals);
    } catch {
      toast.error("Erreur lors du chargement");
    } finally {
      setLoading(false);
    }
  };

  const loadProjects = async () => {
    try {
      const { data } = await projectsAPI.list({ page: 1, limit: 100 });
      setProjects(extractList(data.data).items);
    } catch {}
  };

  const updateParam = (key, value) => {
    const p = new URLSearchParams(searchParams);
    if (value) p.set(key, value);
    else p.delete(key);
    if (key !== "page") p.set("page", "1");
    setSearchParams(p);
  };

  // Une ligne par tâche : groupe de propositions (dernière = représentative)
  const rows = (() => {
    const byTask = {};
    proposals.forEach((p) => {
      const key = p.task_id || `no-task-${p.id}`;
      if (!byTask[key]) byTask[key] = [];
      byTask[key].push(p);
    });
    return Object.entries(byTask)
      .map(([taskKey, list]) => {
        list.sort((a, b) => (b.version_number || 0) - (a.version_number || 0));
        const latest = list[0];
        const taskTitle =
          latest.task?.title || latest.title || "Sans tâche";
        return {
          taskKey,
          taskId: latest.task_id || null,
          taskTitle,
          latestProposal: latest,
          proposalCount: list.length,
        };
      })
      .sort(
        (a, b) =>
          new Date(b.latestProposal.created_at) -
          new Date(a.latestProposal.created_at),
      );
  })();
  const start = (page - 1) * 20;
  const paginatedRows = rows.slice(start, start + 20);

  const loadHistoryForTask = async (taskId, force = false) => {
    if (!force && historyByTaskId[taskId]) return;
    setLoadingHistory(true);
    try {
      const res = await tasksAPI.getProposals(taskId);
      const list = Array.isArray(res.data.data) ? res.data.data : [];
      setHistoryByTaskId((prev) => ({ ...prev, [taskId]: list }));
    } catch {
      toast.error("Erreur lors du chargement de l'historique");
    } finally {
      setLoadingHistory(false);
    }
  };

  const toggleExpand = (row) => {
    const key = row.taskKey;
    if (expandedTaskKey === key) {
      setExpandedTaskKey(null);
      return;
    }
    setExpandedTaskKey(key);
    if (row.taskId) loadHistoryForTask(row.taskId);
  };

  // Workflow steps
  const workflowSteps = [
    "draft",
    "submitted",
    "pending_validation",
    "approved",
    "rejected",
  ];

  const getStepIndex = (status) => workflowSteps.indexOf(status);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-display-lg">Propositions</h1>
        <p className="text-body-md text-ink-400 mt-1">
          {total} tâche{total !== 1 ? "s" : ""} avec proposition
          {total !== 1 ? "s" : ""}
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <Autocomplete
          label={null}
          value={projectId}
          onChange={(v) => updateParam("project", v)}
          options={[
            { value: "", label: "Tous les projets" },
            ...projects.map((p) => ({ value: p.id, label: p.title })),
          ]}
          placeholder="Projet..."
          className="w-52"
        />
        <Select
          value={statusFilter}
          onChange={(e) => updateParam("status", e.target.value)}
          className="w-44"
          options={Object.entries(PROPOSAL_STATUS).map(([k, v]) => ({
            value: k,
            label: v.label,
          }))}
          placeholder="Tout status"
        />
      </div>

      {/* List */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))}
        </div>
      ) : proposals.length === 0 ? (
        <EmptyState
          icon={Send}
          title="Aucune proposition"
          description="Aucune proposition ne correspond aux filtres"
        />
      ) : (
        <div className="space-y-3">
          {paginatedRows.map((row) => {
            const p = row.latestProposal;
            const st = PROPOSAL_STATUS[p.status] || {
              label: p.status,
              color: "neutral",
            };
            const currentStep = getStepIndex(p.status);
            const isExpanded = expandedTaskKey === row.taskKey;
            const hasTask = Boolean(row.taskId);

            return (
              <div key={row.taskKey}>
                <Card
                  className="hover:shadow-card-hover transition-shadow cursor-pointer"
                  onClick={() =>
                    hasTask ? toggleExpand(row) : setDetail(p)
                  }
                >
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center shrink-0 mt-0.5">
                      <Send className="w-5 h-5 text-primary-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          {hasTask ? (
                            <span className="flex items-center gap-1.5">
                              {isExpanded ? (
                                <ChevronDown className="w-4 h-4 text-ink-400" />
                              ) : (
                                <ChevronRight className="w-4 h-4 text-ink-400" />
                              )}
                              <h3 className="text-body-lg font-medium text-ink-900">
                                Proposition pour la tâche : {row.taskTitle}
                              </h3>
                            </span>
                          ) : (
                            <h3 className="text-body-lg font-medium text-ink-900">
                              {p.title}
                            </h3>
                          )}
                          <Badge color="neutral" size="xs">
                            v{p.version_number}
                          </Badge>
                        </div>
                        <Badge color={st.color} dot>
                          {st.label}
                        </Badge>
                      </div>
                      <p className="text-body-sm text-ink-400 line-clamp-1 mb-2.5">
                        {p.description || "Pas de description"}
                      </p>

                      <div className="flex items-center gap-1">
                        {workflowSteps.slice(0, -1).map((step, idx) => {
                          const isActive = idx <= currentStep;
                          const isRejected =
                            p.status === "rejected" && idx === currentStep;
                          return (
                            <div
                              key={step}
                              className="flex items-center gap-1 flex-1"
                            >
                              <div
                                className={`h-1.5 rounded-full flex-1 ${isRejected ? "bg-danger-400" : isActive ? "bg-primary-400" : "bg-surface-200"}`}
                              />
                            </div>
                          );
                        })}
                      </div>

                      <div className="flex items-center gap-4 mt-2 text-body-sm text-ink-400">
                        <span>Projet: {p.project?.title || "—"}</span>
                        <span>
                          Par {p.author?.first_name || "—"}{" "}
                          {p.author?.last_name || ""}
                        </span>
                        <span>{formatRelative(p.created_at)}</span>
                        {hasTask && row.proposalCount > 1 && (
                          <span>
                            {row.proposalCount} version
                            {row.proposalCount > 1 ? "s" : ""}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </Card>

                {/* Déplié : version actuelle (Télécharger, Sauvegarder) + historique */}
                {hasTask && isExpanded && (
                  <div className="mt-3 ml-4 pl-6 border-l-2 border-surface-200 space-y-4">
                    {loadingHistory && !historyByTaskId[row.taskId] ? (
                      <Skeleton className="h-40 rounded-xl" />
                    ) : (() => {
                      const fullList = historyByTaskId[row.taskId] || [];
                      const latest = fullList[0];
                      const previous = fullList.slice(1);
                      if (fullList.length === 0) {
                        return (
                          <p className="text-body-sm text-ink-500 py-2">
                            Aucune proposition pour cette tâche.
                          </p>
                        );
                      }
                      const refreshTaskHistory = () =>
                        loadHistoryForTask(row.taskId, true);
                      return (
                        <>
                          <LatestProposalCard
                            proposal={latest}
                            canValidate={canValidateProposal}
                            onRefresh={refreshTaskHistory}
                          />
                          {previous.length > 0 && (
                            <div className="space-y-4">
                              <p className="text-xs font-semibold text-ink-400 uppercase tracking-wider">
                                Historique des versions
                              </p>
                              {previous.map((prop, idx) => (
                                <TimelineEntry
                                  key={prop.id}
                                  proposal={prop}
                                  isLast={idx === previous.length - 1}
                                />
                              ))}
                            </div>
                          )}
                        </>
                      );
                    })()}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <Pagination
        page={page}
        totalPages={Math.ceil(total / 20) || 1}
        total={total}
        limit={20}
        onPageChange={(p) => updateParam("page", String(p))}
      />

      {detail && (
        <ProposalDetailModal
          proposal={detail}
          onClose={() => setDetail(null)}
          onRefresh={loadProposals}
          canValidate={canValidateProposal}
        />
      )}
    </div>
  );
}

function ProposalDetailModal({ proposal: p, onClose, onRefresh, canValidate }) {
  const [validations, setValidations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [validating, setValidating] = useState(false);
  const [validationForm, setValidationForm] = useState({
    status: "",
    comments: "",
  });

  const handleValidate = async () => {
    if (!validationForm.status)
      return toast.error("Veuillez choisir une décision");
    const projectId = p.project_id || p.project?.id;
    if (!projectId) return;
    setValidating(true);
    try {
      await proposalsAPI.validate(projectId, p.id, validationForm);
      toast.success("Validation enregistrée");
      setValidationForm({ status: "", comments: "" });
      onRefresh();
      onClose();
    } catch (err) {
      const details = formatErrorMessage(err);
      details.forEach((detail) => toast.error(detail.message));
    } finally {
      setValidating(false);
    }
  };

  useEffect(() => {
    (async () => {
      try {
        const projectId = p.project_id || p.project?.id;
        if (!projectId) {
          setLoading(false);
          return;
        }
        const { data } = await proposalsAPI.getValidations(projectId, p.id);
        setValidations(
          Array.isArray(data.data) ? data.data : extractList(data.data).items,
        );
      } catch {
      } finally {
        setLoading(false);
      }
    })();
  }, [p.id]);

  const st = PROPOSAL_STATUS[p.status] || { label: p.status, color: "neutral" };

  return (
    <Modal open onClose={onClose} title="Détail de la proposition" size="lg">
      <div className="space-y-5">
        <div className="flex items-center gap-3">
          <h3 className="text-display-sm">{p.title}</h3>
          <Badge color="neutral" size="sm">
            v{p.version_number}
          </Badge>
          <Badge color={st.color} dot>
            {st.label}
          </Badge>
        </div>

        {p.description && (
          <p className="text-body-md text-ink-500">{p.description}</p>
        )}

        <div className="grid grid-cols-2 gap-4 text-body-sm">
          <div>
            <span className="text-ink-400">Projet:</span>{" "}
            <span className="text-ink-700 ml-1">{p.project?.title || "—"}</span>
          </div>
          <div>
            <span className="text-ink-400">Auteur:</span>{" "}
            <span className="text-ink-700 ml-1">
              {p.author?.first_name || "—"} {p.author?.last_name || ""}
            </span>
          </div>
          <div>
            <span className="text-ink-400">Créée le:</span>{" "}
            <span className="text-ink-700 ml-1">
              {formatDate(p.createdAt)}
            </span>
          </div>
          <div>
            <span className="text-ink-400">Mise à jour:</span>{" "}
            <span className="text-ink-700 ml-1">
              {formatDate(p.updatedAt)}
            </span>
          </div>
        </div>

        {/* Validate action for client validators */}
        {canValidate &&
          ["submitted", "pending_client_validation"].includes(p.status) && (
            <div className="border border-primary-200 bg-primary-50/50 rounded-xl p-4 space-y-3">
              <h4 className="text-label font-semibold text-ink-700">
                Valider cette proposition
              </h4>
              <div className="flex gap-3">
                <button
                  onClick={() =>
                    setValidationForm((f) => ({ ...f, status: "approved" }))
                  }
                  className={`flex-1 py-2 rounded-lg text-body-sm font-medium border transition-default ${
                    validationForm.status === "approved"
                      ? "bg-success-100 border-success-400 text-success-700"
                      : "border-surface-300 text-ink-500 hover:bg-surface-100"
                  }`}
                >
                  Approuver
                </button>
                <button
                  onClick={() =>
                    setValidationForm((f) => ({
                      ...f,
                      status: "needs_revision",
                    }))
                  }
                  className={`flex-1 py-2 rounded-lg text-body-sm font-medium border transition-default ${
                    validationForm.status === "needs_revision"
                      ? "bg-warning-100 border-warning-400 text-warning-700"
                      : "border-surface-300 text-ink-500 hover:bg-surface-100"
                  }`}
                >
                  À modifier
                </button>
                <button
                  onClick={() =>
                    setValidationForm((f) => ({ ...f, status: "rejected" }))
                  }
                  className={`flex-1 py-2 rounded-lg text-body-sm font-medium border transition-default ${
                    validationForm.status === "rejected"
                      ? "bg-danger-100 border-danger-400 text-danger-700"
                      : "border-surface-300 text-ink-500 hover:bg-surface-100"
                  }`}
                >
                  Refuser
                </button>
              </div>
              <Textarea
                placeholder="Commentaire (optionnel)"
                value={validationForm.comments}
                onChange={(e) =>
                  setValidationForm((f) => ({ ...f, comments: e.target.value }))
                }
                rows={2}
              />
              <div className="flex justify-end">
                <Button
                  onClick={handleValidate}
                  loading={validating}
                  disabled={!validationForm.status}
                >
                  Soumettre la validation
                </Button>
              </div>
            </div>
          )}

        {/* Validation history */}
        <div>
          <h4 className="text-label font-semibold text-ink-700 mb-3">
            Historique de validation
          </h4>
          {loading ? (
            <Skeleton className="h-20 rounded-lg" />
          ) : validations.length === 0 ? (
            <p className="text-body-sm text-ink-400 py-4 text-center">
              Aucune validation enregistrée
            </p>
          ) : (
            <div className="space-y-2">
              {validations.map((v) => (
                <div
                  key={v.id}
                  className="flex items-start gap-3 p-3 bg-surface-50 rounded-lg"
                >
                  <div
                    className={`w-2 h-2 rounded-full mt-2 shrink-0 ${v.status === "approved" ? "bg-success-500" : v.status === "rejected" ? "bg-danger-500" : "bg-warning-500"}`}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 text-body-sm">
                      <span className="font-medium text-ink-700">
                        {v.validator?.first_name || "—"}{" "}
                        {v.validator?.last_name || ""}
                      </span>
                      <Badge
                        color={
                          v.status === "approved"
                            ? "success"
                            : v.status === "rejected"
                              ? "danger"
                              : "warning"
                        }
                        size="xs"
                      >
                        {v.status === "approved"
                          ? "Validé"
                          : v.status === "rejected"
                            ? "Refusé"
                            : "À modifier"}
                      </Badge>
                    </div>
                    {v.comments && (
                      <p className="text-body-sm text-ink-400 mt-1">
                        {v.comments}
                      </p>
                    )}
                    <p className="text-body-sm text-ink-300 mt-1">
                      {formatDate(v.validated_at || v.created_at)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}
