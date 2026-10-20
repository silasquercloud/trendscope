import packageJson from "../../package.json";

const currentYear = new Date().getFullYear();

export const APP_CONFIG = {
  name: "TrendScope",
  version: packageJson.version,
  copyright: `© ${currentYear}, TrendScope.`,
  meta: {
    title: "TrendScope — Creator Studio",
    description: "Painel de análise para criadores no YouTube e TikTok.",
  },
};
