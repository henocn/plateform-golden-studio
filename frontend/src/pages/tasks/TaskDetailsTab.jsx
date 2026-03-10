import { useRef } from "react";
import {
  Card,
  Button,
  Badge,
  Skeleton,
  Avatar,
  Input,
  Checkbox,
} from "../../components/ui";
import {
  deltaTime,
  formatDate,
  formatDateTime,
  PRIORITY,
  TASK_STATUS,
} from "../../utils/helpers";
import { SendHorizontal, Mail, Phone, User } from "lucide-react";



/* ─── Carte utilisateur (créateur / assigné / superviseur) ──────────────── */
function UserCard({ label, user }) {
  if (!user) {
    return (
      <div className="flex flex-col gap-1">
        <p className="text-label text-ink-400 uppercase tracking-wide text-xs">
          {label}
        </p>
        <div className="flex items-center gap-3 p-3 rounded-xl bg-surface-50 border border-surface-200">
          <div className="w-9 h-9 rounded-full bg-surface-200 flex items-center justify-center shrink-0">
            <User className="w-4 h-4 text-ink-300" />
          </div>
          <span className="text-body-sm text-ink-400 italic">Non assigné</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1">
      <p className="text-label text-ink-400 uppercase tracking-wide text-xs">
        {label}
      </p>
      <div className="flex items-start gap-3 p-3 rounded-xl bg-surface-50 border border-surface-200">
        <Avatar
          src={user.avatar_url}
          firstName={user.first_name}
          lastName={user.last_name}
          size="sm"
          className="shrink-0 mt-0.5"
        />
        <div className="min-w-0 space-y-0.5">
          <p className="text-body-sm font-semibold text-ink-900 truncate">
            {user.first_name} {user.last_name}
          </p>
          {user.job_title && (
            <p className="text-xs text-ink-400 truncate">{user.job_title}</p>
          )}
          {user.email && (
            <a
              href={`mailto:${user.email}`}
              className="flex items-center gap-1.5 text-xs text-primary-500 hover:underline truncate"
              onClick={(e) => e.stopPropagation()}
            >
              <Mail className="w-3 h-3 shrink-0" />
              {user.email}
            </a>
          )}
          {user.phone && (
            <a
              href={`tel:${user.phone}`}
              className="flex items-center gap-1.5 text-xs text-ink-400 hover:text-ink-700 truncate"
              onClick={(e) => e.stopPropagation()}
            >
              <Phone className="w-3 h-3 shrink-0" />
              {user.phone}
            </a>
          )}
        </div>
      </div>
    </div>
  );
}



/* ─── Section commentaires ───────────────────────────────────────────────── */
function CommentsSection({
  comments,
  commentLoading,
  commentContent,
  setCommentContent,
  submitting,
  isInternal,
  setIsInternal,
  me,
  commentsEndRef,
  handleAddComment,
  hideTitle,
}) {
  const visibleComments = comments
    .slice()
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .filter((c) => {
      if (c.is_internal) return me?.user_type === "internal";
      return true;
    });

  return (
    <div className="flex flex-col gap-3">
      {!hideTitle && (
        <p className="text-label text-ink-400 uppercase tracking-wide text-xs">
          Commentaires
        </p>
      )}

      {/* Liste */}
      <div
        className="flex flex-col-reverse gap-3 overflow-y-auto max-h-[380px] px-1"
        style={{ scrollBehavior: "smooth" }}
      >
        {commentLoading ? (
          <Skeleton className="h-8 w-1/2 mx-auto rounded-full" />
        ) : visibleComments.length === 0 ? (
          <p className="text-center text-body-sm text-ink-300 py-8 italic">
            Aucun commentaire pour l'instant
          </p>
        ) : (
          visibleComments.map((c, idx) => {
            const isOwn = me && c.author?.id === me.id;
            return (
              <div
                key={c.id}
                ref={idx === 0 ? commentsEndRef : null}
                className={`flex w-full ${isOwn ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[78%] flex items-end gap-2 ${isOwn ? "flex-row-reverse" : ""}`}
                >
                  <Avatar
                    src={c.author?.avatar_url}
                    firstName={c.author?.first_name}
                    lastName={c.author?.last_name}
                    size="sm"
                    className="shadow shrink-0"
                  />
                  <div
                    className={`rounded-2xl px-4 py-2.5 shadow-sm ${
                      isOwn
                        ? "bg-primary-100 text-primary-900 ml-2 rounded-tr-sm"
                        : "bg-surface-100 text-ink-900 mr-2 rounded-tl-sm"
                    }`}
                  >
                    <p className="text-xs font-semibold mb-1">
                      {c.author?.first_name} {c.author?.last_name}
                      {c.is_internal && (
                        <span className="ml-2 text-[10px] font-medium text-amber-500 bg-amber-50 px-1.5 py-0.5 rounded-full">
                          Interne
                        </span>
                      )}
                    </p>
                    <p className="text-body-sm whitespace-pre-line">
                      {c.content}
                    </p>
                    <p
                      className={`text-[10px] mt-1.5 ${isOwn ? "text-right text-primary-400" : "text-left text-ink-300"}`}
                    >
                      {formatDateTime(c.createdAt)}
                    </p>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Formulaire */}
      <form
        onSubmit={handleAddComment}
        className="flex flex-col gap-2 bg-surface-50 rounded-xl p-3 border border-surface-200"
      >
        <div className="flex items-end gap-2">
          <div className="flex-1">
            <Input
              value={commentContent}
              onChange={(e) => setCommentContent(e.target.value)}
              placeholder="Ajouter un commentaire..."
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
            style={{ minWidth: 38, minHeight: 38, borderRadius: "50%" }}
          >
            <SendHorizontal size={16} />
          </Button>
        </div>
        {me?.user_type === "internal" && (
          <Checkbox
            checked={!!isInternal}
            onChange={(checked) => setIsInternal(!!checked)}
            label="Interne uniquement (admin)"
          />
        )}
      </form>
    </div>
  );
}

/* ─── Onglet principal Détails ───────────────────────────────────────────── */
export default function TaskDetailsTab({
  task,
  comments,
  commentLoading,
  commentContent,
  setCommentContent,
  submitting,
  isInternal,
  setIsInternal,
  me,
  commentsEndRef,
  handleAddComment,
}) {
  const { assignee, project, creator, supervisor } = task;

  return (
    <div className="space-y-6">
      {/* Bloc infos générales */}
      <Card className="overflow-hidden">
        <div className="px-5 py-4 border-b border-surface-200 bg-surface-50/50">
          <h2 className="text-label font-semibold text-ink-800">Informations générales</h2>
        </div>
        <div className="p-5 space-y-5">
          {/* Ligne meta */}
          <div className="flex flex-wrap items-center gap-x-6 gap-y-1 text-body-sm text-ink-500 pb-4 border-b border-surface-100">
            <span>
              Créée le{" "}
              <span className="font-medium text-ink-700">{formatDate(task.createdAt)}</span>
            </span>
            {task.due_date && (
              <>
                <span className="text-surface-400">|</span>
                <span>
                  Échéance :{" "}
                  <span className="font-medium text-ink-700">{formatDate(task.due_date)}</span>
                </span>
                <span className="text-surface-400">|</span>
                <span>
                  Jours restants :{" "}
                  <span className="font-medium text-ink-700">
                    {deltaTime(task.createdAt, task.due_date)}
                  </span>
                </span>
              </>
            )}
            {task.publication_date && (
              <>
                <span className="text-surface-400">|</span>
                <span>
                  Date de publication :{" "}
                  <span className="font-medium text-ink-700">
                    {formatDate(task.publication_date)}
                  </span>
                </span>
              </>
            )}
            <span className="text-surface-400">|</span>
            <span className="inline-flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-primary-500" />
              <span className="font-medium text-ink-700">
                {task.context === "event" ? "Tâche d’événement" : "Tâche de projet"}
              </span>
            </span>
          </div>

          {/* Grille infos */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            <div>
              <p className="text-label text-ink-400 uppercase tracking-wide text-xs mb-1">
                Projet
              </p>
              <p className="text-body-md text-ink-800 font-medium">
                {project?.title || "—"}
              </p>
            </div>
            <div>
              <p className="text-label text-ink-400 uppercase tracking-wide text-xs mb-1">
                Priorité
              </p>
              <Badge color={PRIORITY[task.priority]?.color} size="sm">
                {PRIORITY[task.priority]?.label}
              </Badge>
            </div>
            <div>
              <p className="text-label text-ink-400 uppercase tracking-wide text-xs mb-1">
                Statut
              </p>
              <Badge color={TASK_STATUS[task.status]?.color} dot size="sm">
                {TASK_STATUS[task.status]?.label}
              </Badge>
            </div>
          </div>

          {/* Description */}
          <div>
            <p className="text-label text-ink-400 uppercase tracking-wide text-xs mb-2">
              Description
            </p>
            <div className="rounded-lg bg-surface-50 border border-surface-200 px-4 py-3 text-body-md text-ink-700 whitespace-pre-line min-h-[60px]">
              {task.description || (
                <span className="italic text-ink-400">Aucune description</span>
              )}
            </div>
          </div>
        </div>
      </Card>

      {/* Bloc intervenants */}
      <Card className="overflow-hidden">
        <div className="px-5 py-4 border-b border-surface-200 bg-surface-50/50">
          <h2 className="text-label font-semibold text-ink-800">Intervenants</h2>
        </div>
        <div className="p-5">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <UserCard label="Créateur" user={creator} />
            <UserCard label="Chargé de la tâche" user={assignee} />
            <UserCard label="Superviseur" user={supervisor} />
          </div>
        </div>
      </Card>

      {/* Bloc commentaires */}
      <Card className="overflow-hidden">
        <div className="px-5 py-4 border-b border-surface-200 bg-surface-50/50">
          <h2 className="text-label font-semibold text-ink-800">Commentaires</h2>
        </div>
        <div className="p-5">
          <CommentsSection
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
          hideTitle
        />
        </div>
      </Card>
    </div>
  );
}
