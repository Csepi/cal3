import { useMarketing } from '../../hooks/useMarketing';

export function AdhdFriendlySection() {
  const { adhdFeatures } = useMarketing();

  return (
    <section className="py-20">
      <div className="marketing-container">
        <div className="mx-auto max-w-3xl text-center">
          <p className="marketing-pill">ADHD-friendly by design</p>
          <h2 className="marketing-display mt-4 text-3xl font-bold text-slate-900 sm:text-4xl">
            Built to reduce cognitive load and planning anxiety
          </h2>
          <p className="mt-3 text-slate-600">
            PrimeCal supports neurodivergent users with clear visuals, repeatable routines, and reminders that
            meet people where they are.
          </p>
        </div>

        <div className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {adhdFeatures.map((feature) => (
            <article key={feature.title} className="marketing-card rounded-2xl p-5">
              <h3 className="text-lg font-semibold text-slate-900">{feature.title}</h3>
              <p className="mt-2 text-sm text-slate-600">{feature.description}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

export default AdhdFriendlySection;
