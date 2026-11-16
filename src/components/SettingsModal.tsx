import type { ChartOptions } from '../lib/chart';
import { HouseSystem, houseSystems } from '../lib/sweph';
import { Field, inputClass } from './Field';
import { Modal } from './Modal';

const toggles: { key: 'partOfFortune' | 'nodes'; label: string }[] = [
  { key: 'partOfFortune', label: 'Show Part of Fortune' },
  { key: 'nodes', label: 'Show north and south nodes' },
];

interface SettingsModalProps {
  options: ChartOptions;
  onChange: (options: ChartOptions) => void;
  onClose: () => void;
}

export function SettingsModal({
  options,
  onChange,
  onClose,
}: SettingsModalProps) {
  return (
    <Modal title="Configuration" side="left" onClose={onClose}>
      <div className="flex flex-col gap-4">
        <Field label="House system">
          <select
            className={inputClass}
            value={options.houseSystem}
            onChange={(e) =>
              onChange({
                ...options,
                houseSystem: e.target.value as HouseSystem,
              })
            }
          >
            {houseSystems.map(({ value, label }) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </Field>
        {toggles.map(({ key, label }) => (
          <label
            key={key}
            className="flex items-center gap-2 text-left text-sm text-slate-100"
          >
            <input
              type="checkbox"
              className="size-4 accent-indigo-400"
              checked={options[key]}
              onChange={(e) =>
                onChange({ ...options, [key]: e.target.checked })
              }
            />
            {label}
          </label>
        ))}
      </div>
    </Modal>
  );
}
