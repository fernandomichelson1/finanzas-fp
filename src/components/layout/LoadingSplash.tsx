/** Splash mientras se restaura la sesión / hidratan los datos (modo nube). */
export function LoadingSplash() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-bg">
      <div
        className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl"
        style={{ background: 'linear-gradient(135deg, #2563EB 0%, #1E40AF 100%)', boxShadow: '0 8px 24px rgba(37,99,235,0.35)' }}
      >
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
          <path d="M4 20V4M4 20h16M8 16V9M13 16V6M18 16v-4" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
      <div className="text-sm text-muted">Cargando tus finanzas…</div>
    </div>
  );
}
