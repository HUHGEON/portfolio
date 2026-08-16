import type { ReactNode } from "react";
import { PortfolioFrame } from "@/components/shell/portfolio-frame";
import { defaultLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";

type PortfolioRootProps = {
  children: ReactNode;
};

export function PortfolioRoot({ children }: PortfolioRootProps) {
  const dictionary = getDictionary(defaultLocale);

  return (
    <PortfolioFrame
      navigation={dictionary.nav}
      profile={dictionary.profile}
      linkLabels={dictionary.home}
      projects={dictionary.projects}
    >
      {children}
    </PortfolioFrame>
  );
}
