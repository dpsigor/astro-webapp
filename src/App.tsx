import { useCallback, useState } from 'react';
import { Button } from './components/Button';
import { ChartView } from './components/ChartView';
import { EphGraphView } from './components/EphGraphView';
import { SettingsIcon } from './components/icons';
import { isMode, ModeSwitch, type Mode } from './components/ModeSwitch';
import { SettingsModal } from './components/SettingsModal';
import { usePersistentState, type Codec } from './hooks/usePersistentState';
import { getCanvasSize } from './lib/canvasSize';
import { HouseSystem, houseSystems } from './lib/sweph';

const MODE_KEY = 'render';
const HOUSE_SYSTEM_KEY = 'default.houseSystem';

const modeCodec: Codec<Mode> = {
  parse: (raw) => (isMode(raw) ? raw : undefined),
  serialize: (mode) => mode,
};

const houseSystemCodec: Codec<HouseSystem> = {
  parse: (raw) => houseSystems.find(({ value }) => value === raw)?.value,
  serialize: (houseSystem) => houseSystem,
};

export function App() {
  const [mode, setMode] = usePersistentState<Mode>(
    MODE_KEY,
    () => 'chart',
    modeCodec,
  );
  const [houseSystem, setHouseSystem] = usePersistentState<HouseSystem>(
    HOUSE_SYSTEM_KEY,
    () => HouseSystem.Placidus,
    houseSystemCodec,
  );
  const [showSettings, setShowSettings] = useState(false);
  const closeSettings = useCallback(() => setShowSettings(false), []);
  const [canvasSize] = useState(getCanvasSize);

  return (
    <div className="mx-auto flex min-h-screen max-w-6xl flex-col gap-2 py-2 md:gap-4 md:p-4">
      <header className="flex items-center justify-between gap-3 px-2 md:px-0">
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            aria-label="Configuration"
            title="Configuration"
            onClick={() => setShowSettings(true)}
          >
            <SettingsIcon />
          </Button>
          <h1 className="text-lg font-semibold tracking-tight text-slate-100">
            Astrology
          </h1>
        </div>
        <ModeSwitch mode={mode} onChange={setMode} />
      </header>

      <main>
        {mode === 'chart' ? (
          <ChartView size={canvasSize} houseSystem={houseSystem} />
        ) : (
          <EphGraphView size={canvasSize} />
        )}
      </main>

      {showSettings && (
        <SettingsModal
          houseSystem={houseSystem}
          onHouseSystemChange={setHouseSystem}
          onClose={closeSettings}
        />
      )}
    </div>
  );
}
