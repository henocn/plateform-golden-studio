import { useParams, useNavigate, Link } from "react-router-dom";
import { useEffect, useState, useRef, useMemo } from "react";
import { tasksAPI } from "../../api/services";
import { useAuthStore } from "../../store/authStore";
import { Button, Badge, Skeleton } from "../../components/ui";
import { formatErrorMessage, TASK_STATUS } from "../../utils/helpers";
import toast from "react-hot-toast";
import { Plus, ClipboardList, FileText, Pencil, ChevronRight } from "lucide-react";
import { usePermissions } from "../../hooks";

import TaskDetailsTab from "./TaskDetailsTab";
import ProposalsTab from "./ProposalsTab";
import CreateProposalModal from "./CreateProposalModal";
import EditTaskModal from "./EditTaskModal";

const TABS = [
  { key: "details", label: "Détails", icon: ClipboardList },
  { key: "proposals", label: "Propositions", icon: FileText },
];

export default function TaskDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("details");

  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [comments, setComments] = useState([]);
  const [commentLoading, setCommentLoading] = useState(true);
  const [commentContent, setCommentContent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [commentIsInternal, setCommentIsInternal] = useState(false);
  const [showCreateProposal, setShowCreateProposal] = useState(false);
  const [proposalsRefreshKey, setProposalsRefreshKey] = useState(0);

  const me = useAuthStore((state) => state.user);
  const { canCreateProposal, can, isInternal } = usePermissions();
  const [showEditTask, setShowEditTask] = useState(false);
  const [proposalsCount, setProposalsCount] = useState(null);
  const intervalRef = useRef();
  const commentsEndRef = useRef(null);

  const canEditTask = task && task.status !== "done" && can("tasks.edit");

  const tabItems = useMemo(() => {
    return TABS.map(({ key, label, icon }) => ({
      key,
      label: key === "proposals" && proposalsCount !== null
        ? `Propositions (${proposalsCount})`
        : label,
      icon,
    }));
  }, [proposalsCount]);

  useEffect(() => {
    const fetchTask = async () => {
      setLoading(true);
      try {
        const { data } = await tasksAPI.getById(id);
        setTask(data.data);
      } catch {
        toast.error("Tâche introuvable");
        navigate(-1);
      } finally {
        setLoading(false);
      }
    };

    const fetchComments = async (showLoader = true) => {
      if (showLoader) setCommentLoading(true);
      try {
        const { data } = await tasksAPI.getComments(id);
        setComments(data.data);
      } catch {
        setComments([]);
      } finally {
        if (showLoader) setCommentLoading(false);
      }
    };

    const fetchProposalsCount = async () => {
      try {
        const res = await tasksAPI.getProposals(id);
        const list = Array.isArray(res.data?.data) ? res.data.data : [];
        setProposalsCount(list.length);
      } catch {
        setProposalsCount(0);
      }
    };

    fetchTask();
    fetchComments();
    fetchProposalsCount();
    intervalRef.current = setInterval(() => fetchComments(false), 5000);
    return () => clearInterval(intervalRef.current);
  }, [id, navigate]);

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!commentContent.trim()) return;
    setSubmitting(true);
    try {
      await tasksAPI.addComment(id, {
        content: commentContent,
        is_internal: Boolean(commentIsInternal),
      });
      setCommentContent("");
      setCommentIsInternal(false);
      const { data } = await tasksAPI.getComments(id);
      setComments(data.data);
      toast.success("Commentaire ajouté");
    } catch (err) {
      const details = formatErrorMessage(err);
      details.forEach((detail) => toast.error(detail.message));
    } finally {
      setSubmitting(false);
    }
  };

  const refetchTask = async () => {
    try {
      const { data } = await tasksAPI.getById(id);
      setTask(data.data);
    } catch {}
  };

  if (loading) return <Skeleton className="h-96 w-full" />;
  if (!task) return null;

  return (
    <div className="min-h-screen bg-surface-50/50">
      {/* Breadcrumb */}
      <nav className="border-b border-surface-200 bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3">
          <ol className="flex items-center gap-2 text-body-sm text-ink-500">
            <li>
              <Link to="/tasks" className="hover:text-primary-600 transition-default">
                Tâches
              </Link>
            </li>
            <li className="flex items-center gap-1">
              <ChevronRight className="w-4 h-4 text-ink-300" />
              <span className="text-ink-700 font-medium truncate max-w-[200px] sm:max-w-md" title={task.title}>
                {task.title}
              </span>
            </li>
          </ol>
        </div>
      </nav>

      {/* En-tête institutionnel */}
      <header className="bg-white border-b border-surface-200 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div className="min-w-0 flex-1">
              <h1 className="text-display-md text-ink-900 font-semibold tracking-tight">
                {task.title}
              </h1>
              <div className="flex flex-wrap items-center gap-2 mt-2">
                <Badge color={TASK_STATUS[task.status]?.color} dot size="sm">
                  {TASK_STATUS[task.status]?.label}
                </Badge>
                {task.project?.title && (
                  <span className="text-body-sm text-ink-500">
                    Projet : {task.project.title}
                  </span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {canEditTask && (
                <Button
                  variant="outline"
                  icon={Pencil}
                  onClick={() => setShowEditTask(true)}
                >
                  Modifier la tâche
                </Button>
              )}
              {canCreateProposal && (
                <Button
                  variant="primary"
                  icon={Plus}
                  onClick={() => setShowCreateProposal(true)}
                >
                  Nouvelle proposition
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="flex gap-1">
            {tabItems.map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                className={`flex items-center gap-2 px-4 py-3 text-body-sm font-medium transition-default border-b-2 -mb-px
                  ${
                    activeTab === key
                      ? "border-primary-500 text-primary-600 text-ink-900"
                      : "border-transparent text-ink-500 hover:text-ink-700"
                  }`}
              >
                <Icon className="w-4 h-4" />
                {label}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Contenu principal */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-6">
        {activeTab === "details" && (
          <TaskDetailsTab
            task={task}
            comments={comments}
            commentLoading={commentLoading}
            commentContent={commentContent}
            setCommentContent={setCommentContent}
            submitting={submitting}
            isInternal={commentIsInternal}
            setIsInternal={setCommentIsInternal}
            me={me}
            commentsEndRef={commentsEndRef}
            handleAddComment={handleAddComment}
          />
        )}

        {activeTab === "proposals" && (
          <ProposalsTab
            taskId={task.id}
            key={proposalsRefreshKey}
            onProposalsLoaded={setProposalsCount}
          />
        )}

        <div className="mt-6">
          <Link
            to="/tasks"
            className="inline-flex items-center gap-1 text-body-sm text-ink-500 hover:text-primary-600 transition-default"
          >
            <ChevronRight className="w-4 h-4 rotate-180" />
            Retour aux tâches
          </Link>
        </div>
      </main>

      {showCreateProposal && (
        <CreateProposalModal
          task={task}
          onClose={() => setShowCreateProposal(false)}
          onCreated={() => {
            setShowCreateProposal(false);
            setProposalsRefreshKey((k) => k + 1);
            setProposalsCount((c) => (typeof c === "number" ? c + 1 : c));
          }}
        />
      )}

      {showEditTask && (
        <EditTaskModal
          task={task}
          isInternal={isInternal}
          onClose={() => setShowEditTask(false)}
          onSaved={refetchTask}
        />
      )}
    </div>
  );
}
