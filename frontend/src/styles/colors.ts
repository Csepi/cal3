export const brandColors = {
  primary: '#3B82F6',
  secondary: '#8B5CF6',
  accent: '#10B981',
  dark: '#1F2937',
  light: '#F9FAFB',
  navy: '#0D1B3F',
  sky: '#DCEEFB',
  mint: '#D1FAE5',
};

export type BrandColorKey = keyof typeof brandColors;

export const pricingTierOrder = ['free', 'user', 'family', 'store', 'enterprise'] as const;

export type PricingTierId = (typeof pricingTierOrder)[number];
