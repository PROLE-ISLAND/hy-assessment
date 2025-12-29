// =====================================================
// Design System - Semantic Colors
// Meaning-based color mappings for consistent design
// =====================================================

import { chartColors, scoreColors, selectionColors } from './colors';

// =====================================================
// Domain Colors (6 Assessment Domains)
// =====================================================

/**
 * Domain-specific color definitions
 * Each domain has a unique color for visual distinction
 */
export const domainColors = {
  GOV: { hex: chartColors[0].stroke, name: 'Indigo', tailwind: 'indigo' },
  CONFLICT: { hex: chartColors[1].stroke, name: 'Teal', tailwind: 'teal' },
  REL: { hex: chartColors[2].stroke, name: 'Orange', tailwind: 'orange' },
  COG: { hex: chartColors[3].stroke, name: 'Pink', tailwind: 'pink' },
  WORK: { hex: chartColors[4].stroke, name: 'Violet', tailwind: 'violet' },
  VALID: { hex: '#94a3b8', name: 'Slate', tailwind: 'slate' }, // Special domain
} as const;

export type DomainKey = keyof typeof domainColors;

/**
 * Get domain color by key
 */
export function getDomainColor(domain: DomainKey): string {
  return domainColors[domain].hex;
}

// =====================================================
// State Colors (Success/Warning/Error/Info)
// =====================================================

/**
 * State-based color definitions
 * Unified semantic colors for status indicators
 */
export const stateColors = {
  success: {
    hex: scoreColors.excellent.hex,
    tailwind: 'emerald',
    // Light mode classes
    light: {
      bg: 'bg-emerald-50',
      text: 'text-emerald-700',
      border: 'border-emerald-200',
      full: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    },
    // Dark mode classes
    dark: {
      bg: 'dark:bg-emerald-900/20',
      text: 'dark:text-emerald-300',
      border: 'dark:border-emerald-800',
      full: 'dark:bg-emerald-900/20 dark:text-emerald-300 dark:border-emerald-800',
    },
    // Combined light + dark
    combined: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-300 dark:border-emerald-800',
  },
  warning: {
    hex: scoreColors.warning.hex,
    tailwind: 'amber',
    light: {
      bg: 'bg-amber-50',
      text: 'text-amber-700',
      border: 'border-amber-200',
      full: 'bg-amber-50 text-amber-700 border-amber-200',
    },
    dark: {
      bg: 'dark:bg-amber-900/20',
      text: 'dark:text-amber-300',
      border: 'dark:border-amber-800',
      full: 'dark:bg-amber-900/20 dark:text-amber-300 dark:border-amber-800',
    },
    combined: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-300 dark:border-amber-800',
  },
  error: {
    hex: scoreColors.danger.hex,
    tailwind: 'rose',
    light: {
      bg: 'bg-rose-50',
      text: 'text-rose-700',
      border: 'border-rose-200',
      full: 'bg-rose-50 text-rose-700 border-rose-200',
    },
    dark: {
      bg: 'dark:bg-rose-900/20',
      text: 'dark:text-rose-300',
      border: 'dark:border-rose-800',
      full: 'dark:bg-rose-900/20 dark:text-rose-300 dark:border-rose-800',
    },
    combined: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-900/20 dark:text-rose-300 dark:border-rose-800',
  },
  info: {
    hex: '#3b82f6',
    tailwind: 'blue',
    light: {
      bg: 'bg-blue-50',
      text: 'text-blue-700',
      border: 'border-blue-200',
      full: 'bg-blue-50 text-blue-700 border-blue-200',
    },
    dark: {
      bg: 'dark:bg-blue-900/20',
      text: 'dark:text-blue-300',
      border: 'dark:border-blue-800',
      full: 'dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800',
    },
    combined: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800',
  },
  neutral: {
    hex: '#6b7280',
    tailwind: 'gray',
    light: {
      bg: 'bg-gray-50',
      text: 'text-gray-700',
      border: 'border-gray-200',
      full: 'bg-gray-50 text-gray-700 border-gray-200',
    },
    dark: {
      bg: 'dark:bg-gray-800',
      text: 'dark:text-gray-300',
      border: 'dark:border-gray-700',
      full: 'dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700',
    },
    combined: 'bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700',
  },
  accent: {
    hex: '#8b5cf6',
    tailwind: 'purple',
    light: {
      bg: 'bg-purple-50',
      text: 'text-purple-700',
      border: 'border-purple-200',
      full: 'bg-purple-50 text-purple-700 border-purple-200',
    },
    dark: {
      bg: 'dark:bg-purple-900/20',
      text: 'dark:text-purple-300',
      border: 'dark:border-purple-800',
      full: 'dark:bg-purple-900/20 dark:text-purple-300 dark:border-purple-800',
    },
    combined: 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-900/20 dark:text-purple-300 dark:border-purple-800',
  },
} as const;

export type StateKey = keyof typeof stateColors;

/**
 * Get state color class (combined light + dark mode)
 */
export function getStateColorClass(state: StateKey): string {
  return stateColors[state].combined;
}

/**
 * Get state hex color
 */
export function getStateHexColor(state: StateKey): string {
  return stateColors[state].hex;
}

// =====================================================
// Interactive Colors (Selection, Hover, Focus)
// =====================================================

/**
 * Interactive state colors for UI elements
 */
export const interactiveColors = {
  selected: {
    ring: 'ring-2 ring-indigo-500',
    bg: 'bg-indigo-50/50',
    border: 'border-indigo-300',
    combined: 'ring-2 ring-indigo-500 bg-indigo-50/50 border-indigo-300',
    dark: 'dark:bg-indigo-900/20 dark:border-indigo-700',
  },
  hover: {
    bg: 'hover:bg-muted/50',
    border: 'hover:border-muted-foreground/20',
  },
  focus: {
    ring: 'focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2',
  },
} as const;

/**
 * Get selection classes for interactive elements
 */
export function getSelectionClasses(isSelected: boolean): string {
  if (!isSelected) return '';
  return `${interactiveColors.selected.combined} ${interactiveColors.selected.dark}`;
}

// =====================================================
// Re-export selection colors for backward compatibility
// =====================================================
export { selectionColors };
