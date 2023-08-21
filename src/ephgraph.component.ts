import { Canvas } from "./canvas";
import { Planet, planetGlyph, planets } from "./sweph";

export function ephGraphComponent(canvasApp: Canvas, d1: Date, d2: Date) {
  // ephemeris graph form
  const ephGrphContainer = document.createElement("div");
  const form = document.createElement("div");
  form.classList.add("eph-graph-form");
  const dateStartInput = document.createElement("input");
  const dateEndInput = document.createElement("input");
  const planetCheckboxesContainer = document.createElement("div");
  planetCheckboxesContainer.classList.add("eph-graph-checkboxes");
  const planetCheckboxes = planets.map((p) => {
    const input = document.createElement("input");
    input.type = "checkbox";
    input.checked = false;
    input.id = `eph-graph-${p}-checkbox`;
    const label = document.createElement("label");
    label.classList.add("eph-graph-label");
    label.innerHTML = planetGlyph[p];
    return { input, label };
  });
  planetCheckboxes.forEach(({ label, input }) => {
    input.onchange = () => {
      const planets: Planet[] = [];
      for (const { input: cb } of planetCheckboxes) {
        if (cb.checked) {
          const parts = cb.id.split("-");
          if (parts.length < 3) throw new Error("Invalid checkbox id " + cb.id);
          const p = parseInt(parts[2]) as Planet;
          if (p !== 0 && !p) throw new Error("Invalid planet " + p);
          planets.push(p);
        }
      }
      canvasApp.setCfg({
        ephGraph: { planets },
        render: "ephGraph",
      });
    };
    planetCheckboxesContainer.append(label, input);
  });
  const warning = document.createElement("p");
  warning.classList.add("eph-graph-warning");
  dateStartInput.type = "date";
  dateEndInput.type = "date";
  dateStartInput.value = d1.toISOString().slice(0, 10);
  dateEndInput.value = d2.toISOString().slice(0, 10);
  [dateStartInput, dateEndInput].forEach((input) => {
    input.onchange = () => {
      const dateStart = new Date(dateStartInput.value);
      const dateEnd = new Date(dateEndInput.value);
      warning.innerHTML = "";
      if (dateStart >= dateEnd) {
        warning.innerHTML = "Start date must be before end date";
        return;
      }
      canvasApp.setCfg({
        ephGraph: { range: [dateStart, dateEnd] },
        render: "ephGraph",
      });
    };
  });
  form.appendChild(dateStartInput);
  form.appendChild(dateEndInput);
  ephGrphContainer.appendChild(form);
  ephGrphContainer.appendChild(warning);
  ephGrphContainer.appendChild(planetCheckboxesContainer);

  return { ephGrphContainer };
}
