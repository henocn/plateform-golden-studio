import { useState, useEffect, useCallback } from 'react';
import { Plus, Users as UsersIcon, UserPlus, MoreVertical } from 'lucide-react';
import { Card, Button, Badge, SearchInput, Pagination, EmptyState, Skeleton, Modal, Input, Select, Tabs, Avatar } from '../../components/ui';
import { usersAPI, organizationsAPI } from '../../api/services';
import { usePagination, useDebounce } from '../../hooks';
import { formatDate, ROLE_LABELS } from '../../utils/helpers';
import { useAuthStore } from '../../store/authStore';
import toast from 'react-hot-toast';

export default function UsersPage() {
  const { user: currentUser } = useAuthStore();
  const [activeTab, setActiveTab] = useState('internal');
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search);
  const pagination = usePagination();
  const [showCreate, setShowCreate] = useState(false);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    try {
      const apiFn = activeTab === 'internal' ? usersAPI.listInternal : usersAPI.listClients;
      const { data } = await apiFn({
        page: pagination.page,
        limit: pagination.limit,
        search: debouncedSearch || undefined,
      });
      const result = data.data;
      setUsers(result.rows || result);
      pagination.setTotal(result.count || result.length || 0);
    } catch (err) {
      toast.error('Erreur lors du chargement des utilisateurs');
    } finally {
      setLoading(false);
    }
  }, [activeTab, pagination.page, debouncedSearch]);

  useEffect(() => { loadUsers(); }, [loadUsers]);

  const tabs = [
    { id: 'internal', label: 'Internes' },
    { id: 'clients', label: 'Clients' },
  ];

  const getRoleBadge = (role) => {
    const info = ROLE_LABELS[role];
    if (!info) return <Badge size="sm">{role}</Badge>;
    return (
      <span
        className="inline-flex items-center gap-1 px-2 py-0.5 text-body-sm font-medium rounded-full"
        style={{ backgroundColor: info.color + '15', color: info.color }}
      >
        <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: info.color }} />
        {info.label}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-display-lg">Utilisateurs</h1>
          <p className="text-body-md text-ink-500 mt-1">Gestion des comptes internes et clients</p>
        </div>
        <Button icon={UserPlus} onClick={() => setShowCreate(true)}>
          Nouvel utilisateur
        </Button>
      </div>

      <Tabs tabs={tabs} activeTab={activeTab} onChange={(t) => { setActiveTab(t); pagination.setPage(1); }} />

      <div className="flex items-center gap-3">
        <SearchInput value={search} onChange={setSearch} placeholder="Rechercher par nom, email…" className="w-72" />
      </div>

      <Card padding={false}>
        {loading ? (
          <div className="p-5 space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4">
                <Skeleton className="w-10 h-10 rounded-full" />
                <Skeleton className="h-4 flex-1" />
                <Skeleton className="h-4 w-20" />
              </div>
            ))}
          </div>
        ) : users.length === 0 ? (
          <EmptyState icon={UsersIcon} title="Aucun utilisateur" description="Créez votre premier utilisateur" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-surface-200">
                  <th className="text-left text-label text-ink-500 font-medium px-5 py-3">Utilisateur</th>
                  <th className="text-left text-label text-ink-500 font-medium px-5 py-3">Rôle</th>
                  {activeTab === 'clients' && <th className="text-left text-label text-ink-500 font-medium px-5 py-3">Organisation</th>}
                  <th className="text-left text-label text-ink-500 font-medium px-5 py-3">Statut</th>
                  <th className="text-left text-label text-ink-500 font-medium px-5 py-3">Dernière connexion</th>
                  <th className="px-5 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-200">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-surface-100 transition-default">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <Avatar firstName={u.first_name} lastName={u.last_name} size="sm" />
                        <div>
                          <p className="text-body-md font-medium text-ink-900">{u.first_name} {u.last_name}</p>
                          <p className="text-body-sm text-ink-400">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3">{getRoleBadge(u.role)}</td>
                    {activeTab === 'clients' && (
                      <td className="px-5 py-3 text-body-sm text-ink-500">{u.Organization?.name || u.organization?.name || '—'}</td>
                    )}
                    <td className="px-5 py-3">
                      <Badge color={u.is_active ? 'success' : 'neutral'} dot size="sm">
                        {u.is_active ? 'Actif' : 'Inactif'}
                      </Badge>
                    </td>
                    <td className="px-5 py-3 text-body-sm text-ink-400">{formatDate(u.last_login_at) || '—'}</td>
                    <td className="px-5 py-3">
                      <button className="p-1 rounded-lg text-ink-400 hover:bg-surface-200 transition-default">
                        <MoreVertical className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {!loading && users.length > 0 && (
          <div className="px-5 border-t border-surface-200">
            <Pagination page={pagination.page} totalPages={pagination.totalPages} total={pagination.total} limit={pagination.limit} onPageChange={pagination.setPage} />
          </div>
        )}
      </Card>

      {/* Create Modal */}
      <CreateUserModal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        onCreated={() => { setShowCreate(false); loadUsers(); }}
        type={activeTab}
      />
    </div>
  );
}

