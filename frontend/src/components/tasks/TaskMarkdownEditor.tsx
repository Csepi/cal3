import { useMemo } from 'react';
import { marked } from 'marked';
import { sanitizeHtml } from '../../utils/htmlSecurity';

import { tStatic } from '../../i18n';

interface TaskMarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
}

export const TaskMarkdownEditor: React.FC<TaskMarkdownEditorProps> = ({
  value,
  onChange,
}) => {
  const sanitizedHtml = useMemo(() => {
    const raw = marked.parse(value || '', { async: false }) as string;
    return sanitizeHtml(raw);
  }, [value]);

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <div className="flex flex-col gap-2">
        <label className="text-xs font-semibold uppercase text-gray-500">
          {tStatic('common:auto.frontend.k484b6e2fed81')}</label>
        <textarea
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="h-48 w-full rounded-lg border border-gray-200 bg-white/80 px-3 py-2 text-sm shadow-inner focus:border-blue-500 focus:outline-none"
          placeholder={tStatic('common:auto.frontend.k332525aff2b1')}
        />
      </div>
      <div className="flex flex-col gap-2">
        <label className="text-xs font-semibold uppercase text-gray-500">
          {tStatic('common:auto.frontend.kf1fbb2b43dca')}</label>
        <div
          className="h-48 overflow-auto rounded-lg border border-dashed border-gray-200 bg-white/70 px-3 py-2 text-sm prose prose-sm max-w-none"
          dangerouslySetInnerHTML={{ __html: sanitizedHtml }}
        />
      </div>
    </div>
  );
};

