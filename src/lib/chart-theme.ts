/**
 * Chart Theme Configuration
 * Provides theme-aware colors for Recharts components
 */

export interface ChartTheme {
  // Primary colors for main chart elements
  primary: string;
  secondary: string;
  accent: string;

  // Chart specific colors
  bar: string[];
  line: string[];
  pie: string[];

  // UI elements
  grid: string;
  axis: string;
  tooltip: {
    background: string;
    border: string;
    text: string;
  };
  legend: string;

  // Status colors
  success: string;
  warning: string;
  error: string;
  info: string;
}

export const lightChartTheme: ChartTheme = {
  primary: 'hsl(222.2, 47.4%, 11.2%)', // Primary color
  secondary: 'hsl(210, 40%, 96.1%)',
  accent: 'hsl(142.1, 76.2%, 36.3%)', // Green accent

  bar: [
    'hsl(221.2, 83.2%, 53.3%)', // Blue
    'hsl(142.1, 76.2%, 36.3%)', // Green
    'hsl(24.6, 95%, 53.1%)',    // Orange
    'hsl(262.1, 83.3%, 57.8%)', // Purple
    'hsl(173, 58%, 39%)',       // Teal
    'hsl(346.8, 77.2%, 49.8%)', // Pink
  ],

  line: [
    'hsl(221.2, 83.2%, 53.3%)',
    'hsl(142.1, 76.2%, 36.3%)',
    'hsl(24.6, 95%, 53.1%)',
    'hsl(262.1, 83.3%, 57.8%)',
  ],

  pie: [
    'hsl(221.2, 83.2%, 53.3%)',
    'hsl(142.1, 76.2%, 36.3%)',
    'hsl(24.6, 95%, 53.1%)',
    'hsl(262.1, 83.3%, 57.8%)',
    'hsl(173, 58%, 39%)',
    'hsl(346.8, 77.2%, 49.8%)',
    'hsl(47.9, 95.8%, 53.1%)',
    'hsl(280.4, 89.5%, 56.1%)',
  ],

  grid: 'hsl(214.3, 31.8%, 91.4%)',
  axis: 'hsl(215.4, 16.3%, 46.9%)',

  tooltip: {
    background: 'hsl(0, 0%, 100%)',
    border: 'hsl(214.3, 31.8%, 91.4%)',
    text: 'hsl(222.2, 47.4%, 11.2%)',
  },

  legend: 'hsl(215.4, 16.3%, 46.9%)',

  success: 'hsl(142.1, 76.2%, 36.3%)',
  warning: 'hsl(24.6, 95%, 53.1%)',
  error: 'hsl(0, 84.2%, 60.2%)',
  info: 'hsl(221.2, 83.2%, 53.3%)',
};

export const darkChartTheme: ChartTheme = {
  primary: 'hsl(210, 40%, 98%)',
  secondary: 'hsl(217.2, 32.6%, 17.5%)',
  accent: 'hsl(142.1, 70.6%, 45.3%)',

  bar: [
    'hsl(217.2, 91.2%, 59.8%)', // Lighter blue for dark mode
    'hsl(142.1, 70.6%, 45.3%)', // Lighter green
    'hsl(24.6, 95%, 63.1%)',    // Lighter orange
    'hsl(263.4, 70%, 70.4%)',   // Lighter purple
    'hsl(173, 58%, 49%)',       // Lighter teal
    'hsl(346.8, 77.2%, 59.8%)', // Lighter pink
  ],

  line: [
    'hsl(217.2, 91.2%, 59.8%)',
    'hsl(142.1, 70.6%, 45.3%)',
    'hsl(24.6, 95%, 63.1%)',
    'hsl(263.4, 70%, 70.4%)',
  ],

  pie: [
    'hsl(217.2, 91.2%, 59.8%)',
    'hsl(142.1, 70.6%, 45.3%)',
    'hsl(24.6, 95%, 63.1%)',
    'hsl(263.4, 70%, 70.4%)',
    'hsl(173, 58%, 49%)',
    'hsl(346.8, 77.2%, 59.8%)',
    'hsl(47.9, 95.8%, 63.1%)',
    'hsl(280.4, 80%, 66.1%)',
  ],

  grid: 'hsl(215, 27.9%, 16.9%)',
  axis: 'hsl(215, 20.2%, 65.1%)',

  tooltip: {
    background: 'hsl(222.2, 84%, 4.9%)',
    border: 'hsl(217.2, 32.6%, 17.5%)',
    text: 'hsl(210, 40%, 98%)',
  },

  legend: 'hsl(215, 20.2%, 65.1%)',

  success: 'hsl(142.1, 70.6%, 45.3%)',
  warning: 'hsl(24.6, 95%, 63.1%)',
  error: 'hsl(0, 72.2%, 50.6%)',
  info: 'hsl(217.2, 91.2%, 59.8%)',
};

/**
 * Hook to get chart theme based on current theme
 */
export function useChartTheme(isDark: boolean): ChartTheme {
  return isDark ? darkChartTheme : lightChartTheme;
}

/**
 * Custom tooltip styles for dark mode
 */
export function getTooltipStyles(isDark: boolean) {
  const theme = isDark ? darkChartTheme : lightChartTheme;

  return {
    contentStyle: {
      backgroundColor: theme.tooltip.background,
      border: `1px solid ${theme.tooltip.border}`,
      borderRadius: '6px',
      color: theme.tooltip.text,
    },
    itemStyle: {
      color: theme.tooltip.text,
    },
    labelStyle: {
      color: theme.tooltip.text,
      fontWeight: 600,
    },
  };
}

/**
 * Get colors for a specific chart type
 */
export function getChartColors(type: 'bar' | 'line' | 'pie', isDark: boolean): string[] {
  const theme = isDark ? darkChartTheme : lightChartTheme;
  return theme[type];
}
