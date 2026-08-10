import { useMemo } from 'react';
import { useData } from '../context/DataContext';
import { useTheme } from '../context/ThemeContext';
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

    return result.sort((a, b) => b.weight - a.weight).slice(0, 10);
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

  const axisTick = { fill: theme === 'dark' ? '#9ca3af' : '#6b7280', fontSize: 12 };
  const axisLine = { stroke: theme === 'dark' ? '#374151' : '#e5e7eb' };
  const gridStroke = theme === 'dark' ? '#374151' : '#e5e7eb';
  const tooltipStyle = {
    backgroundColor: theme === 'dark' ? '#1f2937' : '#ffffff',
    border: `1px solid ${theme === 'dark' ? '#374151' : '#e5e7eb'}`,
    borderRadius: '8px',
    color: theme === 'dark' ? '#f3f4f6' : '#1f2937',
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-lg text-[var(--text-muted)] animate-pulse">Cargando...</div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <h1 className={`text-xl sm:text-3xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>
        Progreso
      </h1>

      {/* Workouts per week */}
      <div className="ui-panel p-4 sm:p-6">
        <h2 className="ui-label ui-label-lg mb-1">Entrenamientos por semana</h2>
        <p className="text-xs text-[var(--text-muted)] mb-4">
          Últimas 12 semanas · meta {DEFAULT_WEEKLY_GOAL}/semana
        </p>
        {weeklyWorkoutsData.every((d) => d.count === 0) ? (
          <div className="text-center py-8 text-[var(--text-muted)]">
            No hay entrenamientos para mostrar
          </div>
        ) : (
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyWorkoutsData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
                <XAxis dataKey="week" tick={axisTick} axisLine={axisLine} interval="preserveStartEnd" />
                <YAxis
                  allowDecimals={false}
                  domain={[0, (dataMax: number) => Math.max(dataMax, DEFAULT_WEEKLY_GOAL)]}
                  tick={axisTick}
                  axisLine={axisLine}
                  width={28}
                />
                <Tooltip
                  contentStyle={tooltipStyle}
                  formatter={(value: number) => [value, 'Entrenamientos']}
                  labelFormatter={(label) => `Semana del ${label}`}
                />
                <ReferenceLine
                  y={DEFAULT_WEEKLY_GOAL}
                  stroke={theme === 'dark' ? '#64748b' : '#94a3b8'}
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
          <div className="text-center py-8 text-[var(--text-muted)]">
            No hay datos de volumen para mostrar
          </div>
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
                <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
                <XAxis dataKey="month" tick={axisTick} axisLine={axisLine} />
                <YAxis
                  tickFormatter={(v) => formatVolume(v)}
                  tick={axisTick}
                  axisLine={axisLine}
                  width={60}
                />
                <Tooltip
                  contentStyle={tooltipStyle}
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
          <div className="text-center py-8 text-[var(--text-muted)]">
            No hay registros de peso corporal
          </div>
        ) : (
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={bodyWeightData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
                <XAxis dataKey="date" tick={axisTick} axisLine={axisLine} />
                <YAxis
                  domain={['dataMin - 2', 'dataMax + 2']}
                  tickFormatter={(v) => `${v} kg`}
                  tick={axisTick}
                  axisLine={axisLine}
                  width={60}
                />
                <Tooltip
                  contentStyle={tooltipStyle}
                  formatter={(value: number) => [`${value} kg`, 'Peso']}
                />
                <Line
                  type="monotone"
                  dataKey="weight"
                  stroke="#10b981"
                  strokeWidth={2}
                  dot={{ fill: '#10b981', strokeWidth: 0, r: 3 }}
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
          <div className="text-center py-8 text-[var(--text-muted)]">
            No hay récords registrados todavía
          </div>
        ) : (
          <div className="space-y-2">
            {prs.map((pr, idx) => (
              <div
                key={pr.exerciseId}
                className="ui-list-item flex items-center justify-between p-3"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                      idx === 0
                        ? 'bg-yellow-500 text-yellow-950'
                        : idx === 1
                        ? 'bg-gray-400 text-gray-900'
                        : idx === 2
                        ? 'bg-amber-700 text-amber-100'
                        : theme === 'dark'
                        ? 'bg-gray-700 text-gray-300'
                        : 'bg-gray-200 text-gray-700'
                    }`}
                  >
                    {idx + 1}
                  </div>
                  <div className="min-w-0">
                    <div className="font-medium text-[var(--text)] truncate">{pr.exerciseName}</div>
                    <div className="text-xs text-[var(--text-muted)]">
                      {new Date(pr.date + 'T12:00:00').toLocaleDateString('es-AR', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </div>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className="font-bold text-[var(--text)]">{formatWeight(pr.weight)}</div>
                  <div className="text-xs text-[var(--text-muted)]">{pr.reps} reps</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
