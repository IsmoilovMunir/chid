interface UnitToggleProps {
  value: 'AMOUNT' | 'PERCENT'
  onChange: (value: 'AMOUNT' | 'PERCENT') => void
}

export function UnitToggle({ value, onChange }: UnitToggleProps) {
  return (
    <div className="flex shrink-0 overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
      <button
        type="button"
        onClick={() => onChange('AMOUNT')}
        className={`px-3 py-3 text-sm font-semibold transition ${
          value === 'AMOUNT'
            ? 'bg-chid-btn text-white'
            : 'text-chid-text/70 hover:bg-chid-accent-muted'
        }`}
        aria-pressed={value === 'AMOUNT'}
      >
        ₽
      </button>
      <button
        type="button"
        onClick={() => onChange('PERCENT')}
        className={`border-l border-slate-200 px-3 py-3 text-sm font-semibold transition ${
          value === 'PERCENT'
            ? 'bg-chid-btn text-white'
            : 'text-chid-text/70 hover:bg-chid-accent-muted'
        }`}
        aria-pressed={value === 'PERCENT'}
      >
        %
      </button>
    </div>
  )
}
