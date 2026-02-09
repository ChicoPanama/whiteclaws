import type { ReactNode } from 'react'

interface PageShellProps {
  title: string
  subtitle?: string
  actions?: ReactNode
  children: ReactNode
}

export default function PageShell({ title, subtitle, actions, children }: PageShellProps) {
  return (
    <section className="page-shell section-reveal visible">
      <header className="page-shell-header">
        <div className="page-shell-heading">
          <h1 className="page-shell-title">{title}</h1>
          {subtitle ? <p className="page-shell-subtitle">{subtitle}</p> : null}
        </div>
        {actions ? <div className="page-shell-actions">{actions}</div> : null}
      </header>
      <div className="page-shell-body">{children}</div>
    </section>
  )
}
