import type { ReactNode } from "react";

/** A titled block (Configurações, Rankings): title, one-line description, content. */
export function SettingsCard({
  title,
  description,
  action,
  children,
}: {
  title: string;
  description?: string;
  /** Optional control shown at the right of the title (e.g. "Adicionar"). */
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="rounded-xl bg-card shadow-card p-4 md:p-5">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-[13px] font-semibold text-foreground">{title}</h2>
          {description && <p className="mt-1 text-[13px] text-muted-foreground">{description}</p>}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}
