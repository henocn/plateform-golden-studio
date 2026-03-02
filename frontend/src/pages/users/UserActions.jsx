import { useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { MoreVertical, Edit, Trash2 } from 'lucide-react';
import { usersAPI } from '../../api/services';
import { formatErrorMessage } from '../../utils/helpers';
import toast from 'react-hot-toast';

import EditUserModal from './EditUserModal';

/** Largeur du menu déroulant pour le positionnement du portal. */
const MENU_WIDTH = 176;

/**
 * Menu d’actions (Modifier / Supprimer) pour une ligne utilisateur.
 * Utilise un Portal pour éviter overflow et propagation du clic vers la ligne.
 */
export default function UserActions({ user, userType, onRefresh, canUpdate, canDelete }) {
  const [open, setOpen] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });
  const buttonRef = useRef(null);

  const handleToggle = (e) => {
    e.stopPropagation();
    e.preventDefault();
    if (!open && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setMenuPosition({
        top: rect.bottom + 4,
        left: Math.max(8, rect.right - MENU_WIDTH),
      });
    }
    setOpen((prev) => !prev);
  };

  const handleOverlayClick = (e) => {
    e.stopPropagation();
    e.preventDefault();
    setOpen(false);
  };

  const handleDelete = async () => {
    if (!confirm('Supprimer cet utilisateur ? Cette action est irréversible.')) return;
    try {
      await usersAPI.remove(user.id);
      toast.success('Utilisateur supprimé');
      onRefresh();
    } catch (err) {
      const details = formatErrorMessage(err);
      if (details.length > 0) details.forEach((d) => toast.error(d.message));
      else toast.error('Erreur lors de la suppression');
    }
  };

  const dropdownContent =
    open &&
    createPortal(
      <>
        <div
          className="fixed inset-0 z-[100]"
          onClick={handleOverlayClick}
          onMouseDown={(e) => e.stopPropagation()}
          aria-hidden
        />
        <div
          className="fixed z-[110] bg-white rounded-xl shadow-dropdown border border-surface-200 py-1 w-44 animate-fade-in"
          style={{ top: menuPosition.top, left: menuPosition.left }}
          onClick={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
        >
          {canUpdate && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setShowEdit(true);
                setOpen(false);
              }}
              className="w-full flex items-center gap-2 px-3 py-2 text-body-sm text-ink-700 hover:bg-surface-100 transition-default text-left"
            >
              <Edit className="w-4 h-4 shrink-0" /> Modifier
            </button>
          )}
          {canDelete && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleDelete();
                setOpen(false);
              }}
              className="w-full flex items-center gap-2 px-3 py-2 text-body-sm text-danger-600 hover:bg-danger-50 transition-default text-left"
            >
              <Trash2 className="w-4 h-4 shrink-0" /> Supprimer
            </button>
          )}
        </div>
      </>,
      document.body
    );

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        type="button"
        className="p-1 rounded-lg text-ink-400 hover:bg-surface-200"
        onClick={handleToggle}
      >
        <MoreVertical className="w-4 h-4" />
      </button>

      {dropdownContent}

      {showEdit && (
        <EditUserModal
          open={showEdit}
          onClose={() => setShowEdit(false)}
          onSaved={() => {
            setShowEdit(false);
            onRefresh();
          }}
          user={user}
          userType={userType}
        />
      )}
    </div>
  );
}
