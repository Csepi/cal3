import React from 'react';

interface BreadcrumbProps {
  items: string[];
}

export const Breadcrumb: React.FC<BreadcrumbProps> = ({ items }) => {
  if (items.length === 0) {
    return null;
  }

  return (
    <nav aria-label="Breadcrumb" className="mt-2">
      <ol className="flex flex-wrap items-center gap-1 text-xs text-slate-500">
        {items.map((item, index) => (
          <li key={`${item}-${index}`} className="inline-flex items-center gap-1">
            {index > 0 && <span aria-hidden="true">/</span>}
            <span className={index === items.length - 1 ? 'font-semibold text-slate-700' : ''}>{item}</span>
          </li>
        ))}
      </ol>
    </nav>
  );
};
