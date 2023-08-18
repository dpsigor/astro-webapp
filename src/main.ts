import { Chart } from "./chart";
import "./style.css";
import { planetSign, planets, signs, swephInit } from "./sweph";

const lskGeolat ="default.geolat" ;
const lskGeolon ="default.geolon" ;

async function main() {
  const app = document.getElementById("app");
  if (!app) throw new Error("No app element");
  const canvas = document.createElement("canvas");
  // get the size of the window
  const { innerWidth, innerHeight } = window;
  let v = Math.min(innerWidth, innerHeight);
  if (v > 600) v = 600;
  const width = v;
  const height = v;
  const radius = (v - 100) / 2;
  canvas.width = width;
  canvas.height = height;

  const sweph = await swephInit();

  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("No canvas context");

  const date = new Date();

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
  const timeContainer = document.createElement("div");
  const calendarLabel = document.createElement("label");
  calendarLabel.innerHTML = "UTC Time:";
  calendarLabel.style.margin = "0 0.5rem";
  calendarLabel.style.color = "#487297";
  const calendarInput = document.createElement("input");
  calendarInput.type = "date";
  calendarInput.value = date.toISOString().slice(0, 10);
  calendarInput.style.margin = "0 0.5rem";
  calendarInput.style.color = "#487297";
  const timeInput = document.createElement("input");
  timeInput.type = "time";
  timeInput.value = date.toISOString().slice(11, 16);
  timeInput.style.margin = "0 0.5rem";
  timeInput.style.color = "#487297";
  timeContainer.append(calendarLabel, calendarInput, timeInput);
  timeContainer.style.display = "flex";
  timeContainer.style.justifyContent = "center";
  [calendarInput, timeInput].forEach((input) => {
    input.onchange = () => {
      const [year, month, day] = calendarInput.value.split("-").map(Number);
      const [hour, minute] = timeInput.value.split(":").map(Number);
      date.setUTCFullYear(year);
      date.setUTCMonth(month - 1);
      date.setUTCDate(day);
      date.setUTCHours(hour);
      date.setUTCMinutes(minute);
      chart.render({ date });
    };
  });

  // add inputs to change the location
  const geoContainer = document.createElement("div");
  const latContainer = document.createElement("div");
  const latLabel = document.createElement("label");
  latLabel.innerHTML = "Latitude";
  latLabel.style.margin = "0 0.5rem";
  latLabel.style.color = "#487297";
  const latInput = document.createElement("input");
  latInput.type = "number";
  latInput.style.width = "4rem";
  latInput.value = geolat.toFixed(2);
  latContainer.append(latLabel, latInput);
  const lonContainer = document.createElement("div");
  const lonLabel = document.createElement("label");
  lonLabel.innerHTML = "Longitude";
  lonLabel.style.margin = "0 0.5rem";
  lonLabel.style.color = "#487297";
  const lonInput = document.createElement("input");
  lonInput.type = "number";
  lonInput.style.width = "4rem";
  lonInput.value = geolon.toFixed(2);
  lonContainer.append(lonLabel, lonInput);
  geoContainer.append(latContainer, lonContainer);
  geoContainer.style.marginBottom = "2rem";
  geoContainer.style.display = "flex";
  geoContainer.style.justifyContent = "center";
  [latInput, lonInput].forEach((input) => {
    input.onchange = () => {
      const geolat = Number(latInput.value)
      const geolon = Number(lonInput.value)
      localStorage.setItem(lskGeolat, latInput.value);
      localStorage.setItem(lskGeolon, lonInput.value);
      chart.render({ geolat, geolon });
    };
  });

  // button to show, in a floating div, the table of planetary positions
  const formatTableAngle = (angle: number) => {
    let deg = Math.floor(angle);
    const sign = signs[Math.floor(deg / 30)];
    const min = Math.floor((angle - deg) * 60);
    console.log(min);
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
      td1.innerHTML = planetSign[planet];
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
    tableContainer.style.fontSize = "1.5rem";
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
    tableContainer.appendChild(table);
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
}

main().catch((e) => console.error(e));
