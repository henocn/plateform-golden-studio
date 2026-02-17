import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState, useRef } from "react";
import { tasksAPI, usersAPI, projectsAPI } from "../../api/services";
import { useAuthStore } from "../../store/authStore";
import {
  Card,
  Button,
  Badge,
  Skeleton,
  Avatar,
  Input,
  Textarea,
  Checkbox,
} from "../../components/ui";
import {
  formatDate,
  formatDateTime,
  PRIORITY,
  TASK_STATUS,
} from "../../utils/helpers";
import toast from "react-hot-toast";
import { SendHorizontal } from "lucide-react";

export default function TaskDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [assignee, setAssignee] = useState(null);
  const [project, setProject] = useState(null);
  const [comments, setComments] = useState([]);
  const [commentLoading, setCommentLoading] = useState(true);
  const [commentContent, setCommentContent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const me = useAuthStore((state) => state.user);
  const [isInternal, setIsInternal] = useState(false);
  const intervalRef = useRef();

  useEffect(() => {
    const fetchTask = async () => {
      setLoading(true);
      try {
        const { data } = await tasksAPI.getById(id);
        setTask(data.data);
        if (data.data.assigned_to) {
          usersAPI
            .getById(data.data.assigned_to)
            .then(({ data }) => setAssignee(data.data));
        }
        if (data.data.project_id) {
          projectsAPI
            .getById(data.data.project_id)
            .then(({ data }) => setProject(data.data));
        }
      } catch (err) {
        toast.error("Tâche introuvable");
        navigate(-1);
      } finally {
        setLoading(false);
      }
    };
    fetchTask();
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
    fetchComments();
    intervalRef.current = setInterval(() => {
      fetchComments(false);
    }, 5000);
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
      toast.error("Erreur lors de l'ajout du commentaire");
    } finally {
      setSubmitting(false);
    }
  };

  const commentsEndRef = useRef(null);

  if (loading) return <Skeleton className="h-96 w-full" />;
  if (!task) return null;

  return (
    <div className="max-w-2xl mx-auto py-8">
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold">{task.title}</h1>
          <Badge color={TASK_STATUS[task.status]?.color}>
            {TASK_STATUS[task.status]?.label}
          </Badge>
        </div>
        <div className="mb-2 text-gray-500 text-sm">
          Créée le {formatDate(task.created_at)}
          {task.due_date && ` · À rendre pour le ${formatDate(task.due_date)}`}
        </div>
        <div className="mb-4">
          <span className="font-semibold">Projet :</span>{" "}
          {project ? project.title : "—"}
        </div>
        <div className="mb-4">
          <span className="font-semibold">Assignée à :</span>{" "}
          {assignee ? (
            <span className="inline-flex items-center">
              <Avatar src={assignee.avatar_url} size={24} className="mr-2" />
              {assignee.first_name} {assignee.last_name}
            </span>
          ) : (
            "Non assignée"
          )}
        </div>
        <div className="mb-4">
          <span className="font-semibold">Priorité :</span>{" "}
          <Badge color={PRIORITY[task.priority]?.color}>
            {PRIORITY[task.priority]?.label}
          </Badge>
        </div>
        <div className="mb-4">
          <span className="font-semibold">Visibilité :</span>{" "}
          {task.visibility === "internal_only"
            ? "Interne uniquement"
            : "Visible client"}
        </div>
        <div className="mb-6">
          <span className="font-semibold">Description :</span>
          <div className="mt-1 whitespace-pre-line">
            {task.description || (
              <span className="italic text-gray-400">Aucune description</span>
            )}
          </div>
        </div>
        <div className="mb-6 relative" style={{ minHeight: 320 }}>
          <span className="font-semibold">Commentaires :</span>
          <div
            className="mt-2 flex flex-col-reverse gap-4 min-h-[120px] pb-24 overflow-y-auto max-h-[400px]"
            style={{ scrollBehavior: "smooth" }}
          >
            {commentLoading ? (
              <Skeleton className="h-8 w-1/2 mx-auto rounded-full" />
            ) : comments.length === 0 ? null : (
              comments
                .slice()
                .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
                .filter((c) => {
                  if (c.is_internal) {
                    return me?.user_type === "internal";
                  }
                  return true;
                })
                .map((c, idx, arr) => {
                  const isOwn = me && c.author?.id === me.id;
                  const isLast = idx === 0;
                  return (
                    <div
                      key={c.id}
                      ref={isLast ? commentsEndRef : null}
                      className={`flex w-full ${isOwn ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[80%] flex items-end gap-2 ${isOwn ? "flex-row-reverse" : ""}`}
                      >
                        <Avatar
                          src={c.author?.avatar_url}
                          firstName={c.author?.first_name}
                          lastName={c.author?.last_name}
                          size="sm"
                          className="shadow"
                        />
                        <div
                          className={`rounded-xl px-4 py-2 ${isOwn ? "bg-primary-100 text-primary-900 ml-2" : "bg-surface-100 text-ink-900 mr-2"} shadow-sm`}
                          style={{
                            alignSelf: isOwn ? "flex-end" : "flex-start",
                          }}
                        >
                          <div className="text-sm font-semibold flex items-center gap-2">
                            {c.author?.first_name} {c.author?.last_name}
                          </div>
                          <div className="text-body-sm mt-1 whitespace-pre-line">
                            {c.content}
                          </div>
                          <div
                            className={`text-xs mt-1 ${isOwn ? "text-right text-primary-500" : "text-left text-gray-400"}`}
                          >
                            {formatDateTime(c.createdAt)}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
            )}
          </div>
          {/* Champ commentaire fixé en bas */}
          <form
            onSubmit={handleAddComment}
            className="absolute left-0 right-0 bottom-0 flex flex-col gap-2 bg-surface-50 rounded-xl p-3 shadow-sm border-t border-surface-200"
            style={{ zIndex: 2 }}
          >
            <div className="flex items-end w-full gap-2">
              <div className="flex-1">
                <Input
                  value={commentContent}
                  onChange={(e) => setCommentContent(e.target.value)}
                  placeholder="Ajouter un commentaire..."
                  className="w-full border border-surface-200 rounded-lg focus:ring-2 focus:ring-primary-200"
                  disabled={submitting}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleAddComment(e);
                    }
                  }}
                />
              </div>
              <Button
                type="submit"
                loading={submitting}
                disabled={!commentContent.trim()}
                style={{ minWidth: 36, minHeight: 36, borderRadius: "50%" }}
              >
                <SendHorizontal size={18} />
              </Button>
            </div>
            {me?.user_type === "internal" && (
              <div className="flex items-center mt-2">
                <Checkbox
                  checked={!!isInternal}
                  onChange={checked => setIsInternal(!!checked)}
                  label="Interne uniquement (admin)"
                />
              </div>
            )}
          </form>
        </div>
        <Button variant="secondary" onClick={() => navigate(-1)}>
          Retour
        </Button>
      </Card>
    </div>
  );
}
