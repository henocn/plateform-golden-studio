import { useState } from 'react';
import {
  User, Mail, Phone, Shield, Key, Camera, Save,
} from 'lucide-react';
import { Card, Button, Input, Badge, Avatar } from '../../components/ui';
import { authAPI, usersAPI } from '../../api/services';
import { useAuthStore } from '../../store/authStore';
import { formatErrorMessage, ROLE_LABELS } from '../../utils/helpers';
import toast from 'react-hot-toast';

export default function ProfilePage() {
  const { user, fetchMe } = useAuthStore();
  const [tab, setTab] = useState('info');

  if (!user) return null;

  const roleInfo = ROLE_LABELS[user.role] || { label: user.role };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Profile Header */}
      <Card>
        <div className="flex items-center gap-5">
          <div className="relative">
            <Avatar name={`${user.first_name} ${user.last_name}`} size="xl" />
            <button className="absolute -bottom-1 -right-1 w-8 h-8 bg-primary-500 text-white rounded-full flex items-center justify-center shadow-md hover:bg-primary-600 transition-default">
              <Camera className="w-4 h-4" />
            </button>
          </div>
          <div>
            <h1 className="text-display-md">{user.first_name} {user.last_name}</h1>
            <p className="text-body-md text-ink-400 mt-0.5">{user.email}</p>
            <div className="flex items-center gap-2 mt-2">
              <Badge color="info" dot>{roleInfo.label}</Badge>
              <Badge color={user.is_active ? 'success' : 'danger'}>{user.is_active ? 'Actif' : 'Inactif'}</Badge>
            </div>
          </div>
        </div>
      </Card>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-surface-200">
        {[
          { id: 'info', label: 'Informations', icon: User },
          { id: 'password', label: 'Mot de passe', icon: Key },
          { id: '2fa', label: 'Sécurité 2FA', icon: Shield },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-body-sm font-medium transition-default border-b-2 -mb-px ${
              tab === t.id ? 'border-primary-500 text-primary-600' : 'border-transparent text-ink-400 hover:text-ink-600'
            }`}
          >
            <t.icon className="w-4 h-4" /> {t.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="animate-fade-in">
        {tab === 'info' && <ProfileInfoTab user={user} onUpdate={fetchMe} />}
        {tab === 'password' && <PasswordTab />}
        {tab === '2fa' && <TwoFactorTab user={user} />}
      </div>
    </div>
  );
}

function ProfileInfoTab({ user, onUpdate }) {
  const [form, setForm] = useState({
    first_name: user.first_name || '',
    last_name: user.last_name || '',
    phone: user.phone || '',
  });
  const [saving, setSaving] = useState(false);
  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await usersAPI.update(user.id, form);
      toast.success('Profil mis à jour');
      onUpdate();
    } catch (err) {
      const details = formatErrorMessage(err);
      details.forEach((detail) => toast.error(detail.message));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <form onSubmit={handleSave} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <Input label="Prénom" value={form.first_name} onChange={(e) => set('first_name', e.target.value)} icon={User} />
          <Input label="Nom" value={form.last_name} onChange={(e) => set('last_name', e.target.value)} icon={User} />
        </div>
        <Input label="Email" value={user.email} disabled icon={Mail} hint="L'email ne peut pas être modifié" />
        <Input label="Téléphone" value={form.phone} onChange={(e) => set('phone', e.target.value)} icon={Phone} />
        <div className="flex justify-end pt-2">
          <Button type="submit" loading={saving} icon={Save}>Enregistrer</Button>
        </div>
      </form>
    </Card>
  );
}

function PasswordTab() {
  const [form, setForm] = useState({ current_password: '', new_password: '', confirm_password: '' });
  const [saving, setSaving] = useState(false);
  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const handleSave = async (e) => {
    e.preventDefault();
    if (form.new_password !== form.confirm_password) return toast.error('Les mots de passe ne correspondent pas');
    if (form.new_password.length < 8) return toast.error('Le mot de passe doit contenir au moins 8 caractères');
    setSaving(true);
    try {
      await authAPI.changePassword({ current_password: form.current_password, new_password: form.new_password });
      toast.success('Mot de passe modifié');
      setForm({ current_password: '', new_password: '', confirm_password: '' });
    } catch (err) {
      const details = formatErrorMessage(err);
      details.forEach((detail) => toast.error(detail.message));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <form onSubmit={handleSave} className="space-y-4">
        <Input label="Mot de passe actuel" type="password" value={form.current_password} onChange={(e) => set('current_password', e.target.value)} icon={Key} />
        <Input label="Nouveau mot de passe" type="password" value={form.new_password} onChange={(e) => set('new_password', e.target.value)} icon={Key} hint="Minimum 8 caractères" />
        <Input label="Confirmer le mot de passe" type="password" value={form.confirm_password} onChange={(e) => set('confirm_password', e.target.value)} icon={Key} />
        <div className="flex justify-end pt-2">
          <Button type="submit" loading={saving} icon={Save}>Modifier le mot de passe</Button>
        </div>
      </form>
    </Card>
  );
}

function TwoFactorTab({ user }) {
  const [enabling, setEnabling] = useState(false);
  const [qrData, setQrData] = useState(null);
  const [token, setToken] = useState('');
  const [verifying, setVerifying] = useState(false);

  const is2FAEnabled = user.two_factor_enabled;

  const handleEnable = async () => {
    setEnabling(true);
    try {
      const { data } = await authAPI.setup2FA();
      setQrData(data.data);
    } catch (err) {
      const details = formatErrorMessage(err);
      details.forEach((detail) => toast.error(detail.message));
    } finally {
      setEnabling(false);
    }
  };

  const handleVerify = async () => {
    if (!token || token.length !== 6) return toast.error('Code à 6 chiffres requis');
    setVerifying(true);
    try {
      await authAPI.verify2FA({ token });
      toast.success('2FA activé avec succès');
      setQrData(null);
      setToken('');
    } catch (err) {
      const details =  formatErrorMessage(err);
      details.forEach((detail) => toast.error(detail.message));
    } finally {
      setVerifying(false);
    }
  };

  const handleDisable = async () => {
    try {
      await authAPI.disable2FA();
      toast.success('2FA désactivé');
    } catch (err) {
      const details = formatErrorMessage(err);
      details.forEach((detail) => toast.error(detail.message));
    }
  };

  return (
    <Card>
      <div className="space-y-5">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${is2FAEnabled ? 'bg-success-50' : 'bg-surface-100'}`}>
            <Shield className={`w-5 h-5 ${is2FAEnabled ? 'text-success-500' : 'text-ink-400'}`} />
          </div>
          <div>
            <h3 className="text-body-lg font-medium text-ink-900">Authentification à deux facteurs</h3>
            <p className="text-body-sm text-ink-400">
              {is2FAEnabled ? 'Activée — votre compte est protégé par une double authentification' : 'Désactivée — activez-la pour renforcer la sécurité'}
            </p>
          </div>
          <div className="ml-auto">
            <Badge color={is2FAEnabled ? 'success' : 'neutral'} dot>{is2FAEnabled ? 'Activé' : 'Désactivé'}</Badge>
          </div>
        </div>

        {!is2FAEnabled && !qrData && (
          <Button onClick={handleEnable} loading={enabling} icon={Shield}>Activer la 2FA</Button>
        )}

        {qrData && (
          <div className="border border-surface-200 rounded-xl p-5 space-y-4">
            <p className="text-body-sm text-ink-500">Scannez ce QR code avec votre application d'authentification (Google Authenticator, Authy, etc.)</p>
            {qrData.qr_code && (
              <div className="flex justify-center">
                <img src={qrData.qr_code} alt="QR Code 2FA" className="w-48 h-48 rounded-lg" />
              </div>
            )}
            {qrData.secret && (
              <div className="bg-surface-50 rounded-lg p-3 text-center">
                <p className="text-body-sm text-ink-400 mb-1">Clé secrète (si QR impossible)</p>
                <p className="text-body-md font-mono font-medium text-ink-700 select-all">{qrData.secret}</p>
              </div>
            )}
            <div className="flex items-end gap-3">
              <Input label="Code de vérification" value={token} onChange={(e) => setToken(e.target.value)} placeholder="000000" className="flex-1" maxLength={6} />
              <Button onClick={handleVerify} loading={verifying}>Vérifier</Button>
            </div>
          </div>
        )}

        {is2FAEnabled && (
          <Button variant="danger" onClick={handleDisable}>Désactiver la 2FA</Button>
        )}
      </div>
    </Card>
  );
}
