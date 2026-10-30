import { forwardRef } from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../utils/cn';

export const Card = forwardRef(function Card({ children, className, hover = true }, ref) {
  const Component = hover ? motion.div : 'div';
  const motionProps = hover ? { whileHover: { y: -4 } } : {};
  return (
    <Component
      ref={ref}
      className={cn('rounded-2xl border border-emerald-900/10 bg-white p-5 shadow-card', className)}
      {...motionProps}
    >
      {children}
    </Component>
  );
});
