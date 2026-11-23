import { init, use as registerCharts } from "echarts/core";
import { BarChart, LineChart } from "echarts/charts";
import { AriaComponent, DataZoomComponent, GridComponent, TooltipComponent } from "echarts/components";
import { SVGRenderer } from "echarts/renderers";

registerCharts([BarChart, LineChart, AriaComponent, DataZoomComponent, GridComponent, TooltipComponent, SVGRenderer]);

export { init };
