import { useMarketing } from '../../hooks/useMarketing';

export function SmartLifeSection() {
  const { smartLifeScenarios } = useMarketing();

  return (
    <section className="py-20">
      <div className="marketing-container">
        <div className="mx-auto max-w-3xl text-center">
          <p className="marketing-pill">Smart office plus personal life</p>
          <h2 className="marketing-display mt-4 text-3xl font-bold text-slate-900 sm:text-4xl">
            One system for work, home, and business operations
          </h2>
          <p className="mt-3 text-slate-600">
            PrimeCal helps you keep professional commitments and personal routines in sync, so nothing slips
            between disconnected tools.
          </p>
        </div>

        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {smartLifeScenarios.map((scenario) => (
            <article key={scenario.title} className="marketing-card rounded-2xl p-6">
              <h3 className="text-xl font-semibold text-slate-900">{scenario.title}</h3>
              <ul className="mt-4 space-y-2">
                {scenario.points.map((point) => (
                  <li key={point} className="flex gap-2 text-sm text-slate-700">
                    <span className="mt-1 text-blue-600">-</span>
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

export default SmartLifeSection;
