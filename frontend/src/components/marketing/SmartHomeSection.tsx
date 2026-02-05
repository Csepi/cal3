import { useMarketing } from '../../hooks/useMarketing';

export function SmartHomeSection() {
  const { smartHomeHighlights } = useMarketing();

  return (
    <section id="smart-home" className="py-20">
      <div className="marketing-container">
        <div className="mx-auto max-w-3xl text-center">
          <p className="marketing-pill">Smart environments</p>
          <h2 className="marketing-display mt-4 text-3xl font-bold text-slate-900 sm:text-4xl">
            Your calendar controls your reality
          </h2>
          <p className="mt-3 text-slate-600">
            PrimeCal does more than store events. It coordinates homes, offices, and business systems through
            webhook automation and RestAPI integrations.
          </p>
        </div>

        <div className="mt-10 grid gap-5 md:grid-cols-2">
          {smartHomeHighlights.map((item) => (
            <article key={item.title} className="marketing-card rounded-2xl p-6">
              <h3 className="text-xl font-semibold text-slate-900">{item.title}</h3>
              <p className="mt-2 text-sm text-slate-600">{item.description}</p>
              <ul className="mt-4 space-y-2">
                {item.points.map((point) => (
                  <li key={point} className="flex gap-2 text-sm text-slate-700">
                    <span className="mt-1 text-emerald-600">-</span>
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

export default SmartHomeSection;
