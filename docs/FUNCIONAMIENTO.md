# Gym11 — Funcionamiento

App de seguimiento de entrenamientos.
Proyecto Firebase: `gym11-1111`

## Flujo de acceso

1. El usuario se registra / inicia sesión con email y contraseña (Firebase Auth).
2. Si no está en `allowedUsers`, ve la pantalla de pedido de acceso.
3. Un admin aprueba desde **Gestión → Acceso**.
4. El email del admin configurado en `src/config/admins.ts` siempre tiene acceso.

## Datos (Firestore)

| Colección | Contenido |
|-----------|-----------|
| `muscleGroups` | Grupos musculares (Pecho, Espalda, etc.) |
| `exercises` | Biblioteca de ejercicios |
| `workouts` | Sesiones con sets (reps × peso) |
| `bodyWeights` | Registro de peso corporal |
| `allowedUsers` | Lista blanca |
| `accessRequests` | Pedidos de acceso |
| `userSettings` | Tema, color de header, título |

## Pantallas

- **Dashboard** — entrenamientos de la semana, volumen, racha, últimos 5
- **Historial** — lista filtrable de entrenamientos
- **Entrenar** — formulario de sesión (ejercicios + series)
- **Progreso** — gráficos de volumen y peso, PRs
- **Peso** — carga y historial de peso corporal
- **Gestión** — grupos, ejercicios y usuarios

## Firebase setup

1. Auth → Email/Password habilitado; dominios: `localhost`, `gym11-1111.web.app`, `gym11-1111.firebaseapp.com`.
2. Firestore creado + reglas desplegadas: `firebase deploy --only firestore:rules`
3. Agregar tu usuario a `allowedUsers` (o entrar como admin configurado).
4. Hosting: `npm run build` + `firebase deploy --only hosting`
