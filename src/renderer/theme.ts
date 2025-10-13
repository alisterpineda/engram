import { createTheme } from '@mantine/core';

/**
 * Compact theme optimized for dense, data-heavy software engineering tooling.
 * Keeps Mantine's default fonts, but tightens spacing and typography scale.
 */
export const compactTheme = createTheme({
  // Spacing - compact scale (reduced ~20-25% from Mantine defaults)
  spacing: {
    xs: '0.5rem',     // 8px  (default: 10px)
    sm: '0.625rem',   // 10px (default: 12px)
    md: '0.75rem',    // 12px (default: 16px)
    lg: '1rem',       // 16px (default: 20px)
    xl: '1.5rem',     // 24px (default: 32px)
  },

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
  // Note: Post titles use size="1.3125rem" fw={665} (21px/semi-bold), distinct from content h1 (20px/650)
  headings: {
    fontWeight: '650',
    sizes: {
      h1: { fontSize: '1.25rem',   lineHeight: '1.35', fontWeight: '650' }, // 20px
      h2: { fontSize: '1.125rem',  lineHeight: '1.4',  fontWeight: '650' }, // 18px
      h3: { fontSize: '1.0625rem', lineHeight: '1.4',  fontWeight: '650' }, // 17px
      h4: { fontSize: '1rem',      lineHeight: '1.4',  fontWeight: '650' }, // 16px
      h5: { fontSize: '0.9375rem', lineHeight: '1.45', fontWeight: '650' }, // 15px
      h6: { fontSize: '0.9375rem', lineHeight: '1.45', fontWeight: '650' }, // 15px (a tad bigger than md 14px)
    },
  },

  // Component overrides
  components: {
    Table: {
      styles: {
        th: {
          fontSize: 'var(--mantine-font-size-md)',
          fontWeight: 600,
        },
        td: {
          fontSize: 'var(--mantine-font-size-md)',
        },
      },
    },
  },
});
