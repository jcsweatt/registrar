import { mkdir, writeFile } from "node:fs/promises";

const startUrl = "https://registrar.ucsf.edu/";
const origin = new URL(startUrl).origin;
const maxPages = Number(process.env.MAX_PAGES || 120);
const outDir = new URL("../data/", import.meta.url);

const seen = new Set();
const queued = [startUrl];
const pages = [];

function decodeEntities(value = "") {
  return value
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&#39;/g, "'");
}

function cleanHtml(html = "") {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, "")
    .replace(/\s(?:class|id|data-[\w-]+|style|onclick)="[^"]*"/gi, "")
    .replace(/\s(?:class|id|data-[\w-]+|style|onclick)='[^']*'/gi, "")
    .replace(/\s{2,}/g, " ")
    .trim();
}

function textOnly(html = "") {
  return decodeEntities(html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim());
}

function extractFirst(html, regex) {
  const match = html.match(regex);
  return match ? decodeEntities(match[1].replace(/<[^>]+>/g, "").trim()) : "";
}

function isSkippable(url) {
  return (
    url.hostname !== "registrar.ucsf.edu" ||
    /\.(pdf|docx?|xlsx?|pptx?|zip|png|jpe?g|gif|svg|webp|ico)$/i.test(url.pathname) ||
    url.pathname.startsWith("/search") ||
    url.pathname.startsWith("/user") ||
    url.pathname.startsWith("/sites/")
  );
}

function normalizeUrl(href, base) {
  try {
    const url = new URL(href, base);
    url.hash = "";
    url.search = "";
    if (url.pathname.endsWith("/") && url.pathname !== "/") {
      url.pathname = url.pathname.slice(0, -1);
    }
    return isSkippable(url) ? "" : url.href;
  } catch {
    return "";
  }
}

function extractMain(html) {
  const main = html.match(/<main[\s\S]*?<\/main>/i);
  if (main) return main[0];
  const content = html.match(/<div[^>]+(?:id="main-content"|class="[^"]*main-content[^"]*")[^>]*>[\s\S]*?<\/div>/i);
  return content ? content[0] : html.match(/<body[\s\S]*?<\/body>/i)?.[0] || html;
}

function slugFor(url) {
  const { pathname } = new URL(url);
  if (pathname === "/") return "index";
  return pathname.replace(/^\/|\/$/g, "").replace(/[^a-z0-9]+/gi, "-").toLowerCase();
}

async function fetchPage(url) {
  const response = await fetch(url, {
    headers: {
      "User-Agent": "Codex registrar redesign content capture (+https://github.com/jcsweatt/registrar)",
    },
  });
  if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
  return response.text();
}

while (queued.length && pages.length < maxPages) {
  const url = queued.shift();
  if (!url || seen.has(url)) continue;
  seen.add(url);

  try {
    const html = await fetchPage(url);
    const mainHtml = cleanHtml(extractMain(html));
    const title = extractFirst(html, /<title[^>]*>([\s\S]*?)<\/title>/i).replace(/\s*\|\s*Office of the Registrar\s*$/i, "");
    const h1 = extractFirst(mainHtml, /<h1[^>]*>([\s\S]*?)<\/h1>/i) || title || "Office of the Registrar";
    const summary = textOnly(mainHtml).split(". ").slice(0, 2).join(". ").slice(0, 240);
    const links = [...html.matchAll(/<a[^>]+href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi)]
      .map(([, href, label]) => ({
        href: normalizeUrl(href, url),
        label: textOnly(label),
      }))
      .filter((link) => link.href && link.label && !/^(log in|skip to|menu|search)$/i.test(link.label));

    for (const link of links) {
      if (!seen.has(link.href) && !queued.includes(link.href) && queued.length + pages.length < maxPages * 2) {
        queued.push(link.href);
      }
    }

    pages.push({
      url,
      path: new URL(url).pathname,
      slug: slugFor(url),
      title: h1,
      pageTitle: title,
      summary,
      bodyHtml: mainHtml,
      links,
    });
    console.log(`captured ${pages.length}: ${url}`);
  } catch (error) {
    console.error(`failed ${url}: ${error.message}`);
  }
}

await mkdir(outDir, { recursive: true });
await writeFile(new URL("registrar-pages.json", outDir), JSON.stringify({ source: origin, capturedAt: new Date().toISOString(), pages }, null, 2));
console.log(`Wrote ${pages.length} pages to data/registrar-pages.json`);
