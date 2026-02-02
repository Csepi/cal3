import React from 'react';

export interface SelectOption {
  label: string;
  value: string | number;
}

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options: SelectOption[];
  error?: string;
}

/**
 * Reusable select component.
 *
 * @example
 * ```tsx
 * <Select
 *   label="Status"
 *   options={[{ label: 'Open', value: 'open' }]}
 * />
 * ```
 */
export const Select: React.FC<SelectProps> = ({
  label,
  options,
  error,
  className = '',
  ...props
}) => (
  <label className="block text-sm font-medium text-gray-700">
    {label && <span className="mb-1 block">{label}</span>}
    <select
      className={`w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 ${className}`}
      {...props}
    >
      {options.map((option) => (
        <option key={String(option.value)} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
    {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
  </label>
);
