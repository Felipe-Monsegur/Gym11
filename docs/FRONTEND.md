# Finanzas 11 — Arquitectura y decisiones de Front

Guía para **replicar el front de Finanzas 11 en otras apps** (a mano o con Claude).
Describe stack, estructura, sistema visual, componentes, patrones y las decisiones detrás de cada uno.

Documentos hermanos:
- [`Diseño.json`](../Diseño.json) — perfil del design system en formato máquina (útil para pasarle a una IA).
- [`docs/FUNCIONAMIENTO.md`](FUNCIONAMIENTO.md) — datos, Firestore, acceso y deploy.

> Si hay diferencia entre este documento y `Diseño.json`, **manda el código** (`src/index.css`). Los valores de abajo están tomados del CSS actual.

---

## 1. Stack

| Capa | Elección | Por qué |
|------|----------|---------|
| Framework | React 18 + TypeScript | Tipado de entidades (`src/types.ts`) compartido por páginas y servicios |
| Build | Vite 5 | Rápido, plugin propio para `BUILD_ID` (ver §12) |
| Ruteo | react-router-dom v6 (`BrowserRouter`) | SPA con rewrite `** → /index.html` en Firebase Hosting |
| Estilos | Tailwind 3 **+** clases propias `ui-*` en `src/index.css` | Tailwind para layout/spacing; `ui-*` para todo lo que define identidad |
| Tipografía | Plus Jakarta Sans (Google Fonts 400/500/600/700) | Única familia en toda la app |
| Gráficos | Recharts + `DonutChart` propio | Recharts para barras/líneas; donut propio para control visual |
| Fechas | date-fns + `Intl` | `Intl` con zona `America/Argentina/Buenos_Aires` para "hoy" |
| Tour | react-joyride | Tour guiado de la app |
| Excel | xlsx (SheetJS CDN) | Import/export |
| Backend | Firebase Auth + Firestore + Hosting | |

**No se usa:** librería de componentes (MUI, shadcn, etc.), CSS-in-JS, Redux/Zustand, React Query, librería de íconos (los SVG van inline, estilo Heroicons outline, `strokeWidth` 1.75–2).

---

## 2. Estructura de carpetas

```
src/
  main.tsx              # monta <App/>, llama watchForNewBuilds()
  App.tsx               # providers + rutas + ProtectedRoute + ScrollToTop
  index.css             # TODO el sistema visual: tokens, temas, clases ui-*, animaciones
  types.ts              # entidades de dominio
  config/               # firebase (no versionado, hay .example), admins
  constants/            # colores fijos (EXPENSE_COLOR, INCOME_COLOR)
  context/              # Auth, Theme, Data, Currency, Toast
  services/             # acceso a Firebase y APIs externas (sin JSX)
  utils/                # cálculos puros, fechas, orden, excel, cache-busting
  data/                 # datos semilla (pack inicial de categorías)
  components/           # componentes compartidos con lógica (Modal, DateInput, Layout…)
  components/ui/        # primitivas visuales sin dominio (Skeleton, EmptyState, AmountInput…)
  features/help/        # feature autocontenida: FAQ, drawer, FAB, tour
  pages/                # una pantalla por archivo (paneles y formularios)
public/                 # logo, favicons, manifest
```

