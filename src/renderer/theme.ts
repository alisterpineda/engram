import { createTheme } from '@mantine/core';

/**
 * Compact theme optimized for dense, data-heavy software engineering tooling.
 * Keeps Mantine's default fonts, but tightens spacing and typography scale.
 */
export const compactTheme = createTheme({
  // Body/UI text - compact scale
  fontSizes: {
    xs: '0.6875rem',  // 11px
    sm: '0.75rem',    // 12px
    md: '0.875rem',   // 14px (default)
    lg: '1rem',       // 16px
    xl: '1.125rem',   // 18px
  },

  // Line heights - compact but readable
  lineHeights: {
    xs: '1.35',
    sm: '1.4',
    md: '1.45',
    lg: '1.5',
    xl: '1.55',
  },

  // Headings - compact hierarchy for toolbars, settings, modals
  headings: {
    fontWeight: '650',
    sizes: {
      h1: { fontSize: '1.5rem',    lineHeight: '1.3',  fontWeight: '650' }, // 24px
      h2: { fontSize: '1.25rem',   lineHeight: '1.35', fontWeight: '650' }, // 20px
      h3: { fontSize: '1.125rem',  lineHeight: '1.4',  fontWeight: '650' }, // 18px
      h4: { fontSize: '1rem',      lineHeight: '1.4',  fontWeight: '650' }, // 16px
      h5: { fontSize: '0.9375rem', lineHeight: '1.45', fontWeight: '650' }, // 15px
      h6: { fontSize: '0.875rem',  lineHeight: '1.5',  fontWeight: '650' }, // 14px
    },
  },
});
