# Finanzas F&P

App de finanzas para pareja (Fer + Pao). Reimplementación del prototipo de
`design_handoff_finanzas_fp/` con stack de producción, responsive (mobile + desktop)
y lista para enchufar un backend.

## Stack

- **React 18 + TypeScript + Vite**
- **Tailwind v4** (config CSS-first) + variables de tema para dark/light
- **Zustand** (`persist` → localStorage) para el estado
- **React Router v6** para navegación
- Moneda **ARS**, locale **es-AR**, español rioplatense

## Scripts

```bash
npm install      # instalar dependencias
npm run dev      # servidor de desarrollo (http://localhost:5173)
npm run build    # typecheck + build de producción (dist/)
npm run preview  # servir el build
npm run typecheck
npm run lint
npm run format
```

## Estructura

```
src/
├─ types/domain.ts      # modelo de datos (entidades)
├─ data/                # seeds tipados (migrados de data.jsx)
├─ lib/                 # format, color, date, selectors (cálculos puros)
├─ store/               # Zustand store + lookups
├─ services/            # repository.ts = seam para backend
├─ theme/               # ThemeProvider (dark/light)
├─ hooks/               # useBreakpoint
├─ components/          # ui/, charts/, movimientos/, layout/
├─ features/            # una carpeta por pantalla
└─ navigation/          # rutas
```

## Responsive

- **Mobile (<768)**: pantalla completa, bottom tab bar, FAB, bottom sheets.
- **Tablet (768–1023)**: contenido centrado con ancho máximo.
- **Desktop (≥1024)**: sidebar de navegación + contenido multi-columna; el alta de
  movimiento es un modal centrado en vez de bottom sheet.

## Notas

- El prototipo fija "hoy" = **19/05/2026** y mes activo = **2026-05** (en `src/lib/date.ts`)
  para que los datos seed rendericen fieles. Cambiar ahí para usar fecha real.
- El marco de iPhone y el panel de Tweaks del prototipo **no** se implementan (andamiaje).
- Para conectar un backend: implementar `FinanzasRepository` (`src/services/`) y reemplazar
  el `persist` del store por hidratación/acciones async. Las pantallas no cambian.

## Estado

- ✅ Scaffold + tema + store + tipos + datos + navegación responsive
- ✅ Login + Dashboard (mobile y desktop)
- ✅ Movimientos, Stats, Ahorros, Vencimientos/Gastos fijos, alta multi-step
- ✅ Más + submódulos: Categorías, Cajas, Usuarios, Eventos, Alertas y metas,
  Resumen semanal, Fin de mes
- ✅ Gastos fijos reales importados del Excel + vista en USD
- ✅ Backend (Supabase) integrado en modo dual: local (localStorage) por defecto,
  nube (login real + sync en vivo) al configurar `.env` — ver [SETUP-BACKEND.md](SETUP-BACKEND.md)
- ⏳ Próximo: mejoras del Excel (frecuencias anual/bimestral, historial+tendencia
  por gasto, alertas de vencimiento) y deploy a Vercel
