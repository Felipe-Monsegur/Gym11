import { useTheme } from '../context/ThemeContext';

export default function InfoPage() {
  const { theme, headerColor } = useTheme();

  return (
    <div className="space-y-4 sm:space-y-6">
      <h1 className={`text-xl sm:text-3xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>
        Información
      </h1>

      <div className="ui-panel p-4 sm:p-6 space-y-6">
        <section>
          <h2 className="ui-label ui-label-lg mb-3" style={{ color: headerColor }}>
            Bienvenido a Gym11
          </h2>
          <p className="text-[var(--text-muted)] text-sm leading-relaxed">
            Esta app te permite llevar un registro completo de tus entrenamientos de gimnasio.
            Registrá ejercicios, series, repeticiones y peso para hacer seguimiento de tu progreso.
          </p>
        </section>

        <section>
          <h2 className="ui-label ui-label-lg mb-3" style={{ color: headerColor }}>
            Cómo empezar
          </h2>
          <ol className="list-decimal list-inside space-y-2 text-[var(--text-muted)] text-sm">
            <li>
              <strong className="text-[var(--text)]">Creá grupos musculares</strong> — En Gestión, agregá los grupos (Pecho, Espalda, Piernas, etc.)
            </li>
            <li>
              <strong className="text-[var(--text)]">Agregá ejercicios</strong> — Asociá cada ejercicio a un grupo muscular (Press banca → Pecho)
            </li>
            <li>
              <strong className="text-[var(--text)]">Registrá entrenamientos</strong> — Seleccioná ejercicios, agregá series con reps y peso
            </li>
            <li>
              <strong className="text-[var(--text)]">Seguí tu progreso</strong> — Mirá gráficos de volumen y tus récords personales
            </li>
          </ol>
        </section>

        <section>
          <h2 className="ui-label ui-label-lg mb-3" style={{ color: headerColor }}>
            Conceptos clave
          </h2>
          <dl className="space-y-3 text-sm">
            <div>
              <dt className="font-semibold text-[var(--text)]">Volumen</dt>
              <dd className="text-[var(--text-muted)]">
                Suma de (repeticiones × peso) de todas las series. Indica el trabajo total realizado.
              </dd>
            </div>
            <div>
              <dt className="font-semibold text-[var(--text)]">Racha</dt>
              <dd className="text-[var(--text-muted)]">
                Cantidad de días consecutivos con al menos un entrenamiento registrado.
              </dd>
            </div>
            <div>
              <dt className="font-semibold text-[var(--text)]">PR (Récord Personal)</dt>
              <dd className="text-[var(--text-muted)]">
                El peso máximo que levantaste en un ejercicio específico.
              </dd>
            </div>
          </dl>
        </section>

        <section>
          <h2 className="ui-label ui-label-lg mb-3" style={{ color: headerColor }}>
            Tips de entrenamiento
          </h2>
          <ul className="space-y-2 text-[var(--text-muted)] text-sm">
            <li className="flex items-start gap-2">
              <span className="text-green-500 mt-0.5">✓</span>
              <span>Registrá cada entrenamiento para ver tu progreso a lo largo del tiempo</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-500 mt-0.5">✓</span>
              <span>Usá notas para recordar técnica, ajustes de máquinas o sensaciones</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-500 mt-0.5">✓</span>
              <span>Registrá tu peso corporal regularmente para correlacionar con volumen</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-500 mt-0.5">✓</span>
              <span>Intentá superar tus PRs gradualmente con buena técnica</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-500 mt-0.5">✓</span>
              <span>Mantené consistencia: pequeñas mejoras suman grandes resultados</span>
            </li>
          </ul>
        </section>

        <section>
          <h2 className="ui-label ui-label-lg mb-3" style={{ color: headerColor }}>
            Personalización
          </h2>
          <p className="text-[var(--text-muted)] text-sm leading-relaxed">
            Podés cambiar el tema (claro/oscuro) y el color del header desde el botón de perfil
            en la parte superior. Tus preferencias se guardan y sincronizan entre dispositivos.
          </p>
        </section>
      </div>
    </div>
  );
}
