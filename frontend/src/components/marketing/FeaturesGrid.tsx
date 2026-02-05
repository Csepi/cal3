import { motion } from 'framer-motion';
import { useMarketing } from '../../hooks/useMarketing';
import CTA from '../common/CTA';

interface FeaturesGridProps {
  compact?: boolean;
}

export function FeaturesGrid({ compact = false }: FeaturesGridProps) {
  const { features } = useMarketing();
  const visibleFeatures = compact ? features.slice(0, 6) : features;

  return (
    <section className="py-20">
      <div className="marketing-container">
        <div className="mb-10 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="marketing-pill">Feature depth</p>
            <h2 className="marketing-display mt-4 text-3xl font-bold text-slate-900 sm:text-4xl">
              Everything you need to stay in sync
            </h2>
          </div>
          <CTA to="/features" label="Explore features #primecal" variant="secondary" />
        </div>

        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {visibleFeatures.map((feature, index) => (
            <motion.article
              key={feature.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.45, delay: index * 0.05 }}
              className="marketing-card rounded-2xl p-5"
            >
              <div className="flex items-center justify-between">
                <span className="text-2xl">{feature.icon}</span>
                <span className="rounded-full bg-blue-50 px-2 py-1 text-xs font-semibold text-blue-700">
                  {feature.id.toUpperCase()}
                </span>
              </div>
              <h3 className="mt-4 text-lg font-semibold text-slate-900">{feature.title}</h3>
              <p className="mt-2 text-sm text-slate-600">{feature.description}</p>
              <ul className="mt-4 space-y-2">
                {feature.benefits.map((benefit) => (
                  <li key={benefit} className="flex gap-2 text-sm text-slate-700">
                    <span className="mt-1 h-2 w-2 rounded-full bg-emerald-400" />
                    <span>{benefit}</span>
                  </li>
                ))}
              </ul>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
}

export default FeaturesGrid;

