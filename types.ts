
export enum BrandTone {
  LUXURY = 'Luxury',
  MINIMAL = 'Minimal',
  BOLD = 'Bold',
  FESTIVE = 'Festive',
  URGENT = 'Urgent'
}

export interface BrandKit {
  logoUrl?: string;
  primaryColor: string;
  secondaryColor: string;
  fontFamily: string;
}

export interface Brand {
  id: string;
  name: string;
  description: string;
  industry: string;
  targetAudience: string;
  tone: BrandTone;
  platforms: string[];
  kit: BrandKit;
}

export interface Product {
  id: string;
  brandId: string;
  name: string;
  price: number;
  description: string;
  originalImageUrl: string;
  processedImageUrl?: string;
}

export enum CampaignObjective {
  SALES = 'Sales',
  LEADS = 'Leads',
  AWARENESS = 'Awareness'
}

export interface Campaign {
  id: string;
  brandId: string;
  name: string;
  offer: string;
  cta: string;
  objective: CampaignObjective;
  market: string;
  productIds: string[];
  status: 'Draft' | 'Generating' | 'Ready';
  assets: CampaignAsset[];
  pmaxText?: PmaxTextBundle;
}

export interface CampaignAsset {
  id: string;
  name: string;
  size: { width: number; height: number };
  category: string;
  dataUrl?: string;
  editorState?: string; // Fabric JSON string
  variation: number;
}

export interface PmaxTextBundle {
  headlines: string[];
  longHeadlines: string[];
  descriptions: string[];
  shortDescriptions: string[];
}

export interface Job {
  id: string;
  type: 'image_generation' | 'copy_generation';
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
}
