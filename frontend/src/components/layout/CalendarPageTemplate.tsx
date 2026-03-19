import React from 'react';

interface CalendarPageTemplateProps {
  children: React.ReactNode;
}

/**
 * Reuses the Calendar page container rhythm across feature pages.
 * Mirrors Calendar.tsx layout: container + max-width shell.
 */
export const CalendarPageTemplate: React.FC<CalendarPageTemplateProps> = ({ children }) => (
  <div className="container mx-auto px-4 py-6">
    <div className="max-w-7xl mx-auto">
      {children}
    </div>
  </div>
);

