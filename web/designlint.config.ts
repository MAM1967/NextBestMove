import { defineConfig } from '@lapidist/design-lint';

// Design tokens from docs/UI-UX/UI_Specifications.md
export default defineConfig({
  tokens: {
    // Colors - Primary and Semantic
    colors: {
      // Primary Colors
      'primary-blue': '#2563EB',
      'primary-blue-hover': '#1D4ED8',
      'primary-blue-active': '#1E40AF',
      
      // Semantic Colors
      'success-green': '#10B981',
      'success-green-hover': '#059669',
      'warning-orange': '#F59E0B',
      'warning-orange-hover': '#D97706',
      'error-red': '#EF4444',
      'error-red-hover': '#DC2626',
      'fast-win-accent': '#8B5CF6',
      
      // Gray Scale
      'gray-50': '#F9FAFB',   // Background light
      'gray-100': '#F3F4F6',  // Background subtle
      'gray-200': '#E5E7EB',  // Borders, dividers
      'gray-300': '#D1D5DB',  // Disabled states
      'gray-400': '#9CA3AF',  // Placeholder text
      'gray-500': '#6B7280',  // Secondary text
      'gray-600': '#4B5563',  // Primary text
      'gray-700': '#1F2937',  // Headings, emphasis
      'gray-800': '#111827',  // Maximum contrast text
      'gray-900': '#111827',  // Alias for maximum contrast
      
      // Additional semantic colors
      'black': '#000000',
      'white': '#FFFFFF',
    },
    
    // Spacing - Base unit: 4px
    spacing: {
      'xs': 4,    // 4px (0.25rem)
      'sm': 8,    // 8px (0.5rem)
      'md': 12,   // 12px (0.75rem)
      'base': 16, // 16px (1rem)
      'lg': 24,   // 24px (1.5rem)
      'xl': 32,   // 32px (2rem)
      '2xl': 48,  // 48px (3rem)
      '3xl': 64,  // 64px (4rem)
    },
    
    // Border Radius
    borderRadius: {
      'sm': 4,
      'base': 8,
      'md': 12,
      'lg': 16,
      'xl': 24,
      'full': 9999, // For pills/badges
    },
    
    // Typography - Font Sizes (in pixels)
    fontSizes: {
      'h1': 32,        // 2rem - Page Title
      'h2': 24,        // 1.5rem - Section Title
      'h3': 20,        // 1.25rem - Card Title
      'h4': 18,        // 1.125rem - Subsection
      'body-large': 16, // 1rem
      'body': 14,       // 0.875rem
      'body-small': 12, // 0.75rem
      'caption': 11,    // 0.6875rem
    },
    
    // Font Weights
    fontWeights: {
      'light': 300,
      'regular': 400,
      'medium': 500,
      'semibold': 600,
      'bold': 700,
    },
    
    // Shadows
    shadows: {
      'sm': '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
      'base': '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
      'md': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
      'lg': '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
      'xl': '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
    },
  },
  
  // Enable design token rules (start with warnings, can escalate to errors later)
  rules: {
    'design-token/colors': 'warn',
    'design-token/spacing': 'warn',
    'design-token/border-radius': 'warn',
    'design-token/box-shadow': 'warn',
    'design-token/font-size': 'warn',
    'design-token/font-weight': 'warn',
  },
});