Reglas:
- **pages/** consume contextos y servicios; **components/ui/** no conoce el dominio.
- **services/** devuelve datos tipados; nunca toca el DOM.
- **utils/** son funciones puras (testeables, sin React).
- Una feature grande y autónoma va en `features/<nombre>/` con todo adentro.

---

## 3. Arranque, providers y ruteo

Orden de providers en `App.tsx` (importa: cada uno depende del anterior):

```tsx
<BrowserRouter>
  <ScrollToTop />            // vuelve arriba al cambiar de ruta
  <AuthProvider>             // usuario + lista blanca
    <ThemeProvider>          // tema + color de acento (lee settings del usuario)
      <DataProvider>         // carga todos los datos del usuario
        <CurrencyProvider>   // moneda de visualización ARS/USD
          <ToastProvider>    // toasts globales
            <AppRoutes />
```

- `ProtectedRoute` muestra un loader (logo con `animate-pulse` + "Cargando…") mientras se resuelve auth; redirige a `/login` o `/not-authorized`.
- Cada ruta privada se envuelve en `<ProtectedRoute><Layout>…</Layout></ProtectedRoute>`.
- Rutas viejas se mantienen como `<Navigate replace>` para no romper links guardados.
- Rutas en español y por recurso: `/ingresos`, `/gastos/nuevo`, `/inversiones/operacion`, `/gestion`.
- No hay code splitting (`React.lazy`): la app es chica y se prioriza simplicidad.

---

## 4. Estado y datos

| Contexto | Contenido | Persistencia |
|----------|-----------|--------------|
| `AuthContext` | `user`, `loading`, `isAllowed`, `checkingAccess` | Firebase Auth |
| `ThemeContext` | `theme`, `headerColor` (dark/light por separado), `headerTitle` | localStorage (instantáneo) + Firestore `userSettings` (multi-dispositivo) |
| `DataContext` | todas las colecciones del usuario + `loading` + `refresh()` | Firestore |
| `CurrencyContext` | `displayCurrency` ARS/USD | localStorage + Firestore |
| `ToastContext` | `showToast(msg, type)` | memoria |

Decisiones:
- **Un solo DataContext que carga todo al entrar** (`Promise.all`) y expone `refresh()`. Después de crear/editar/borrar, la página llama al servicio y luego `refresh()`. Simple y suficiente para volúmenes personales.
- Colecciones secundarias (ajustes, periódicos, inversiones) se cargan en `try/catch` propios: si fallan, la app sigue con `[]`.
- Cálculos derivados (saldos, totales) se hacen en `utils/` y se memoizan con `useMemo` en la página, no se guardan en contexto.
- **Preferencias del usuario: localStorage para evitar parpadeo al abrir + Firestore para sincronizar.** Siempre envolver `localStorage` en `try/catch`.
- Los defaults (colores, tema) aplican solo a usuarios nuevos; **nunca sobrescribir valores guardados**.
- "Hoy" se calcula con `getTodayDateString()` en zona Argentina, nunca con `new Date().toISOString()` (UTC).
- Orden de listas: `sortOrder` manual y, si falta, `createdAt` desc (`utils/displayOrder.ts`).

---

## 5. Shell / Layout

`components/Layout.tsx` + clases `app-*`.

**Desktop (≥1024px)**
- Sidebar fija a la izquierda: `15.5rem` expandida / `4.75rem` colapsada, borde derecho de 2px en `--header-color`.
- Contenido: brand (logo + título editable) → navegación (ícono + label) → acciones rápidas (Gasto / Ingreso / Transferencia, en mayúsculas) → footer (tema, perfil, salir).
- Botón de colapsar en el borde; estado en `localStorage('sidebarCollapsed')`.
- **Anti-FOUC:** un `<script>` inline en `index.html` agrega `html.sidebar-collapsed` antes de que cargue React. Las transiciones del sidebar se activan recién con `html.sidebar-ready` (un `requestAnimationFrame` después del montaje) para que no anime al cargar.
- **No hay barra superior de color** ocupando todo el ancho.

**Mobile (<1024px)**
- `app-mobile-tabs`: pestañas fijas arriba con las 4 secciones principales + "Más" (abre el sidebar como drawer con overlay).
- `app-mobile-actions`: botones de carga fijos abajo (Gasto / Ingreso / Transferencia).
- Respetar `env(safe-area-inset-*)` (viewport con `viewport-fit=cover`).

**Siempre**
- `<main className="app-content animate-fade-up">` — la animación de entrada **no usa `fill: both`**: un `transform` residual en `<main>` rompe `position: fixed/sticky` de los hijos.
- Botón flotante "Volver arriba" (aparece con `scrollY > 280`).
- FAB de ayuda + drawer de FAQ por sección + tour (react-joyride, elementos marcados con `data-tour="..."`).
- El sidebar se cierra al cambiar de ruta.

**Patrón de página:** título (`ui-page-title`) → grilla de KPIs → panel de filtros colapsable → tablas/gráficos dentro de `ui-panel`.

---

## 6. Sistema visual (tokens)

Todo en variables CSS sobre `:root` (oscuro por defecto) y overrides en `body.light-theme`. `ThemeContext` pone `dark-theme`/`light-theme` en `<body>` y escribe `--header-color` en `<html>`.

### 6.1 Colores

| Token | Oscuro | Claro |
|-------|--------|-------|
| `--app-bg` | `#0f0f0f` | `#f6f6fb` |
| `--surface` | `#1a1a1a` | `#ffffff` |
| `--surface-2` | `#262626` | `#f3f3f9` |
| `--surface-3` | `#333333` | `#eaeaf4` |
| `--border` | `rgba(255,255,255,.10)` | `rgba(26,26,46,.08)` |
| `--border-strong` | `rgba(255,255,255,.18)` | `rgba(26,26,46,.16)` |
| `--text` | `#fafafa` | `#1a1a2e` |
| `--text-muted` | `#a3a3a3` | `#5c5c72` |

Fijos en ambos temas:
- `--header-color` — **único acento de marca**, configurable por usuario (default `#7c6ff0` oscuro / `#6b5ce7` claro).
- `--expense-color: #dc2626` · `--income-color: #16a34a` (también en `constants/transactionColors.ts`).
- Estados (`StatusIcon`): success `#22c55e`, error/danger `#ef4444`, info `#3b82f6`, warning `#f59e0b`.

Derivados con `color-mix` (nunca hardcodear tintes):
- `--accent-text` — acento legible como texto (mezclado con blanco en oscuro, con `--text` en claro).
- `--focus-ring` — anillo de foco.
- `--pastel-1..4` — tintes suaves de acento / ingreso / ámbar / celeste sobre `--surface`.

Reglas:
- **Oscuro neutro**: nada de grises azulados (`#1c2536`, slate). Nada de `#000` puro.
- **Claro**: `--text-muted` no más claro que `#5c5c72` (contraste).
- Fondo: `body::before` fijo con gradientes radiales muy suaves del acento + lineal vertical. `body::after` permite un "glow" del tipo de transacción activo (`--tx-accent` + `html.tx-accent-active`).
- Remapeo de grises de Tailwind (`bg-gray-*`, `bg-slate-*`, `text-gray-*`) a tokens por tema, para que clases sueltas no rompan el tema. **No remapear `text-white`** en claro (rompe botones).

### 6.2 Radios, sombras, movimiento

```css
--radius-control: 1rem;   /* inputs, botones */
--radius-panel: 1.25rem;  /* paneles, KPIs, tablas */
--radius-lg: 1.5rem;      /* diálogos */
--radius-pill: 999px;
--shadow-subtle / --shadow-panel / --shadow-float   /* más fuertes en oscuro, muy suaves en claro */
--ease-out: cubic-bezier(0.32, 0.72, 0, 1);
--ease-spring: cubic-bezier(0.34, 1.36, 0.64, 1);
--dur-fast: 150ms; --dur-base: 220ms; --dur-slow: 300ms;
```

`DIALOG_EXIT_MS` (220) en `dialogHooks.ts` debe coincidir con `--dur-base`.

### 6.3 Tipografía

- Familia única: `'Plus Jakarta Sans', system-ui, sans-serif`.
- **Sistema de micro-labels en MAYÚSCULAS** (peso 700, `letter-spacing: .06em`): `.ui-label` (+ `-xs/-sm/-md/-lg`), `.ui-kpi-label`, labels de `.form-group`, botones submit y de acción, encabezados de tabla, pestañas.
- **No** van en mayúsculas: títulos de página/sección y valores.

| Clase | Tamaño (mobile → sm+) | Peso |
|-------|----------------------|------|
| `ui-page-title` | 1.625 → 1.875rem | 700 |
| `ui-section-title` | 1.25 → 1.5rem | 700 |
| `ui-subsection-title` | ~1.06 → 1.125rem | 600 |
| `ui-kpi-label` | .875 → .9375rem, mayúsculas | 700 |
| `ui-kpi-value` | 1.35 → 1.55rem, `letter-spacing -0.02em` | 700 |
| `ui-caption` / `ui-page-subtitle` | chico, `--text-muted` | |

- Números: **usar los numerales por defecto de la fuente**. `tabular-nums` solo en `.ui-table` (decisión explícita: no agregar en otros lados).
- Montos con `Intl.NumberFormat('es-AR')` vía `formatCurrency()`.

---

## 7. Arquitectura CSS

- Un único `src/index.css`: `@tailwind base/components/utilities` → tokens → temas → animaciones → `@layer components { .ui-* .app-* }` → tablas/fechas.
- **Tailwind para layout** (`flex`, `grid`, `gap-3/4`, `p-4 sm:p-6`, breakpoints). **Clases `ui-*` para identidad** (superficies, tipografía, inputs, botones, diálogos).
- Colores en JSX siempre por token: `bg-[var(--surface)]`, `text-[var(--text-muted)]`, `border-[var(--border)]`. Tailwind expone `canvas`, `surface`, `muted`, `rounded-panel/soft/pill`, `shadow-panel/soft`.
- Color dinámico (de una entidad) por `style` inline o variable CSS local (`--status-color`, `--tab-accent`), nunca generando clases.
- Scrollbars ocultas globalmente; **excepción**: tablas con scroll (`.ui-table-wrap`) muestran scrollbar fina con thumb `--header-color`.
- Breakpoints: `sm` 640px (tipografía/espaciado), `lg` 1024px (shell desktop vs mobile).

---

## 8. Catálogo de componentes

### Primitivas (`components/ui/`)
| Componente | Uso |
|-----------|-----|
| `Skeleton` | Bloque shimmer; tamaño por `className` (`h-6 w-32`) |
| `PanelSkeleton` | Esqueleto estándar de panel: filtros + tabla + gráfico |
| `EmptyState` | Ícono en círculo + título + texto + CTA opcional |
| `StatusIcon` + `STATUS_COLORS` | Círculo con ícono por estado (toasts, alertas) |
| `AmountInput` | Input de monto con prefijo de moneda (`$`, `US$`) **del mismo tamaño que el resto** |
| `DonutChart` | Donut propio |
| `dialogHooks` | `usePresence`, `useFrozenWhileClosed`, `useBodyScrollLock`, `useEscapeToClose`, `useDialogFocus` |

### Compartidos (`components/`)
| Componente | Uso |
|-----------|-----|
| `Layout` | Shell completo (§5) |
| `Modal` | Diálogo genérico con barra de acento + título coloreable + subtítulo |
| `ConfirmModal` | `alertdialog` centrado; tipos danger/warning/info |
| `MessageModal` | Mensaje informativo |
| `Toast` | Item de toast (ver `ToastContext`) |
| `DateInput` / `MonthInput` | Popover de calendario propio (`ui-popover`, `ui-cal-cell`) sobre input nativo |
| `MonthRangeFiltersPanel` / `CollapsibleOptionsPanel` | Filtros colapsables con resumen y "limpiar" |
| `HamburgerMenuDropdown` | Menú cuadrado `h-10 w-10` para Exportar/Importar en listas |

### Clases sin componente
`ui-panel`, `ui-kpi`, `ui-stat`, `ui-list-item(-btn)`, `ui-icon-btn(-primary|-ghost)`, `ui-btn(-primary|-secondary)`, `ui-btn-submit`, `ui-form-secondary`, `ui-tabs`/`ui-tab`, `ui-menu-btn`/`ui-menu-panel`/`ui-menu-item`, `ui-row-action`, `ui-swatch`, `ui-link-btn`, `ui-expense-*`/`ui-income-*` (color/bg/btn/link).

---

## 9. Patrones

### 9.1 Diálogos
- Siempre por **portal** a `document.body`.
- **Mobile: bottom sheet** (sube desde abajo, esquinas superiores redondeadas, `ui-sheet-grabber`, `92vh`, safe-area). **Desktop: tarjeta centrada** con `scaleIn`, `max-width: 28rem`.
- Confirmaciones/alertas (`ui-overlay.is-centered` + `ui-alert`): centradas también en mobile, `max-width: 22rem`.
- Overlay `rgba(0,0,0,.55)` + `backdrop-filter: blur(8px)`.
- Animación de salida real: `usePresence` mantiene montado durante `DIALOG_EXIT_MS` con clase `is-closing`; `useFrozenWhileClosed` congela el contenido para que no "parpadee" vacío mientras sale.
- Accesibilidad: `role="dialog"`/`alertdialog`, `aria-modal`, `aria-labelledby` con `useId`, foco al abrir y devuelto al disparador al cerrar, Escape cierra **solo el de más arriba** (pila), lock de scroll con contador (soporta diálogos apilados).
- Cabecera sticky: barrita de acento `h-1 w-10` (color de la entidad o `--header-color`) + `ui-section-title` + botón cerrar `ui-icon-btn`.

### 9.2 Toasts
- `showToast(mensaje, 'success'|'error'|'info'|'warning')`.
- Arriba centrados en mobile, arriba-derecha en desktop, `aria-live="polite"`, respetan safe-area.
- Toda acción de guardado termina en toast de éxito o error.

### 9.3 Formularios
- Página propia por tipo (`/gastos/nuevo`), no modal. Edición de registros existentes sí en `Modal`.
- Cada campo: `<div className="form-group"><label>…</label><input className="ui-input"/></div>`.
- `ui-input`: fondo `--surface-2`, sin borde visible, hover con borde tinte acento, foco con borde + halo `color-mix` del acento.
- **Todos los campos del mismo tamaño** (no agrandar el de monto).
- Submit `ui-btn-submit` en mayúsculas; estado cargando con `data-loading="true"` (oculta texto, muestra spinner) + estado `submitting` que evita doble envío.
- Validación en el submit con toast `warning`; valores por defecto inteligentes (fecha de hoy en zona AR, última cuenta, etc.).
- Mobile: `font-size: 16px` en inputs para que iOS no haga zoom.

### 9.4 KPIs
- `ui-kpi`: sin borde, radio panel, `min-height 5.5rem`, label en mayúsculas → valor grande → sublíneas muted.
- **Tinte de la entidad real**: `background: color-mix(in srgb, COLOR 14–18%, var(--surface))` + barra izquierda `box-shadow: inset 4px 0 0 COLOR`.
- KPI "Total": neutro (`--surface-2` + barra gris `#6b7280`), sin tinte de marca.
- Si son métricas (no entidades): tintes distintos `--pastel-1..4`.

