import { useMarketing } from '../../hooks/useMarketing';

export function Comparison() {
  const { comparisonRows } = useMarketing();

  return (
    <section className="py-20">
      <div className="marketing-container">
        <div className="mb-8">
          <p className="marketing-pill">Before vs after</p>
          <h2 className="marketing-display mt-4 text-3xl font-bold text-slate-900 sm:text-4xl">
            How PrimeCal compares to fragmented scheduling stacks
          </h2>
          <p className="mt-3 max-w-3xl text-slate-600">
            Many teams start with disconnected tools and spreadsheets. This table shows what changes when
            scheduling, booking, and automation share one platform.
          </p>
        </div>

        <div className="overflow-hidden rounded-2xl border border-slate-200 shadow-sm">
          <table className="min-w-full bg-white text-left text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 font-semibold text-slate-700">Capability</th>
                <th className="px-4 py-3 font-semibold text-blue-700">PrimeCal</th>
                <th className="px-4 py-3 font-semibold text-slate-700">Generic stack</th>
                <th className="px-4 py-3 font-semibold text-slate-700">Manual process</th>
              </tr>
            </thead>
            <tbody>
              {comparisonRows.map((row) => (
                <tr key={row.capability} className="border-t border-slate-100">
                  <td className="px-4 py-3 font-medium text-slate-700">{row.capability}</td>
                  <td className="px-4 py-3 text-slate-900">{row.primecal}</td>
                  <td className="px-4 py-3 text-slate-600">{row.genericStack}</td>
                  <td className="px-4 py-3 text-slate-500">{row.manualProcess}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

export default Comparison;

