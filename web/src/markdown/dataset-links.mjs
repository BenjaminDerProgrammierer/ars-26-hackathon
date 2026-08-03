export function rewriteDatasetLinks(html, datasetBase, datasetSlugs) {
  return html.replaceAll(/href="([^"]+)"/g, (attribute, link) => {
    const match = link.match(/^([^?#]*)([?#].*)?$/);
    if (!match?.[1] || match[1].startsWith("/") || match[1].includes("\\")) {
      return attribute;
    }

    const normalizedPath = match[1].replace(/^\.\//, "");
    const segments = normalizedPath.split("/");
    let decodedSegments;
    try {
      decodedSegments = segments.map(decodeURIComponent);
    } catch {
      return attribute;
    }
    if (
      decodedSegments.some((segment) => segment === "." || segment === "..")
    ) {
      return attribute;
    }

    const requestedSlug = decodedSegments[0].toLocaleLowerCase("en");
    const targetSlug = [...datasetSlugs].find(
      (slug) => slug.toLocaleLowerCase("en") === requestedSlug,
    );

    if (!targetSlug) {
      return attribute;
    }

    segments[0] = targetSlug;
    const localizedPath = segments.join("/");
    const trailingSlash = localizedPath.endsWith("/") ? "" : "/";
    return `href="${datasetBase}${localizedPath}${trailingSlash}${match[2] ?? ""}"`;
  });
}