### 9.5 Tablas
- Envoltura `ui-table-wrap` (scroll horizontal) o `ui-table-wrap-y` (con `max-height`). `overscroll-behavior` solo en X para no atrapar la rueda vertical.
- Header, primera columna y footer **sticky con fondo opaco** de token.
- Zebra `surface` / `surface-2`.
- **Verde/rojo solo en columnas de total o semánticas**, no en cada celda.
- Filtros por columna (`ui-table-filter`, chips) y acciones de fila (`ui-row-action` editar/eliminar, área táctil mayor en `pointer: coarse`).

### 9.6 Pestañas
- `ui-tabs` + `ui-tab`; activa teñida con `--tab-accent` o `--header-color`.
- En mobile se convierten en chips tipo pill.
- Tinte con `opacity`, no `color-mix`, por un bug de repaint en WebKit mobile.

### 9.7 Listas de gestión
- Panel con título `ui-label ui-label-lg`, botón `+` (`ui-icon-btn`) y menú hamburguesa (Exportar/Importar) del mismo tamaño, alineados.
- Swatches de color (`ui-swatch`) para elegir color de cuenta/categoría.

### 9.8 Estados de carga y vacíos
- Mientras `loading`: `PanelSkeleton` / `Skeleton`, nunca spinner a pantalla completa (salvo el gate de auth).
- Sin datos: `EmptyState` con CTA hacia el formulario correspondiente.

