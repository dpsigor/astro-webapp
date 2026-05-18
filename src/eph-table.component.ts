import { Observable, Subscription } from 'rxjs';
import { planetGlyphUnicode } from './sweph';
import type { Ephemeris } from './ephemeris.service';
import { formatTableAngle } from './text';

export class EphTable {
  private subs: Subscription | null = null;

  constructor(private ephs: Observable<Ephemeris>) {}

  onInit() {
    this.subs = this.ephs.subscribe((eph) => {
      this.render(eph);
    });
  }

  render(eph: Ephemeris) {
    const table = document.createElement('table');
    table.style.color = 'white';
    const headers = document.createElement('tr');
    ['Date/Time', 'A', 'B', 'Angle'].forEach((col) => {
      const h = document.createElement('th');
      h.innerText = col;
      headers.appendChild(h);
    });
    table.appendChild(headers);
    eph.events.forEach(({ time, a, b, angle }) => {
      const row = document.createElement('tr');
      const dateCell = document.createElement('td');
      dateCell.innerText = time.toISOString();
      const aCell = document.createElement('td');
      aCell.innerText = planetGlyphUnicode[a];
      const bCell = document.createElement('td');
      bCell.innerText = planetGlyphUnicode[b];
      const angleCell = document.createElement('td');
      angleCell.innerText = formatTableAngle(angle);
      row.appendChild(dateCell);
      row.appendChild(aCell);
      row.appendChild(bCell);
      row.appendChild(angleCell);
      table.appendChild(row);
    });
    const container = document.getElementById('eph-table-container');
    if (container) {
      container.innerHTML = '';
      container.appendChild(table);
    }
  }

  onDestroy() {
    if (this.subs) this.subs.unsubscribe();
  }
}
