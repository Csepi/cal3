import React from 'react';

export interface FormProps extends React.FormHTMLAttributes<HTMLFormElement> {
  children: React.ReactNode;
}

/**
 * Form wrapper with consistent spacing.
 *
 * @example
 * ```tsx
 * <Form onSubmit={handleSubmit}>
 *   <Input label="Name" />
 * </Form>
 * ```
 */
export const Form: React.FC<FormProps> = ({ children, className = '', ...props }) => (
  <form className={`space-y-4 ${className}`} {...props}>
    {children}
  </form>
);
