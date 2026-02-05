import { motion } from 'framer-motion';
import { useEffect, useMemo, useState } from 'react';
import { useMarketing } from '../../hooks/useMarketing';

export function Testimonials() {
  const { testimonials } = useMarketing();
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % testimonials.length);
    }, 4800);
    return () => window.clearInterval(timer);
  }, [testimonials.length]);

  const active = useMemo(() => testimonials[activeIndex], [activeIndex, testimonials]);

  return (
    <section className="py-20">
      <div className="marketing-container">
        <div className="grid gap-8 lg:grid-cols-[1fr_1.1fr] lg:items-center">
          <div>
            <p className="marketing-pill">Customer outcomes</p>
            <h2 className="marketing-display mt-4 text-3xl font-bold text-slate-900 sm:text-4xl">
              Teams use PrimeCal to stay in sync with reality
            </h2>
            <p className="mt-4 text-slate-600">
              This is not abstract feature talk. These are operation-level wins from teams that moved from
              fragmented tools to one scheduling system.
            </p>
            <div className="mt-6 flex gap-2">
              {testimonials.map((item, index) => (
                <button
                  key={item.name}
                  type="button"
                  aria-label={`Show testimonial ${index + 1}`}
                  className={`h-2.5 w-9 rounded-full transition ${
                    index === activeIndex ? 'bg-blue-500' : 'bg-slate-300'
                  }`}
                  onClick={() => setActiveIndex(index)}
                />
              ))}
            </div>
          </div>

          <motion.div
            key={active.name}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
            className="marketing-card rounded-3xl p-8"
          >
            <p className="text-lg leading-relaxed text-slate-700">"{active.quote}"</p>
            <div className="mt-6 border-t border-slate-200 pt-5">
              <p className="marketing-display text-xl font-semibold text-slate-900">{active.name}</p>
              <p className="text-sm text-slate-500">{active.role}</p>
              <p className="mt-3 rounded-xl bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700">
                {active.outcome}
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

export default Testimonials;

