import localFont from "next/font/local";

import { GeistMono } from "geist/font/mono";
import { GeistPixelSquare } from "geist/font/pixel";

const geistMono = GeistMono;
const geist = localFont({
  src: "../../../node_modules/geist/dist/fonts/geist-sans/Geist-Variable.woff2",
  variable: "--font-geist",
  display: "swap",
});
const inter = localFont({
  src: "../../../node_modules/@fontsource-variable/inter/files/inter-latin-wght-normal.woff2",
  variable: "--font-inter",
  display: "swap",
  preload: false,
});
const notoSans = localFont({
  src: "../../../node_modules/@fontsource-variable/noto-sans/files/noto-sans-latin-wght-normal.woff2",
  variable: "--font-noto-sans",
  display: "swap",
  preload: false,
});
const roboto = localFont({
  src: "../../../node_modules/@fontsource-variable/roboto/files/roboto-latin-wght-normal.woff2",
  variable: "--font-roboto",
  display: "swap",
  preload: false,
});
const outfit = localFont({
  src: "../../../node_modules/@fontsource-variable/outfit/files/outfit-latin-wght-normal.woff2",
  variable: "--font-outfit",
  display: "swap",
  preload: false,
});
const dmSans = localFont({
  src: "../../../node_modules/@fontsource-variable/dm-sans/files/dm-sans-latin-wght-normal.woff2",
  variable: "--font-dm-sans",
  display: "swap",
  preload: false,
});
const nunitoSans = localFont({
  src: "../../../node_modules/@fontsource-variable/nunito-sans/files/nunito-sans-latin-wght-normal.woff2",
  variable: "--font-nunito-sans",
  display: "swap",
  preload: false,
});
const figtree = localFont({
  src: "../../../node_modules/@fontsource-variable/figtree/files/figtree-latin-wght-normal.woff2",
  variable: "--font-figtree",
  display: "swap",
  preload: false,
});
const raleway = localFont({
  src: "../../../node_modules/@fontsource-variable/raleway/files/raleway-latin-wght-normal.woff2",
  variable: "--font-raleway",
  display: "swap",
  preload: false,
});
const publicSans = localFont({
  src: "../../../node_modules/@fontsource-variable/public-sans/files/public-sans-latin-wght-normal.woff2",
  variable: "--font-public-sans",
  display: "swap",
  preload: false,
});
const jetBrainsMono = localFont({
  src: "../../../node_modules/@fontsource-variable/jetbrains-mono/files/jetbrains-mono-latin-wght-normal.woff2",
  variable: "--font-jetbrains-mono",
  display: "swap",
  preload: false,
});
const notoSerif = localFont({
  src: "../../../node_modules/@fontsource-variable/noto-serif/files/noto-serif-latin-wght-normal.woff2",
  variable: "--font-noto-serif",
  display: "swap",
  preload: false,
});
const robotoSlab = localFont({
  src: "../../../node_modules/@fontsource-variable/roboto-slab/files/roboto-slab-latin-wght-normal.woff2",
  variable: "--font-roboto-slab",
  display: "swap",
  preload: false,
});
const merriweather = localFont({
  src: "../../../node_modules/@fontsource-variable/merriweather/files/merriweather-latin-wght-normal.woff2",
  variable: "--font-merriweather",
  display: "swap",
  preload: false,
});
const lora = localFont({
  src: "../../../node_modules/@fontsource-variable/lora/files/lora-latin-wght-normal.woff2",
  variable: "--font-lora",
  display: "swap",
  preload: false,
});
const playfairDisplay = localFont({
  src: "../../../node_modules/@fontsource-variable/playfair-display/files/playfair-display-latin-wght-normal.woff2",
  variable: "--font-playfair-display",
  display: "swap",
  preload: false,
});
export const fontRegistry = {
  geist: {
    label: "Geist",
    font: geist,
  },
  inter: {
    label: "Inter",
    font: inter,
  },
  notoSans: {
    label: "Noto Sans",
    font: notoSans,
  },
  nunitoSans: {
    label: "Nunito Sans",
    font: nunitoSans,
  },
  figtree: {
    label: "Figtree",
    font: figtree,
  },
  roboto: {
    label: "Roboto",
    font: roboto,
  },
  raleway: {
    label: "Raleway",
    font: raleway,
  },
  dmSans: {
    label: "DM Sans",
    font: dmSans,
  },
  publicSans: {
    label: "Public Sans",
    font: publicSans,
  },
  outfit: {
    label: "Outfit",
    font: outfit,
  },
  geistMono: {
    label: "Geist Mono",
    font: geistMono,
  },
  geistPixelSquare: {
    label: "Geist Pixel Square",
    font: GeistPixelSquare,
  },
  jetBrainsMono: {
    label: "JetBrains Mono",
    font: jetBrainsMono,
  },
  notoSerif: {
    label: "Noto Serif",
    font: notoSerif,
  },
  robotoSlab: {
    label: "Roboto Slab",
    font: robotoSlab,
  },
  merriweather: {
    label: "Merriweather",
    font: merriweather,
  },
  lora: {
    label: "Lora",
    font: lora,
  },
  playfairDisplay: {
    label: "Playfair Display",
    font: playfairDisplay,
  },
} as const;

export type FontKey = keyof typeof fontRegistry;

export const fontKeys = Object.keys(fontRegistry) as FontKey[];

export const fontVars = Object.values(fontRegistry)
  .map(({ font }) => font.variable)
  .join(" ");

export const fontOptions = fontKeys.map((key) => ({
  key,
  label: fontRegistry[key].label,
}));
