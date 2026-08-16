import type { NextConfig } from "next";
import createMDX from "@next/mdx";

const githubPagesBasePath = process.env.GITHUB_PAGES === "true" ? "/portfolio" : "";

const nextConfig: NextConfig = {
  output: "export",
  trailingSlash: true,
  basePath: githubPagesBasePath,
  assetPrefix: githubPagesBasePath,
  env: {
    NEXT_PUBLIC_BASE_PATH: githubPagesBasePath,
  },
  images: {
    unoptimized: true,
  },
  pageExtensions: ["js", "jsx", "md", "mdx", "ts", "tsx"],
};

const withMDX = createMDX();

export default withMDX(nextConfig);
