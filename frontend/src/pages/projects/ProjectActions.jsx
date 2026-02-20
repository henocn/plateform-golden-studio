import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { MoreVertical, Edit, Trash2 } from "lucide-react";
import { projectsAPI } from "../../api/services";
import { formatErrorMessage } from "../../utils/helpers";
import toast from "react-hot-toast";

import CreateProjectModal from "./CreateProjectModal";

export default function ProjectActions({ project, onRefresh, canDelete }) {
  const [open, setOpen] = useState(false);
  const [showEdit, setShowEdit] = useState(false);

  const handleDelete = async () => {
    if (!confirm("Supprimer ce projet ? Cette action est irréversible."))
      return;
    try {
      await projectsAPI.remove(project.id);
      toast.success("Projet supprimé");
      onRefresh();
    } catch (err) {
      const details = formatErrorMessage(err);
      if (details.length > 0) details.forEach((d) => toast.error(d.message));
      else toast.error("Erreur lors de la suppression");
    }
  };

  return (
    <div className="relative">
      <button
        className="p-1 rounded-lg text-ink-400 hover:bg-surface-200"
        onClick={(e) => {
          e.stopPropagation();
          setOpen((prev) => !prev);
        }}
      >
        <MoreVertical className="w-4 h-4" />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-8 z-20 bg-white rounded-xl shadow-dropdown border border-surface-200 py-1 w-44 animate-fade-in">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowEdit(true);
                setOpen(false);
              }}
              className="w-full flex items-center gap-2 px-3 py-2 text-body-sm text-ink-700 hover:bg-surface-100 transition-default"
            >
              <Edit className="w-4 h-4" /> Modifier
            </button>
            {canDelete && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDelete();
                  setOpen(false);
                }}
                className="w-full flex items-center gap-2 px-3 py-2 text-body-sm text-danger-600 hover:bg-danger-50 transition-default"
              >
                <Trash2 className="w-4 h-4" /> Supprimer
              </button>
            )}
          </div>
        </>
      )}

      {showEdit && (
        <CreateProjectModal
          open={showEdit}
          onClose={() => setShowEdit(false)}
          onCreated={() => {
            setShowEdit(false);
            onRefresh();
          }}
          project={project}
        />
      )}
    </div>
  );
}
