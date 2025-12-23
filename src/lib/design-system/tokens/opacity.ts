// =====================================================
// Design System - Opacity Tokens
// Centralized opacity values for consistent transparency
// =====================================================

// =====================================================
// Gradient Opacity Presets
// Optimized values for different chart types
// =====================================================

/**
 * Gradient opacity presets for chart types
 */
export const gradientOpacity = {
  /**
   * Soft gradient - for Radar/Comparison charts
   * Gentle fade effect
   */
  soft: {
    start: 0.6,
    end: 0.15,
  },

  /**
   * Strong gradient - for Bar/Distribution charts
   * Higher contrast for emphasis
   */
  strong: {
    start: 0.9,
    end: 0.6,
  },

  /**
   * Area gradient - for Area charts
   * Three-stage fade for depth
   */
  area: {
    start: 0.5,
    mid: 0.25,
    end: 0.05,
  },

  /**
   * Glow effect - for Progress bars
   * Fill and shadow opacity
   */
  glow: {
    fill: 0.6,
    shadow: 0.4,
  },
} as const;

// =====================================================
// Glow Filter Intensity
// Blur values for SVG filters
// =====================================================

/**
 * Glow filter intensity (stdDeviation values)
 */
export const glowIntensity = {
  /** Soft glow - for Radar, Comparison charts */
  soft: 3,
  /** Normal glow - for Bar, Area, Distribution charts */
  normal: 2,
  /** Strong glow - for emphasis */
  strong: 4,
  /** Subtle glow - for minimal effect */
  subtle: 1.5,
} as const;

// =====================================================
// Surface Opacity
// Background transparency for UI elements
// =====================================================

/**
 * Surface opacity for different UI contexts
 */
export const surfaceOpacity = {
  /** Glass effect background */
  glass: 0.3,
  /** Glass effect (darker mode) */
  glassDark: 0.2,
  /** Overlay background */
  overlay: 0.5,
  /** Subtle hover effect */
  hover: 0.05,
  /** Active/pressed state */
  active: 0.1,
  /** Disabled state */
  disabled: 0.4,
} as const;

// =====================================================
// Border Opacity
// Border transparency values
// =====================================================

/**
 * Border opacity for different states
 */
export const borderOpacity = {
  /** Default border */
  default: 0.2,
  /** Hover state */
  hover: 0.3,
  /** Focus state */
  focus: 0.5,
  /** Glass effect border */
  glass: 0.2,
  /** Glass effect border (dark mode) */
  glassDark: 0.1,
} as const;

// =====================================================
// Helper Functions
// =====================================================

/**
 * Create rgba color with specified opacity
 */
export function withOpacity(hex: string, opacity: number): string {
  // Remove # if present
  const cleanHex = hex.replace('#', '');

  // Parse RGB values
  const r = parseInt(cleanHex.substring(0, 2), 16);
  const g = parseInt(cleanHex.substring(2, 4), 16);
  const b = parseInt(cleanHex.substring(4, 6), 16);

  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
}

/**
 * Get gradient stop values for SVG gradients
 * Note: 'glow' type is not supported as it uses fill/shadow instead of start/end
 */
export function getGradientStops(
  type: 'soft' | 'strong' | 'area'
): { offset: string; opacity: number }[] {
  const preset = gradientOpacity[type];

  if ('mid' in preset) {
    // Three-stage gradient (area type)
    return [
      { offset: '0%', opacity: preset.start },
      { offset: '50%', opacity: preset.mid },
      { offset: '100%', opacity: preset.end },
    ];
  }

  // Two-stage gradient (soft, strong)
  return [
    { offset: '0%', opacity: preset.start },
    { offset: '100%', opacity: preset.end },
  ];
}
