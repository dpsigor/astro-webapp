import assert from 'node:assert/strict';
import { describe, it } from 'vitest';
import {
  fromZonedInputs,
  isValidTimezone,
  localTimezone,
  supportedTimezones,
  toDateInput,
  toZonedInputs,
} from '../src/lib/dates';

const iso = (date: Date | null) => date?.toISOString();

describe('fromZonedInputs', () => {
  it('reads the inputs as wall-clock time in the zone', () => {
    assert.equal(
      iso(fromZonedInputs('2024-07-01', '12:00', 'America/Sao_Paulo')),
      '2024-07-01T15:00:00.000Z',
    );
    assert.equal(
      iso(fromZonedInputs('2024-07-01', '12:00', 'UTC')),
      '2024-07-01T12:00:00.000Z',
    );
    assert.equal(
      iso(fromZonedInputs('2024-07-01', '12:00', 'Asia/Tokyo')),
      '2024-07-01T03:00:00.000Z',
    );
  });

  it('handles zones with a half-hour offset', () => {
    assert.equal(
      iso(fromZonedInputs('2024-01-01', '05:30', 'Asia/Kolkata')),
      '2024-01-01T00:00:00.000Z',
    );
  });

  it('crosses into the neighbouring day', () => {
    assert.equal(
      iso(fromZonedInputs('2024-01-01', '00:30', 'Asia/Tokyo')),
      '2023-12-31T15:30:00.000Z',
    );
    assert.equal(
      iso(fromZonedInputs('2024-12-31', '23:30', 'America/Sao_Paulo')),
      '2025-01-01T02:30:00.000Z',
    );
  });

  it('applies daylight saving time', () => {
    // New York moved its clocks forward on 2024-03-10 and back on 2024-11-03.
    const newYork = (date: string) =>
      iso(fromZonedInputs(date, '12:00', 'America/New_York'));
    assert.equal(newYork('2024-03-09'), '2024-03-09T17:00:00.000Z');
    assert.equal(newYork('2024-03-10'), '2024-03-10T16:00:00.000Z');
    assert.equal(newYork('2024-11-02'), '2024-11-02T16:00:00.000Z');
    assert.equal(newYork('2024-11-03'), '2024-11-03T17:00:00.000Z');
  });

  it('applies the daylight saving rules of the time', () => {
    // São Paulo had summer time in 1963–64 and has had none since 2019.
    assert.equal(
      iso(fromZonedInputs('1963-12-15', '12:00', 'America/Sao_Paulo')),
      '1963-12-15T14:00:00.000Z',
    );
    assert.equal(
      iso(fromZonedInputs('2018-12-15', '12:00', 'America/Sao_Paulo')),
      '2018-12-15T14:00:00.000Z',
    );
    assert.equal(
      iso(fromZonedInputs('2023-12-15', '12:00', 'America/Sao_Paulo')),
      '2023-12-15T15:00:00.000Z',
    );
    assert.equal(
      iso(fromZonedInputs('1950-07-01', '12:00', 'America/New_York')),
      '1950-07-01T16:00:00.000Z',
    );
    // Britain stayed an hour ahead of GMT through the winters of 1968–71.
    assert.equal(
      iso(fromZonedInputs('1970-01-01', '12:00', 'Europe/London')),
      '1970-01-01T11:00:00.000Z',
    );
  });

  it('returns null while an input is empty', () => {
    assert.equal(fromZonedInputs('', '12:00', 'UTC'), null);
    assert.equal(fromZonedInputs('2024-07-01', '', 'UTC'), null);
    assert.equal(fromZonedInputs('', '', 'UTC'), null);
  });
});

describe('fromZonedInputs with unusable inputs', () => {
  it('returns null for inputs that are not a date or a time', () => {
    assert.equal(fromZonedInputs('abc', '12:00', 'UTC'), null);
    assert.equal(fromZonedInputs('2024-07-01', 'abc', 'UTC'), null);
    assert.equal(fromZonedInputs('2024-7-1', '12:00', 'UTC'), null);
    assert.equal(fromZonedInputs('2024-07-01', '9:5', 'UTC'), null);
  });

  it('returns null while the year is being typed', () => {
    for (const year of ['0002', '0020', '0050', '0202', '0999'])
      assert.equal(fromZonedInputs(`${year}-01-01`, '12:00', 'UTC'), null);
    assert.equal(
      iso(fromZonedInputs('1000-01-01', '12:00', 'UTC')),
      '1000-01-01T12:00:00.000Z',
    );
  });

  it('ignores seconds in the time', () => {
    assert.equal(
      iso(fromZonedInputs('2024-07-01', '12:00:30', 'UTC')),
      '2024-07-01T12:00:00.000Z',
    );
  });
});

describe('isValidTimezone', () => {
  it('accepts zones the runtime knows', () => {
    assert.ok(isValidTimezone('UTC'));
    assert.ok(isValidTimezone('America/Sao_Paulo'));
    assert.ok(isValidTimezone(localTimezone()));
    for (const tz of supportedTimezones) assert.ok(isValidTimezone(tz), tz);
  });

  it('rejects anything else', () => {
    assert.ok(!isValidTimezone('Foo/Bar'));
    assert.ok(!isValidTimezone(''));
    assert.ok(!isValidTimezone('undefined'));
  });
});

describe('toZonedInputs', () => {
  it('formats an instant as wall-clock time in the zone', () => {
    const date = new Date('2024-07-01T15:05:00Z');
    assert.deepEqual(toZonedInputs(date, 'America/Sao_Paulo'), {
      date: '2024-07-01',
      time: '12:05',
    });
    assert.deepEqual(toZonedInputs(date, 'Asia/Tokyo'), {
      date: '2024-07-02',
      time: '00:05',
    });
    assert.deepEqual(toZonedInputs(date, 'Asia/Kolkata'), {
      date: '2024-07-01',
      time: '20:35',
    });
  });

  it('round-trips with fromZonedInputs', () => {
    const zones = [
      'UTC',
      'America/Sao_Paulo',
      'America/New_York',
      'Europe/London',
      'Asia/Kolkata',
      'Australia/Sydney',
      'Pacific/Auckland',
    ];
    const inputs = [
      ['2024-01-15', '00:00'],
      ['2024-07-04', '09:05'],
      ['2024-12-31', '23:59'],
      ['1985-06-15', '03:30'],
      ['1950-02-28', '18:45'],
    ];
    for (const tz of zones) {
      for (const [date, time] of inputs) {
        const instant = fromZonedInputs(date, time, tz);
        assert.ok(instant, `${date} ${time} ${tz}`);
        assert.deepEqual(
          toZonedInputs(instant, tz),
          { date, time },
          `${date} ${time} ${tz}`,
        );
      }
    }
  });
});

describe('toDateInput', () => {
  it('gives the UTC date', () => {
    assert.equal(toDateInput(new Date('2024-07-01T00:00:00Z')), '2024-07-01');
    assert.equal(toDateInput(new Date('2024-07-01T23:59:59Z')), '2024-07-01');
    assert.equal(toDateInput(new Date('2024-02-29T12:00:00Z')), '2024-02-29');
  });
});

describe('time zone lists', () => {
  it('knows the local zone', () => {
    const tz = localTimezone();
    assert.ok(fromZonedInputs('2024-07-01', '12:00', tz));
  });

  it('lists zones that all convert', () => {
    assert.ok(supportedTimezones.includes('America/Sao_Paulo'));
    for (const tz of supportedTimezones)
      assert.ok(fromZonedInputs('2024-07-01', '12:00', tz), tz);
  });
});
