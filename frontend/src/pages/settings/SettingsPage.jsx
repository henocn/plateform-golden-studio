import { useState, useEffect } from 'react';
import {
  Bell,
  Building2,
  Upload,
  Mail,
  Phone,
  MapPin,
  Plus,
  Pencil,
  Trash2,
} from 'lucide-react';
import { Card, Button, Input, Select, Badge, Modal, Textarea } from '../../components/ui';
import { useAuthStore } from '../../store/authStore';
import { useOrganizationStore } from '../../store/organizationStore';
import { usePermissions } from '../../hooks';
import { organizationsAPI, agenciesAPI, directionsAPI, uploadsUrl, calendarAPI, usersAPI } from '../../api/services';
import toast from 'react-hot-toast';

export default function SettingsPage() {
  const { user } = useAuthStore();
  const { current, fetchCurrent, setCurrent } = useOrganizationStore();
  const { can, userType, isAdmin } = usePermissions();

  const canManageAgenciesDirections = can('settings.agencies_directions');
  const isPlatformAdmin = user?.role === 'super_admin' || user?.role === 'admin';
  const isOrgEditor =
    user?.role === 'super_admin' || user?.role === 'admin' || user?.role === 'client_admin';

  const [orgForm, setOrgForm] = useState({
    name: '',
    short_name: '',
    type: 'other',
    contact_email: '',
    contact_phone: '',
    address: '',
  });
  const [logoFile, setLogoFile] = useState(null);
  const [orgLoading, setOrgLoading] = useState(true);
  const [orgSaving, setOrgSaving] = useState(false);

  useEffect(() => {
    const loadOrg = async () => {
      setOrgLoading(true);
      try {
        const org = await fetchCurrent();
        if (org) {
          setOrgForm({
            name: org.name || '',
            short_name: org.short_name || '',
            type: org.type || 'other',
            contact_email: org.contact_email || '',
            contact_phone: org.contact_phone || '',
            address: org.address || '',
          });
        }
      } finally {
        setOrgLoading(false);
      }
    };

    loadOrg();
  }, [fetchCurrent]);

  const handleOrgSubmit = async (e) => {
    e.preventDefault();
    if (!isOrgEditor) return;
    if (!current?.id) {
      toast.error("Organisation introuvable");
      return;
    }
    setOrgSaving(true);
    try {
      const formData = new FormData();
      formData.append('name', orgForm.name);
      formData.append('short_name', orgForm.short_name || '');
      formData.append('type', orgForm.type);
      formData.append('contact_email', orgForm.contact_email || '');
      formData.append('contact_phone', orgForm.contact_phone || '');
      formData.append('address', orgForm.address || '');
      if (logoFile) formData.append('logo', logoFile);

      const { data } = await organizationsAPI.updateWithLogo(current.id, formData);
      const updated = data?.data ?? data;
      setCurrent(updated);
      setLogoFile(null);
      toast.success("Organisation mise à jour");
    } catch (err) {
      const msg =
        err.response?.data?.error?.message ||
        err.response?.data?.message ||
        "Erreur lors de l'enregistrement";
      toast.error(msg);
    } finally {
      setOrgSaving(false);
    }
  };

  const orgLogoUrl = current?.logo_path ? uploadsUrl(current.logo_path) : null;
  const TYPE_LABELS = {
    ministry: 'Ministère',
    agency: 'Agence',
    direction: 'Direction',
    other: 'Autre',
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-display-lg">Paramètres</h1>
        <p className="text-body-md text-ink-400 mt-1">Configuration générale de la plateforme</p>
      </div>

      {/* Organisation (mono-organisation) */}
      <Card
        title="Organisation"
        action={
          <Badge color={isOrgEditor ? 'info' : 'neutral'} size="sm">
            <Building2 className="w-3 h-3 inline mr-1" />
            {isOrgEditor ? 'Édition autorisée' : 'Lecture seule'}
          </Badge>
        }
      >
        {orgLoading ? (
          <div className="space-y-3">
            <div className="h-6 w-40 bg-surface-200 rounded" />
            <div className="h-28 w-full bg-surface-100 rounded-lg" />
          </div>
        ) : !current ? (
          <p className="text-body-sm text-warning-700">
            Aucune organisation configurée. Contactez un administrateur.
          </p>
        ) : (
          <form onSubmit={handleOrgSubmit} className="space-y-6">
            <div className="flex flex-col sm:flex-row gap-6">
              {/* Logo */}
              <div className="flex flex-col items-start gap-2">
                <div className="w-24 h-24 rounded-xl bg-surface-200 flex items-center justify-center overflow-hidden border-2 border-surface-300">
                  {orgLogoUrl ? (
                    <img src={orgLogoUrl} alt="Logo" className="w-full h-full object-contain" />
                  ) : (
                    <Building2 className="w-10 h-10 text-ink-400" />
                  )}
                </div>
                {isOrgEditor && (
                  <label className="flex items-center gap-2 text-body-sm text-primary-600 hover:text-primary-700 cursor-pointer">
                    <Upload className="w-4 h-4" />
                    <span>{logoFile ? logoFile.name : 'Changer le logo'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => setLogoFile(e.target.files?.[0] || null)}
                    />
                  </label>
                )}
              </div>

              <div className="flex-1 space-y-4">
                <Input
                  label="Nom complet"
                  value={orgForm.name}
                  onChange={(e) =>
                    setOrgForm((f) => ({ ...f, name: e.target.value }))
                  }
                  required
                  placeholder="Ex. Ministère de la Communication"
                  disabled={!isOrgEditor}
                />
                <Input
                  label="Nom court"
                  value={orgForm.short_name}
                  onChange={(e) =>
                    setOrgForm((f) => ({ ...f, short_name: e.target.value }))
                  }
                  placeholder="Nom affiché dans l'interface"
                  disabled={!isOrgEditor}
                />
                <div>
                  <label className="block text-body-sm font-medium text-ink-700 mb-1">
                    Type
                  </label>
                  <select
                    value={orgForm.type}
                    onChange={(e) =>
                      setOrgForm((f) => ({ ...f, type: e.target.value }))
                    }
                    disabled={!isOrgEditor}
                    className="w-full rounded-lg border border-surface-300 bg-white px-3 py-2 text-body-md text-ink-900 disabled:bg-surface-100 disabled:text-ink-400 focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
                  >
                    {Object.entries(TYPE_LABELS).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Email de contact"
                type="email"
                value={orgForm.contact_email}
                onChange={(e) =>
                  setOrgForm((f) => ({ ...f, contact_email: e.target.value }))
                }
                icon={Mail}
                placeholder="contact@organisation.gov"
                disabled={!isOrgEditor}
              />
              <Input
                label="Téléphone"
                value={orgForm.contact_phone}
                onChange={(e) =>
                  setOrgForm((f) => ({ ...f, contact_phone: e.target.value }))
                }
                icon={Phone}
                placeholder="+241 XX XX XX XX"
                disabled={!isOrgEditor}
              />
              <div className="md:col-span-2">
                <Input
                  label="Adresse"
                  value={orgForm.address}
                  onChange={(e) =>
                    setOrgForm((f) => ({ ...f, address: e.target.value }))
                  }
                  icon={MapPin}
                  placeholder="Adresse postale"
                  disabled={!isOrgEditor}
                />
              </div>
            </div>

            {isOrgEditor && (
              <div className="flex justify-end">
                <Button type="submit" loading={orgSaving} disabled={orgSaving}>
                  Enregistrer l'organisation
                </Button>
              </div>
            )}
          </form>
        )}
      </Card>

      {/* Agences & Directions — réservé admin */}
      {canManageAgenciesDirections && (
        <>
          <AgenciesSection />
          <DirectionsSection />
        </>
      )}

      {/* Templates d'événements (type + tâches pré-remplies) — uniquement super admin / admin */}
      {isAdmin && <EventTemplatesSection />}

      {/* Notifications */}
      <NotificationsSection />

      {/* Le reste (apparence / plateforme / sécurité) sera configuré plus tard */}
    </div>
  );
}

function AgenciesSection() {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: '', code: '' });
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await agenciesAPI.list();
      setList(Array.isArray(data?.data) ? data.data : data || []);
    } catch {
      toast.error('Erreur chargement des agences');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const openCreate = () => {
    setEditing(null);
    setForm({ name: '', code: '' });
    setModalOpen(true);
  };

  const openEdit = (row) => {
    setEditing(row);
    setForm({ name: row.name || '', code: row.code || '' });
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name?.trim()) {
      toast.error('Nom requis');
      return;
    }
    setSaving(true);
    try {
      if (editing) {
        await agenciesAPI.update(editing.id, form);
        toast.success('Agence mise à jour');
      } else {
        await agenciesAPI.create(form);
        toast.success('Agence créée');
      }
      setModalOpen(false);
      load();
    } catch (err) {
      const msg = err.response?.data?.error?.message || err.response?.data?.message || 'Erreur';
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Supprimer cette agence ? Les directions liées seront aussi supprimées.')) return;
    try {
      await agenciesAPI.remove(id);
      toast.success('Agence supprimée');
      load();
    } catch (err) {
      toast.error(err.response?.data?.error?.message || 'Erreur');
    }
  };

  return (
    <Card
      title="Agences"
      action={
        <Button size="sm" icon={Plus} onClick={openCreate}>
          Ajouter une agence
        </Button>
      }
    >
      {loading ? (
        <div className="h-24 bg-surface-100 rounded-lg animate-pulse" />
      ) : list.length === 0 ? (
        <p className="text-body-sm text-ink-400 py-4">Aucune agence. Ajoutez-en une pour les proposer dans les projets.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-surface-200">
                <th className="text-left text-label text-ink-500 font-medium py-2 pr-4">Nom</th>
                <th className="text-left text-label text-ink-500 font-medium py-2 pr-4">Code</th>
                <th className="text-right text-label text-ink-500 font-medium py-2">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-100">
              {list.map((row) => (
                <tr key={row.id}>
                  <td className="py-2 pr-4 text-body-md text-ink-900">{row.name}</td>
                  <td className="py-2 pr-4 text-body-sm text-ink-500">{row.code || '—'}</td>
                  <td className="py-2 text-right">
                    <button type="button" onClick={() => openEdit(row)} className="p-1.5 rounded-lg text-ink-400 hover:bg-surface-100 hover:text-primary-600">
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button type="button" onClick={() => handleDelete(row.id)} className="p-1.5 rounded-lg text-ink-400 hover:bg-surface-100 hover:text-danger-600">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Modifier l\'agence' : 'Nouvelle agence'} size="md">
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input label="Nom *" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="Ex. Agence de la communication" />
          <Input label="Code" value={form.code} onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))} placeholder="Ex. AG-COM" />
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => setModalOpen(false)}>Annuler</Button>
            <Button type="submit" loading={saving}>Enregistrer</Button>
          </div>
        </form>
      </Modal>
    </Card>
  );
}

