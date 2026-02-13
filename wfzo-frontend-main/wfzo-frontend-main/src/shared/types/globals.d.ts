export type Formats = {
  thumbnail?: string;
  small?: string;
  medium?: string;
  large?: string;
};
export type ImageType = {
  url?: string;
  alt?: string;
  formats?: Formats;
};
export type EcosystemCard = { 
  backgroundImage: ImageType; 
  title: string; 
  link: string 
};
export interface Author {
  name: string;
  company?: string | null;
  photo?: {
    id: number;
    url: string;
    alt?: string | null;
    href?: string | null;
    formats?: Record<string, unknown> | null;
  } | null;
}