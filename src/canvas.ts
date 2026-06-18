import { Subject } from 'rxjs';
import { Chart, ChartCfg as ChartConfig } from './chart';
import { EphGraph, EphGraphConfig } from './eph_graph';
import { Planet } from './sweph';

export type Render = 'chart' | 'ephGraph';

export const RENDER_KEY = 'render';

export interface CanvasCfg {
  chart: Partial<ChartConfig>;
  ephGraph: Partial<EphGraphConfig>;
  render: Render;
}

export class Canvas {
  private render: Render = 'chart';

  constructor(
    private chart: Chart,
    private ephGraph: EphGraph,
  ) {}

  setCfg(cfg: Partial<CanvasCfg>) {
    if (cfg.chart) this.chart.setCfg(cfg.chart);
    if (cfg.ephGraph) {
      this.ephGraph.setCfg(cfg.ephGraph);
    }
    if (cfg.render) {
      localStorage.setItem(RENDER_KEY, cfg.render);
      this.render = cfg.render;
    }
    switch (cfg.render) {
      case 'chart':
        this.chart.render();
        break;
      case 'ephGraph':
        this.ephGraph.render();
        break;
    }
  }

  loadEphGraphCfg() {
    this.ephGraph.loadCfg()
  }

  resolveRender(): Render {
    const cached = localStorage.getItem(RENDER_KEY);
    if (cached === 'chart' || cached === 'ephGraph') return cached;
    localStorage.setItem(RENDER_KEY, 'chart');
    return 'chart';
  }

  getRender(): Render {
    return this.render;
  }

  ephGraphPlanetCheckedSubj(planet: Planet): Subject<boolean> {
    return this.ephGraph.getPlanetCheckedSubj(planet);
  }
}
