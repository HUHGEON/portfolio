"use client";

import { createContext, type ReactNode, useContext, useEffect, useState } from "react";

type PortfolioViewportContextValue = {
  occludedLeft: number;
  ready: boolean;
};

type PortfolioViewportProviderProps = {
  children: ReactNode;
};

const PortfolioViewportContext = createContext<PortfolioViewportContextValue>({
  occludedLeft: 0,
  ready: false,
});

const EXPANDED_SIDEBAR_OCCLUSION = 232;

export function PortfolioViewportProvider({
  children,
}: PortfolioViewportProviderProps) {
  const [isSidebarVisible, setIsSidebarVisible] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(min-width: 1024px)");
    const updateSidebarVisibility = () => {
      setIsSidebarVisible(mediaQuery.matches);
      setReady(true);
    };

    updateSidebarVisibility();
    mediaQuery.addEventListener("change", updateSidebarVisibility);

    return () => mediaQuery.removeEventListener("change", updateSidebarVisibility);
  }, []);

  return (
    <PortfolioViewportContext.Provider
      value={{
        occludedLeft: isSidebarVisible ? EXPANDED_SIDEBAR_OCCLUSION : 0,
        ready,
      }}
    >
      {children}
    </PortfolioViewportContext.Provider>
  );
}

export function usePortfolioViewport() {
  return useContext(PortfolioViewportContext);
}
