export type Mode = 'chart' | 'ephGraph';

const modes: { value: Mode; label: string }[] = [
  { value: 'chart', label: 'Chart' },
  { value: 'ephGraph', label: 'Ephemeris' },
];

export function isMode(value: string): value is Mode {
  return modes.some((mode) => mode.value === value);
}

interface ModeSwitchProps {
  mode: Mode;
  onChange: (mode: Mode) => void;
}

/** Segmented control that picks which view is shown. */
export function ModeSwitch({ mode, onChange }: ModeSwitchProps) {
  return (
    <div
      role="radiogroup"
      aria-label="View"
      className="inline-flex rounded-lg border border-slate-800 bg-slate-900 p-1"
    >
      {modes.map(({ value, label }) => (
        <label
          key={value}
          className={`cursor-pointer rounded-md px-2.5 py-1.5 sm:px-3.5 text-sm font-medium transition-colors has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-indigo-400 ${
            mode === value
              ? 'bg-indigo-500 text-white'
              : 'text-slate-400 hover:text-slate-100'
          }`}
        >
          <input
            type="radio"
            name="mode"
            className="sr-only"
            value={value}
            checked={mode === value}
            onChange={() => onChange(value)}
          />
          {label}
        </label>
      ))}
    </div>
  );
}
