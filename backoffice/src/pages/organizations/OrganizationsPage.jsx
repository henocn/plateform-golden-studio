import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Building2, Users, FolderKanban, MoreVertical } from 'lucide-react';
import { Card, Button, Badge, SearchInput, Pagination, EmptyState, Skeleton, Modal, Input, Select } from '../../components/ui';
import { organizationsAPI } from '../../api/services';
import { usePagination, useDebounce } from '../../hooks';
import { formatDate } from '../../utils/helpers';
import toast from 'react-hot-toast';

export default function OrganizationsPage() {
  const navigate = useNavigate();
  const [orgs, setOrgs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search);
  const pagination = usePagination();
  const [showCreate, setShowCreate] = useState(false);

  const loadOrgs = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await organizationsAPI.list({
        page: pagination.page,
        limit: pagination.limit,
        search: debouncedSearch || undefined,
      });
      const result = data.data;
      setOrgs(result.rows || result);
      pagination.setTotal(result.count || result.length || 0);
    } catch (err) {
      toast.error('Erreur lors du chargement des organisations');
    } finally {
      setLoading(false);
    }
  }, [pagination.page, debouncedSearch]);

  useEffect(() => { loadOrgs(); }, [loadOrgs]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-display-lg">Organisations</h1>
          <p className="text-body-md text-ink-500 mt-1">Institutions clientes partenaires</p>
        </div>
        <Button icon={Plus} onClick={() => setShowCreate(true)}>
          Nouvelle organisation
        </Button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Rechercher une organisation…"
          className="w-72"
        />
      </div>

      {/* Table */}
      <Card padding={false}>
        {loading ? (
          <div className="p-5">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 py-3">
                <Skeleton className="w-10 h-10 rounded-xl" />
                <Skeleton className="h-4 flex-1" />
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-24" />
              </div>
            ))}
          </div>
        ) : orgs.length === 0 ? (
          <EmptyState
            icon={Building2}
            title="Aucune organisation"
            description="Créez votre première organisation cliente"
            action={<Button icon={Plus} onClick={() => setShowCreate(true)}>Créer</Button>}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-surface-200">
                  <th className="text-left text-label text-ink-500 font-medium px-5 py-3">Organisation</th>
                  <th className="text-left text-label text-ink-500 font-medium px-5 py-3">Type</th>
                  <th className="text-left text-label text-ink-500 font-medium px-5 py-3">Contact</th>
                  <th className="text-left text-label text-ink-500 font-medium px-5 py-3">Statut</th>
                  <th className="text-left text-label text-ink-500 font-medium px-5 py-3">Date</th>
                  <th className="px-5 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-200">
                {orgs.map((org) => (
                  <tr
                    key={org.id}
                    className="hover:bg-surface-100 cursor-pointer transition-default"
                    onClick={() => navigate(`/organizations/${org.id}`)}
                  >
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-primary-50 flex items-center justify-center shrink-0">
                          <Building2 className="w-4 h-4 text-primary-500" />
                        </div>
                        <div>
                          <p className="text-body-md font-medium text-ink-900">{org.name}</p>
                          <p className="text-body-sm text-ink-400">{org.short_name}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <Badge color="info" size="sm">{org.type || 'ministry'}</Badge>
                    </td>
                    <td className="px-5 py-3 text-body-sm text-ink-500">{org.contact_email || '—'}</td>
                    <td className="px-5 py-3">
                      <Badge color={org.is_active ? 'success' : 'neutral'} dot size="sm">
                        {org.is_active ? 'Actif' : 'Inactif'}
                      </Badge>
                    </td>
                    <td className="px-5 py-3 text-body-sm text-ink-400">{formatDate(org.created_at)}</td>
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

        {!loading && orgs.length > 0 && (
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

      {/* Create Modal */}
      <CreateOrganizationModal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        onCreated={() => { setShowCreate(false); loadOrgs(); }}
      />
    </div>
  );
}

function CreateOrganizationModal({ open, onClose, onCreated }) {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: '', short_name: '', type: 'ministry', contact_email: '', contact_phone: '', address: '',
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await organizationsAPI.create(form);
      toast.success('Organisation créée avec succès');
      onCreated();
    } catch (err) {
      toast.error(err.response?.data?.error?.message || 'Erreur lors de la création');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Nouvelle organisation" size="md"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Annuler</Button>
          <Button loading={loading} onClick={handleSubmit}>Créer</Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input label="Nom" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Ministère de…" />
        <Input label="Nom court" required value={form.short_name} onChange={(e) => setForm({ ...form, short_name: e.target.value })} placeholder="MIPISE" />
        <Select label="Type" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}
          options={[
            { value: 'ministry', label: 'Ministère' },
            { value: 'agency', label: 'Agence' },
            { value: 'institution', label: 'Institution' },
            { value: 'enterprise', label: 'Entreprise' },
          ]}
        />
        <Input label="Email de contact" type="email" value={form.contact_email} onChange={(e) => setForm({ ...form, contact_email: e.target.value })} />
        <Input label="Téléphone" value={form.contact_phone} onChange={(e) => setForm({ ...form, contact_phone: e.target.value })} />
        <Input label="Adresse" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
      </form>
    </Modal>
  );
}
