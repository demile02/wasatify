import { motion } from 'framer-motion';
import { cn } from '../../utils/cn';

const variants = {
  primary: 'bg-emerald-700 text-white shadow-card hover:bg-emerald-800',
  secondary: 'border border-emerald-700/30 bg-white text-emerald-900 hover:bg-emerald-50',
  ghost: 'text-slate-700 hover:bg-emerald-50',
  gold: 'bg-gold text-emerald-950 shadow-card hover:bg-amber-400',
};

export function Button({ className, variant = 'primary', children, ...props }) {
  return (
    <motion.button
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.98 }}
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-bold transition disabled:cursor-not-allowed disabled:opacity-50',
        variants[variant],
        className,
      )}
      {...props}
    >
      {children}
    </motion.button>
  );
}
