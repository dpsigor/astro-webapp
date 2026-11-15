import type { Conjunction } from '../lib/conjunctions';
import { toDateInput } from '../lib/dates';
import { planetGlyphUnicode } from '../lib/sweph';
import { formatTableAngle } from '../lib/text';
import { Card } from './Card';
import { CopyTableButton } from './CopyTableButton';
import { DataTable } from './DataTable';

const HEADERS = ['Date', 'A', 'B', 'Angle'];

interface ConjunctionsTableProps {
  conjunctions: Conjunction[];
  /** Set when the period was too long to search to its end. */
  searchedUntil?: Date;
}

export function ConjunctionsTable({
  conjunctions,
  searchedUntil,
}: ConjunctionsTableProps) {
  const rows = conjunctions.map(({ time, a, b, angle }) => [
    toDateInput(time),
    planetGlyphUnicode[a],
    planetGlyphUnicode[b],
    formatTableAngle(angle),
  ]);

  return (
    <Card
      title="Conjunctions"
      action={<CopyTableButton headers={HEADERS} rows={rows} />}
    >
      {rows.length > 0 ? (
        <DataTable headers={HEADERS} rows={rows} />
      ) : (
        <p className="py-4 text-center text-sm text-slate-500">
          No conjunctions between the selected planets in this period.
        </p>
      )}
      {searchedUntil && (
        <p className="mt-3 text-left text-xs text-amber-400">
          The period is too long to search in full: conjunctions are listed up
          to {toDateInput(searchedUntil)}.
        </p>
      )}
    </Card>
  );
}
