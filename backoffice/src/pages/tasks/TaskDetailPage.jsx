import { useParams, useNavigate } from 'react-router-dom';
import { useEffect, useState, useRef } from 'react';
import { tasksAPI, usersAPI, projectsAPI } from '../../api/services';
import { Card, Button, Badge, Skeleton, Avatar, Input, Textarea, Checkbox } from '../../components/ui';
import { formatDate, formatDateTime, PRIORITY, TASK_STATUS } from '../../utils/helpers';
import toast from 'react-hot-toast';
import Picker from '@emoji-mart/react';
import data from '@emoji-mart/data';

export default function TaskDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [assignee, setAssignee] = useState(null);
  const [project, setProject] = useState(null);
  const [comments, setComments] = useState([]);
  const [commentLoading, setCommentLoading] = useState(true);
  const [commentContent, setCommentContent] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [me, setMe] = useState(null);
  const [showEmoji, setShowEmoji] = useState(false);
  const [isInternal, setIsInternal] = useState(false);
  const intervalRef = useRef();

  useEffect(() => {
    const fetchTask = async () => {
      setLoading(true);
      try {
        const { data } = await tasksAPI.getById(id);
        setTask(data.data);
        if (data.data.assigned_to) {
          usersAPI.getById(data.data.assigned_to).then(({ data }) => setAssignee(data.data));
        }
        if (data.data.project_id) {
          projectsAPI.getById(data.data.project_id).then(({ data }) => setProject(data.data));
        }
      } catch (err) {
        toast.error('Tâche introuvable');
        navigate(-1);
      } finally {
        setLoading(false);
      }
    };
    fetchTask();
    const fetchComments = async () => {
      setCommentLoading(true);
      try {
        const { data } = await tasksAPI.getComments(id);
        setComments(data.data);
      } catch {
        setComments([]);
      } finally {
        setCommentLoading(false);
      }
    };
    fetchComments();
    // Get current user for comment alignment
    usersAPI.me?.().then(({ data }) => setMe(data.data)).catch(() => setMe(null));
    // Rafraîchissement auto toutes les 5s
    intervalRef.current = setInterval(() => {
      fetchComments();
    }, 5000);
    return () => clearInterval(intervalRef.current);
  }, [id, navigate]);

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!commentContent.trim()) return;
    setSubmitting(true);
    try {
      await tasksAPI.addComment(id, { content: commentContent, is_internal: isInternal });
      setCommentContent('');
      setIsInternal(false);
      // Refresh comments
      const { data } = await tasksAPI.getComments(id);
      setComments(data.data);
      toast.success('Commentaire ajouté');
    } catch (err) {
      toast.error('Erreur lors de l\'ajout du commentaire');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEmojiSelect = (emoji) => {
    setCommentContent(commentContent + emoji.native);
    setShowEmoji(false);
  };

  if (loading) return <Skeleton className="h-96 w-full" />;
  if (!task) return null;

  return (
    <div className="max-w-2xl mx-auto py-8">
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold">{task.title}</h1>
          <Badge color={TASK_STATUS[task.status]?.color}>{TASK_STATUS[task.status]?.label}</Badge>
        </div>
        <div className="mb-2 text-gray-500 text-sm">Créée le {formatDate(task.created_at)}{task.due_date && ` · À rendre pour le ${formatDate(task.due_date)}`}</div>
        <div className="mb-4">
          <span className="font-semibold">Projet :</span> {project ? project.title : '—'}
        </div>
        <div className="mb-4">
          <span className="font-semibold">Assignée à :</span> {assignee ? <span className="inline-flex items-center"><Avatar src={assignee.avatar_url} size={24} className="mr-2" />{assignee.first_name} {assignee.last_name}</span> : 'Non assignée'}
        </div>
        <div className="mb-4">
          <span className="font-semibold">Priorité :</span> <Badge color={PRIORITY[task.priority]?.color}>{PRIORITY[task.priority]?.label}</Badge>
        </div>
        <div className="mb-4">
          <span className="font-semibold">Visibilité :</span> {task.visibility === 'internal_only' ? 'Interne uniquement' : 'Visible client'}
        </div>
        <div className="mb-6">
          <span className="font-semibold">Description :</span>
          <div className="mt-1 whitespace-pre-line">{task.description || <span className="italic text-gray-400">Aucune description</span>}</div>
        </div>
        <div className="mb-6">
          <span className="font-semibold">Commentaires :</span>
          <div className="mt-2 flex flex-col-reverse gap-4 min-h-[120px]">
            {commentLoading ? (
              <Skeleton className="h-16 w-full" />
            ) : (
              comments.slice().sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).map((c) => {
                const isOwn = me && c.author?.id === me.id;
                return (
                  <div key={c.id} className={`flex w-full ${isOwn ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[80%] flex items-end gap-2 ${isOwn ? 'flex-row-reverse' : ''}`}>
                      <Avatar
                        src={c.author?.avatar_url}
                        firstName={c.author?.first_name}
                        lastName={c.author?.last_name}
                        size="sm"
                        className="shadow"
                      />
                      <div className={`rounded-xl px-4 py-2 ${isOwn ? 'bg-primary-100 text-primary-900 ml-2' : 'bg-surface-100 text-ink-900 mr-2'} shadow-sm`} style={{alignSelf: isOwn ? 'flex-end' : 'flex-start'}}>
                        <div className="text-sm font-semibold flex items-center gap-2">
                          {c.author?.first_name} {c.author?.last_name}
                        </div>
                        <div className="text-body-sm mt-1 whitespace-pre-line">{c.content}</div>
                        <div className={`text-xs mt-1 ${isOwn ? 'text-right text-primary-500' : 'text-left text-gray-400'}`}>{formatDateTime(c.created_at)}</div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
        <form onSubmit={handleAddComment} className="mt-4 flex flex-col gap-2 bg-surface-50 rounded-xl p-3 mb-6 shadow-sm">
          <div className="flex items-end gap-2 w-full">
            <Textarea
              value={commentContent}
              onChange={e => setCommentContent(e.target.value)}
              placeholder="Ajouter un commentaire..."
              rows={2}
              className="flex-1 resize-none border border-surface-200 rounded-lg focus:ring-2 focus:ring-primary-200"
              disabled={submitting}
              style={{ minHeight: 48 }}
            />
            <Button type="button" variant="ghost" onClick={() => setShowEmoji(v => !v)} className="mb-1">😊</Button>
            <Button type="submit" loading={submitting} disabled={!commentContent.trim()} className="mb-1">Envoyer</Button>
          </div>
          {/* Checkbox admin pour is_internal */}
          {me?.user_type === 'internal' && (
            <div className="flex items-center mt-1">
              <Checkbox checked={isInternal} onChange={setIsInternal} label="Interne uniquement (admin)" />
            </div>
          )}
          {showEmoji && (
            <div className="absolute z-50 mt-2">
              <Picker data={data} onEmojiSelect={handleEmojiSelect} theme="light" />
            </div>
          )}
        </form>
        <Button variant="secondary" onClick={() => navigate(-1)}>Retour</Button>
      </Card>
    </div>
  );
}
