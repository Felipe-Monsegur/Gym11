import { useId, useState, type ReactNode } from 'react';

type CollapsibleOptionsPanelProps = {
  title: string;
  summary?: string;
  defaultOpen?: boolean;
  className?: string;
  /** Sin wrapper ui-panel; para incrustar dentro de otro panel */
  embedded?: boolean;
  children: ReactNode;
};

export default function CollapsibleOptionsPanel({
  title,
  summary,
  defaultOpen = false,
  className = '',
  embedded = false,
  children,
}: CollapsibleOptionsPanelProps) {
  const [open, setOpen] = useState(defaultOpen);
  const panelId = useId();

  const content = (
    <>
      <div className="ui-options-toolbar">
        <button
          type="button"
          className={`ui-options-toggle ui-label ui-label-md ${open ? 'is-open' : ''}`}
          aria-expanded={open}
          aria-controls={panelId}
          onClick={() => setOpen((prev) => !prev)}
        >
          <span className="ui-options-toggle-icon" aria-hidden="true">
            <span />
            <span />
            <span />
          </span>
          <span>{title}</span>
        </button>
        {summary && (
          <span className="ui-options-summary" title="Configuración actual">
            {summary}
          </span>
        )}
      </div>

      {open && (
        <div className="ui-options-panel" id={panelId}>
          {children}
        </div>
      )}
    </>
  );

  if (embedded) {
    return <div className={className}>{content}</div>;
  }

  return (
    <div className={`ui-panel p-3 sm:p-4 ${className}`.trim()}>
      {content}
    </div>
  );
}
