import dayjs from "dayjs";
import dayjstimezone from "dayjs/plugin/timezone";
import dayjsutc from "dayjs/plugin/utc";
import { Chart } from "./chart";
import { loadFonts } from "./preloadfonts";
import "./style.css";
import { Planet, planetGlyph, planets, signGlyph, swephInit } from "./sweph";
import { EphGraph } from "./eph_graph";

dayjs.extend(dayjsutc);
dayjs.extend(dayjstimezone);

const lskGeolat = "default.geolat";
const lskGeolon = "default.geolon";
const lskTime = "default.time";
const lskTimezone = "default.timezone";

function updateDateTz(date: Date, amdStr: string, timeStr: string, tz: string) {
  if (!amdStr || !timeStr) return;
  const [year, month, day] = amdStr.split("-").map(Number);
  const [hour, minute] = timeStr.split(":").map(Number);
  const d1 = dayjs.tz(`${year}-${month}-${day} ${hour}:${minute}`, tz).utc();
  date.setUTCFullYear(d1.year());
  date.setUTCMonth(d1.month());
  date.setUTCDate(d1.date());
  date.setUTCHours(d1.hour());
  date.setUTCMinutes(d1.minute());
  date.setUTCSeconds(d1.second());
  localStorage.setItem(lskTime, date.valueOf().toString());
}

