import { useEffect, useMemo, useState } from 'react'
import { CATEGORY_META, FEATURES, type Category, type FeatureMeta } from './features'

type View = 'score' | 'rank' | 'roadmap'

interface Scores {
  effort: number
  value: number
  dependency: number
}

interface Weights {
  value: number   // weight for value (positive)
  effort: number  // weight for effort (penalty)
  dependency: number // weight for dependency (penalty)
}

const DEFAULT_WEIGHTS: Weights = { value: 0.5, effort: 0.3, dependency: 0.2 }

// Score range 0–100. Higher = stronger candidate to build now.
function weightedScore(s: Scores, w: Weights) {
  // value ∈ [1,5] → reward ; effort/dependency ∈ [1,5] → penalty
  // normalize each contributor to 0–1 then combine, then scale to 100
  const valueComp = (s.value - 1) / 4 // 0..1
  const effortComp = 1 - (s.effort - 1) / 4 // invert: low effort → high
  const depComp = 1 - (s.dependency - 1) / 4 // invert: low dep → high
  const wSum = Math.max(0.0001, w.value + w.effort + w.dependency)
  const raw = (valueComp * w.value + effortComp * w.effort + depComp * w.dependency) / wSum
  return Math.round(raw * 100)
}

function phaseFor(score: number): 'P1' | 'P2' | 'P3' | 'BL' {
  if (score >= 75) return 'P1'
  if (score >= 60) return 'P2'
  if (score >= 45) return 'P3'
  return 'BL'
}

const PHASE_META: Record<
  'P1' | 'P2' | 'P3' | 'BL',
  { label: string; subtitle: string; tone: string }
> = {
  P1: { label: 'Phase 1 — Build now', subtitle: 'Highest weighted score (≥ 75). Start in the next sprint.', tone: 'var(--score-high)' },
  P2: { label: 'Phase 2 — Build next', subtitle: 'Strong candidates (60–74). Schedule in this quarter.', tone: 'var(--color-primary)' },
  P3: { label: 'Phase 3 — Plan ahead', subtitle: 'Worthwhile but lower priority (45–59).', tone: 'var(--score-mid)' },
  BL: { label: 'Backlog', subtitle: 'Below 45 — revisit when assumptions change.', tone: 'var(--score-low)' }
}

// ---- Logo ----
function Logo({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" aria-label="KBMesh logo" role="img">
      <rect width="32" height="32" rx="7" fill="var(--color-primary)" />
      <path d="M8 16 L16 8 L24 16 L16 24 Z" stroke="white" strokeWidth="1.6" fill="none" />
      <circle cx="16" cy="16" r="2.5" fill="white" />
      <circle cx="16" cy="8" r="1.6" fill="white" />
      <circle cx="24" cy="16" r="1.6" fill="white" />
      <circle cx="16" cy="24" r="1.6" fill="white" />
      <circle cx="8" cy="16" r="1.6" fill="white" />
    </svg>
  )
}

// ---- Theme toggle ----
function ThemeToggle() {
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    if (typeof document !== 'undefined') {
      return (document.documentElement.getAttribute('data-theme') as 'light' | 'dark') ?? 'dark'
    }
    return 'dark'
  })
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
  }, [theme])
  return (
    <button
      onClick={() => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))}
      className="h-9 w-9 rounded-md border border-border bg-surface-2 hover:border-primary inline-flex items-center justify-center"
      aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
      data-testid="button-theme-toggle"
    >
      {theme === 'dark' ? (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/></svg>
      ) : (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
      )}
    </button>
  )
}

// ---- Slider with label & value ----
function ScoreSlider({
  label,
  variant,
  value,
  onChange,
  hint
}: {
  label: string
  variant: 'value' | 'effort' | 'depend'
  value: number
  onChange: (v: number) => void
  hint?: string
}) {
  const labels = ['', 'Very low', 'Low', 'Medium', 'High', 'Very high']
  const colorVar =
    variant === 'value'
      ? 'var(--score-high)'
      : variant === 'effort'
      ? 'var(--score-mid)'
      : 'var(--score-low)'
  return (
    <div className="grid grid-cols-[150px_1fr_104px] items-center gap-3">
      <div className="flex items-center gap-1.5 min-w-0">
        <span className="inline-block h-2 w-2 rounded-full shrink-0" style={{ background: colorVar }} aria-hidden />
        <label className="text-xs font-medium text-text-muted tooltip cursor-help truncate">
          {label}
          {hint && <span className="tooltip-content">{hint}</span>}
        </label>
      </div>
      <input
        type="range"
        min={1}
        max={5}
        step={1}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className={`range-slider ${variant}`}
        data-testid={`slider-${variant}`}
      />
      <div className="font-mono text-sm tabular-nums text-text-muted text-right whitespace-nowrap">
        {value} <span className="text-text-faint">· {labels[value]}</span>
      </div>
    </div>
  )
}

