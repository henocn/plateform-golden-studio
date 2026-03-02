import { useState, useEffect } from 'react';
import { Building2, Upload, Mail, Phone, MapPin } from 'lucide-react';
import { Card, Button, Input, Skeleton } from '../../components/ui';
import { organizationsAPI, uploadsUrl } from '../../api/services';
import { useOrganizationStore } from '../../store/organizationStore';
import toast from 'react-hot-toast';

const TYPE_LABELS = {
  ministry: 'Ministère',
  agency: 'Agence',
  direction: 'Direction',
  other: 'Autre',
};

export default function OrganizationPage() {
  const { current, fetchCurrent, setCurrent } = useOrganizationStore();
  const [form, setForm] = useState({
    name: '',
    short_name: '',
    type: 'other',
    contact_email: '',
    contact_phone: '',
    address: '',
  });
  const [logoFile, setLogoFile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadCurrent();
  }, []);

  const loadCurrent = async () => {
    setLoading(true);
    try {
      const org = await fetchCurrent();
      if (org) {
        setForm({
          name: org.name || '',
          short_name: org.short_name || '',
          type: org.type || 'other',
          contact_email: org.contact_email || '',
          contact_phone: org.contact_phone || '',
          address: org.address || '',
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!current?.id) {
      toast.error('Organisation introuvable');
      return;
    }
    setSaving(true);
    try {
      const formData = new FormData();
      formData.append('name', form.name);
      formData.append('short_name', form.short_name || '');
      formData.append('type', form.type);
      formData.append('contact_email', form.contact_email || '');
      formData.append('contact_phone', form.contact_phone || '');
      formData.append('address', form.address || '');
      if (logoFile) formData.append('logo', logoFile);

      const { data } = await organizationsAPI.updateWithLogo(current.id, formData);
      const updated = data?.data ?? data;
      setCurrent(updated);
      setLogoFile(null);
      toast.success('Organisation mise à jour');
      loadCurrent();
    } catch (err) {
      const msg = err.response?.data?.error?.message || err.response?.data?.message || 'Erreur lors de l\'enregistrement';
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 rounded-xl" />
      </div>
    );
  }

  if (!current) {
    return (
      <div className="rounded-xl border border-warning-200 bg-warning-50 p-6 text-warning-800">
        <p className="font-medium">Aucune organisation configurée.</p>
        <p className="text-body-sm mt-1">Vérifiez qu’au moins une organisation active existe en base.</p>
      </div>
    );
  }

  const logoUrlPath = current.logo_path ? uploadsUrl(current.logo_path) : null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-display-md text-ink-900">Organisation</h1>
        <p className="text-body-md text-ink-500 mt-1">
          Nom, logo et coordonnées de votre organisation (mode mono-organisation).
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        <Card title="Identité" className="mb-6">
          <div className="flex flex-col sm:flex-row gap-6">
            {/* Logo */}
            <div className="flex flex-col items-start gap-2">
              <div className="w-24 h-24 rounded-xl bg-surface-200 flex items-center justify-center overflow-hidden border-2 border-surface-300">
                {logoUrlPath ? (
                  <img src={logoUrlPath} alt="Logo" className="w-full h-full object-contain" />
                ) : (
                  <Building2 className="w-10 h-10 text-ink-400" />
                )}
              </div>
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
            </div>

            <div className="flex-1 space-y-4">
              <Input
                label="Nom complet"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                required
                placeholder="Ex. Ministère de l'Industrie"
              />
              <Input
                label="Nom court (affiché dans la barre latérale)"
                value={form.short_name}
                onChange={(e) => setForm((f) => ({ ...f, short_name: e.target.value }))}
                placeholder="Ex. MIPISE"
              />
              <div>
                <label className="block text-body-sm font-medium text-ink-700 mb-1">Type</label>
                <select
                  value={form.type}
                  onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}
                  className="w-full rounded-lg border border-surface-300 bg-white px-3 py-2 text-body-md text-ink-900 focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
                >
                  {Object.entries(TYPE_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </Card>

        <Card title="Coordonnées" className="mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Email de contact"
              type="email"
              value={form.contact_email}
              onChange={(e) => setForm((f) => ({ ...f, contact_email: e.target.value }))}
              icon={Mail}
              placeholder="contact@organisation.gov.dz"
            />
            <Input
              label="Téléphone"
              value={form.contact_phone}
              onChange={(e) => setForm((f) => ({ ...f, contact_phone: e.target.value }))}
              icon={Phone}
              placeholder="+213 21 00 00 00"
            />
            <div className="md:col-span-2">
              <Input
                label="Adresse"
                value={form.address}
                onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
                icon={MapPin}
                placeholder="Adresse postale"
              />
            </div>
          </div>
        </Card>

        <div className="flex justify-end">
          <Button type="submit" loading={saving} disabled={saving}>
            Enregistrer
          </Button>
        </div>
      </form>
    </div>
  );
}
