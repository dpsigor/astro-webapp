import { HouseSystem, houseSystems } from '../lib/sweph';
import { Field, inputClass } from './Field';
import { Modal } from './Modal';

interface SettingsModalProps {
  houseSystem: HouseSystem;
  onHouseSystemChange: (houseSystem: HouseSystem) => void;
  onClose: () => void;
}

export function SettingsModal({
  houseSystem,
  onHouseSystemChange,
  onClose,
}: SettingsModalProps) {
  return (
    <Modal title="Configuration" side="left" onClose={onClose}>
      <Field label="House system">
        <select
          className={inputClass}
          value={houseSystem}
          onChange={(e) => onHouseSystemChange(e.target.value as HouseSystem)}
        >
          {houseSystems.map(({ value, label }) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </Field>
    </Modal>
  );
}