### 9.9 Botones de ícono
- `ui-icon-btn`: cuadrado `2.25rem` (40px en táctil), `box-sizing: border-box`, padding 0 — hermanos siempre del mismo tamaño.

---

## 10. Responsive y mobile (iOS primero)

- `viewport-fit=cover` + `env(safe-area-inset-*)` en barras fijas, toasts, sheets.
- `touch-action: manipulation` en `html` (sin zoom por doble tap).
- Inputs a 16px en mobile; `DateInput` con wrapper que evita overflow del date nativo en Safari.
- PWA liviana: `manifest.webmanifest`, `apple-touch-icon`, `theme-color #121212`, `apple-mobile-web-app-capable`. Sin service worker (se desregistra activamente, ver §12).
- Íconos con `?v=N` en la URL para forzar refresco cuando cambian.

---

## 11. Accesibilidad y movimiento

- `:focus-visible` con `outline: 2px solid var(--focus-ring)` en todos los controles interactivos (solo teclado).
- Botones de ícono siempre con `aria-label` y `title`.
- `aria-current="page"` en navegación activa, `aria-busy` en esqueletos, `aria-live` en toasts.
- `prefers-reduced-motion: reduce` → duraciones a 1ms globalmente.
- Feedback de press: `transform: scale(.97)` + leve `filter: brightness`; hover `translateY(-1px)`.
- Animaciones de entrada sin `fill: both` cuando el elemento contiene hijos `fixed/sticky`.

