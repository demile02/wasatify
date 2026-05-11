import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { LearningIllustration } from '../../components/ui/Illustration';
import { Logo } from '../../components/ui/Logo';

export function AuthShell({ children, backTo = '/', illustration = true }) {
  return (
    <div className="pattern min-h-screen px-4 py-6">
      <div className="mx-auto grid min-h-[calc(100vh-3rem)] max-w-6xl overflow-hidden rounded-[2rem] border border-emerald-900/10 bg-white shadow-soft lg:grid-cols-[0.95fr_1.05fr]">
        <div className="flex flex-col p-6 sm:p-8">
          <div className="mb-8 flex items-center justify-between">
            <Logo />
            <Link to={backTo} className="inline-flex items-center gap-2 text-sm font-bold text-emerald-700">
              <ArrowLeft className="h-4 w-4" /> Kembali
            </Link>
          </div>
          {children}
        </div>
        {illustration && (
          <div className="hidden bg-gradient-to-br from-emerald-950 to-emerald-800 p-8 lg:block">
            <div className="grid h-full place-items-center rounded-[2rem] bg-white/95 p-8">
              <LearningIllustration />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
