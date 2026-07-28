# Gym11

App web para registrar entrenamientos de gimnasio: ejercicios, series, repeticiones, peso, progreso y peso corporal, con sincronización en Firebase.

**Proyecto Firebase:** `gym11-1111`  
**Hosting:** [https://gym11-1111.web.app](https://gym11-1111.web.app)

![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)
![Firebase](https://img.shields.io/badge/Firebase-FFCA28?logo=firebase&logoColor=black)
![Vite](https://img.shields.io/badge/Vite-5-646CFF?logo=vite&logoColor=white)

## Características

- **Dashboard** — entrenamientos de la semana, volumen total, racha, últimos entrenamientos
- **Historial** — lista completa de entrenamientos con filtros por fecha y búsqueda
- **Entrenamientos** — registro de ejercicios con series (reps × peso), duración, notas
- **Progreso** — gráficos de volumen mensual, peso corporal, récords personales (PRs)
- **Peso corporal** — registro y seguimiento del peso con historial
- **Gestión** — grupos musculares, ejercicios, orden de visualización, pedidos de acceso (admin)
- **UI** — tema claro/oscuro, color de header personalizable, diseño responsive

## Stack

| Capa | Tecnología |
|------|------------|
| UI | React 18, TypeScript, Vite, Tailwind CSS |
| Gráficos | Recharts |
| Backend | Firebase Auth, Firestore, Hosting |
| Utilidades | date-fns |

## Requisitos

- Node.js 18+
- Proyecto Firebase (Auth email/password + Firestore)

## Instalación

```bash
npm install
cp src/config/firebase.example.ts src/config/firebase.ts
# Completá las credenciales de tu proyecto Firebase en firebase.ts
npm run dev
```

La app corre en `http://localhost:5173`.

### Firestore

```bash
firebase deploy --only firestore:rules
```

Agregá tu usuario a la lista blanca (`allowedUsers`) en Firestore **antes** del primer acceso. El flujo de pedidos de acceso lo administra un admin desde **Gestión**.

## Scripts

| Comando | Descripción |
|---------|-------------|
| `npm run dev` | Desarrollo (Vite) |
| `npm run build` | Typecheck + build de producción (`dist/`) |
| `npm run preview` | Preview del build local |
| `firebase deploy --only hosting` | Publicar Hosting |

En Windows también podés usar `local.bat` / `publicar.bat`.

## Estructura

```
src/
  components/   # Layout, modales, inputs de fecha
  context/      # Auth, Data, Theme, Toast
  pages/        # Dashboard, WorkoutHistory, WorkoutForm, Progress, BodyWeight, Management, InfoPage
  services/     # Firebase
  utils/        # gymStats, displayOrder, fechas
  config/       # firebase.example.ts (firebase.ts es local)
  types.ts
```

## Notas de seguridad

- `src/config/firebase.ts` está en `.gitignore` (no subir credenciales).
- Usá `firebase.example.ts` como plantilla.
- Las reglas de Firestore limitan el acceso según lista blanca / admin.

## Licencia

Uso personal / MIT si se publica el repo con licencia.
