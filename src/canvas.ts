import { Chart, ChartCfg as ChartConfig } from "./chart";
import { EphGraph, EphGraphConfig } from "./eph_graph";

export type Render = "chart" | "ephGraph";

export interface CanvasCfg {
  chart: Partial<ChartConfig>;
  ephGraph: Partial<EphGraphConfig>;
  render: Render;
}

export class Canvas {
  constructor(private chart: Chart, private ephGraph: EphGraph) {}

  setCfg(cfg: Partial<CanvasCfg>) {
    if (cfg.chart) this.chart.setCfg(cfg.chart);
    if (cfg.ephGraph) this.ephGraph.setCfg(cfg.ephGraph);
    switch (cfg.render) {
      case "chart":
        this.chart.render();
        break;
      case "ephGraph":
        this.ephGraph.render();
        break;
    }
  }
}
