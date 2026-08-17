const publicAssetBasePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

/** Prefix a public asset path with the deploy basePath (e.g. /portfolio) when set. */
export function assetPath(src: string): string {
  if (
    !publicAssetBasePath ||
    !src.startsWith("/") ||
    src.startsWith("//") ||
    src.startsWith(`${publicAssetBasePath}/`)
  ) {
    return src;
  }
  return `${publicAssetBasePath}${src}`;
}