// ---- Score gauge ----
function ScoreGauge({ score }: { score: number }) {
  const tone = score >= 75 ? 'var(--score-high)' : score >= 60 ? 'var(--color-primary)' : score >= 45 ? 'var(--score-mid)' : 'var(--score-low)'
  const ringStyle: React.CSSProperties = {
    background: `conic-gradient(${tone} ${score * 3.6}deg, var(--color-surface-offset) 0)`
  }
  return (
    <div className="relative h-20 w-20 shrink-0 rounded-full" style={ringStyle}>
      <div className="absolute inset-1.5 rounded-full bg-surface flex flex-col items-center justify-center">
        <div className="font-mono text-xl font-semibold leading-none tabular-nums" style={{ color: tone }}>
          {score}
        </div>
        <div className="text-[10px] uppercase tracking-wider text-text-faint mt-0.5">score</div>
      </div>
    </div>
  )
}

// ---- Feature card (scoring view) ----
function FeatureCard({
  feature,
  scores,
  onChange,
  weights,
  defaultScores,
  onReset
}: {
  feature: FeatureMeta
  scores: Scores
  weights: Weights
  defaultScores: Scores
  onChange: (s: Scores) => void
  onReset: () => void
}) {
  const score = weightedScore(scores, weights)
  const phase = phaseFor(score)
  const isModified =
    scores.effort !== defaultScores.effort ||
    scores.value !== defaultScores.value ||
    scores.dependency !== defaultScores.dependency
  return (
    <div className="card p-5 card-hover" data-testid={`card-feature-${feature.id}`}>
      <div className="flex items-start gap-4">
        <ScoreGauge score={score} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-base font-semibold text-text leading-snug">{feature.name}</h3>
            <span className="chip" style={{ borderColor: PHASE_META[phase].tone, color: PHASE_META[phase].tone }}>{phase}</span>
            {isModified && (
              <span className="chip" title="You have customised the default scores">edited</span>
            )}
          </div>
          <p className="text-sm text-text-muted mt-1.5 leading-relaxed">{feature.description}</p>
        </div>
        {isModified && (
          <button
            onClick={onReset}
            className="text-xs text-text-faint hover:text-primary px-2 py-1 rounded-md tooltip"
            data-testid={`button-reset-${feature.id}`}
            aria-label="Reset to default scores"
          >
            ↺
            <span className="tooltip-content">Reset defaults</span>
          </button>
        )}
      </div>

      <div className="divider my-4" />

      <div className="space-y-3">
        <ScoreSlider
          label="Business value"
          variant="value"
          value={scores.value}
          onChange={(v) => onChange({ ...scores, value: v })}
          hint="Impact on users, revenue, productivity"
        />
        <ScoreSlider
          label="Implementation effort"
          variant="effort"
          value={scores.effort}
          onChange={(v) => onChange({ ...scores, effort: v })}
          hint="Engineering time + complexity"
        />
        <ScoreSlider
          label="Architectural dependency"
          variant="depend"
          value={scores.dependency}
          onChange={(v) => onChange({ ...scores, dependency: v })}
          hint="How many other components must exist first"
        />
      </div>
    </div>
  )
}