function EventTemplatesSection() {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [assignableUsers, setAssignableUsers] = useState([]);
  const { isInternal } = usePermissions();
  const [form, setForm] = useState({
    name: '',
    tasks: [],
  });

  // Commentaire: charge les templates existants
  const loadTemplates = async () => {
    setLoading(true);
    try {
      const { data } = await calendarAPI.listEventTemplates();
      const items = Array.isArray(data?.data) ? data.data : data || [];
      setTemplates(items);
    } catch {
      toast.error('Erreur chargement des templates d’événement');
    } finally {
      setLoading(false);
    }
  };

  const loadUsers = async () => {
    try {
      if (isInternal) {
        const { data } = await usersAPI.listMembers({ page: 1, limit: 100 });
        const items = data?.data?.data || [];
        setAssignableUsers(items);
      } else {
        const { data } = await usersAPI.listClients({ page: 1, limit: 100 });
        const items = data?.data?.data || [];
        setAssignableUsers(items);
      }
    } catch {
      setAssignableUsers([]);
    }
  };

  useEffect(() => {
    loadUsers();
    loadTemplates();
  }, []);


  const openCreate = () => {
    setEditing(null);
    setForm({ name: '', tasks: [] });
    setModalOpen(true);
  };

  const openEdit = (tpl) => {
    setEditing(tpl);
    setForm({
      name: tpl.name || '',
      tasks: Array.isArray(tpl.tasks) ? tpl.tasks : [],
    });
    setModalOpen(true);
  };

  const handleAddTask = () => {
    setForm((prev) => ({
      ...prev,
      tasks: [...(prev.tasks || []), { title: '', status: 'pending', responsible_user_id: '' }],
    }));
  };

  const handleTaskChange = (index, key, value) => {
    setForm((prev) => {
      const tasks = (prev.tasks || []).slice();
      tasks[index] = { ...tasks[index], [key]: value };
      return { ...prev, tasks };
    });
  };

  const handleRemoveTask = (index) => {
    setForm((prev) => {
      const tasks = (prev.tasks || []).slice();
      tasks.splice(index, 1);
      return { ...prev, tasks };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name?.trim()) {
      toast.error('Nom du template requis');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        tasks: (form.tasks || []).filter((t) => t.title?.trim()),
      };
      if (editing) {
        await calendarAPI.updateEventTemplate(editing.id, payload);
        toast.success('Template d’événement mis à jour');
      } else {
        await calendarAPI.createEventTemplate(payload);
        toast.success('Template d’événement créé');
      }
      setModalOpen(false);
      loadTemplates();
    } catch (err) {
      const details = formatErrorMessage(err);
      details.forEach((d) => toast.error(d.message));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (tpl) => {
    if (!window.confirm('Supprimer ce template d’événement ?')) return;
    try {
      await calendarAPI.removeEventTemplate(tpl.id);
      toast.success('Template supprimé');
      loadTemplates();
    } catch (err) {
      const details = formatErrorMessage(err);
      details.forEach((d) => toast.error(d.message));
    }
  };

  return (
    <Card
      title="Templates d’événements"
      action={
        <Button variant="ghost" size="sm" icon={Plus} onClick={openCreate}>
          Nouveau template
        </Button>
      }
    >
      {loading ? (
        <div className="space-y-2">
          <div className="h-5 w-1/3 bg-surface-200 rounded" />
          <div className="h-24 w-full bg-surface-100 rounded" />
        </div>
      ) : templates.length === 0 ? (
        <p className="text-body-sm text-ink-400">
          Aucun template pour l’instant. Créez un type d’événement avec des tâches pré-remplies afin de gagner du temps lors de la création d’un événement.
        </p>
      ) : (
        <div className="space-y-3">
          {templates.map((tpl) => (
            <div
              key={tpl.id}
              className="flex items-start justify-between gap-3 rounded-lg border border-surface-200 bg-surface-50 px-3 py-2"
            >
              <div className="flex-1">
                <p className="text-body-md font-medium text-ink-900">{tpl.name}</p>
                {Array.isArray(tpl.tasks) && tpl.tasks.length > 0 && (
                  <p className="text-body-xs text-ink-400 mt-1">
                    {tpl.tasks.length} tâche{tpl.tasks.length > 1 ? 's' : ''} pré-configurée{tpl.tasks.length > 1 ? 's' : ''}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  icon={Pencil}
                  onClick={() => openEdit(tpl)}
                >
                  Modifier
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  icon={Trash2}
                  onClick={() => handleDelete(tpl)}
                >
                  Supprimer
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Modifier le template' : 'Nouveau template d’événement'}
        size="lg"
        footer={
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => setModalOpen(false)}>
              Annuler
            </Button>
            <Button type="submit" form="event-template-form" loading={saving}>
              Enregistrer
            </Button>
          </div>
        }
      >
        <form id="event-template-form" onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Nom du template *"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            placeholder="Ex. Conférence de presse, Couverture d’événement…"
          />
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-label text-ink-700">Tâches du template</p>
              <Button type="button" variant="ghost" size="sm" onClick={handleAddTask}>
                Ajouter une tâche
              </Button>
            </div>
            {(!form.tasks || form.tasks.length === 0) && (
              <p className="text-body-sm text-ink-400">
                Ajoutez quelques tâches types qui seront pré-remplies lors de la création d’un événement.
              </p>
            )}
            {(form.tasks || []).map((task, index) => (
              <div
                key={index}
                className="grid grid-cols-[minmax(0,2fr)_minmax(0,2fr)_minmax(0,1.5fr)_auto] gap-2 items-start"
              >
                <Input
                  label={index === 0 ? 'Titre' : undefined}
                  value={task.title}
                  onChange={(e) => handleTaskChange(index, 'title', e.target.value)}
                  placeholder="Intitulé de la tâche"
                />
                <Textarea
                  label={index === 0 ? 'Description' : undefined}
                  value={task.description || ''}
                  onChange={(e) => handleTaskChange(index, 'description', e.target.value)}
                  rows={2}
                />
                <Select
                  label={index === 0 ? 'Responsable' : undefined}
                  value={task.responsible_user_id || ''}
                  onChange={(e) =>
                    handleTaskChange(index, 'responsible_user_id', e.target.value)
                  }
                  options={assignableUsers.map((u) => ({
                    value: u.id,
                    label: `${u.first_name} ${u.last_name}`,
                  }))}
                />
                <button
                  type="button"
                  onClick={() => handleRemoveTask(index)}
                  className="mt-7 p-2 rounded-lg text-ink-400 hover:bg-surface-200"
                  aria-label="Supprimer la tâche"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </form>
      </Modal>
    </Card>
  );
}

function NotificationsSection() {
  const { user, setUser } = useAuthStore();
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState({
    email_enabled: true,
    tasks_enabled: true,
    validations_enabled: true,
    events_enabled: true,
    weekly_summary_enabled: false,
  });

  useEffect(() => {
    const raw = user?.notification_settings || {};
    setSettings({
      email_enabled: raw.email_enabled !== false,
      tasks_enabled: raw.tasks_enabled !== false,
      validations_enabled: raw.validations_enabled !== false,
      events_enabled: raw.events_enabled !== false,
      weekly_summary_enabled: raw.weekly_summary_enabled === true,
    });
  }, [user]);

  const updateSetting = async (key, value) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
    setSaving(true);
    try {
      const payload = { [key]: value };
      const { data } = await usersAPI.updateNotificationSettings(payload);
      const updatedUser = data?.data || data;
      if (updatedUser) {
        setUser(updatedUser);
      }
    } catch (err) {
      const msg =
        err.response?.data?.error?.message ||
        err.response?.data?.message ||
        "Erreur lors de la mise à jour des notifications";
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card
      title="Notifications"
      action={
        <Badge color="info" size="sm">
          <Bell className="w-3 h-3 inline mr-1" />
          Préférences
        </Badge>
      }
    >
      <div className="space-y-4">
        <ToggleSetting
          label="Notifications par email"
          description="Recevoir un email pour chaque notification importante"
          checked={settings.email_enabled}
          onChange={(val) => updateSetting('email_enabled', val)}
        />
        <ToggleSetting
          label="Notifications de tâches"
          description="Être notifié quand une tâche vous est assignée"
          checked={settings.tasks_enabled}
          onChange={(val) => updateSetting('tasks_enabled', val)}
        />
        <ToggleSetting
          label="Alertes de validation"
          description="Recevoir une alerte quand une proposition est en attente de validation"
          checked={settings.validations_enabled}
          onChange={(val) => updateSetting('validations_enabled', val)}
        />
        <ToggleSetting
          label="Notifications d’événements"
          description="Être notifié des événements importants du calendrier"
          checked={settings.events_enabled}
          onChange={(val) => updateSetting('events_enabled', val)}
        />
        <ToggleSetting
          label="Résumé hebdomadaire"
          description="Recevoir un récapitulatif hebdomadaire par email"
          checked={settings.weekly_summary_enabled}
          onChange={(val) => updateSetting('weekly_summary_enabled', val)}
        />
        {saving && (
          <p className="text-body-xs text-ink-400">
            Enregistrement des préférences...
          </p>
        )}
      </div>
    </Card>
  );
}

function DirectionsSection() {
  const [agencies, setAgencies] = useState([]);
  const [list, setList] = useState([]);
  const [filterAgencyId, setFilterAgencyId] = useState('');
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: '', code: '', agency_id: '' });
  const [saving, setSaving] = useState(false);

  const loadAgencies = async () => {
    try {
      const { data } = await agenciesAPI.list();
      setAgencies(Array.isArray(data?.data) ? data.data : data || []);
    } catch {}
  };

  const loadDirections = async () => {
    setLoading(true);
    try {
      const params = filterAgencyId === '' ? { agency_id: 'null' } : { agency_id: filterAgencyId };
      const { data } = await directionsAPI.list(params);
      setList(Array.isArray(data?.data) ? data.data : data || []);
    } catch {
      toast.error('Erreur chargement des directions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAgencies();
  }, []);

  useEffect(() => {
    loadDirections();
  }, [filterAgencyId]);

  const openCreate = () => {
    setEditing(null);
    setForm({ name: '', code: '', agency_id: filterAgencyId || '' });
    setModalOpen(true);
  };

  const openEdit = (row) => {
    setEditing(row);
    setForm({ name: row.name || '', code: row.code || '', agency_id: row.agency_id || '' });
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name?.trim()) {
      toast.error('Nom requis');
      return;
    }
    setSaving(true);
    try {
      const payload = { name: form.name.trim(), code: form.code?.trim() || null, agency_id: form.agency_id || null };
      if (editing) {
        await directionsAPI.update(editing.id, payload);
        toast.success('Direction mise à jour');
      } else {
        await directionsAPI.create(payload);
        toast.success('Direction créée');
      }
      setModalOpen(false);
      loadDirections();
    } catch (err) {
      const msg = err.response?.data?.error?.message || err.response?.data?.message || 'Erreur';
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Supprimer cette direction ?')) return;
    try {
      await directionsAPI.remove(id);
      toast.success('Direction supprimée');
      loadDirections();
    } catch (err) {
      toast.error(err.response?.data?.error?.message || 'Erreur');
    }
  };

  const filterLabel = filterAgencyId === '' ? 'Directions du ministère' : `Directions de l'agence`;

  return (
    <Card
      title="Directions"
      action={
        <Button size="sm" icon={Plus} onClick={openCreate}>
          Ajouter une direction
        </Button>
      }
    >
      <div className="mb-4">
        <label className="block text-body-sm font-medium text-ink-700 mb-1">Contexte</label>
        <select
          value={filterAgencyId}
          onChange={(e) => setFilterAgencyId(e.target.value)}
          className="w-full max-w-xs rounded-lg border border-surface-300 bg-white px-3 py-2 text-body-md text-ink-900"
        >
          <option value="">Directions du ministère</option>
          {agencies.map((a) => (
            <option key={a.id} value={a.id}>Directions de : {a.name}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="h-24 bg-surface-100 rounded-lg animate-pulse" />
      ) : list.length === 0 ? (
        <p className="text-body-sm text-ink-400 py-4">Aucune direction dans ce contexte.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-surface-200">
                <th className="text-left text-label text-ink-500 font-medium py-2 pr-4">Nom</th>
                <th className="text-left text-label text-ink-500 font-medium py-2 pr-4">Code</th>
                <th className="text-right text-label text-ink-500 font-medium py-2">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-100">
              {list.map((row) => (
                <tr key={row.id}>
                  <td className="py-2 pr-4 text-body-md text-ink-900">{row.name}</td>
                  <td className="py-2 pr-4 text-body-sm text-ink-500">{row.code || '—'}</td>
                  <td className="py-2 text-right">
                    <button type="button" onClick={() => openEdit(row)} className="p-1.5 rounded-lg text-ink-400 hover:bg-surface-100 hover:text-primary-600">
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button type="button" onClick={() => handleDelete(row.id)} className="p-1.5 rounded-lg text-ink-400 hover:bg-surface-100 hover:text-danger-600">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Modifier la direction' : 'Nouvelle direction'} size="md">
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input label="Nom *" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="Ex. Direction de la communication" />
          <Input label="Code" value={form.code} onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))} placeholder="Ex. DC" />
          <div>
            <label className="block text-body-sm font-medium text-ink-700 mb-1">Rattachement</label>
            <select
              value={form.agency_id}
              onChange={(e) => setForm((f) => ({ ...f, agency_id: e.target.value }))}
              className="w-full rounded-lg border border-surface-300 bg-white px-3 py-2 text-body-md text-ink-900"
            >
              <option value="">Ministère (direction centrale)</option>
              {agencies.map((a) => (
                <option key={a.id} value={a.id}>{a.name}</option>
              ))}
            </select>
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => setModalOpen(false)}>Annuler</Button>
            <Button type="submit" loading={saving}>Enregistrer</Button>
          </div>
        </form>
      </Modal>
    </Card>
  );
}

function ToggleSetting({ label, description, defaultChecked = false, checked, onChange }) {
  const [internalChecked, setInternalChecked] = useState(defaultChecked);
  const isControlled = typeof checked === 'boolean';
  const value = isControlled ? checked : internalChecked;

  const toggle = () => {
    const next = !value;
    if (!isControlled) setInternalChecked(next);
    if (onChange) onChange(next);
  };

  return (
    <div className="flex items-center justify-between py-1">
      <div>
        <p className="text-body-md font-medium text-ink-700">{label}</p>
        {description && <p className="text-body-sm text-ink-400 mt-0.5">{description}</p>}
      </div>
      <button
        onClick={toggle}
        className={`relative w-11 h-6 rounded-full transition-colors duration-200 ${value ? 'bg-primary-500' : 'bg-surface-300'}`}
      >
        <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform duration-200 ${value ? 'translate-x-5' : ''}`} />
      </button>
    </div>
  );
}
