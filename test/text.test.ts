import assert from 'node:assert/strict';
import { describe, it } from 'vitest';
import { signGlyphUnicode } from '../src/lib/sweph';
import { formatTableAngle } from '../src/lib/text';

describe('formatTableAngle', () => {
  const [aries, taurus, , , leo] = signGlyphUnicode;
  const pisces = signGlyphUnicode[11];

  it('splits a longitude into sign, degrees, minutes and seconds', () => {
    assert.equal(formatTableAngle(0), `${aries} 0° 0' 0"`);
    assert.equal(formatTableAngle(45.5), `${taurus} 15° 30' 0"`);
    assert.equal(formatTableAngle(123.2625), `${leo} 3° 15' 45"`);
  });

  it('changes sign every 30°', () => {
    assert.equal(formatTableAngle(29.75), `${aries} 29° 45' 0"`);
    assert.equal(formatTableAngle(30), `${taurus} 0° 0' 0"`);
    assert.equal(formatTableAngle(359.75), `${pisces} 29° 45' 0"`);
    signGlyphUnicode.forEach((glyph, i) =>
      assert.equal(formatTableAngle(i * 30 + 15.25), `${glyph} 15° 15' 0"`),
    );
  });

  it('truncates rather than rounds', () => {
    assert.equal(formatTableAngle(10 + 59.9 / 3600), `${aries} 10° 0' 59"`);
  });
});