---

## 12. Build, caché y deploy

Problema: usuarios quedándose con versiones viejas. Solución en tres capas:

1. **Plugin de Vite** (`vite.config.ts`) genera un `BUILD_ID` por build: lo inyecta como `__BUILD_ID__`, lo escribe en `<meta name="build-id">` y genera `dist/version.json`.
2. **Script inline en `index.html`** compara el meta con `/version.json` (sin caché) antes de cargar la app; si difiere, recarga con `?_bid=` (máximo 2 intentos por sesión).
3. **`watchForNewBuilds()`** en `main.tsx` desregistra service workers, limpia `caches` y vuelve a chequear.

Headers en `firebase.json`: `/assets/**` inmutable 1 año; `index.html`, `version.json` y resto `no-cache`.

Deploy: `publicar.bat` (build + `firebase deploy`). Desarrollo local: `local.bat` / `npm run dev`.

---

## 13. Convenciones de código

- Idioma: **UI, rutas, comentarios y mensajes en español** (rioplatense: "Indicá", "Agregá"). Identificadores en inglés.
- Componentes como `export default function Nombre()`, un componente principal por archivo.
- Comentarios solo para el *por qué* (ej. bugs de WebKit, decisiones de animación).
- Hooks de contexto `useX()`; `useToast` tira error si se usa fuera del provider.
- Íconos SVG inline, `fill="none" stroke="currentColor"`, `aria-hidden`.
- Nada de colores hex sueltos en JSX salvo colores de dominio (entidad, gasto/ingreso, estados).

