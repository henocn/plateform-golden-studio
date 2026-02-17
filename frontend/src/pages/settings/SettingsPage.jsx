import { useState } from 'react';
import {
  Settings as SettingsIcon, Palette, Bell, Globe, Database, Shield,
} from 'lucide-react';
import { Card, Button, Input, Select, Badge } from '../../components/ui';
import { useAuthStore } from '../../store/authStore';
import toast from 'react-hot-toast';

export default function SettingsPage() {
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'super_admin' || user?.role === 'admin';

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-display-lg">Paramètres</h1>
        <p className="text-body-md text-ink-400 mt-1">Configuration générale de la plateforme</p>
      </div>

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

      {/* Appearance */}
      <Card title="Apparence" action={<Badge color="neutral" size="sm"><Palette className="w-3 h-3 inline mr-1" />Thème</Badge>}>
        <div className="space-y-4">
          <Select label="Langue de l'interface" defaultValue="fr">
            <option value="fr">Français</option>
            <option value="en">English</option>
          </Select>
          <Select label="Fuseau horaire" defaultValue="Africa/Libreville">
            <option value="Africa/Libreville">Afrique/Libreville (UTC+1)</option>
            <option value="Europe/Paris">Europe/Paris (UTC+1/+2)</option>
            <option value="UTC">UTC</option>
          </Select>
          <Select label="Format de date" defaultValue="dd/MM/yyyy">
            <option value="dd/MM/yyyy">JJ/MM/AAAA</option>
            <option value="MM/dd/yyyy">MM/JJ/AAAA</option>
            <option value="yyyy-MM-dd">AAAA-MM-JJ</option>
          </Select>
        </div>
      </Card>

      {/* Admin-only settings */}
      {isAdmin && (
        <>
          <Card title="Plateforme" action={<Badge color="warning" size="sm"><Shield className="w-3 h-3 inline mr-1" />Admin</Badge>}>
            <div className="space-y-4">
              <Input label="Nom de la plateforme" defaultValue="GovCom Platform" />
              <Input label="Email de support" defaultValue="support@govcom.ga" />
              <ToggleSetting
                label="Mode maintenance"
                description="Active la page de maintenance pour les utilisateurs non-admin"
              />
              <ToggleSetting
                label="Inscription ouverte"
                description="Autoriser l'inscription de nouveaux utilisateurs clients"
              />
            </div>
          </Card>

          <Card title="Sécurité" action={<Badge color="danger" size="sm"><Shield className="w-3 h-3 inline mr-1" />Critique</Badge>}>
            <div className="space-y-4">
              <ToggleSetting
                label="2FA obligatoire"
                description="Forcer l'authentification à deux facteurs pour tous les utilisateurs internes"
                defaultChecked
              />
              <Select label="Durée de session (minutes)" defaultValue="60">
                <option value="15">15 minutes</option>
                <option value="30">30 minutes</option>
                <option value="60">1 heure</option>
                <option value="480">8 heures</option>
              </Select>
              <Select label="Tentatives de connexion max" defaultValue="5">
                <option value="3">3 tentatives</option>
                <option value="5">5 tentatives</option>
                <option value="10">10 tentatives</option>
              </Select>
            </div>
          </Card>
        </>
      )}

      <div className="flex justify-end">
        <Button onClick={() => toast.success('Paramètres enregistrés')} icon={SettingsIcon}>Enregistrer les paramètres</Button>
      </div>
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
