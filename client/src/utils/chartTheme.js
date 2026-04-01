export function getChartTheme(isDark) {
  return {
    tickFill: isDark ? '#94a3b8' : '#64748b',
    tooltipBg: isDark ? '#1e293b' : '#ffffff',
    tooltipBorder: isDark ? '#334155' : '#e2e8f0',
    gridStroke: isDark ? '#334155' : '#e2e8f0',
    lineStroke: '#38bdf8',
  };
}
