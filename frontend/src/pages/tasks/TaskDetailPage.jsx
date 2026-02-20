import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState, useRef } from "react";
import { tasksAPI } from "../../api/services";
import { useAuthStore } from "../../store/authStore";
import { Button, Badge, Skeleton } from "../../components/ui";
import { formatErrorMessage, TASK_STATUS } from "../../utils/helpers";
import toast from "react-hot-toast";
import { Plus, ClipboardList, FileText } from "lucide-react";
import { usePermissions } from "../../hooks";

import TaskDetailsTab from "./TaskDetailsTab";
import ProposalsTab from "./ProposalsTab";

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
  const [isInternal, setIsInternal] = useState(false);

  const me = useAuthStore((state) => state.user);
  const { canCreateProposal } = usePermissions();
  const intervalRef = useRef();
  const commentsEndRef = useRef(null);

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

    fetchTask();
    fetchComments();
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
        is_internal: Boolean(isInternal),
      });
      setCommentContent("");
      setIsInternal(false);
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

  if (loading) return <Skeleton className="h-96 w-full" />;
  if (!task) return null;

  return (
    <div className="max-w-5xl mx-auto py-8 space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3 flex-wrap">
          <h1 className="text-2xl font-bold text-ink-900">{task.title}</h1>
          <Badge color={TASK_STATUS[task.status]?.color} dot>
            {TASK_STATUS[task.status]?.label}
          </Badge>
        </div>
        {canCreateProposal && (
          <Button
            color="primary"
            icon={Plus}
            onClick={() => navigate(`/proposals/create?taskId=${task.id}`)}
          >
            Proposition
          </Button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-surface-200">
        {TABS.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`flex items-center gap-2 px-4 py-2.5 text-body-sm font-medium transition-default rounded-t-lg border-b-2 -mb-px
              ${
                activeTab === key
                  ? "border-primary-500 text-primary-600 bg-primary-50"
                  : "border-transparent text-ink-400 hover:text-ink-700 hover:bg-surface-100"
              }`}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      {/* Contenu */}
      {activeTab === "details" && (
        <TaskDetailsTab
          task={task}
          comments={comments}
          commentLoading={commentLoading}
          commentContent={commentContent}
          setCommentContent={setCommentContent}
          submitting={submitting}
          isInternal={isInternal}
          setIsInternal={setIsInternal}
          me={me}
          commentsEndRef={commentsEndRef}
          handleAddComment={handleAddComment}
        />
      )}

      {activeTab === "proposals" && <ProposalsTab taskId={task.id} />}

      <Button variant="secondary" onClick={() => navigate(-1)}>
        Retour
      </Button>
    </div>
  );
}