---

## 14. Qué evitar

- Superficies oscuras azuladas; `#000` puro; sombras pesadas multicapa; esquinas rectas.
- Barra superior de color a todo el ancho.
- Pasteles genéricos rotativos cuando existe el color real de la entidad.
- Abandonar el sistema de labels en mayúsculas.
- Colorear verde/rojo cada celda.
- Remapear `text-white` globalmente en claro.
- `tabular-nums` fuera de `.ui-table`.
- Un campo de formulario más grande que los demás.
- Spinners a pantalla completa para cargas de datos.
- `transform` residual en contenedores con hijos `fixed`/`sticky`.
- Sobrescribir preferencias guardadas del usuario con defaults.

---

## 15. Checklist para portar a una app nueva

1. Vite + React + TS + Tailwind + react-router. Fuente Plus Jakarta Sans en `index.html`.
2. Copiar `src/index.css` completo (tokens, temas, `ui-*`, `app-*`, animaciones) y `tailwind.config.js`.
3. Copiar `components/ui/` (incluido `dialogHooks.ts`), `Modal`, `ConfirmModal`, `MessageModal`, `Toast` + `ToastContext`.
4. `ThemeContext`: clase en `body`, `--header-color` en `html`, persistencia localStorage + backend.
5. `Layout`: sidebar colapsable con script anti-FOUC, pestañas mobile arriba, acciones abajo, volver arriba.
6. Providers en el orden de §3; `ProtectedRoute` con loader de logo.
7. Páginas con el patrón título → KPIs → filtros → paneles.
8. Plugin `BUILD_ID` + script de versión + headers de caché.
9. QA: contraste en claro, neutralidad en oscuro, acento personalizado distinto al default, iPhone (safe-area, zoom de inputs, sheets), teclado (foco, Escape), reduced motion.

---

## 16. Prompt base para Claude

Para arrancar otra app con este estilo, pegar algo así junto con este archivo y `Diseño.json`:

> Construí el front de esta app replicando el sistema de `FRONTEND.md`: React + TS + Vite + Tailwind, tokens CSS con tema oscuro neutro y claro lavanda, un solo acento `--header-color` configurable, Plus Jakarta Sans, micro-labels en mayúsculas, paneles redondeados (`ui-panel`), KPIs teñidos con el color de la entidad + barra izquierda, sidebar colapsable en desktop y pestañas arriba + acciones abajo en mobile, diálogos como bottom sheet en mobile y tarjeta en desktop con los hooks de `dialogHooks`, toasts globales, skeletons y empty states. Respetá la sección "Qué evitar". No agregues librerías de componentes ni de íconos.
