import type { ReactNode } from 'react';

type EmptyStateProps = {
  title: string;
  description?: ReactNode;
  icon?: ReactNode;
  /** CTA opcional (botón o link) */
  action?: ReactNode;
  className?: string;
};

const DefaultIcon = (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.75}
      d="M20 13V7a2 2 0 00-2-2H6a2 2 0 00-2 2v6m16 0v4a2 2 0 01-2 2H6a2 2 0 01-2-2v-4m16 0h-4l-1.5 2h-5L8 13H4"
    />
  </svg>
);

export default function EmptyState({ title, description, icon, action, className = '' }: EmptyStateProps) {
  return (
    <div className={`ui-empty ${className}`.trim()}>
      <span className="ui-empty-icon" aria-hidden="true">
        {icon ?? DefaultIcon}
      </span>
      <p className="ui-empty-title">{title}</p>
      {description && <p className="ui-empty-text">{description}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
