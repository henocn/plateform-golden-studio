import { Link } from 'react-router-dom';
import { Home, ShieldOff } from 'lucide-react';
import { Button } from '../../components/ui';

export default function ForbiddenPage() {
  return (
    <div className="min-h-screen bg-surface-50 flex items-center justify-center px-6">
      <div className="text-center max-w-md">
        {/* 403 visual */}
        <div className="relative mb-8">
          <div className="text-[160px] font-bold text-surface-200 leading-none select-none">403</div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-20 h-20 rounded-2xl bg-danger-50 flex items-center justify-center">
              <ShieldOff className="w-10 h-10 text-danger-400" />
            </div>
          </div>
        </div>

        <h1 className="text-display-md text-ink-900 mb-2">Accès refusé</h1>
        <p className="text-body-md text-ink-400 mb-8">
          Vous n'avez pas les permissions nécessaires pour accéder à cette page.
          Contactez un administrateur si vous pensez qu'il s'agit d'une erreur.
        </p>

        <Link to="/">
          <Button icon={Home} size="lg">Retour au tableau de bord</Button>
        </Link>
      </div>
    </div>
  );
}