async function main() {
  const app = document.getElementById("app");
  if (!app) throw new Error("No app element");
  const canvas = document.createElement("canvas");
  // get the size of the window
  const { innerWidth, innerHeight } = window;
  let v = Math.min(innerWidth - 20, innerHeight);
  if (v > 600) v = 600;
  if (v > innerHeight - 200) v = innerHeight - 210;
  if (v > innerWidth - 10) v = innerWidth - 10;
  if (v < 100) v = 102; // TODO: handle this better
  const width = v;
  const height = v;
  const radius = (v - 100) / 2;
  canvas.width = width;
  canvas.height = height;

  const sweph = await swephInit();

  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("No canvas context");

  let timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const lsTimezone = localStorage.getItem(lskTimezone);
  if (lsTimezone) timezone = lsTimezone;
  const date = new Date();
  const lsTime = parseInt(localStorage.getItem(lskTime) || "");
  if (!Number.isNaN(lsTime)) {
    date.setTime(lsTime);
  } else {
    localStorage.removeItem(lskTime);
  }

  let geolon = -43 - 56 / 60;
  let geolat = -19 - 55 / 60;
  const lsgeolon = localStorage.getItem(lskGeolon);
  const lsgeolat = localStorage.getItem(lskGeolat);
  if (lsgeolon) geolon = Number(lsgeolon);
  if (lsgeolat) geolat = Number(lsgeolat);

  const chart = new Chart(ctx, sweph, {
    date,
    geolat,
    geolon,
    width,
    height,
    radius,
  });
  chart.render({});

  // time inputs
  const dj = dayjs(date).tz(timezone);
  const timeContainer = document.createElement("div");
  const calendarInput = document.createElement("input");
  calendarInput.type = "date";
  calendarInput.value = dj.format("YYYY-MM-DD");
  calendarInput.style.margin = "0 0.5rem";
  calendarInput.style.color = "#487297";

  const timeInput = document.createElement("input");
  timeInput.type = "time";
  timeInput.value = dj.format("HH:mm");
  timeInput.style.margin = "0 0.5rem";
  timeInput.style.color = "#487297";

  timeContainer.append(calendarInput, timeInput);

  if (
    Intl &&
    Intl.DateTimeFormat() &&
    Intl.DateTimeFormat().resolvedOptions() &&
    (Intl as unknown as any).supportedValuesOf
  ) {
    const tzs = (Intl as unknown as any).supportedValuesOf("timeZone");
    if (tzs && timezone) {
      const tzSelect = document.createElement("select");
      tzSelect.style.margin = "0 0.5rem";
      tzSelect.style.color = "#487297";
      tzSelect.onchange = () => {
        timezone = tzSelect.value;
        localStorage.setItem(lskTimezone, timezone);
        updateDateTz(date, calendarInput.value, timeInput.value, timezone);
        chart.render({ date });
      };
      tzs.forEach((tz: string) => {
        const option = document.createElement("option");
        option.value = tz;
        option.innerHTML = tz;
        if (tz === timezone) option.selected = true;
        tzSelect.append(option);
      });
      timeContainer.append(tzSelect);
    }
  }
  timeContainer.classList.add("time-container");
  [calendarInput, timeInput].forEach((input) => {
    input.onchange = () => {
      updateDateTz(date, calendarInput.value, timeInput.value, timezone);
      chart.render({ date });
    };
  });

  // add inputs to change the location
  const geoContainer = document.createElement("div");
  const latContainer = document.createElement("div");
  const latLabel = document.createElement("label");
  latLabel.innerHTML = "Lat";
  latLabel.style.margin = "0 0.5rem";
  latLabel.style.color = "#487297";
  const latInput = document.createElement("input");
  latInput.type = "number";
  latInput.style.width = "4rem";
  latInput.value = geolat.toFixed(2);
  latContainer.append(latLabel, latInput);
  const lonContainer = document.createElement("div");
  const lonLabel = document.createElement("label");
  lonLabel.innerHTML = "Lon";
  lonLabel.style.margin = "0 0.5rem";
  lonLabel.style.color = "#487297";
  const lonInput = document.createElement("input");
  lonInput.type = "number";
  lonInput.style.width = "4rem";
  lonInput.value = geolon.toFixed(2);
  lonContainer.append(lonLabel, lonInput);
  geoContainer.append(latContainer, lonContainer);
  geoContainer.classList.add("geo-container");
  [latInput, lonInput].forEach((input) => {
    input.onchange = () => {
      const geolat = Number(latInput.value);
      const geolon = Number(lonInput.value);
      localStorage.setItem(lskGeolat, latInput.value);
      localStorage.setItem(lskGeolon, lonInput.value);
      chart.render({ geolat, geolon });
    };
  });

  // button to show, in a floating div, the table of planetary positions
  const formatTableAngle = (angle: number) => {
    let deg = Math.floor(angle);
    const sign = signGlyph[Math.floor(deg / 30)];
    const min = Math.floor((angle - deg) * 60);
    const sec = Math.floor(((angle - deg) * 60 - min) * 60);
    deg = deg % 30;
    return `${sign} ${deg}° ${min}' ${sec}"`;
  };
  const tableButton = document.createElement("button");
  tableButton.innerHTML = "Table";
  tableButton.style.margin = "0 0.5rem";
  tableButton.style.color = "#487297";
  tableButton.onclick = () => {
    const table = document.createElement("table");
    table.style.borderCollapse = "collapse";
    table.style.border = "1px solid #487297";
    table.style.margin = "1rem";
    const thead = document.createElement("thead");
    const tbody = document.createElement("tbody");
    const tr = document.createElement("tr");
    ["Planet", "Longitude", "Speed"].forEach((text) => {
      const th = document.createElement("th");
      th.innerHTML = text;
      th.style.border = "1px solid #487297";
      th.style.padding = "0.5rem";
      tr.appendChild(th);
    });
    thead.appendChild(tr);
    table.appendChild(thead);
    planets.forEach((planet) => {
      const tr = document.createElement("tr");
      const td1 = document.createElement("td");
      td1.innerHTML = planetGlyph[planet];
      td1.style.border = "1px solid #487297";
      td1.style.padding = "0.5rem";
      const td2 = document.createElement("td");
      const pos = chart.planetPositions.get(planet);
      if (!pos) throw new Error("No position for planet " + planet);
      td2.innerHTML = formatTableAngle(pos.lon);
      td2.style.border = "1px solid #487297";
      td2.style.padding = "0.5rem";
      const td3 = document.createElement("td");
      td3.innerHTML = pos.slon.toFixed(2);
      td3.style.border = "1px solid #487297";
      td3.style.padding = "0.5rem";
      tr.append(td1, td2, td3);
      tbody.appendChild(tr);
    });
    // add the ascendant and MC
    [
      { idx: 0, symbol: "ASC" },
      { idx: 9, symbol: "MC" },
    ].forEach(({ idx, symbol }) => {
      const tr = document.createElement("tr");
      const td1 = document.createElement("td");
      td1.innerHTML = symbol;
      td1.style.border = "1px solid #487297";
      td1.style.padding = "0.5rem";
      const td2 = document.createElement("td");
      const pos = chart.houses[idx];
      td2.innerHTML = formatTableAngle(pos);
      td2.style.border = "1px solid #487297";
      td2.style.padding = "0.5rem";
      tr.append(td1, td2);
      tbody.appendChild(tr);
    });
    table.appendChild(tbody);
    const tableContainer = document.createElement("div");
    tableContainer.style.position = "fixed";
    tableContainer.style.top = "0";
    tableContainer.style.left = "0";
    tableContainer.style.width = "100%";
    tableContainer.style.height = "100%";
    tableContainer.style.backgroundColor = "rgba(0, 0, 0, 0.9)";
    tableContainer.style.zIndex = "1000";
    tableContainer.style.color = "#487297";
    tableContainer.style.fontSize = "1rem";
    tableContainer.style.display = "flex";
    tableContainer.style.justifyContent = "center";
    tableContainer.style.alignItems = "center";
    tableContainer.onclick = (ev) => {
      // if also clicked on the table, do not remove
      const x = ev.clientX;
      const y = ev.clientY;
      const rect = table.getBoundingClientRect();
      if (
        x >= rect.left &&
        x <= rect.right &&
        y >= rect.top &&
        y <= rect.bottom
      )
        return;
      tableContainer.remove();
    };
    // X button to close the table, floating
    const xButton = document.createElement("button");
    xButton.innerHTML = "X";
    xButton.style.position = "absolute";
    tableContainer.style.zIndex = "1001";
    xButton.style.top = "0";
    xButton.style.right = "0";
    xButton.style.margin = "1rem";
    xButton.style.color = "#487297";
    xButton.style.fontSize = "1.5rem";
    xButton.style.border = "none";
    xButton.style.backgroundColor = "transparent";
    xButton.onclick = () => tableContainer.remove();
    tableContainer.appendChild(table);
    tableContainer.appendChild(xButton);
    document.body.appendChild(tableContainer);
  };
  const tableButtonContainer = document.createElement("div");
  tableButtonContainer.appendChild(tableButton);
  tableButtonContainer.style.marginTop = "1rem";
  tableButtonContainer.style.display = "flex";
  tableButtonContainer.style.justifyContent = "center";

  // append elements to the DOM
  app.appendChild(timeContainer);
  app.appendChild(geoContainer);
  app.appendChild(canvas);
  app.appendChild(tableButtonContainer);

  const d1 = new Date();
  const d2 = new Date();
  d2.setFullYear(d2.getFullYear() + 2);
  const ephGraph = new EphGraph(ctx, sweph, {
    planet: Planet.Mercury,
    height,
    width,
    radius,
    range: [d1, d2],
  });
  ephGraph.render();

  // moving mouse on the canvas, show the description of the point
  canvas.addEventListener("mousemove", (ev) => {
    ephGraph.pointDescription(ev.offsetX, ev.offsetY);
  })
}

loadFonts().then(() => {
  main().catch((e) => console.error(e));
});
