import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  ScrollText, Shield, User, Clock, Database, ChevronDown, ChevronRight,
} from 'lucide-react';
import {
  Card, Badge, Select, SearchInput, Pagination, EmptyState, Skeleton,
} from '../../components/ui';
import { auditAPI } from '../../api/services';
import { formatDate, formatRelative, extractList } from '../../utils/helpers';
import toast from 'react-hot-toast';

const actionColors = {
  CREATE: 'success',
  UPDATE: 'info',
  DELETE: 'danger',
  LOGIN: 'warning',
  LOGOUT: 'neutral',
};

const actionLabels = {
  CREATE: 'Création',
  UPDATE: 'Modification',
  DELETE: 'Suppression',
  LOGIN: 'Connexion',
  LOGOUT: 'Déconnexion',
};

export default function AuditPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [logs, setLogs] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [expandedRow, setExpandedRow] = useState(null);

  const page = parseInt(searchParams.get('page') || '1');
  const action = searchParams.get('action') || '';
  const entity = searchParams.get('entity') || '';
  const search = searchParams.get('q') || '';

  useEffect(() => { loadLogs(); }, [page, action, entity, search]);

  const loadLogs = async () => {
    setLoading(true);
    try {
      const params = { page, limit: 30 };
      if (action) params.action = action;
      if (entity) params.entity_type = entity;
      if (search) params.search = search;
      const { data } = await auditAPI.list(params);
      const { items, total: t } = extractList(data.data);
      setLogs(items);
      setTotal(t);
    } catch {
      toast.error('Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  const updateParam = (key, value) => {
    const p = new URLSearchParams(searchParams);
    if (value) p.set(key, value); else p.delete(key);
    if (key !== 'page') p.set('page', '1');
    setSearchParams(p);
  };

  const entities = ['User', 'Organization', 'Project', 'Task', 'Proposal', 'Validation', 'Publication', 'CalendarEvent', 'Media'];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-display-lg">Journal d'audit</h1>
        <p className="text-body-md text-ink-400 mt-1">Historique complet des actions du système — lecture seule</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <SearchInput value={search} onChange={(v) => updateParam('q', v)} placeholder="Rechercher par utilisateur…" className="w-64" />
        <Select value={action} onChange={(e) => updateParam('action', e.target.value)} className="w-40">
          <option value="">Toutes les actions</option>
          {Object.entries(actionLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </Select>
        <Select value={entity} onChange={(e) => updateParam('entity', e.target.value)} className="w-44">
          <option value="">Toutes les entités</option>
          {entities.map((e) => <option key={e} value={e}>{e}</option>)}
        </Select>
      </div>

      {/* Audit Table */}
      {loading ? (
        <div className="space-y-2">{[1,2,3,4,5].map((i) => <Skeleton key={i} className="h-14 rounded-lg" />)}</div>
      ) : logs.length === 0 ? (
        <EmptyState icon={ScrollText} title="Aucune entrée" description="Le journal d'audit est vide pour les filtres sélectionnés" />
      ) : (
        <Card padding={false}>
          <table className="w-full">
            <thead>
              <tr className="border-b border-surface-200">
                <th className="w-8 px-3 py-3"></th>
                <th className="text-left text-label text-ink-500 font-medium px-4 py-3">Date</th>
                <th className="text-left text-label text-ink-500 font-medium px-4 py-3">Utilisateur</th>
                <th className="text-left text-label text-ink-500 font-medium px-4 py-3">Action</th>
                <th className="text-left text-label text-ink-500 font-medium px-4 py-3">Entité</th>
                <th className="text-left text-label text-ink-500 font-medium px-4 py-3">ID Entité</th>
                <th className="text-left text-label text-ink-500 font-medium px-4 py-3">IP</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-100">
              {logs.map((log) => {
                const isExpanded = expandedRow === log.id;
                const hasDetails = log.old_values || log.new_values;
                return (
                  <>
                    <tr
                      key={log.id}
                      onClick={() => hasDetails && setExpandedRow(isExpanded ? null : log.id)}
                      className={`hover:bg-surface-50 transition-default ${hasDetails ? 'cursor-pointer' : ''}`}
                    >
                      <td className="px-3 py-3 text-ink-400">
                        {hasDetails ? (
                          isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />
                        ) : <div className="w-4 h-4" />}
                      </td>
                      <td className="px-4 py-3">
                        <div>
                          <p className="text-body-sm text-ink-700">{formatDate(log.created_at)}</p>
                          <p className="text-body-sm text-ink-400">{formatRelative(log.created_at)}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg bg-primary-50 flex items-center justify-center">
                            <User className="w-3.5 h-3.5 text-primary-500" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-body-sm font-medium text-ink-700 truncate">
                              {log.User?.first_name || '—'} {log.User?.last_name || ''}
                            </p>
                            <p className="text-body-sm text-ink-400 truncate">{log.User?.email || ''}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <Badge color={actionColors[log.action] || 'neutral'} dot size="sm">
                          {actionLabels[log.action] || log.action}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5 text-body-sm text-ink-500">
                          <Database className="w-3.5 h-3.5 text-ink-400" />
                          {log.entity_type}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-body-sm text-ink-400 font-mono">{log.entity_id || '—'}</td>
                      <td className="px-4 py-3 text-body-sm text-ink-400">{log.ip_address || '—'}</td>
                    </tr>
                    {/* Expanded detail row */}
                    {isExpanded && hasDetails && (
                      <tr key={`${log.id}-detail`}>
                        <td colSpan={7} className="px-8 py-4 bg-surface-50/50">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {log.old_values && (
                              <div>
                                <h5 className="text-label font-semibold text-ink-500 mb-2 flex items-center gap-1.5">
                                  <span className="w-2 h-2 rounded-full bg-danger-400" /> Anciennes valeurs
                                </h5>
                                <DiffView data={log.old_values} />
                              </div>
                            )}
                            {log.new_values && (
                              <div>
                                <h5 className="text-label font-semibold text-ink-500 mb-2 flex items-center gap-1.5">
                                  <span className="w-2 h-2 rounded-full bg-success-400" /> Nouvelles valeurs
                                </h5>
                                <DiffView data={log.new_values} />
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                );
              })}
            </tbody>
          </table>
        </Card>
      )}

      <Pagination page={page} totalPages={Math.ceil(total / 30) || 1} total={total} limit={30} onPageChange={(p) => updateParam('page', String(p))} />
    </div>
  );
}

function DiffView({ data }) {
  const obj = typeof data === 'string' ? JSON.parse(data) : data || {};
  const entries = Object.entries(obj);
  if (entries.length === 0) return <p className="text-body-sm text-ink-400">Aucune donnée</p>;

  return (
    <div className="bg-white rounded-lg border border-surface-200 overflow-hidden">
      {entries.map(([key, value]) => (
        <div key={key} className="flex border-b border-surface-100 last:border-0">
          <div className="px-3 py-1.5 bg-surface-50 text-body-sm font-medium text-ink-500 w-40 shrink-0">{key}</div>
          <div className="px-3 py-1.5 text-body-sm text-ink-700 truncate">{typeof value === 'object' ? JSON.stringify(value) : String(value ?? '—')}</div>
        </div>
      ))}
    </div>
  );
}