function CreateUserModal({ open, onClose, onCreated, type }) {
  const [loading, setLoading] = useState(false);
  const [orgs, setOrgs] = useState([]);
  const [form, setForm] = useState({
    email: '', password: '', first_name: '', last_name: '',
    role: type === 'internal' ? 'contributor' : 'client_reader',
    organization_id: '', job_title: '',
  });

  useEffect(() => {
    if (open && type === 'clients') {
      organizationsAPI.list({ limit: 100 }).then(({ data }) => {
        setOrgs(data.data?.rows || data.data || []);
      }).catch(() => {});
    }
  }, [open, type]);

  const internalRoles = [
    { value: 'admin', label: 'Admin' },
    { value: 'validator', label: 'Validateur' },
    { value: 'contributor', label: 'Contributeur' },
    { value: 'viewer', label: 'Lecteur' },
  ];

  const clientRoles = [
    { value: 'client_admin', label: 'Client Admin' },
    { value: 'client_validator', label: 'Client Validateur' },
    { value: 'client_contributor', label: 'Client Contributeur' },
    { value: 'client_reader', label: 'Client Lecteur' },
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (type === 'internal') {
        await usersAPI.createInternal(form);
      } else {
        await usersAPI.createClient(form);
      }
      toast.success('Utilisateur créé avec succès');
      onCreated();
    } catch (err) {
      toast.error(err.response?.data?.error?.message || 'Erreur lors de la création');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title={`Nouvel utilisateur ${type === 'internal' ? 'interne' : 'client'}`} size="md"
      footer={<><Button variant="ghost" onClick={onClose}>Annuler</Button><Button loading={loading} onClick={handleSubmit}>Créer</Button></>}
    >
      <form className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <Input label="Prénom" required value={form.first_name} onChange={(e) => setForm({ ...form, first_name: e.target.value })} />
          <Input label="Nom" required value={form.last_name} onChange={(e) => setForm({ ...form, last_name: e.target.value })} />
        </div>
        <Input label="Email" type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        <Input label="Mot de passe" type="password" required value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} hint="Min. 8 caractères" />
        <Select label="Rôle" required value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} options={type === 'internal' ? internalRoles : clientRoles} />
        {type === 'clients' && (
          <Select label="Organisation" required value={form.organization_id} onChange={(e) => setForm({ ...form, organization_id: e.target.value })}
            options={orgs.map((o) => ({ value: o.id, label: o.name }))}
          />
        )}
        <Input label="Poste" value={form.job_title} onChange={(e) => setForm({ ...form, job_title: e.target.value })} />
      </form>
    </Modal>
  );
}
