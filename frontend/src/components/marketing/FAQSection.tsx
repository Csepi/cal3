import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useMarketing } from '../../hooks/useMarketing';

interface FAQSectionProps {
  heading?: string;
}

export function FAQSection({
  heading = 'Questions teams ask before switching to PrimeCal',
}: FAQSectionProps) {
  const { faqs } = useMarketing();
  const [open, setOpen] = useState(0);

  return (
    <section className="py-20">
      <div className="marketing-container max-w-4xl">
        <p className="marketing-pill">FAQ</p>
        <h2 className="marketing-display mt-4 text-3xl font-bold text-slate-900 sm:text-4xl">{heading}</h2>
        <div className="mt-8 space-y-3">
          {faqs.map((item, index) => {
            const expanded = open === index;
            return (
              <div key={item.question} className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
                <button
                  type="button"
                  onClick={() => setOpen(expanded ? -1 : index)}
                  className="flex w-full items-center justify-between gap-3 text-left"
                  aria-expanded={expanded}
                >
                  <span className="text-base font-semibold text-slate-800">{item.question}</span>
                  <span className="text-xl text-blue-600">{expanded ? '-' : '+'}</span>
                </button>
                <AnimatePresence initial={false}>
                  {expanded ? (
                    <motion.p
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden pr-8 pt-3 text-sm text-slate-600"
                    >
                      {item.answer}
                    </motion.p>
                  ) : null}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export default FAQSection;

