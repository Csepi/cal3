import { motion } from 'framer-motion';
import { useMarketing } from '../../hooks/useMarketing';
import CTA from '../common/CTA';

export function PricingCards() {
  const { pricing, appUrl, isExternalAppUrl } = useMarketing();

  return (
    <section className="py-20">
      <div className="marketing-container">
        <div className="mx-auto mb-10 max-w-3xl text-center">
          <p className="marketing-pill">Pricing built for growth</p>
          <h2 className="marketing-display mt-4 text-3xl font-bold text-slate-900 sm:text-4xl">
            Simple, transparent pricing
          </h2>
          <p className="mt-3 text-slate-600">
            Be in sync with reality. Choose a PrimeCal plan that matches your personal workflow, family
            planning, or business operation.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-5">
          {pricing.map((tier, index) => (
            <motion.article
              key={tier.id}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.25 }}
              transition={{ duration: 0.4, delay: index * 0.07 }}
              className={`rounded-2xl p-6 ${
                tier.popular
                  ? 'marketing-card-strong border border-blue-300 shadow-xl shadow-blue-100'
                  : 'marketing-card border border-slate-200'
              } h-full flex flex-col`}
            >
              {tier.highlight ? (
                <span className="inline-flex rounded-full bg-blue-600 px-3 py-1 text-xs font-semibold text-white">
                  {tier.highlight}
                </span>
              ) : null}
              <h3 className="mt-4 text-xl font-semibold text-slate-900">{tier.name}</h3>
              <p className="mt-1 text-slate-900">
                <span className="text-3xl font-bold">{tier.priceLabel.split('/')[0]}</span>
                {tier.priceLabel.includes('/') ? (
                  <span className="ml-1 align-baseline text-xl font-semibold text-slate-800">
                    /{tier.priceLabel.split('/').slice(1).join('/')}
                  </span>
                ) : null}
              </p>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">{tier.description}</p>
              <ul className="mt-5 flex-1 space-y-2">
                {tier.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2 text-sm text-slate-700">
                    <span className="mt-1 text-emerald-600">✓</span>
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-6">
                <CTA
                  to={tier.id === 'enterprise' || tier.id === 'store' ? '/contact' : appUrl}
                  label={tier.cta}
                  external={tier.id !== 'enterprise' && tier.id !== 'store' && isExternalAppUrl}
                  variant={tier.popular ? 'primary' : 'secondary'}
                />
              </div>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
}

export default PricingCards;

