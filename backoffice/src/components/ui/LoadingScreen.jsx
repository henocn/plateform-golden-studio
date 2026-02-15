import { Loader2 } from 'lucide-react';

export default function LoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-100">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 rounded-xl bg-primary-500 flex items-center justify-center shadow-lg">
          <span className="text-white font-bold text-lg">G</span>
        </div>
        <Loader2 className="w-5 h-5 text-primary-500 animate-spin" />
        <p className="text-body-sm text-ink-400">Chargement…</p>
      </div>
    </div>
  );
}
