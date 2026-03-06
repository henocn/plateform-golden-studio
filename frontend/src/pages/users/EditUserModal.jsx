import { useState, useEffect } from 'react';
import { Modal, Button, Input, Select } from '../../components/ui';
import { usersAPI } from '../../api/services';
import { usePermissions } from '../../hooks';
import { formatErrorMessage } from '../../utils/helpers';
import toast from 'react-hot-toast';

const internalRoles = [
  { value: 'admin', label: 'Admin' },
  { value: 'validator', label: 'Validateur' },
  { value: 'contributor', label: 'Contributeur' },
  { value: 'reader', label: 'Lecteur' },
];

const clientRolesFull = [
  { value: 'client_admin', label: 'Client Admin' },
  { value: 'client_validator', label: 'Client Validateur' },
  { value: 'client_contributor', label: 'Client Contributeur' },
  { value: 'client_reader', label: 'Client Lecteur' },
];

const clientRolesOrg = [
  { value: 'client_validator', label: 'Client Validateur' },
  { value: 'client_contributor', label: 'Client Contributeur' },
  { value: 'client_reader', label: 'Client Lecteur' },
];

/**
 * Modal d’édition d’un utilisateur (interne ou client).
 * Met à jour profil (nom, prénom, poste), rôle et statut actif/inactif.
 */
export default function EditUserModal({ open, onClose, onSaved, user, userType }) {
  const { isClientAdmin, isSuperAdmin } = usePermissions();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    first_name: '',
    last_name: '',
    email: '',
    job_title: '',
    role: '',
    is_active: true,
  });

  useEffect(() => {
    if (open && user) {
      setForm({
        first_name: user.first_name ?? '',
        last_name: user.last_name ?? '',
        email: user.email ?? '',
        job_title: user.job_title ?? '',
        role: user.role ?? '',
        is_active: user.is_active ?? true,
      });
    }
  }, [open, user]);

  const roleOptions = userType === 'internal' ? internalRoles : (isClientAdmin ? clientRolesOrg : clientRolesFull);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user?.id) return;
    setLoading(true);
    try {
      const updatePayload = {
        first_name: form.first_name,
        last_name: form.last_name,
        job_title: form.job_title || null,
      };
      if (isSuperAdmin && form.email?.trim()) {
        updatePayload.email = form.email.trim();
      }
      await usersAPI.update(user.id, updatePayload);
      const type = userType === 'internal' ? 'internal' : 'clients';
      await usersAPI.patchRole(type, user.id, { role: form.role });
      await usersAPI.patchStatus(user.id, { is_active: form.is_active });
      toast.success('Utilisateur mis à jour');
      onSaved();
    } catch (err) {
      const details = formatErrorMessage(err);
      if (details.length > 0) details.forEach((d) => toast.error(d.message));
      else toast.error('Erreur lors de la mise à jour');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Modifier l'utilisateur ${userType === 'internal' ? 'interne' : 'client'}`}
      size="md"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Annuler</Button>
          <Button loading={loading} onClick={handleSubmit}>Enregistrer</Button>
        </>
      }
    >
      <form className="space-y-4" onSubmit={handleSubmit}>
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Prénom"
            required
            value={form.first_name}
            onChange={(e) => setForm({ ...form, first_name: e.target.value })}
          />
          <Input
            label="Nom"
            required
            value={form.last_name}
            onChange={(e) => setForm({ ...form, last_name: e.target.value })}
          />
        </div>
        <Input
          label="Email"
          type="email"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          disabled={!isSuperAdmin}
        />
        <Input
          label="Poste"
          value={form.job_title}
          onChange={(e) => setForm({ ...form, job_title: e.target.value })}
        />
        <Select
          label="Rôle"
          required
          value={form.role}
          onChange={(e) => setForm({ ...form, role: e.target.value })}
          options={roleOptions}
        />
        <Select
          label="Statut"
          value={form.is_active ? 'active' : 'inactive'}
          onChange={(e) => setForm({ ...form, is_active: e.target.value === 'active' })}
          options={[
            { value: 'active', label: 'Actif' },
            { value: 'inactive', label: 'Inactif' },
          ]}
        />
      </form>
    </Modal>
  );
}
