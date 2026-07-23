export function rewriteDatasetLinks(html, datasetBase, datasetSlugs) {
  return html.replaceAll(/href="([^"]+)"/g, (attribute, link) => {
    const normalizedLink = link.replace(/^\.\//, "");
    const targetSlug = normalizedLink.split("/")[0];

    if (!datasetSlugs.has(targetSlug)) {
      return attribute;
    }

    const trailingSlash = normalizedLink.endsWith("/") ? "" : "/";
    return `href="${datasetBase}${normalizedLink}${trailingSlash}"`;
  });
}
