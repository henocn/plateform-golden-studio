import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Mail, Lock, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useOrganizationStore } from '../../store/organizationStore';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';

const schema = z.object({
  email: z.string().email('Email invalide'),
  password: z.string().min(1, 'Mot de passe requis'),
});

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isLoading } = useAuthStore();
  const { fetchCurrent, logoUrl, displayName } = useOrganizationStore();
  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState('');

  useEffect(() => {
    fetchCurrent();
  }, [fetchCurrent]);

  const logoSrc = logoUrl();
  const orgName = displayName();

  const from = location.state?.from?.pathname || '/dashboard';

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = async (values) => {
    setServerError('');
    try {
      const result = await login(values.email, values.password);
      if (result.requires2FA) {
        navigate('/2fa');
      } else {
        navigate(from, { replace: true });
      }
    } catch (err) {
      const message = err.response?.data?.error?.message || err.response?.data?.message;
      setServerError(message || 'Erreur de connexion. Vérifiez vos identifiants.');
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* ── Left: Branding Panel ───────────── */}
      <div className="hidden lg:flex lg:w-[45%] bg-primary-500 relative overflow-hidden">
        {/* Abstract geometric pattern */}
        <div className="absolute inset-0">
          <div className="absolute top-0 right-0 w-96 h-96 bg-primary-400/20 rounded-full -translate-y-1/2 translate-x-1/3" />
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-primary-600/30 rounded-full translate-y-1/3 -translate-x-1/4" />
          <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-primary-400/10 rounded-full -translate-x-1/2 -translate-y-1/2" />
        </div>

        <div className="relative z-10 flex flex-col justify-between p-12 text-white">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-20 h-20 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center overflow-hidden shrink-0">
                {logoSrc ? (
                  <img src={logoSrc} alt="" className="w-full h-full object-contain" />
                ) : (
                  <span className="text-white font-bold text-2xl">G</span>
                )}
              </div>
              <span className="text-xl font-bold tracking-tight">{orgName}</span>
            </div>
            <p className="text-primary-200 text-body-md">Golden Studio Platform</p>
          </div>

          <div className="max-w-md">
            <h1 className="text-3xl font-bold leading-tight mb-4">
              Pilotez la communication institutionnelle avec excellence.
            </h1>
            <p className="text-primary-200 text-body-lg leading-relaxed">
              Plateforme centralisée de gestion de projets, validation de contenus
              et suivi de publications pour les institutions gouvernementales.
            </p>
          </div>

          <p className="text-primary-300 text-body-sm">
            © {new Date().getFullYear()} Golden Studio — Tous droits réservés
          </p>
        </div>
      </div>

      {/* ── Right: Login Form ──────────────── */}
      <div className="flex-1 flex items-center justify-center p-8 bg-surface-100">
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-3 mb-10">
            <div className="w-16 h-16 rounded-xl bg-primary-500 flex items-center justify-center overflow-hidden shrink-0">
              {logoSrc ? (
                <img src={logoSrc} alt="" className="w-full h-full object-contain" />
              ) : (
                <span className="text-white font-bold text-xl">G</span>
              )}
            </div>
            <span className="text-xl font-bold text-ink-900 tracking-tight">{orgName}</span>
          </div>

          <div className="mb-8">
            <h2 className="text-display-lg text-ink-900 mb-2">Connexion</h2>
            <p className="text-body-md text-ink-500">
              Accédez à votre espace de travail
            </p>
          </div>

          {serverError && (
            <div className="flex items-start gap-2 p-3 mb-5 bg-danger-50 border border-danger-200 rounded-lg animate-fade-in">
              <AlertCircle className="w-4 h-4 text-danger-500 mt-0.5 shrink-0" />
              <p className="text-body-sm text-danger-700">{serverError}</p>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input
              label="Adresse email"
              type="email"
              icon={Mail}
              placeholder="admin@goldenstudio.com"
              autoComplete="email"
              error={errors.email?.message}
              {...register('email')}
            />

            <div className="space-y-1">
              <Input
                label="Mot de passe"
                type={showPassword ? 'text' : 'password'}
                icon={Lock}
                placeholder="••••••••"
                autoComplete="current-password"
                error={errors.password?.message}
                {...register('password')}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="flex items-center gap-1 text-body-sm text-ink-400 hover:text-ink-700 transition-default ml-auto"
              >
                {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                {showPassword ? 'Masquer' : 'Afficher'}
              </button>
            </div>

            <Button
              type="submit"
              loading={isLoading}
              className="w-full h-10 mt-2"
              size="lg"
            >
              Se connecter
            </Button>
          </form>

          <p className="mt-8 text-center text-body-sm text-ink-400">
            Plateforme réservée aux collaborateurs autorisés
          </p>
        </div>
      </div>
    </div>
  );
}
