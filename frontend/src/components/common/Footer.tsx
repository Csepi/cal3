import { Link } from 'react-router-dom';
import CTA from './CTA';
import { useMarketing } from '../../hooks/useMarketing';

const footerLinks = [
  {
    heading: 'Product',
    links: [
      { label: 'Features', to: '/features' },
      { label: 'Pricing', to: '/pricing' },
      { label: 'Smart Home', to: '/features#smart-home' },
      { label: 'API + Webhooks', to: '/features#integrations' },
    ],
  },
  {
    heading: 'Company',
    links: [
      { label: 'About', to: '/about' },
      { label: 'Blog', to: '/blog' },
      { label: 'Contact', to: '/contact' },
      { label: '#primecal on X', to: '/contact' },
    ],
  },
  {
    heading: 'Support',
    links: [
      { label: 'Help Center', to: '/contact' },
      { label: 'Status', to: '/blog' },
      { label: 'Privacy', to: '/about' },
    ],
  },
];

export function Footer() {
  const { appUrl, isExternalAppUrl } = useMarketing();

  return (
    <footer className="border-t border-slate-200 bg-slate-950 text-slate-200">
      <div className="marketing-container py-14">
        <div className="grid gap-10 lg:grid-cols-[1.1fr_2fr]">
          <div className="space-y-5">
            <p className="marketing-display text-2xl font-bold">PrimeCal</p>
            <p className="max-w-md text-sm text-slate-300">
              PrimeCal keeps work and personal life in one system with unified scheduling, booking, smart
              home workflows, and RestAPI automation.
            </p>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-300">Be in sync with reality. #primecal</p>
            <div className="flex flex-wrap items-center gap-3">
              <CTA to={appUrl} label="Open App" external={isExternalAppUrl} />
              <CTA to="/pricing" label="See Pricing #primecal" variant="secondary" />
            </div>
          </div>

          <div className="grid gap-8 sm:grid-cols-3">
            {footerLinks.map((group) => (
              <div key={group.heading} className="space-y-3">
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">{group.heading}</p>
                <ul className="space-y-2">
                  {group.links.map((item) => (
                    <li key={`${group.heading}-${item.label}-${item.to}`}>
                      <Link to={item.to} className="text-sm text-slate-300 transition hover:text-white">
                        {item.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-10 flex flex-col gap-3 border-t border-slate-800 pt-5 text-xs text-slate-400 sm:flex-row sm:items-center sm:justify-between">
          <p>(c) {new Date().getFullYear()} PrimeCal. Be in sync with reality.</p>
          <p>Response-time promise: support replies within one business day.</p>
        </div>
      </div>
    </footer>
  );
}

export default Footer;

