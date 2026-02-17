import { Link } from 'react-router-dom';
import { Home, Search } from 'lucide-react';
import { Button } from '../../components/ui';

export default function NotFoundPage() {
  return (
    <div className="min-h-screen bg-surface-50 flex items-center justify-center px-6">
      <div className="text-center max-w-md">
        {/* 404 visual */}
        <div className="relative mb-8">
          <div className="text-[160px] font-bold text-surface-200 leading-none select-none">404</div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-20 h-20 rounded-2xl bg-primary-50 flex items-center justify-center">
              <Search className="w-10 h-10 text-primary-400" />
            </div>
          </div>
        </div>

        <h1 className="text-display-md text-ink-900 mb-2">Page introuvable</h1>
        <p className="text-body-md text-ink-400 mb-8">
          La page que vous recherchez n'existe pas ou a été déplacée.
        </p>

        <Link to="/">
          <Button icon={Home} size="lg">Retour au tableau de bord</Button>
        </Link>
      </div>
    </div>
  );
}
