import { FormEvent, useState } from 'react';
import { useMarketingMeta } from '../../hooks/useMarketing';

function Contact() {
  useMarketingMeta('Contact PrimeCal', 'Get in touch with PrimeCal sales and support teams.');

  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitted(true);
  };

  return (
    <section className="py-16 sm:py-20">
      <div className="marketing-container grid gap-8 lg:grid-cols-[1fr_1.1fr]">
        <div>
          <p className="marketing-pill">Contact</p>
          <h1 className="marketing-display mt-4 text-4xl font-bold text-slate-900 sm:text-5xl">
            Let's design your scheduling workflow
          </h1>
          <p className="mt-4 text-slate-600">
            Whether you are exploring plans, integrations, or enterprise requirements, our team can help
            you map the fastest path to value.
          </p>
          <p className="mt-2 text-sm font-semibold uppercase tracking-[0.2em] text-blue-700">
            Be in sync with reality. #primecal
          </p>
          <div className="mt-6 space-y-3 text-sm text-slate-600">
            <p>Email: support@primecal.com</p>
            <p>Sales: sales@primecal.com</p>
            <p>Response-time guarantee: under 24 hours on business days</p>
            <p>Social: linkedin.com/company/primecal | x.com/primecal</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="marketing-card rounded-3xl p-6">
          <h2 className="text-xl font-semibold text-slate-900">Send us a message</h2>
          <div className="mt-4 space-y-3">
            <input className="marketing-input" name="name" placeholder="Your name" required />
            <input className="marketing-input" name="email" type="email" placeholder="Work email" required />
            <select className="marketing-input" name="topic" defaultValue="general">
              <option value="general">General question</option>
              <option value="pricing">Pricing and plans</option>
              <option value="enterprise">Enterprise setup</option>
              <option value="integration">Integration support</option>
            </select>
            <textarea className="marketing-input min-h-32" name="message" placeholder="How can we help?" required />
          </div>
          <button
            type="submit"
            className="mt-4 inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-blue-500 via-indigo-500 to-emerald-500 px-5 py-2.5 text-sm font-semibold text-white"
          >
            Send message
          </button>
          {submitted ? (
            <p className="mt-3 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
              Thanks! We received your message and will reply shortly.
            </p>
          ) : null}
        </form>
      </div>
    </section>
  );
}

export default Contact;

