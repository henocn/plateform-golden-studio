import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, ArrowLeft } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import Button from '../../components/ui/Button';

export default function TwoFactorPage() {
  const navigate = useNavigate();
  const { verify2FA, isLoading, requires2FA, logout } = useAuthStore();
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState('');

  // Redirect if not in 2FA flow
  if (!requires2FA) {
    navigate('/login', { replace: true });
    return null;
  }

  const handleChange = (index, value) => {
    if (value.length > 1) return;
    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);

    // Auto-focus next
    if (value && index < 5) {
      document.getElementById(`otp-${index + 1}`)?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      document.getElementById(`otp-${index - 1}`)?.focus();
    }
  };

  const handlePaste = (e) => {
    const text = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (text.length === 6) {
      setCode(text.split(''));
      document.getElementById('otp-5')?.focus();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const fullCode = code.join('');
    if (fullCode.length !== 6) {
      setError('Veuillez saisir les 6 chiffres');
      return;
    }

    setError('');
    try {
      await verify2FA(fullCode);
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setError('Code invalide. Veuillez réessayer.');
      setCode(['', '', '', '', '', '']);
      document.getElementById('otp-0')?.focus();
    }
  };

  const handleCancel = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-100 p-8">
      <div className="w-full max-w-sm text-center">
        {/* Icon */}
        <div className="w-16 h-16 rounded-2xl bg-primary-50 flex items-center justify-center mx-auto mb-6">
          <ShieldCheck className="w-8 h-8 text-primary-500" />
        </div>

        <h2 className="text-display-lg text-ink-900 mb-2">Vérification 2FA</h2>
        <p className="text-body-md text-ink-500 mb-8">
          Saisissez le code à 6 chiffres de votre application d'authentification
        </p>

        {error && (
          <div className="p-3 mb-5 bg-danger-50 border border-danger-200 rounded-lg text-body-sm text-danger-700 animate-fade-in">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="flex justify-center gap-2 mb-6" onPaste={handlePaste}>
            {code.map((digit, i) => (
              <input
                key={i}
                id={`otp-${i}`}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleChange(i, e.target.value.replace(/\D/, ''))}
                onKeyDown={(e) => handleKeyDown(i, e)}
                className="
                  w-11 h-12 text-center text-lg font-bold text-ink-900
                  bg-white border border-surface-400 rounded-xl
                  focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400
                  transition-default
                "
              />
            ))}
          </div>

          <Button type="submit" loading={isLoading} className="w-full" size="lg">
            Vérifier
          </Button>
        </form>

        <button
          onClick={handleCancel}
          className="mt-4 inline-flex items-center gap-1 text-body-sm text-ink-400 hover:text-ink-700 transition-default"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Retour à la connexion
        </button>
      </div>
    </div>
  );
}
