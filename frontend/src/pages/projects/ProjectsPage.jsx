import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, FolderKanban } from "lucide-react";
import {
  Card,
  Button,
  Badge,
  SearchInput,
  Select,
  Pagination,
  EmptyState,
  Skeleton,
} from "../../components/ui";
import { projectsAPI } from "../../api/services";
import { usePagination, useDebounce, usePermissions } from "../../hooks";
import {
  formatDate,
  PROJECT_STATUS,
  PRIORITY,
  extractList,
} from "../../utils/helpers";
import toast from "react-hot-toast";

import ProjectActions from "./ProjectActions";
import CreateProjectModal from "./CreateProjectModal";

export default function ProjectsPage() {
  const navigate = useNavigate();
  const { can } = usePermissions();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");
  const debouncedSearch = useDebounce(search);
  const pagination = usePagination();
  const [showCreate, setShowCreate] = useState(false);

  const loadProjects = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await projectsAPI.list({
        page: pagination.page,
        limit: pagination.limit,
        search: debouncedSearch || undefined,
        status: statusFilter || undefined,
        priority: priorityFilter || undefined,
      });
      const { items, total } = extractList(data.data);
      setProjects(items);
      pagination.setTotal(total);
    } catch {
      toast.error("Erreur lors du chargement des projets");
    } finally {
      setLoading(false);
    }
  }, [pagination.page, debouncedSearch, statusFilter, priorityFilter]);

  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  const statusOptions = Object.entries(PROJECT_STATUS).map(([k, v]) => ({
    value: k,
    label: v.label,
  }));
  const priorityOptions = Object.entries(PRIORITY).map(([k, v]) => ({
    value: k,
    label: v.label,
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-display-lg">Projets</h1>
          <p className="text-body-md text-ink-500 mt-1">
            Gestion des projets de communication
          </p>
        </div>
        {can("projects.create") && (
          <Button icon={Plus} onClick={() => setShowCreate(true)}>
            Nouveau projet
          </Button>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Rechercher un projet…"
          className="w-72"
        />
        <Select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            pagination.setPage(1);
          }}
          placeholder="Tous les statuts"
          options={statusOptions}
          className="w-44"
        />
        <Select
          value={priorityFilter}
          onChange={(e) => {
            setPriorityFilter(e.target.value);
            pagination.setPage(1);
          }}
          placeholder="Toutes priorités"
          options={priorityOptions}
          className="w-44"
        />
      </div>

      {/* Table */}
      <Card padding={false}>
        {loading ? (
          <div className="p-5 space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4">
                <Skeleton className="w-10 h-10 rounded-xl" />
                <Skeleton className="h-4 flex-1" />
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-24" />
              </div>
            ))}
          </div>
        ) : projects.length === 0 ? (
          <EmptyState
            icon={FolderKanban}
            title="Aucun projet"
            description="Créez votre premier projet de communication"
            action={
              can("projects.create") ? (
                <Button icon={Plus} onClick={() => setShowCreate(true)}>
                  Créer un projet
                </Button>
              ) : null
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-surface-200">
                  <th className="text-left text-label text-ink-500 font-medium px-5 py-3">
                    Projet
                  </th>
                  <th className="text-left text-label text-ink-500 font-medium px-5 py-3">
                    Statut
                  </th>
                  <th className="text-left text-label text-ink-500 font-medium px-5 py-3">
                    Priorité
                  </th>
                  <th className="text-left text-label text-ink-500 font-medium px-5 py-3">
                    Date cible
                  </th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-200">
                {projects.map((p) => {
                  const status = PROJECT_STATUS[p.status] || {
                    label: p.status,
                    color: "neutral",
                  };
                  const priority = PRIORITY[p.priority] || {
                    label: p.priority,
                    color: "neutral",
                  };
                  return (
                    <tr
                      key={p.id}
                      className="hover:bg-surface-100 cursor-pointer transition-default"
                      onClick={() => navigate(`/projects/${p.id}`)}
                    >
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-primary-50 flex items-center justify-center shrink-0">
                            <FolderKanban className="w-4 h-4 text-primary-500" />
                          </div>
                          <div>
                            <p className="text-body-md font-medium text-ink-900">
                              {p.title}
                            </p>
                            <p className="text-body-sm text-ink-400">
                              {p?.direction?.name || "—"} / {p?.agency?.name || "—"}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3">
                        <Badge color={status.color} dot size="sm">
                          {status.label}
                        </Badge>
                      </td>
                      <td className="px-5 py-3">
                        <Badge color={priority.color} size="sm">
                          {priority.label}
                        </Badge>
                      </td>
                      <td className="px-5 py-3 text-body-sm text-ink-400">
                        {formatDate(p.target_date)}
                      </td>
                      <td className="px-5 py-3">
                        {can("projects.update") && (
                          <ProjectActions
                            project={p}
                            onRefresh={loadProjects}
                            canDelete={can("projects.delete")}
                          />
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {!loading && projects.length > 0 && (
          <div className="px-5 border-t border-surface-200">
            <Pagination
              page={pagination.page}
              totalPages={pagination.totalPages}
              total={pagination.total}
              limit={pagination.limit}
              onPageChange={pagination.setPage}
            />
          </div>
        )}
      </Card>

      <CreateProjectModal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        onCreated={() => {
          setShowCreate(false);
          loadProjects();
        }}
      />
    </div>
  );
}
