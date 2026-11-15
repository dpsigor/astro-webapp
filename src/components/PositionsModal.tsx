import type { ChartData } from '../lib/chart';
import { planetGlyphUnicode } from '../lib/sweph';
import { formatTableAngle } from '../lib/text';
import { CopyTableButton } from './CopyTableButton';
import { DataTable } from './DataTable';
import { Modal } from './Modal';

const HEADERS = ['Planet', 'Longitude', 'Speed'];

function positionRows({ positions, asc, mc }: ChartData): string[][] {
  return [
    ...Array.from(positions, ([planet, { lon, slon }]) => [
      planetGlyphUnicode[planet],
      formatTableAngle(lon),
      slon.toFixed(2),
    ]),
    ['ASC', formatTableAngle(asc), ''],
    ['MC', formatTableAngle(mc), ''],
  ];
}

interface PositionsModalProps {
  chart: ChartData;
  onClose: () => void;
}

/** Dialog with the table of planetary positions. */
export function PositionsModal({ chart, onClose }: PositionsModalProps) {
  const rows = positionRows(chart);

  return (
    <Modal title="Positions" onClose={onClose}>
      <DataTable headers={HEADERS} rows={rows} />
      <div className="mt-4 flex justify-end">
        <CopyTableButton headers={HEADERS} rows={rows} />
      </div>
    </Modal>
  );
}
