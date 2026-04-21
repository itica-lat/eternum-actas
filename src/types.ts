export type DocType = 'acta' | 'document';

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
