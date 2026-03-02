import { useState, useRef } from 'react';
import {
  User, Mail, Phone, Key, Camera, Save,
} from 'lucide-react';
import { Card, Button, Input, Badge, Avatar } from '../../components/ui';
import { authAPI, usersAPI, uploadsUrl } from '../../api/services';
import { useAuthStore } from '../../store/authStore';
import { formatErrorMessage, ROLE_LABELS } from '../../utils/helpers';
import toast from 'react-hot-toast';

export default function ProfilePage() {
  const { user, fetchMe } = useAuthStore();
  const [tab, setTab] = useState('info');
  const [avatarUploading, setAvatarUploading] = useState(false);
  const avatarInputRef = useRef(null);

  if (!user) return null;

  const roleInfo = ROLE_LABELS[user.role] || { label: user.role };
  const avatarSrc = user.avatar_path ? uploadsUrl(user.avatar_path) : null;

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarUploading(true);
    try {
      const formData = new FormData();
      formData.append('avatar', file);
      await usersAPI.uploadAvatar(user.id, formData);
      await fetchMe();
      toast.success('Photo de profil mise à jour');
    } catch (err) {
      const details = formatErrorMessage(err);
      details.forEach((detail) => toast.error(detail.message));
    } finally {
      setAvatarUploading(false);
      if (avatarInputRef.current) avatarInputRef.current.value = '';
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Profile Header */}
      <Card>
        <div className="flex items-center gap-5">
          <div className="relative">
            <Avatar
              src={avatarSrc}
              firstName={user.first_name}
              lastName={user.last_name}
              size="lg"
            />
            <input
              ref={avatarInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleAvatarChange}
            />
            <button
              type="button"
              disabled={avatarUploading}
              onClick={() => avatarInputRef.current?.click()}
              className="absolute -bottom-1 -right-1 w-8 h-8 bg-primary-500 text-white rounded-full flex items-center justify-center shadow-md hover:bg-primary-600 disabled:opacity-60 disabled:cursor-default transition-default"
            >
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
