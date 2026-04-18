export type DocType = 'acta' | 'document';

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
};
