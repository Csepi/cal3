import { motion } from 'framer-motion';
import FeaturesGrid from '../../components/marketing/FeaturesGrid';
import Comparison from '../../components/marketing/Comparison';
import Testimonials from '../../components/marketing/Testimonials';
import SmartHomeSection from '../../components/marketing/SmartHomeSection';
import SmartLifeSection from '../../components/marketing/SmartLifeSection';
import AdhdFriendlySection from '../../components/marketing/AdhdFriendlySection';
import IntegrationsSection from '../../components/marketing/IntegrationsSection';
import CTA from '../../components/common/CTA';
import { useMarketing, useMarketingMeta } from '../../hooks/useMarketing';

function Features() {
  const { features, appUrl, isExternalAppUrl } = useMarketing();
  useMarketingMeta(
    'Features - PrimeCal',
    'Explore PrimeCal features: universal sync, booking engine, smart home automation, ADHD-friendly planning, and RestAPI integrations.',
  );

  return (
    <>
      <section className="py-16 sm:py-20">
        <div className="marketing-container">
          <p className="marketing-pill">Feature showcase</p>
          <h1 className="marketing-display mt-4 max-w-3xl text-4xl font-bold text-slate-900 sm:text-5xl">
            Every feature is designed to remove friction from schedule-driven work
          </h1>
          <p className="mt-4 max-w-3xl text-slate-600">
            PrimeCal is not just another calendar surface. It is an operational platform that combines
            visibility, booking, smart environments, and automation in one reliable workflow.
          </p>
        </div>
      </section>

      <FeaturesGrid />
      <SmartHomeSection />
      <SmartLifeSection />
      <AdhdFriendlySection />
      <IntegrationsSection />

      <section className="py-16">
        <div className="marketing-container space-y-6">
          {features.map((feature, index) => (
            <motion.article
              key={feature.id}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.45, delay: index * 0.05 }}
              className="grid gap-6 rounded-3xl border border-slate-200 bg-white p-6 lg:grid-cols-[0.35fr_1fr]"
            >
              <div className="rounded-2xl bg-gradient-to-br from-blue-50 via-indigo-50 to-emerald-50 p-5">
                <p className="text-4xl">{feature.icon}</p>
                <h2 className="mt-4 text-xl font-semibold text-slate-900">{feature.title}</h2>
                <p className="mt-2 text-sm text-slate-600">{feature.summary}</p>
              </div>
              <div>
                <p className="text-slate-700">{feature.description}</p>
                <ul className="mt-4 grid gap-2 sm:grid-cols-2">
                  {feature.benefits.map((benefit) => (
                    <li key={benefit} className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-2 text-sm text-slate-700">
                      {benefit}
                    </li>
                  ))}
                </ul>
                <div className="mt-5">
                  <CTA
                    to={appUrl}
                    label="Try this in PrimeCal"
                    external={isExternalAppUrl}
                    variant="secondary"
                  />
                </div>
              </div>
            </motion.article>
          ))}
        </div>
      </section>

      <Comparison />
      <Testimonials />
    </>
  );
}

export default Features;

