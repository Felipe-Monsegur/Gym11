import { useMemo } from 'react';
import { useData } from '../context/DataContext';
import { useTheme } from '../context/ThemeContext';
import PanelSkeleton from '../components/ui/PanelSkeleton';
import EmptyState from '../components/ui/EmptyState';
import {
  getMonthlyVolumeData,
  getWeeklyWorkoutCounts,
  maxWeightByExercise,
  formatVolume,
  formatWeight,
  DEFAULT_WEEKLY_GOAL,
  getCardioExerciseIds,
} from '../utils/gymStats';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  LineChart,
  Line,
  BarChart,
  Bar,
  ReferenceLine,
} from 'recharts';

// Podio con colores de medalla; el resto neutro.
const RANK_COLORS = ['#eab308', '#9ca3af', '#b45309'];
function rankStyle(idx: number) {
  const color = RANK_COLORS[idx];
  return color
    ? { backgroundColor: color, color: '#fff' }
    : { backgroundColor: 'var(--surface-3)', color: 'var(--text-muted)' };
}

export default function Progress() {
  const { workouts, exercises, muscleGroups, bodyWeights, loading } = useData();
  const { theme, headerColor } = useTheme();

  const cardioExerciseIds = useMemo(
    () => getCardioExerciseIds(exercises, muscleGroups),
    [exercises, muscleGroups]
  );

  const weeklyWorkoutsData = useMemo(() => getWeeklyWorkoutCounts(workouts, 12), [workouts]);

  const volumeData = useMemo(
    () => getMonthlyVolumeData(workouts, 6, cardioExerciseIds),
    [workouts, cardioExerciseIds]
  );

  const prs = useMemo(() => {
    const prMap = maxWeightByExercise(workouts, cardioExerciseIds);
    const result: {
      exerciseId: string;
      exerciseName: string;
      weight: number;
      load: number;
      equipment: 'total' | 'dumbbell';
      reps: number;
      date: string;
    }[] = [];

    prMap.forEach((pr, exerciseId) => {
      const exercise = exercises.find((e) => e.id === exerciseId);
      if (exercise) {
        result.push({
          exerciseId,
          exerciseName: exercise.name,
          ...pr,
        });
      }
    });

    return result.sort((a, b) => b.load - a.load).slice(0, 10);
  }, [workouts, exercises, cardioExerciseIds]);

  const bodyWeightData = useMemo(() => {
    return [...bodyWeights]
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(-30)
      .map((bw) => ({
        date: new Date(bw.date + 'T12:00:00').toLocaleDateString('es-AR', {
          day: 'numeric',
          month: 'short',
        }),
        weight: bw.weight,
      }));
  }, [bodyWeights]);

  // Colores de los gráficos por token para que sigan el tema.
  const axisTick = { fill: 'var(--text-muted)', fontSize: 12 };
  const axisLine = false as const;
  const gridStroke = 'var(--border)';
  const tooltipStyle = {
    backgroundColor: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-control)',
    boxShadow: 'var(--shadow-float)',
    color: 'var(--text)',
  };
  const tooltipCursor = { fill: theme === 'dark' ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.04)' };

  if (loading) {
    return (
      <PanelSkeleton />
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h1 className="ui-page-title">Progreso</h1>
        <p className="ui-page-subtitle">Frecuencia, volumen, peso corporal y récords.</p>
      </div>

      {/* Workouts per week */}
      <div className="ui-panel p-4 sm:p-6">
        <h2 className="ui-label ui-label-lg mb-1">Entrenamientos por semana</h2>
        <p className="ui-caption mb-4">
          Últimas 12 semanas · meta {DEFAULT_WEEKLY_GOAL}/semana
        </p>
        {weeklyWorkoutsData.every((d) => d.count === 0) ? (
          <EmptyState title="No hay entrenamientos para mostrar" />
        ) : (
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyWorkoutsData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} vertical={false} />
                <XAxis dataKey="week" tick={axisTick} axisLine={axisLine} tickLine={false} interval="preserveStartEnd" />
                <YAxis
                  allowDecimals={false}
                  domain={[0, (dataMax: number) => Math.max(dataMax, DEFAULT_WEEKLY_GOAL)]}
                  tick={axisTick}
                  axisLine={axisLine} tickLine={false}
                  width={28}
                />
                <Tooltip
                  contentStyle={tooltipStyle}
                  cursor={tooltipCursor}
                  formatter={(value: number) => [value, 'Entrenamientos']}
                  labelFormatter={(label) => `Semana del ${label}`}
                />
                <ReferenceLine
                  y={DEFAULT_WEEKLY_GOAL}
                  stroke="var(--border-strong)"
                  strokeDasharray="4 4"
                />
                <Bar dataKey="count" fill={headerColor} radius={[6, 6, 0, 0]} maxBarSize={36} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Monthly Volume Chart */}
      <div className="ui-panel p-4 sm:p-6">
        <h2 className="ui-label ui-label-lg mb-4">Volumen mensual</h2>
        {volumeData.every((d) => d.volume === 0) ? (
          <EmptyState title="No hay datos de volumen para mostrar" />
        ) : (
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={volumeData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="volumeGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={headerColor} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={headerColor} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} vertical={false} />
                <XAxis dataKey="month" tick={axisTick} axisLine={axisLine} tickLine={false} />
                <YAxis
                  tickFormatter={(v) => formatVolume(v)}
                  tick={axisTick}
                  axisLine={axisLine} tickLine={false}
                  width={60}
                />
                <Tooltip
                  contentStyle={tooltipStyle}
                  cursor={tooltipCursor}
                  formatter={(value: number) => [formatVolume(value), 'Volumen']}
                />
                <Area
                  type="monotone"
                  dataKey="volume"
                  stroke={headerColor}
                  strokeWidth={2}
                  fill="url(#volumeGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Body Weight Chart */}
      <div className="ui-panel p-4 sm:p-6">
        <h2 className="ui-label ui-label-lg mb-4">Peso corporal</h2>
        {bodyWeightData.length === 0 ? (
          <EmptyState title="No hay registros de peso corporal" description="Cargalos desde la sección Peso." />
        ) : (
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={bodyWeightData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} vertical={false} />
                <XAxis dataKey="date" tick={axisTick} axisLine={axisLine} tickLine={false} />
                <YAxis
                  domain={['dataMin - 2', 'dataMax + 2']}
                  tickFormatter={(v) => `${v} kg`}
                  tick={axisTick}
                  axisLine={axisLine} tickLine={false}
                  width={60}
                />
                <Tooltip
                  contentStyle={tooltipStyle}
                  cursor={tooltipCursor}
                  formatter={(value: number) => [`${value} kg`, 'Peso']}
                />
                <Line
                  type="monotone"
                  dataKey="weight"
                  stroke={headerColor}
                  strokeWidth={2}
                  dot={{ fill: headerColor, strokeWidth: 0, r: 3 }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Personal Records */}
      <div className="ui-panel p-4 sm:p-6">
        <h2 className="ui-label ui-label-lg mb-4">Récords personales (PRs)</h2>
        {prs.length === 0 ? (
          <EmptyState title="No hay récords registrados todavía" />
        ) : (
          <div className="space-y-2">
            {prs.map((pr, idx) => (
              <div
                key={pr.exerciseId}
                className="ui-list-item flex items-center justify-between p-3"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold"
                    style={rankStyle(idx)}
                  >
                    {idx + 1}
                  </div>
                  <div className="min-w-0">
                    <div className="font-medium text-[var(--text)] truncate">{pr.exerciseName}</div>
                    <div className="ui-caption">
                      {new Date(pr.date + 'T12:00:00').toLocaleDateString('es-AR', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </div>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className="font-bold text-[var(--text)]">
                    {formatWeight(pr.weight)}
                    {pr.equipment === 'dumbbell' && <span className="ui-caption font-normal"> c/u</span>}
                  </div>
                  <div className="ui-caption">{pr.reps} reps</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
