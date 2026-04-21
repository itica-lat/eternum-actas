export type DocType = 'acta' | 'document';

export interface BrandColors {
  navy:  string;
  teal:  string;
  aqua:  string;
  frost: string;
}

export const defaultBrandColors: BrandColors = {
  navy:  '#001C30',
  teal:  '#176B87',
  aqua:  '#64CCC5',
  frost: '#DAFFFB',
}

export interface BrandPreset {
  name:   string;
  colors: BrandColors;
}

export const BRAND_PRESETS: BrandPreset[] = [
  { name: 'Eternum',  colors: { navy: '#001C30', teal: '#176B87', aqua: '#64CCC5', frost: '#DAFFFB' } },
  { name: 'Violeta',  colors: { navy: '#0D0D1A', teal: '#4A1D96', aqua: '#A78BFA', frost: '#EDE9FE' } },
  { name: 'Bosque',   colors: { navy: '#0A1F1A', teal: '#1A6B4A', aqua: '#5ECFA0', frost: '#E0FFF4' } },
  { name: 'Cobre',    colors: { navy: '#1A0F00', teal: '#8B4513', aqua: '#D4845A', frost: '#FFF3EB' } },
  { name: 'Pizarra',  colors: { navy: '#0F1117', teal: '#334155', aqua: '#94A3B8', frost: '#F1F5F9' } },
]

/** A saved document template capturing structure + display settings */
export interface Template {
  id: string;
  name: string;
  /** ISO-8601 creation timestamp */
  createdAt: string;
  docSettings: DocSettings;
  /** H1 / H2 / H3 heading lines extracted from the markdown at save time */
  sections: string[];
  /** Full ---refs--- block content (empty string if absent) */
  refs: string;
}

export interface DocSettings {
  type: DocType;
  headerEnabled: boolean;
  headerProjectRef: string;
  headerDate: string;
  footerLeft: string;
  footerRight: string;
  watermarkEnabled: boolean;
  watermarkText: string;
  watermarkOpacity: number;
  brandColors: BrandColors;
}

export const defaultDocSettings: DocSettings = {
  type: 'acta',
  headerEnabled: false,
  headerProjectRef: '',
  headerDate: '',
  footerLeft: '',
  footerRight: '',
  watermarkEnabled: false,
  watermarkText: 'BORRADOR',
  watermarkOpacity: 0.06,
  brandColors: defaultBrandColors,
};
