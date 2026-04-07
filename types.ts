import { LucideIcon } from 'lucide-react';

export interface ServiceItem {
  title: string;
  items: string[];
  icon: LucideIcon;
}

export interface CountryExperience {
  country: string;
  flagCode: string; // ISO code for flag display if needed, or just visual reference
  highlights: string[];
}

export interface CampaignStat {
  label: string;
  value: string;
  description: string;
}

export interface Product {
  title: string;
  description: string;
}

export interface SurveyPost {
  id: string;
  title: string;
  category: string;
  summary: string;
  content: string;
  imageUrl: string;
  pdfUrl: string;
  publishedAt: string;
  createdAt?: string;
  contentBlocks?: SurveyContentBlock[];
}

export interface SurveyContentTextBlock {
  id: string;
  type: 'text';
  content: string;
}

export interface SurveyContentImageBlock {
  id: string;
  type: 'image';
  imageUrl: string;
  caption?: string;
}

export type SurveyContentBlock = SurveyContentTextBlock | SurveyContentImageBlock;
