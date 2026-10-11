import { Bricolage_Grotesque, Figtree } from 'next/font/google';

export const displayFont = Bricolage_Grotesque({
  subsets: ['latin'],
  variable: '--font-display',
  display: 'swap',
});

export const bodyFont = Figtree({
  subsets: ['latin'],
  variable: '--font-body',
  display: 'swap',
});