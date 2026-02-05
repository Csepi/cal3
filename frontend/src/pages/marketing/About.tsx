import { motion } from 'framer-motion';
import { useMarketingMeta } from '../../hooks/useMarketing';

const values = [
  {
    title: 'Clarity over complexity',
    description:
      'Scheduling should make decisions easier, not harder. We design for clear visibility and predictable outcomes.',
  },
  {
    title: 'Automation with guardrails',
    description:
      'Automation should save time without sacrificing control. We focus on safe defaults and transparent execution.',
  },
  {
    title: 'Built for real operations',
    description:
      'PrimeCal is built for teams with real booking pressure, cross-team coordination, and integration demands.',
  },
];

function About() {
  useMarketingMeta(
    'About PrimeCal',
    'Learn the story, mission, and values behind PrimeCal.',
  );

  return (
    <>
      <section className="py-16 sm:py-20">
        <div className="marketing-container grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <div>
            <p className="marketing-pill">About PrimeCal</p>
            <h1 className="marketing-display mt-4 text-4xl font-bold text-slate-900 sm:text-5xl">
              We build scheduling tools for teams that move fast
            </h1>
            <p className="mt-4 text-slate-600">
              PrimeCal started with one frustration: teams were spending more time managing schedules than
              doing their actual work. We built PrimeCal to unify that chaos into one reliable workflow
              engine.
            </p>
            <p className="mt-3 text-slate-600">
              Our mission is simple: help people stay in sync with reality by turning calendars into
              operational command centers.
            </p>
          </div>
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4 }}
            className="rounded-3xl border border-slate-200 bg-white p-6"
          >
            <h2 className="text-xl font-semibold text-slate-900">Press mentions</h2>
            <ul className="mt-4 space-y-3 text-sm text-slate-600">
              <li>"One of the most practical booking + automation experiences for growing teams."</li>
              <li>"PrimeCal bridges calendar UX and operations workflow better than typical scheduling apps."</li>
              <li>"A strong choice for service teams that need reliable booking throughput."</li>
            </ul>
          </motion.div>
        </div>
      </section>

      <section className="py-12 pb-20">
        <div className="marketing-container">
          <h2 className="marketing-display text-3xl font-semibold text-slate-900">Our values</h2>
          <div className="mt-6 grid gap-5 md:grid-cols-3">
            {values.map((value) => (
              <article key={value.title} className="marketing-card rounded-2xl p-5">
                <h3 className="text-lg font-semibold text-slate-900">{value.title}</h3>
                <p className="mt-2 text-sm text-slate-600">{value.description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}

export default About;

