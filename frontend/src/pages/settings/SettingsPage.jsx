import { useState, useEffect } from 'react';
import {
  Settings as SettingsIcon,
  Bell,
  Building2,
  Upload,
  Mail,
  Phone,
  MapPin,
} from 'lucide-react';
import { Card, Button, Input, Select, Badge } from '../../components/ui';
import { useAuthStore } from '../../store/authStore';
import { useOrganizationStore } from '../../store/organizationStore';
import { organizationsAPI, uploadsUrl } from '../../api/services';
import toast from 'react-hot-toast';

export default function SettingsPage() {
  const { user } = useAuthStore();
  const { current, fetchCurrent, setCurrent } = useOrganizationStore();

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

      {/* Notifications */}
      <Card title="Notifications" action={<Badge color="info" size="sm"><Bell className="w-3 h-3 inline mr-1" />Préférences</Badge>}>
        <div className="space-y-4">
          <ToggleSetting
            label="Notifications par email"
            description="Recevoir un email pour chaque notification importante"
            defaultChecked
          />
          <ToggleSetting
            label="Notifications de tâches"
            description="Être notifié quand une tâche vous est assignée"
            defaultChecked
          />
          <ToggleSetting
            label="Alertes de validation"
            description="Recevoir une alerte quand une proposition est en attente de validation"
            defaultChecked
          />
          <ToggleSetting
            label="Résumé hebdomadaire"
            description="Recevoir un récapitulatif hebdomadaire par email"
          />
        </div>
      </Card>

      {/* Le reste (apparence / plateforme / sécurité) sera configuré plus tard */}
    </div>
  );
}

function ToggleSetting({ label, description, defaultChecked = false }) {
  const [checked, setChecked] = useState(defaultChecked);

  return (
    <div className="flex items-center justify-between py-1">
      <div>
        <p className="text-body-md font-medium text-ink-700">{label}</p>
        {description && <p className="text-body-sm text-ink-400 mt-0.5">{description}</p>}
      </div>
      <button
        onClick={() => setChecked(!checked)}
        className={`relative w-11 h-6 rounded-full transition-colors duration-200 ${checked ? 'bg-primary-500' : 'bg-surface-300'}`}
      >
        <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform duration-200 ${checked ? 'translate-x-5' : ''}`} />
      </button>
    </div>
  );
}
