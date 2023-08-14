import { Chart } from "./chart";
import "./style.css";
import { swephInit } from "./sweph";

async function main() {
  const app = document.getElementById("app");
  if (!app) throw new Error("No app element");
  const canvas = document.createElement("canvas");
  // get the size of the window
  const { innerWidth, innerHeight } = window;
  const v = Math.min(innerWidth, innerHeight);
  const width = v;
  const height = v;
  const radius = (v - 100) / 2;
  canvas.width = width;
  canvas.height = height;

  const sweph = await swephInit();

  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("No canvas context");

  const chart = new Chart(ctx, sweph, width, height, radius);
  chart.render(new Date());

  // display the date
  const description = document.createElement("p");
  description.style.fontSize = "2rem";
  description.style.color = "#487297";
  description.innerHTML =
    chart.date.toISOString().slice(0, 16).replace("T", " ") + " UTC";

  // add buttons to change the date
  const btnsContainer = document.createElement("div");
  const btns = [
    { txt: "-1min", dt: -60 * 1000 },
    { txt: "+1min", dt: 60 * 1000 },
    { txt: "-1h", dt: -60 * 60 * 1000 },
    { txt: "+1h", dt: 60 * 60 * 1000 },
    { txt: "-1d", dt: -24 * 60 * 60 * 1000 },
    { txt: "+1d", dt: 24 * 60 * 60 * 1000 },
  ];
  const btnElements: HTMLButtonElement[] = [];
  for (const { txt, dt } of btns) {
    const btn = document.createElement("button");
    btnElements.push(btn);
    btn.innerHTML = txt;
    btn.style.margin = "0 0.5rem";
    btn.onclick = () => {
      chart.date.setTime(chart.date.getTime() + dt);
      chart.render(chart.date);
      description.innerHTML =
        chart.date.toISOString().slice(0, 16).replace("T", " ") + " UTC";
    };
  }

  // add inputs to change the location
  const inputsContainer = document.createElement("div");
  const latContainer = document.createElement("div");
  const latLabel = document.createElement("label");
  latLabel.innerHTML = "Latitude";
  latLabel.style.margin = "0 0.5rem";
  latLabel.style.color = "#487297";
  const latInput = document.createElement("input");
  latInput.type = "number";
  latInput.value = (-20).toString();
  latContainer.append(latLabel, latInput);

  const lonContainer = document.createElement("div");
  const lonLabel = document.createElement("label");
  lonLabel.innerHTML = "Longitude";
  lonLabel.style.margin = "0 0.5rem";
  lonLabel.style.color = "#487297";
  const lonInput = document.createElement("input");
  lonInput.type = "number";
  lonInput.value = (-44).toString();

  lonContainer.append(lonLabel, lonInput);
  inputsContainer.append(latContainer, lonContainer);

  inputsContainer.style.marginBottom = "2rem";
  [latInput, lonInput].forEach((input) => {
    input.onchange = () => {
      chart.setGeopos(Number(latInput.value), Number(lonInput.value));
    };
  });

  // append elements to the DOM
  app.append(description);
  app.appendChild(inputsContainer);
  app.appendChild(canvas);
  btnElements.forEach((el) => btnsContainer.appendChild(el));
  app.appendChild(btnsContainer);
}

main().catch((e) => console.error(e));
