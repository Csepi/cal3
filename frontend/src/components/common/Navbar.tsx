import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import CTA from './CTA';
import { useMarketing } from '../../hooks/useMarketing';

const navItems = [
  { label: 'Features', to: '/features' },
  { label: 'Pricing', to: '/pricing' },
  { label: 'About', to: '/about' },
  { label: 'Blog', to: '/blog' },
  { label: 'Contact', to: '/contact' },
];

const activeClass = 'text-slate-900';
const idleClass = 'text-slate-600 hover:text-slate-900';

export function Navbar() {
  const [open, setOpen] = useState(false);
  const { appUrl, isExternalAppUrl } = useMarketing();
  const loginUrl = 'https://app.primecal.com';

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/70 bg-white/80 backdrop-blur-md">
      <div className="marketing-container flex h-16 items-center justify-between">
        <NavLink to="/" className="flex items-center gap-3">
          <img src="/primecal-icon.png" alt="PrimeCal logo" className="h-10 w-10" />
          <div className="leading-tight">
            <p className="hero-title hero-title-nav">
              Prime<span className="highlight">Cal</span>
            </p>
            <p className="text-xs uppercase tracking-[0.3em] text-gray-500">Be in sync with reality</p>
          </div>
        </NavLink>

        <nav className="hidden items-center gap-8 md:flex">
          {navItems.map((item) => (
            <NavLink
              key={`${item.label}-${item.to}`}
              to={item.to}
              className={({ isActive }) =>
                `text-sm font-semibold transition-colors ${isActive ? activeClass : idleClass}`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          <CTA to={loginUrl} label="Login" external variant="ghost" />
          <CTA to={appUrl} label="Start Free #primecal" external={isExternalAppUrl} />
        </div>

        <button
          type="button"
          className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 text-slate-700 md:hidden"
          aria-label="Toggle menu"
          onClick={() => setOpen((previous) => !previous)}
        >
          {open ? (
            <svg viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-current stroke-2">
              <path d="M6 6l12 12M6 18L18 6" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-current stroke-2">
              <path d="M4 7h16M4 12h16M4 17h16" />
            </svg>
          )}
        </button>
      </div>

      {open ? (
        <div className="border-t border-slate-200 bg-white px-4 pb-4 pt-3 md:hidden">
          <nav className="flex flex-col gap-3">
            {navItems.map((item) => (
              <NavLink
                key={`mobile-${item.label}-${item.to}`}
                to={item.to}
                onClick={() => setOpen(false)}
                className={({ isActive }) =>
                  `rounded-lg px-3 py-2 text-sm font-semibold ${isActive ? 'bg-blue-50 text-blue-700' : 'text-slate-700'}`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
          <div className="mt-4 flex gap-2">
            <CTA to={loginUrl} label="Login" external variant="secondary" />
            <CTA to={appUrl} label="Start Free #primecal" external={isExternalAppUrl} />
          </div>
        </div>
      ) : null}
    </header>
  );
}

export default Navbar;

