const origin = process.argv[2] ?? "http://localhost:4321";
const startPaths = ["/en/datasets/", "/de/datasets/"];
const htmlQueue = [...startPaths];
const checkedPages = new Set();
const links = new Set();
const failures = [];

function extractLinks(html, pageUrl) {
  for (const match of html.matchAll(/href="([^"]+)"/g)) {
    const href = match[1].replaceAll("&amp;", "&");
    if (
      href.startsWith("#") ||
      href.startsWith("mailto:") ||
      href.startsWith("tel:")
    ) {
      continue;
    }

    const url = new URL(href, pageUrl);
    links.add(url.href);
    if (
      url.origin === origin &&
      /^\/(?:en|de)\/datasets(?:\/|$)/.test(url.pathname) &&
      !checkedPages.has(url.href)
    ) {
      htmlQueue.push(url.href);
    }
  }
}

async function request(url, method = "HEAD") {
  const response = await fetch(url, {
    method,
    redirect: "follow",
    headers: method === "GET" ? { Range: "bytes=0-0" } : undefined,
  });
  if (response.body) {
    await response.body.cancel();
  }
  return response;
}

while (htmlQueue.length > 0) {
  const next = htmlQueue.shift();
  const url = new URL(next, origin);
  url.hash = "";
  if (checkedPages.has(url.href)) {
    continue;
  }

  checkedPages.add(url.href);
  try {
    const response = await fetch(url);
    if (!response.ok) {
      failures.push(`${response.status} ${url.href}`);
      continue;
    }
    extractLinks(await response.text(), url);
  } catch (error) {
    failures.push(`ERROR ${url.href}: ${error.message}`);
  }
}

for (const link of [...links].sort()) {
  const url = new URL(link);
  url.hash = "";
  try {
    let response = await request(url);
    if (response.status === 405) {
      response = await request(url, "GET");
    }
    if (response.status >= 400) {
      failures.push(`${response.status} ${url.href}`);
    }
  } catch (error) {
    failures.push(`ERROR ${url.href}: ${error.message}`);
  }
}

if (failures.length > 0) {
  console.error(failures.join("\n"));
  process.exitCode = 1;
} else {
  console.log(
    `Resolved ${checkedPages.size} dataset pages and ${links.size} displayed links.`,
  );
}
