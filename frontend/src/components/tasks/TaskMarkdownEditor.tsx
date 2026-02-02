// @ts-nocheck
import { useMemo } from 'react';
import { marked } from 'marked';
import DOMPurify from 'dompurify';

interface TaskMarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
}

export const TaskMarkdownEditor: React.FC<TaskMarkdownEditorProps> = ({
  value,
  onChange,
}) => {
  const sanitizedHtml = useMemo(() => {
    const raw = marked.parse(value || '');
    return DOMPurify.sanitize(raw);
  }, [value]);

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <div className="flex flex-col gap-2">
        <label className="text-xs font-semibold uppercase text-gray-500">
          Notes (Markdown)
        </label>
        <textarea
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="h-48 w-full rounded-lg border border-gray-200 bg-white/80 px-3 py-2 text-sm shadow-inner focus:border-blue-500 focus:outline-none"
          placeholder="Document quick notes, links, or steps..."
        />
      </div>
      <div className="flex flex-col gap-2">
        <label className="text-xs font-semibold uppercase text-gray-500">
          Preview
        </label>
        <div
          className="h-48 overflow-auto rounded-lg border border-dashed border-gray-200 bg-white/70 px-3 py-2 text-sm prose prose-sm max-w-none"
          dangerouslySetInnerHTML={{ __html: sanitizedHtml }}
        />
      </div>
    </div>
  );
};

