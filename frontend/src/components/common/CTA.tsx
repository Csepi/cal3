import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

interface CTAProps {
  to: string;
  label: string;
  variant?: 'primary' | 'secondary' | 'ghost';
  external?: boolean;
}

const variantClasses: Record<NonNullable<CTAProps['variant']>, string> = {
  primary:
    'bg-gradient-to-r from-blue-500 via-indigo-500 to-emerald-500 text-white shadow-lg shadow-blue-300/40 hover:shadow-blue-400/50',
  secondary:
    'bg-white text-slate-900 border border-slate-200 hover:border-blue-300 hover:bg-blue-50/80',
  ghost: 'text-blue-700 hover:text-blue-900 hover:bg-blue-50',
};

export function CTA({ to, label, external = false, variant = 'primary' }: CTAProps) {
  const classes =
    'inline-flex items-center justify-center rounded-xl px-5 py-2.5 text-sm font-semibold transition-all duration-200';

  if (external) {
    return (
      <motion.a
        whileHover={{ y: -1.5 }}
        whileTap={{ scale: 0.98 }}
        href={to}
        target="_blank"
        rel="noreferrer"
        className={`${classes} ${variantClasses[variant]}`}
      >
        {label}
      </motion.a>
    );
  }

  return (
    <motion.div whileHover={{ y: -1.5 }} whileTap={{ scale: 0.98 }}>
      <Link to={to} className={`${classes} ${variantClasses[variant]}`}>
        {label}
      </Link>
    </motion.div>
  );
}

export default CTA;

