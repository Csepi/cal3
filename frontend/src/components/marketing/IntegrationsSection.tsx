import { useMarketing } from '../../hooks/useMarketing';

export function IntegrationsSection() {
  const { integrationGroups } = useMarketing();

  return (
    <section id="integrations" className="py-20">
      <div className="marketing-container">
        <div className="mx-auto max-w-3xl text-center">
          <p className="marketing-pill">Integrations</p>
          <h2 className="marketing-display mt-4 text-3xl font-bold text-slate-900 sm:text-4xl">
            Integrations that work for you
          </h2>
          <p className="mt-3 text-slate-600">
            PrimeCal connects to the tools you already rely on through native sync, webhooks, and RestAPI
            access. If a connector is missing, you can build your own quickly.
          </p>
        </div>

        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {integrationGroups.map((group) => (
            <article key={group.title} className="marketing-card rounded-2xl p-5">
              <h3 className="text-lg font-semibold text-slate-900">{group.title}</h3>
              <ul className="mt-4 space-y-2">
                {group.points.map((point) => (
                  <li key={point} className="flex gap-2 text-sm text-slate-700">
                    <span className="mt-1 text-emerald-600">-</span>
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>

        <p className="mt-6 text-center text-sm text-slate-600">
          Need something custom? PrimeCal supports open RestAPI and webhook pipelines for domain-specific
          integrations.
        </p>
      </div>
    </section>
  );
}

export default IntegrationsSection;
