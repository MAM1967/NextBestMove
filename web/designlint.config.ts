import { defineConfig } from '@lapidist/design-lint';
import tokens from './design.tokens.json';

// Design tokens from docs/UI-UX/UI_Specifications.md
// Tokens are defined in DTIF format in design.tokens.json
export default defineConfig({
  // Reference the DTIF token document (colors now use object format with colorSpace/components/hex)
  tokens: tokens,
  
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
