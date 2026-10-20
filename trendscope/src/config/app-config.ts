import packageJson from "../../package.json";

const currentYear = new Date().getFullYear();

export const APP_CONFIG = {
  name: "TrendScope",
  version: packageJson.version,
  copyright: `© ${currentYear}, TrendScope.`,
  meta: {
    title: "TrendScope: Open Source Admin Dashboard with shadcn/ui",
    description:
      "Painel de análise para criadores no YouTube e TikTok.",
  },
};
