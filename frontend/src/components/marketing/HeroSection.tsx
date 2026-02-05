import { motion } from 'framer-motion';
import CTA from '../common/CTA';
import { useMarketing } from '../../hooks/useMarketing';

export function HeroSection() {
  const { appUrl, isExternalAppUrl } = useMarketing();

  return (
    <section className="relative overflow-hidden pb-20 pt-16 sm:pt-24">
      <div className="marketing-container relative z-10 grid items-center gap-14 lg:grid-cols-[1.1fr_0.9fr]">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55 }}
          className="space-y-7"
        >
          <h1 className="marketing-display text-4xl font-bold leading-tight text-slate-900 sm:text-5xl md:text-6xl">
            Be in sync with <span className="marketing-gradient-text">reality</span>
          </h1>
          <p className="max-w-xl text-base text-slate-600 sm:text-lg">
            One calendar. One system. Work synced with life. PrimeCal combines unified schedules, booking
            workflows, smart home actions, and automation into a single operational timeline.
          </p>
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-blue-700">#primecal</p>
          <div className="flex flex-wrap items-center gap-3">
            <CTA to={appUrl} label="Start Free with PrimeCal" external={isExternalAppUrl} />
            <CTA to="/features" label="Watch Demo" variant="secondary" />
          </div>
          <div className="grid max-w-xl grid-cols-1 gap-3 sm:grid-cols-3">
            {[
              { label: 'Uptime', value: '99.9%' },
              { label: 'Avg response', value: '<200ms' },
              { label: 'API mode', value: 'Rest + webhooks' },
            ].map((metric) => (
              <div key={metric.label} className="marketing-card rounded-xl px-4 py-3">
                <p className="text-xs uppercase tracking-[0.16em] text-slate-500">{metric.label}</p>
                <p className="marketing-display text-2xl font-bold text-slate-900">{metric.value}</p>
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 25 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.65, delay: 0.15 }}
          className="marketing-card marketing-card-strong relative rounded-3xl p-6 sm:p-8"
        >
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-700">Live operations snapshot</p>
          <h2 className="mt-3 marketing-display text-2xl font-semibold text-slate-900">
            Your calendar controls your reality
          </h2>
          <p className="mt-3 text-sm text-slate-600">
            Booking link {'->'} confirmed event {'->'} webhook action {'->'} smart office response {'->'} team
            update. No manual copy-paste between tools.
          </p>
          <div className="mt-6 space-y-3">
            {[
              'Calendar sync healthy across Google + Outlook',
              'New booking confirmed for consultation room at 14:00',
              'Webhook sent booking payload to CRM and invoicing service',
              'Smart office profile activated for upcoming meeting',
            ].map((line) => (
              <div key={line} className="flex items-start gap-3 rounded-xl bg-white/90 p-3">
                <span className="mt-1 h-2.5 w-2.5 rounded-full bg-emerald-400" />
                <p className="text-sm text-slate-700">{line}</p>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}

export default HeroSection;

