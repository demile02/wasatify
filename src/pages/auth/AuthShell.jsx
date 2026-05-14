import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Logo } from '../../components/ui/Logo';

export function AuthShell({ children, backTo = '/', illustration = '/assets/wasatify-auth-student.png', panelTitle, panelText }) {
  const hasIllustration = Boolean(illustration);

  return (
    <div className="pattern min-h-screen px-3 py-4 sm:px-5 sm:py-6">
      <div className={`mx-auto grid overflow-hidden rounded-[2rem] border border-emerald-900/10 bg-white shadow-soft ${hasIllustration ? 'max-w-6xl lg:min-h-[720px] lg:grid-cols-[0.92fr_1.08fr]' : 'max-w-4xl'}`}>
        <div className={`flex flex-col p-6 sm:p-8 lg:p-10 ${hasIllustration ? 'min-h-[680px]' : 'min-h-[620px]'}`}>
          <div className="mb-5 flex items-center justify-between">
            <Logo />
            <Link to={backTo} className="inline-flex items-center gap-2 text-sm font-bold text-emerald-700">
              <ArrowLeft className="h-4 w-4" /> Kembali
            </Link>
          </div>
          {children}
        </div>
        {hasIllustration && (
          <div className="hidden bg-gradient-to-br from-emerald-950 via-emerald-900 to-emerald-700 p-6 lg:block">
            <div className="relative h-full overflow-hidden rounded-[2rem] bg-gradient-to-br from-white via-emerald-50 to-cream">
              <img
                src={illustration}
                alt=""
                className="absolute inset-0 h-full w-full object-cover object-center"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-emerald-950/10 via-transparent to-white/35" />
              {(panelTitle || panelText) && (
                <div className="absolute inset-x-6 bottom-6 rounded-2xl border border-white/60 bg-white/82 p-5 shadow-card backdrop-blur-md">
                  {panelTitle && <p className="font-display text-xl font-extrabold text-ink">{panelTitle}</p>}
                  {panelText && <p className="mt-2 text-sm leading-6 text-slate-600">{panelText}</p>}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
