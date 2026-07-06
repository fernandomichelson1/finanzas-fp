interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  action?: string;
  onAction?: () => void;
}

export function SectionHeader({ title, subtitle, action, onAction }: SectionHeaderProps) {
  return (
    <div className="mb-2.5 flex items-baseline justify-between">
      <div className="flex items-baseline gap-1.5">
        <h3 className="m-0 text-[15px] font-semibold tracking-[-0.2px] text-text">{title}</h3>
        {subtitle && <span className="text-xs text-muted">{subtitle}</span>}
      </div>
      {action && (
        <button
          onClick={onAction}
          className="cursor-pointer border-0 bg-transparent p-0 text-[13px] font-medium text-accent"
        >
          {action}
        </button>
      )}
    </div>
  );
}
