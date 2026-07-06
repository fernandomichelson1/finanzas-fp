interface PlaceholderProps {
  title: string;
  emoji?: string;
  subtitle?: string;
}

/** Pantalla provisoria mientras se implementan los módulos restantes. */
export function Placeholder({ title, emoji = '🚧', subtitle }: PlaceholderProps) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-8 py-24 text-center">
      <div className="mb-4 text-6xl opacity-80">{emoji}</div>
      <h2 className="m-0 text-2xl font-semibold tracking-[-0.4px] text-text">{title}</h2>
      <p className="mt-2 max-w-[280px] text-sm leading-relaxed text-muted">
        {subtitle ?? 'Esta pantalla se implementa en el próximo paso.'}
      </p>
      <div className="mt-5 rounded-full border border-line bg-surface px-3 py-1.5 text-xs text-muted">
        En construcción
      </div>
    </div>
  );
}
