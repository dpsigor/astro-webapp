import { Canvas, Render } from "./canvas";
import { Chart } from "./chart";
import { chartComponent } from "./chart.component";
import { lskGeolat, lskGeolon, lskTime, lskTimezone } from "./constants";
import { EphGraph } from "./eph_graph";
import { ephGraphComponent } from "./ephgraph.component";
import { loadFonts } from "./preloadfonts";
import "./style.css";
import { planets, swephInit } from "./sweph";

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

  const d1 = new Date();
  const d2 = new Date();
  d2.setFullYear(d2.getFullYear() + 1);
  const ephGraph = new EphGraph(ctx, sweph, {
    planets: [],
    height,
    width,
    radius,
    range: [d1, d2],
  });

  const canvasApp = new Canvas(chart, ephGraph);
  canvasApp.setCfg({ render: "chart" });

  const { timeContainer, geoContainer, tableButtonContainer } = chartComponent(
    canvasApp,
    chart,
    date,
    timezone,
    geolat,
    geolon
  );

  const { ephGrphContainer } = ephGraphComponent(canvasApp, d1, d2);

  // screen container
  const screenContainer = document.createElement("div");

  // mode radio
  let mode: Render = "chart";
  const modeRadioContainer = document.createElement("div");
  modeRadioContainer.classList.add("mode-radio-container");
  const modeRadioLabel = document.createElement("label");
  modeRadioLabel.innerHTML = "Chart";
  const modeRadioChart = document.createElement("input");
  modeRadioChart.type = "radio";
  modeRadioChart.name = "mode";
  modeRadioChart.value = "chart";
  const modeRadioChartLabel = document.createElement("label");
  modeRadioChartLabel.innerHTML = "Ephemeris";
  const modeRadioEphGraph = document.createElement("input");
  modeRadioEphGraph.type = "radio";
  modeRadioEphGraph.name = "mode";
  modeRadioEphGraph.value = "ephGraph";

  modeRadioChart.checked = true;
  modeRadioEphGraph.checked = false;

  const modeRadioEphGraphLabel = document.createElement("label");
  modeRadioEphGraphLabel.innerHTML = "Ephemeris Graph";
  modeRadioContainer.appendChild(modeRadioLabel);
  modeRadioContainer.appendChild(modeRadioChart);
  modeRadioContainer.appendChild(modeRadioChartLabel);
  modeRadioContainer.appendChild(modeRadioEphGraph);
  modeRadioChart.onchange = () => {
    screenContainer.innerHTML = "";
    screenContainer.appendChild(timeContainer);
    screenContainer.appendChild(geoContainer);
    screenContainer.appendChild(canvas);
    screenContainer.appendChild(tableButtonContainer);
    mode = "chart";
    canvasApp.setCfg({ render: "chart" });
  };
  modeRadioEphGraph.onchange = () => {
    screenContainer.innerHTML = "";
    screenContainer.appendChild(ephGrphContainer);
    screenContainer.appendChild(canvas);
    mode = "ephGraph";
    canvasApp.setCfg({ render: "ephGraph" });
  };

  // append elements to the DOM
  screenContainer.appendChild(timeContainer);
  screenContainer.appendChild(geoContainer);
  screenContainer.appendChild(canvas);
  screenContainer.appendChild(tableButtonContainer);
  app.appendChild(modeRadioContainer);
  app.appendChild(screenContainer);

  // moving mouse on the canvas, show the description of the point
  canvas.addEventListener("mousemove", (ev) => {
    if (mode !== "ephGraph") return;
    ephGraph.pointDescription(ev.offsetX, ev.offsetY);
  });
}

loadFonts().then(() => {
  main().catch((e) => console.error(e));
});
