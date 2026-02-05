import PricingCards from '../../components/marketing/PricingCards';
import FAQSection from '../../components/marketing/FAQSection';
import { useMarketingMeta } from '../../hooks/useMarketing';

const pricingMatrix = [
  { capability: 'Calendars', free: '1', user: 'Unlimited', family: 'Unlimited', store: 'Unlimited', enterprise: 'Unlimited' },
  { capability: 'Users', free: '1', user: '1', family: 'Up to 5', store: 'Organization', enterprise: 'Unlimited' },
  { capability: 'Bookings per month', free: '50', user: 'Unlimited', family: 'Unlimited', store: 'Unlimited', enterprise: 'Unlimited' },
  { capability: 'Automation depth', free: 'Basic', user: 'Smart automations', family: 'Shared automations', store: 'Advanced webhooks', enterprise: 'Custom workflows' },
  { capability: 'RestAPI access', free: '-', user: 'Included', family: 'Included', store: 'Included', enterprise: 'Included + higher limits' },
  { capability: 'Support', free: 'Community', user: 'Email', family: 'Priority', store: 'Dedicated', enterprise: 'Dedicated account manager' },
];

function Pricing() {
  useMarketingMeta(
    'Pricing - PrimeCal',
    'Simple, transparent PrimeCal pricing across Free, User, Family, Store, and Enterprise plans.',
  );

  return (
    <>
      <section className="py-16 sm:py-20">
        <div className="marketing-container">
          <p className="marketing-pill">Transparent plans</p>
          <h1 className="marketing-display mt-4 text-4xl font-bold text-slate-900 sm:text-5xl">
            Simple, transparent pricing
          </h1>
          <p className="mt-4 max-w-3xl text-slate-600">
            Be in sync with reality. Start with Free, then move to User, Family, Store, or Enterprise as
            your scheduling complexity grows.
          </p>
        </div>
      </section>

      <PricingCards />

      <section className="py-12">
        <div className="marketing-container">
          <h2 className="marketing-display text-3xl font-semibold text-slate-900">Feature comparison matrix</h2>
          <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200 bg-white">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-700">
                <tr>
                  <th className="px-4 py-3 font-semibold">Capability</th>
                  <th className="px-4 py-3 font-semibold">Free</th>
                  <th className="px-4 py-3 font-semibold text-blue-700">User</th>
                  <th className="px-4 py-3 font-semibold">Family</th>
                  <th className="px-4 py-3 font-semibold">Store</th>
                  <th className="px-4 py-3 font-semibold">Enterprise</th>
                </tr>
              </thead>
              <tbody>
                {pricingMatrix.map((row) => (
                  <tr key={row.capability} className="border-t border-slate-100">
                    <td className="px-4 py-3 font-medium text-slate-700">{row.capability}</td>
                    <td className="px-4 py-3 text-slate-700">{row.free}</td>
                    <td className="px-4 py-3 text-blue-700">{row.user}</td>
                    <td className="px-4 py-3 text-slate-700">{row.family}</td>
                    <td className="px-4 py-3 text-slate-700">{row.store}</td>
                    <td className="px-4 py-3 text-slate-700">{row.enterprise}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section className="py-8">
        <div className="marketing-container">
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm text-emerald-800">
            30-day money-back guarantee on all paid plans. If your team does not see measurable scheduling
            improvement, we refund the first month.
          </div>
        </div>
      </section>

      <FAQSection heading="Pricing and plan questions" />
    </>
  );
}

export default Pricing;
