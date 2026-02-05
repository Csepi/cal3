import { motion } from 'framer-motion';
import HeroSection from '../../components/marketing/HeroSection';
import FeaturesGrid from '../../components/marketing/FeaturesGrid';
import Testimonials from '../../components/marketing/Testimonials';
import PricingCards from '../../components/marketing/PricingCards';
import FAQSection from '../../components/marketing/FAQSection';
import SmartHomeSection from '../../components/marketing/SmartHomeSection';
import SmartLifeSection from '../../components/marketing/SmartLifeSection';
import AdhdFriendlySection from '../../components/marketing/AdhdFriendlySection';
import IntegrationsSection from '../../components/marketing/IntegrationsSection';
import CTA from '../../components/common/CTA';
import { defaultMarketingDescription, useMarketing, useMarketingMeta } from '../../hooks/useMarketing';

function Home() {
  const { appUrl, isExternalAppUrl } = useMarketing();
  useMarketingMeta('PrimeCal - Be in sync with reality.', defaultMarketingDescription);

  return (
    <>
      <HeroSection />
      <FeaturesGrid compact />
      <SmartHomeSection />
      <SmartLifeSection />
      <AdhdFriendlySection />
      <IntegrationsSection />
      <Testimonials />
      <PricingCards />
      <FAQSection heading="What teams ask before moving fully into PrimeCal" />
      <section className="pb-24">
        <div className="marketing-container">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.45 }}
            className="rounded-3xl bg-slate-950 px-6 py-10 text-center text-white sm:px-10"
          >
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-200">Ready to be in sync with reality?</p>
            <h2 className="marketing-display mt-3 text-3xl font-bold sm:text-4xl">
              Start free and launch your first PrimeCal workflow today
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-slate-300">
              Build one system for work, family, and operations. Add smart home actions, webhook automation,
              and RestAPI integrations as you scale.
            </p>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              <CTA to={appUrl} label="Start Free with PrimeCal #primecal" external={isExternalAppUrl} />
              <CTA to="/contact" label="Talk to Sales" variant="secondary" />
            </div>
          </motion.div>
        </div>
      </section>
    </>
  );
}

export default Home;

