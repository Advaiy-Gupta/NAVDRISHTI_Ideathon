import type { ReactNode } from 'react';
import { ExternalLink } from 'lucide-react';
import type { UrlStatus } from '../data/types';

export function PageHeader({ title, lead, children }: { title: string; lead?: ReactNode; children?: ReactNode }) {
  return (
    <div className="border-b border-line bg-surface">
      <div className="container-page flex flex-col gap-3 py-6 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{title}</h1>
          {lead && <p className="mt-1 max-w-3xl text-sm text-muted">{lead}</p>}
        </div>
        {children}
      </div>
    </div>
  );
}

export function Field({
  label,
  htmlFor,
  hint,
  error,
  optional,
  children,
  className = '',
}: {
  label: string;
  htmlFor: string;
  hint?: string;
  error?: string;
  optional?: boolean;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <label htmlFor={htmlFor} className="label">
        {label}
        {optional && <span className="ml-1 font-normal text-muted">(optional)</span>}
      </label>
      {children}
      {error ? (
        <p className="error-text" id={`${htmlFor}-error`} role="alert">
          {error}
        </p>
      ) : (
        hint && <p className="hint">{hint}</p>
      )}
    </div>
  );
}

export function Notice({ tone = 'info', title, children }: { tone?: 'info' | 'warn' | 'ok' | 'crit'; title?: string; children: ReactNode }) {
  const styles = {
    info: 'border-accent bg-accent-tint',
    warn: 'border-warn bg-warn-tint',
    ok: 'border-ok bg-ok-tint',
    crit: 'border-crit bg-crit-tint',
  }[tone];
  return (
    <div className={`border-l-4 px-4 py-3 text-sm ${styles}`} role={tone === 'crit' || tone === 'warn' ? 'alert' : undefined}>
      {title && <div className="font-semibold">{title}</div>}
      <div className={title ? 'mt-0.5' : ''}>{children}</div>
    </div>
  );
}

/**
 * Opens in a new tab so the citizen keeps their place in JanSeva.
 * Mock URLs open the in-app placeholder page instead of a government site.
 */
export function PortalLink({ url, status, children, className = 'link' }: { url: string; status: UrlStatus; children: ReactNode; className?: string }) {
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      title={status === 'mock' ? 'Mock link: opens a placeholder page in this prototype' : 'Official website: opens in a new tab'}
      className={`${className} inline-flex items-center gap-1`}
    >
      {children}
      <ExternalLink size={13} aria-hidden />
      <span className="sr-only">(opens in a new tab)</span>
    </a>
  );
}

export function UrlStatusLabel({ status }: { status: UrlStatus }) {
  return status === 'public' ? (
    <span className="text-xs text-ok">Official domain</span>
  ) : (
    <span className="text-xs text-warn">Mock link (demo)</span>
  );
}

export function EmptyState({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="border border-dashed border-line bg-surface px-6 py-10 text-center">
      <div className="font-medium">{title}</div>
      {children && <div className="mt-1 text-sm text-muted">{children}</div>}
    </div>
  );
}
