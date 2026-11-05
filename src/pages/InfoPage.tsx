
export default function InfoPage() {

  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h1 className="ui-page-title">Información</h1>
        <p className="ui-page-subtitle">Cómo funciona Gym11.</p>
      </div>

      <div className="ui-panel p-4 sm:p-6 space-y-6">
        <section>
          <h2 className="ui-label ui-label-lg mb-3" style={{ color: 'var(--accent-text)' }}>
            Bienvenido a Gym11
          </h2>
          <p className="text-[var(--text-muted)] text-sm leading-relaxed">
            Esta app te permite llevar un registro completo de tus entrenamientos de gimnasio.
            Al empezar ya tenés un pack de grupos y ejercicios; registrá series con reps y peso (o minutos en cardio).
          </p>
        </section>

        <section>
          <h2 className="ui-label ui-label-lg mb-3" style={{ color: 'var(--accent-text)' }}>
            Cómo empezar
          </h2>
          <ol className="list-decimal list-inside space-y-2 text-[var(--text-muted)] text-sm">
            <li>
              <strong className="text-[var(--text)]">Pack inicial</strong> — Al entrar por primera vez se cargan grupos (Pecho, Espalda, Cardio, etc.) y ejercicios base
            </li>
            <li>
              <strong className="text-[var(--text)]">Personalizá en Gestión</strong> — Agregá, editá o reordená grupos y ejercicios; marcá un grupo como cardio si hace falta
            </li>
            <li>
              <strong className="text-[var(--text)]">Registrá entrenamientos</strong> — Fuerza: series con reps y kg. Cardio: series con reps y minutos
            </li>
            <li>
              <strong className="text-[var(--text)]">Seguí tu progreso</strong> — Mirá gráficos de volumen y tus récords personales
            </li>
          </ol>
        </section>

        <section>
          <h2 className="ui-label ui-label-lg mb-3" style={{ color: 'var(--accent-text)' }}>
            Conceptos clave
          </h2>
          <dl className="space-y-3 text-sm">
            <div>
              <dt className="font-semibold text-[var(--text)]">Volumen</dt>
              <dd className="text-[var(--text-muted)]">
                Suma de (repeticiones × peso) de las series de fuerza. El cardio no suma al volumen en kg.
              </dd>
            </div>
            <div>
              <dt className="font-semibold text-[var(--text)]">Cardio</dt>
              <dd className="text-[var(--text-muted)]">
                Grupos marcados como cardio se miden en repeticiones y minutos, sin peso en kg.
              </dd>
            </div>
            <div>
              <dt className="font-semibold text-[var(--text)]">Esta semana</dt>
              <dd className="text-[var(--text-muted)]">
                Cuántos entrenamientos registraste desde el lunes hasta hoy.
              </dd>
            </div>
            <div>
              <dt className="font-semibold text-[var(--text)]">PR (Récord Personal)</dt>
              <dd className="text-[var(--text-muted)]">
                El peso máximo que levantaste en un ejercicio de fuerza específico.
              </dd>
            </div>
          </dl>
        </section>

        <section>
          <h2 className="ui-label ui-label-lg mb-3" style={{ color: 'var(--accent-text)' }}>
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
          <h2 className="ui-label ui-label-lg mb-3" style={{ color: 'var(--accent-text)' }}>
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
