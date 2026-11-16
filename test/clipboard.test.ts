import assert from 'node:assert/strict';
import { describe, it } from 'vitest';
import { toMarkdownTable } from '../src/lib/clipboard';

describe('toMarkdownTable', () => {
  it('writes a header, a separator and one line per row', () => {
    assert.equal(
      toMarkdownTable(
        ['Planet', 'Position'],
        [
          ['Sun', '10°'],
          ['Moon', '20°'],
        ],
      ),
      '| Planet | Position |\n| --- | --- |\n| Sun | 10° |\n| Moon | 20° |',
    );
  });

  it('writes only the header for an empty table', () => {
    assert.equal(
      toMarkdownTable(['A', 'B', 'C'], []),
      '| A | B | C |\n| --- | --- | --- |',
    );
  });

  it('escapes what would break a cell', () => {
    assert.equal(
      toMarkdownTable(['a|b'], [['c\\d'], ['e\nf'], ['\\|']]),
      '| a\\|b |\n| --- |\n| c\\\\d |\n| e f |\n| \\\\\\| |',
    );
  });
});