// ---- Weight controls (header) ----
function WeightControls({
  weights,
  onChange,
  onReset
}: {
  weights: Weights
  onChange: (w: Weights) => void
  onReset: () => void
}) {
  return (
    <div className="card p-4">
      <div className="flex items-center justify-between mb-3">
        <div>
          <div className="text-xs uppercase tracking-wider text-text-faint">Global weights</div>
          <div className="text-sm text-text-muted">How much each dimension counts in the final score.</div>
        </div>
        <button
          onClick={onReset}
          className="text-xs text-text-muted hover:text-primary px-2 py-1 rounded-md border border-border"
          data-testid="button-reset-weights"
        >
          Reset
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <WeightSlider label="Value" tone="var(--score-high)" value={weights.value} onChange={(v) => onChange({ ...weights, value: v })} />
        <WeightSlider label="Effort penalty" tone="var(--score-mid)" value={weights.effort} onChange={(v) => onChange({ ...weights, effort: v })} />
        <WeightSlider label="Dependency penalty" tone="var(--score-low)" value={weights.dependency} onChange={(v) => onChange({ ...weights, dependency: v })} />
      </div>
      <div className="divider mt-4 mb-3" />
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
        <div className="flex items-center gap-1.5">
          <span className="chip" style={{ borderColor: 'var(--score-high)', color: 'var(--score-high)' }}>P1</span>
          <span className="text-text-faint">≥ 75</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="chip" style={{ borderColor: 'var(--color-primary)', color: 'var(--color-primary)' }}>P2</span>
          <span className="text-text-faint">60–74</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="chip" style={{ borderColor: 'var(--score-mid)', color: 'var(--score-mid)' }}>P3</span>
          <span className="text-text-faint">45–59</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="chip" style={{ borderColor: 'var(--score-low)', color: 'var(--score-low)' }}>BL</span>
          <span className="text-text-faint">&lt; 45</span>
        </div>
      </div>
    </div>
  )
}

function WeightSlider({
  label,
  tone,
  value,
  onChange
}: {
  label: string
  tone: string
  value: number
  onChange: (v: number) => void
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-1.5">
          <span className="inline-block h-2 w-2 rounded-full" style={{ background: tone }} aria-hidden />
          <span className="text-xs font-medium text-text-muted">{label}</span>
        </div>
        <span className="weight-num text-xs tabular-nums text-text">{value.toFixed(2)}</span>
      </div>
      <input
        type="range"
        min={0}
        max={1}
        step={0.05}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="range-slider"
        data-testid={`slider-weight-${label.toLowerCase().replace(/\s/g, '-')}`}
        style={{ accentColor: tone }}
      />
    </div>
  )
}

