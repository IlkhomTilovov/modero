// Self-hosted Google Fonts (via @fontsource) — no requests to fonts.googleapis.com.
// Each loader pulls only the weights the UI actually uses, and is only invoked
// for the font family that's actually active, so unused fonts never ship.
type FontLoader = () => Promise<unknown>;

const FONT_LOADERS: Record<string, FontLoader> = {
  Manrope: () =>
    Promise.all([
      import('@fontsource/manrope/300.css'),
      import('@fontsource/manrope/400.css'),
      import('@fontsource/manrope/500.css'),
      import('@fontsource/manrope/600.css'),
      import('@fontsource/manrope/700.css'),
      import('@fontsource/manrope/800.css'),
    ]),
  Inter: () =>
    Promise.all([
      import('@fontsource/inter/400.css'),
      import('@fontsource/inter/500.css'),
      import('@fontsource/inter/600.css'),
      import('@fontsource/inter/700.css'),
    ]),
  'Playfair Display': () =>
    Promise.all([
      import('@fontsource/playfair-display/400.css'),
      import('@fontsource/playfair-display/500.css'),
      import('@fontsource/playfair-display/600.css'),
      import('@fontsource/playfair-display/700.css'),
    ]),
  Roboto: () =>
    Promise.all([
      import('@fontsource/roboto/400.css'),
      import('@fontsource/roboto/500.css'),
      import('@fontsource/roboto/700.css'),
    ]),
  Montserrat: () =>
    Promise.all([
      import('@fontsource/montserrat/400.css'),
      import('@fontsource/montserrat/500.css'),
      import('@fontsource/montserrat/600.css'),
      import('@fontsource/montserrat/700.css'),
    ]),
  Lora: () =>
    Promise.all([
      import('@fontsource/lora/400.css'),
      import('@fontsource/lora/500.css'),
      import('@fontsource/lora/600.css'),
      import('@fontsource/lora/700.css'),
    ]),
  'Nunito Sans': () =>
    Promise.all([
      import('@fontsource/nunito-sans/400.css'),
      import('@fontsource/nunito-sans/500.css'),
      import('@fontsource/nunito-sans/600.css'),
      import('@fontsource/nunito-sans/700.css'),
    ]),
  'Work Sans': () =>
    Promise.all([
      import('@fontsource/work-sans/400.css'),
      import('@fontsource/work-sans/500.css'),
      import('@fontsource/work-sans/600.css'),
      import('@fontsource/work-sans/700.css'),
    ]),
  'Bebas Neue': () => import('@fontsource/bebas-neue/400.css'),
  Rubik: () =>
    Promise.all([
      import('@fontsource/rubik/400.css'),
      import('@fontsource/rubik/500.css'),
      import('@fontsource/rubik/600.css'),
      import('@fontsource/rubik/700.css'),
    ]),
  Oswald: () =>
    Promise.all([
      import('@fontsource/oswald/400.css'),
      import('@fontsource/oswald/500.css'),
      import('@fontsource/oswald/600.css'),
      import('@fontsource/oswald/700.css'),
    ]),
  Poppins: () =>
    Promise.all([
      import('@fontsource/poppins/400.css'),
      import('@fontsource/poppins/500.css'),
      import('@fontsource/poppins/600.css'),
      import('@fontsource/poppins/700.css'),
    ]),
  Raleway: () =>
    Promise.all([
      import('@fontsource/raleway/400.css'),
      import('@fontsource/raleway/500.css'),
      import('@fontsource/raleway/600.css'),
      import('@fontsource/raleway/700.css'),
    ]),
  Merriweather: () =>
    Promise.all([
      import('@fontsource/merriweather/400.css'),
      import('@fontsource/merriweather/500.css'),
      import('@fontsource/merriweather/600.css'),
      import('@fontsource/merriweather/700.css'),
    ]),
  'PT Serif': () =>
    Promise.all([import('@fontsource/pt-serif/400.css'), import('@fontsource/pt-serif/700.css')]),
  'Cormorant Garamond': () =>
    Promise.all([
      import('@fontsource/cormorant-garamond/400.css'),
      import('@fontsource/cormorant-garamond/500.css'),
      import('@fontsource/cormorant-garamond/600.css'),
      import('@fontsource/cormorant-garamond/700.css'),
    ]),
  'DM Sans': () =>
    Promise.all([
      import('@fontsource/dm-sans/400.css'),
      import('@fontsource/dm-sans/500.css'),
      import('@fontsource/dm-sans/600.css'),
      import('@fontsource/dm-sans/700.css'),
    ]),
  'Libre Baskerville': () =>
    Promise.all([
      import('@fontsource/libre-baskerville/400.css'),
      import('@fontsource/libre-baskerville/700.css'),
    ]),
  'Josefin Sans': () =>
    Promise.all([
      import('@fontsource/josefin-sans/400.css'),
      import('@fontsource/josefin-sans/500.css'),
      import('@fontsource/josefin-sans/600.css'),
      import('@fontsource/josefin-sans/700.css'),
    ]),
  Quicksand: () =>
    Promise.all([
      import('@fontsource/quicksand/400.css'),
      import('@fontsource/quicksand/500.css'),
      import('@fontsource/quicksand/600.css'),
      import('@fontsource/quicksand/700.css'),
    ]),
  'Space Grotesk': () =>
    Promise.all([
      import('@fontsource/space-grotesk/400.css'),
      import('@fontsource/space-grotesk/500.css'),
      import('@fontsource/space-grotesk/600.css'),
      import('@fontsource/space-grotesk/700.css'),
    ]),
};

const loadedFonts = new Set<string>();

function extractFontName(fontFamilyCss: string): string {
  return fontFamilyCss.split(',')[0].trim().replace(/^['"]|['"]$/g, '');
}

export function loadWebFont(fontFamilyCss?: string | null): void {
  if (!fontFamilyCss) return;
  const name = extractFontName(fontFamilyCss);
  if (loadedFonts.has(name)) return;
  const loader = FONT_LOADERS[name];
  if (!loader) return;
  loadedFonts.add(name);
  loader().catch(() => {
    loadedFonts.delete(name);
  });
}
