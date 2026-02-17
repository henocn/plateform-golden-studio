import { useParams, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { tasksAPI, usersAPI, projectsAPI } from '../../api/services';
import { Card, Button, Badge, Skeleton, Avatar } from '../../components/ui';
import { formatDate, PRIORITY, TASK_STATUS } from '../../utils/helpers';
import toast from 'react-hot-toast';

export default function TaskDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [assignee, setAssignee] = useState(null);
  const [project, setProject] = useState(null);

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
  }, [id, navigate]);

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
        <Button variant="secondary" onClick={() => navigate(-1)}>Retour</Button>
      </Card>
    </div>
  );
}