// ---- Header tab ----
function ViewTab({
  active,
  label,
  count,
  onClick,
  testId
}: {
  active: boolean
  label: string
  count?: number
  onClick: () => void
  testId: string
}) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 text-sm rounded-md font-medium ${
        active ? 'bg-surface text-text border border-border shadow-sm' : 'text-text-muted hover:text-text'
      }`}
      data-testid={testId}
    >
      {label}
      {typeof count === 'number' && (
        <span className="ml-1.5 font-mono text-xs text-text-faint tabular-nums">{count}</span>
      )}
    </button>
  )
}

// ---- Ranked table view ----
function RankView({
  rows,
  weights
}: {
  rows: Array<{ feature: FeatureMeta; scores: Scores; score: number; phase: 'P1' | 'P2' | 'P3' | 'BL' }>
  weights: Weights
}) {
  const [sortKey, setSortKey] = useState<'score' | 'value' | 'effort' | 'dependency' | 'name'>('score')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')

  const sorted = useMemo(() => {
    const copy = [...rows]
    copy.sort((a, b) => {
      let av: number | string = 0
      let bv: number | string = 0
      switch (sortKey) {
        case 'score': av = a.score; bv = b.score; break
        case 'value': av = a.scores.value; bv = b.scores.value; break
        case 'effort': av = a.scores.effort; bv = b.scores.effort; break
        case 'dependency': av = a.scores.dependency; bv = b.scores.dependency; break
        case 'name': av = a.feature.name; bv = b.feature.name; break
      }
      const cmp = typeof av === 'number' ? (av as number) - (bv as number) : String(av).localeCompare(String(bv))
      return sortDir === 'desc' ? -cmp : cmp
    })
    return copy
  }, [rows, sortKey, sortDir])

  const SortHeader = ({ k, label, align = 'left' }: { k: typeof sortKey; label: string; align?: 'left' | 'right' }) => (
    <th
      className={`px-3 py-2.5 text-xs font-semibold text-text-muted uppercase tracking-wider cursor-pointer select-none ${align === 'right' ? 'text-right' : 'text-left'}`}
      onClick={() => {
        if (sortKey === k) setSortDir((d) => (d === 'desc' ? 'asc' : 'desc'))
        else { setSortKey(k); setSortDir(k === 'name' ? 'asc' : 'desc') }
      }}
      data-testid={`header-sort-${k}`}
    >
      <span className="inline-flex items-center gap-1">
        {label}
        {sortKey === k && <span className="text-text-faint">{sortDir === 'desc' ? '↓' : '↑'}</span>}
      </span>
    </th>
  )

  return (
    <div className="card overflow-hidden">
      <div className="px-5 py-4 border-b border-divider">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <h2 className="text-lg font-semibold">Ranked feature list</h2>
            <p className="text-sm text-text-muted">
              Weighted score = value × {weights.value.toFixed(2)} − effort × {weights.effort.toFixed(2)} − dependency × {weights.dependency.toFixed(2)} (normalised to 0–100).
            </p>
          </div>
          <div className="text-xs text-text-faint font-mono">{rows.length} features</div>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-surface-2 border-b border-divider">
            <tr>
              <th className="px-3 py-2.5 text-xs font-semibold text-text-muted uppercase tracking-wider text-left w-12">#</th>
              <SortHeader k="name" label="Feature" />
              <th className="px-3 py-2.5 text-xs font-semibold text-text-muted uppercase tracking-wider text-left">Category</th>
              <SortHeader k="value" label="Value" align="right" />
              <SortHeader k="effort" label="Effort" align="right" />
              <SortHeader k="dependency" label="Dep." align="right" />
              <SortHeader k="score" label="Score" align="right" />
              <th className="px-3 py-2.5 text-xs font-semibold text-text-muted uppercase tracking-wider text-left">Phase</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((row, i) => {
              const cat = CATEGORY_META[row.feature.category]
              return (
                <tr
                  key={row.feature.id}
                  className="border-b border-divider last:border-b-0 hover:bg-surface-2"
                  data-testid={`row-feature-${row.feature.id}`}
                >
                  <td className="px-3 py-3 font-mono text-text-faint tabular-nums">{i + 1}</td>
                  <td className="px-3 py-3">
                    <div className="font-medium text-text">{row.feature.name}</div>
                    <div className="text-xs text-text-muted line-clamp-1 max-w-[42ch]">{row.feature.description}</div>
                  </td>
                  <td className="px-3 py-3">
                    <span className="chip" style={{ color: cat.color, borderColor: cat.color }}>{cat.label}</span>
                  </td>
                  <td className="px-3 py-3 text-right font-mono tabular-nums">{row.scores.value}</td>
                  <td className="px-3 py-3 text-right font-mono tabular-nums">{row.scores.effort}</td>
                  <td className="px-3 py-3 text-right font-mono tabular-nums">{row.scores.dependency}</td>
                  <td className="px-3 py-3 text-right">
                    <span
                      className="font-mono font-semibold tabular-nums"
                      style={{
                        color:
                          row.score >= 75 ? 'var(--score-high)' :
                          row.score >= 60 ? 'var(--color-primary)' :
                          row.score >= 45 ? 'var(--score-mid)' : 'var(--score-low)'
                      }}
                    >
                      {row.score}
                    </span>
                  </td>
                  <td className="px-3 py-3">
                    <span className="chip solid" style={{ background: 'transparent', borderColor: PHASE_META[row.phase].tone, color: PHASE_META[row.phase].tone }}>
                      {row.phase}
                    </span>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ---- Roadmap view ----
function RoadmapView({
  rows
}: {
  rows: Array<{ feature: FeatureMeta; scores: Scores; score: number; phase: 'P1' | 'P2' | 'P3' | 'BL' }>
}) {
  const phases: ('P1' | 'P2' | 'P3' | 'BL')[] = ['P1', 'P2', 'P3', 'BL']
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
      {phases.map((p) => {
        const meta = PHASE_META[p]
        const items = rows.filter((r) => r.phase === p).sort((a, b) => b.score - a.score)
        return (
          <div key={p} className="card p-4 flex flex-col" data-testid={`column-phase-${p}`}>
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <span className="inline-block h-2 w-2 rounded-full" style={{ background: meta.tone }} aria-hidden />
                <h3 className="text-sm font-semibold uppercase tracking-wider" style={{ color: meta.tone }}>{p}</h3>
              </div>
              <span className="font-mono text-xs text-text-faint tabular-nums">{items.length}</span>
            </div>
            <div className="text-sm font-medium text-text mb-1">{meta.label}</div>
            <div className="text-xs text-text-muted mb-3">{meta.subtitle}</div>
            <div className="divider mb-3" />
            <div className="flex flex-col gap-2 flex-1 min-h-[80px]">
              {items.length === 0 && (
                <div className="text-xs text-text-faint italic py-4 text-center">No features in this phase</div>
              )}
              {items.map((row) => {
                const cat = CATEGORY_META[row.feature.category]
                return (
                  <div
                    key={row.feature.id}
                    className="rounded-md border border-border bg-surface-2 px-3 py-2.5 hover:border-primary"
                    data-testid={`roadmap-card-${row.feature.id}`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-text leading-snug">{row.feature.name}</div>
                        <div className="text-[11px] mt-0.5" style={{ color: cat.color }}>{cat.label}</div>
                      </div>
                      <span
                        className="font-mono text-xs font-semibold tabular-nums shrink-0"
                        style={{ color: meta.tone }}
                      >
                        {row.score}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ---- Main ----
export default function App() {
  const defaultScoresMap = useMemo(() => {
    const m: Record<string, Scores> = {}
    for (const f of FEATURES) m[f.id] = { effort: f.effort, value: f.value, dependency: f.dependency }
    return m
  }, [])

  const [scoresMap, setScoresMap] = useState<Record<string, Scores>>(() => ({ ...defaultScoresMap }))
  const [weights, setWeights] = useState<Weights>(DEFAULT_WEIGHTS)
  const [view, setView] = useState<View>('score')
  const [filter, setFilter] = useState<Category | 'all'>('all')
  const [search, setSearch] = useState('')

  const computed = useMemo(() => {
    return FEATURES.map((f) => {
      const s = scoresMap[f.id]
      const score = weightedScore(s, weights)
      return { feature: f, scores: s, score, phase: phaseFor(score) }
    })
  }, [scoresMap, weights])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return computed.filter((row) => {
      if (filter !== 'all' && row.feature.category !== filter) return false
      if (!q) return true
      return (
        row.feature.name.toLowerCase().includes(q) ||
        row.feature.description.toLowerCase().includes(q)
      )
    })
  }, [computed, filter, search])

  const updateScores = (id: string, s: Scores) => setScoresMap((m) => ({ ...m, [id]: s }))
  const resetScores = (id: string) => setScoresMap((m) => ({ ...m, [id]: defaultScoresMap[id] }))
  const resetAll = () => { setScoresMap({ ...defaultScoresMap }); setWeights(DEFAULT_WEIGHTS) }
  const resetWeights = () => setWeights(DEFAULT_WEIGHTS)

  const exportCsv = () => {
    const ordered = [...computed].sort((a, b) => b.score - a.score)
    const rows = [
      ['rank', 'id', 'feature', 'category', 'description', 'value_1to5', 'effort_1to5', 'dependency_1to5', 'weighted_score', 'phase', 'on_prem'],
      ...ordered.map((row, i) => [
        String(i + 1),
        row.feature.id,
        row.feature.name,
        CATEGORY_META[row.feature.category].label,
        row.feature.description,
        String(row.scores.value),
        String(row.scores.effort),
        String(row.scores.dependency),
        String(row.score),
        row.phase,
        row.feature.onPrem ? 'yes' : 'no'
      ])
    ]
    const csv = rows
      .map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(','))
      .join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    const stamp = new Date().toISOString().slice(0, 16).replace(/[T:]/g, '-')
    a.href = url
    a.download = `kbmesh-prioritization-${stamp}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  // Group filtered features by category for the scoring view
  const grouped = useMemo(() => {
    const map: Partial<Record<Category, typeof filtered>> = {}
    for (const row of filtered) {
      const k = row.feature.category
      if (!map[k]) map[k] = []
      map[k]!.push(row)
    }
    return map
  }, [filtered])

  const phaseCounts = useMemo(() => {
    const c = { P1: 0, P2: 0, P3: 0, BL: 0 }
    for (const r of computed) c[r.phase]++
    return c
  }, [computed])

  return (
    <div className="min-h-screen flex flex-col">
      {/* ---- Header ---- */}
      <header className="sticky top-0 z-30 border-b border-divider bg-bg/85 backdrop-blur-md" data-testid="app-header">
        <div className="max-w-[1400px] mx-auto px-5 py-3">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-3">
              <Logo />
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold tracking-tight">KBMesh</span>
                  <span className="chip">v0.3</span>
                  <span className="hidden sm:inline-flex items-center gap-1.5 text-[11px] text-text-faint">
                    <span className="live-dot" /> live
                  </span>
                </div>
                <h1 className="text-base font-semibold text-text leading-tight">AI Feature Prioritization Scorecard</h1>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <a
                href="https://github.com/tonylnng/kbmesh"
                target="_blank"
                rel="noreferrer"
                className="hidden md:inline-flex items-center gap-1.5 text-xs text-text-muted hover:text-primary px-2.5 py-1.5 rounded-md border border-border bg-surface-2"
                data-testid="link-repo"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 .3a12 12 0 0 0-3.8 23.4c.6.1.8-.3.8-.6v-2c-3.3.7-4-1.6-4-1.6-.6-1.4-1.4-1.8-1.4-1.8-1.1-.7.1-.7.1-.7 1.2.1 1.9 1.3 1.9 1.3 1.1 1.9 2.9 1.3 3.6 1 .1-.8.4-1.3.8-1.6-2.7-.3-5.5-1.3-5.5-6 0-1.3.5-2.4 1.3-3.2-.1-.4-.6-1.6.1-3.3 0 0 1-.3 3.3 1.2a11.5 11.5 0 0 1 6 0c2.3-1.5 3.3-1.2 3.3-1.2.7 1.7.2 2.9.1 3.3.8.8 1.3 1.9 1.3 3.2 0 4.7-2.8 5.7-5.5 6 .4.4.8 1.1.8 2.2v3.3c0 .3.2.7.8.6A12 12 0 0 0 12 .3"/></svg>
                Repo
              </a>
              <button
                onClick={exportCsv}
                className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-md bg-primary text-white hover:bg-primary-hover"
                style={{ background: 'var(--color-primary)', color: 'white' }}
                data-testid="button-export-csv"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                Export CSV
              </button>
              <button
                onClick={resetAll}
                className="text-xs px-2.5 py-1.5 rounded-md border border-border bg-surface-2 text-text-muted hover:text-primary hover:border-primary"
                data-testid="button-reset-all"
              >
                Reset all
              </button>
              <ThemeToggle />
            </div>
          </div>
        </div>
      </header>

      {/* ---- Body ---- */}
      <main className="flex-1 max-w-[1400px] w-full mx-auto px-5 py-6">
        {/* Hero / weight controls */}
        <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_2fr] gap-4 mb-6">
          <div className="card p-5">
            <div className="text-xs uppercase tracking-wider text-text-faint mb-1">Method</div>
            <h2 className="text-lg font-semibold mb-2">Score every AI feature on three dimensions</h2>
            <p className="text-sm text-text-muted leading-relaxed">
              Each feature carries baseline scores from the KBMesh design discussion. Adjust the sliders to reflect your context — the weighted score, ranking, and phased roadmap update live. Export your decisions as CSV.
            </p>
            <div className="flex items-center gap-4 mt-4 text-[11px] text-text-faint">
              <div className="flex items-center gap-1.5"><span className="inline-block h-2 w-2 rounded-full" style={{background:'var(--score-high)'}}/>Value</div>
              <div className="flex items-center gap-1.5"><span className="inline-block h-2 w-2 rounded-full" style={{background:'var(--score-mid)'}}/>Effort</div>
              <div className="flex items-center gap-1.5"><span className="inline-block h-2 w-2 rounded-full" style={{background:'var(--score-low)'}}/>Dependency</div>
            </div>
          </div>
          <WeightControls weights={weights} onChange={setWeights} onReset={resetWeights} />
        </div>

        {/* Phase summary tiles */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          {(['P1', 'P2', 'P3', 'BL'] as const).map((p) => (
            <div key={p} className="card p-4" data-testid={`tile-phase-${p}`}>
              <div className="flex items-center justify-between">
                <div className="text-xs uppercase tracking-wider" style={{ color: PHASE_META[p].tone }}>{PHASE_META[p].label.split('—')[0].trim()}</div>
                <span className="font-mono text-xs text-text-faint">{p}</span>
              </div>
              <div className="font-mono text-2xl font-semibold mt-1 tabular-nums" style={{ color: PHASE_META[p].tone }}>
                {phaseCounts[p]}
              </div>
              <div className="text-[11px] text-text-muted mt-0.5">{PHASE_META[p].subtitle}</div>
            </div>
          ))}
        </div>

        {/* Tabs + filters */}
        <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
          <div className="inline-flex gap-1 p-1 rounded-lg bg-surface-2 border border-border" role="tablist">
            <ViewTab active={view === 'score'} label="Score" count={filtered.length} onClick={() => setView('score')} testId="tab-score" />
            <ViewTab active={view === 'rank'} label="Ranked list" count={computed.length} onClick={() => setView('rank')} testId="tab-rank" />
            <ViewTab active={view === 'roadmap'} label="Roadmap" onClick={() => setView('roadmap')} testId="tab-roadmap" />
          </div>
          {view === 'score' && (
            <div className="flex items-center gap-2 flex-wrap">
              <input
                type="search"
                placeholder="Search features…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="px-3 py-1.5 text-sm rounded-md border border-border bg-surface-2 placeholder:text-text-faint focus:border-primary focus:outline-none w-44"
                data-testid="input-search"
              />
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value as Category | 'all')}
                className="px-2.5 py-1.5 text-sm rounded-md border border-border bg-surface-2 focus:border-primary focus:outline-none"
                data-testid="select-category"
              >
                <option value="all">All categories</option>
                {Object.entries(CATEGORY_META).map(([k, v]) => (
                  <option key={k} value={k}>{v.label}</option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Views */}
        {view === 'score' && (
          <div className="space-y-8">
            {Object.entries(grouped).length === 0 && (
              <div className="card p-10 text-center text-text-muted">
                No features match this search.
              </div>
            )}
            {(Object.keys(CATEGORY_META) as Category[]).map((cat) => {
              const items = grouped[cat]
              if (!items || items.length === 0) return null
              const meta = CATEGORY_META[cat]
              return (
                <section key={cat} data-testid={`section-${cat}`}>
                  <div className="flex items-baseline justify-between mb-3 pb-2 border-b border-divider">
                    <div className="flex items-center gap-2.5">
                      <span className="inline-block h-3 w-3 rounded-sm" style={{ background: meta.color }} aria-hidden />
                      <h2 className="text-lg font-semibold">{meta.label}</h2>
                      <span className="font-mono text-xs text-text-faint tabular-nums">{items.length}</span>
                    </div>
                    <p className="text-xs text-text-muted hidden sm:block">{meta.subtitle}</p>
                  </div>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                    {items.map((row) => (
                      <FeatureCard
                        key={row.feature.id}
                        feature={row.feature}
                        scores={row.scores}
                        weights={weights}
                        defaultScores={defaultScoresMap[row.feature.id]}
                        onChange={(s) => updateScores(row.feature.id, s)}
                        onReset={() => resetScores(row.feature.id)}
                      />
                    ))}
                  </div>
                </section>
              )
            })}
          </div>
        )}

        {view === 'rank' && <RankView rows={[...computed].sort((a, b) => b.score - a.score)} weights={weights} />}
        {view === 'roadmap' && <RoadmapView rows={computed} />}
      </main>

      {/* ---- Footer ---- */}
      <footer className="border-t border-divider mt-8 py-5 px-5">
        <div className="max-w-[1400px] mx-auto flex items-center justify-between flex-wrap gap-2 text-xs text-text-faint">
          <div>
            Built for the{' '}
            <a href="https://github.com/tonylnng/kbmesh" target="_blank" rel="noreferrer" className="text-text-muted hover:text-primary underline-offset-4 hover:underline">
              KBMesh
            </a>{' '}
            AI feature backlog · {FEATURES.length} features across {Object.keys(CATEGORY_META).length} categories
          </div>
          <div className="font-mono">
            Phase thresholds: P1 ≥ 75 · P2 ≥ 60 · P3 ≥ 45 · BL &lt; 45
          </div>
        </div>
      </footer>
    </div>
  )
}
