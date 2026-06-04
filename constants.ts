
export const PLATFORMS = [
  'Shopify Website',
  'Instagram',
  'Facebook',
  'Google Ads',
  'Google PMAX',
  'Email',
  'WhatsApp',
  'LinkedIn',
  'Affiliate (Awin)',
  'Affiliate (Webgains)'
];

// Added 'name' property to the size object type definition
export const ASSET_SIZES: Record<string, { name: string, width: number, height: number, category: string }[]> = {
  'Shopify Website': [
    { name: 'Hero Banner (Desktop)', width: 1920, height: 800, category: 'Website' },
    { name: 'Hero Banner (Mobile)', width: 1080, height: 1350, category: 'Website' },
    { name: 'Collection Banner', width: 1600, height: 500, category: 'Website' },
    { name: 'Popup Banner', width: 800, height: 800, category: 'Website' }
  ],
  'Instagram': [
    { name: 'Instagram Post', width: 1080, height: 1350, category: 'Social' },
    { name: 'Instagram Story', width: 1080, height: 1920, category: 'Social' },
    { name: 'Reel Cover', width: 1080, height: 1920, category: 'Social' }
  ],
  'Facebook': [
    { name: 'Facebook Post', width: 1200, height: 1200, category: 'Social' },
    { name: 'Facebook Story', width: 1080, height: 1920, category: 'Social' }
  ],
  'Google Ads': [
    { name: 'Medium Rectangle', width: 300, height: 250, category: 'Ads' },
    { name: 'Leaderboard', width: 728, height: 90, category: 'Ads' },
    { name: 'Wide Skyscraper', width: 160, height: 600, category: 'Ads' }
  ],
  'Google PMAX': [
    { name: 'Landscape Marketing', width: 1200, height: 628, category: 'PMAX' },
    { name: 'Square Marketing', width: 1200, height: 1200, category: 'PMAX' },
    { name: 'Portrait Marketing', width: 960, height: 1200, category: 'PMAX' },
    { name: 'Logo Square', width: 1200, height: 1200, category: 'PMAX' }
  ]
};