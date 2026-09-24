/** Shared Recharts styling so every chart reads as one system. */
export const CHART_PRIMARY = "#dae878";

export const CHART_AXIS = {
  stroke: "#808080",
  fontSize: 11,
  tickLine: false,
  axisLine: false,
} as const;

export const CHART_GRID = { stroke: "#242424", strokeDasharray: "0", vertical: false } as const;

export const CHART_TOOLTIP = {
  contentStyle: {
    background: "#1A1A1A",
    border: "1px solid #242424",
    borderRadius: 8,
    color: "#F0F0F0",
    fontSize: 12,
  },
  labelStyle: { color: "#808080" },
  itemStyle: { color: "#F0F0F0" },
  cursor: { fill: "rgba(218,232,120,0.06)", stroke: "rgba(218,232,120,0.25)" },
} as const;
