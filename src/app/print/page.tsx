import type { Metadata } from "next";
import { PrintPortfolio } from "@/components/pages/print/print-portfolio";
import { defaultLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";

export const metadata: Metadata = {
  title: "허건 포트폴리오 (PDF)",
  robots: { index: false, follow: false },
};

export default function PrintPage() {
  return (
    <>
      {/* the PDF is always the light edition, whatever theme the viewer picked */}
      <script
        dangerouslySetInnerHTML={{
          __html: "document.documentElement.classList.remove('dark')",
        }}
      />
      <PrintPortfolio dictionary={getDictionary(defaultLocale)} />
    </>
  );
}
