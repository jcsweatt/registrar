import { mkdir, readFile, rm, writeFile } from "node:fs/promises";

const mode = process.argv[2] || "redesign";
const data = JSON.parse(await readFile(new URL("../data/registrar-pages.json", import.meta.url), "utf8"));
const pages = data.pages;
const outRoot = new URL(mode === "current" ? "../current-site/" : "../public/", import.meta.url);

function esc(value = "") {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function localHref(href = "") {
  try {
    if (href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("tel:")) return href;
    const url = href.startsWith("/") ? new URL(href, "https://registrar.ucsf.edu") : new URL(href);
    if (url.hostname !== "registrar.ucsf.edu") return href;
    const page = pages.find((candidate) => candidate.path === url.pathname || `${candidate.path}/` === url.pathname);
    return page ? `${page.slug}.html` : href;
  } catch {
    return href;
  }
}

function rewriteLinks(html = "") {
  return html.replace(/href=["']([^"']+)["']/gi, (_match, href) => `href="${esc(localHref(href))}"`);
}

function navItems() {
  const priority = [
    "/",
    "/registration",
    "/course-catalog",
    "/student-records",
    "/transcripts",
    "/calendars",
    "/forms",
    "/contact-us",
  ];
  const selected = priority.map((path) => pages.find((page) => page.path === path)).filter(Boolean);
  return selected.length >= 4 ? selected : pages.slice(0, 8);
}

function currentTemplate(page) {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${esc(page.title)} | Office of the Registrar</title>
  <link rel="stylesheet" href="styles.css">
</head>
<body>
  <header class="site-header">
    <a class="brand" href="index.html">UCSF Office of the Registrar</a>
    <nav>${navItems().map((item) => `<a href="${item.slug}.html">${esc(item.title)}</a>`).join("")}</nav>
  </header>
  <main class="current-page">
    ${rewriteLinks(page.bodyHtml)}
  </main>
</body>
</html>`;
}

function categoryFor(page) {
  const path = page.path.toLowerCase();
  if (/calendar|catalog|course|schedule/.test(path)) return "Academics";
  if (/registration|enroll|degree|diploma|record|transcript|verification/.test(path)) return "Student Records";
  if (/form|fee|policy|privacy|ferpa/.test(path)) return "Forms & Policies";
  if (/contact|staff|about/.test(path)) return "About";
  return "Registrar Services";
}

function cardGrid(activePage) {
  return pages
    .filter((page) => page.slug !== activePage.slug)
    .slice(0, 12)
    .map((page) => `<article class="link-card">
      <span>${esc(categoryFor(page))}</span>
      <h3><a href="${page.slug}.html">${esc(page.title)}</a></h3>
      <p>${esc(page.summary || "Registrar information and services.")}</p>
    </article>`)
    .join("");
}

function redesignTemplate(page) {
  const isHome = page.slug === "index";
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${esc(page.title)} | UCSF Office of the Registrar</title>
  <link rel="stylesheet" href="styles.css">
</head>
<body>
  <header class="ucsf-header">
    <div class="topbar"><a href="https://www.ucsf.edu/">UCSF</a><a href="contact-us.html">Contact</a></div>
    <div class="masthead">
      <a class="identity" href="index.html">Office of the Registrar</a>
      <nav aria-label="Primary">${navItems().map((item) => `<a href="${item.slug}.html">${esc(item.title)}</a>`).join("")}</nav>
    </div>
  </header>
  <main>
    <section class="hero">
      <div>
        <p class="eyebrow">UCSF Education Services</p>
        <h1>${esc(page.title)}</h1>
        <p>${esc(page.summary || "Registrar services, records, registration, courses, calendars, forms, and academic information for UCSF learners.")}</p>
      </div>
    </section>
    ${isHome ? `<section class="feature-band">
      <div><h2>Registrar Services</h2><p>Find registration, course, records, transcript, calendar, and form information from the current Registrar site.</p></div>
      <div class="quick-links">${navItems().slice(1).map((item) => `<a href="${item.slug}.html">${esc(item.title)}</a>`).join("")}</div>
    </section>` : ""}
    <div class="content-layout">
      <aside>
        <h2>Explore</h2>
        ${navItems().map((item) => `<a href="${item.slug}.html">${esc(item.title)}</a>`).join("")}
      </aside>
      <article class="content">
        ${rewriteLinks(page.bodyHtml)}
      </article>
    </div>
    <section class="related">
      <h2>Related Registrar Pages</h2>
      <div class="card-grid">${cardGrid(page)}</div>
    </section>
  </main>
  <footer>UCSF Office of the Registrar</footer>
</body>
</html>`;
}

const currentCss = `body{margin:0;font-family:Arial,Helvetica,sans-serif;color:#1f1f1f;background:#fff}.site-header{border-bottom:1px solid #ddd;padding:18px 5vw}.brand{font-size:24px;font-weight:700;color:#052049;text-decoration:none}nav{display:flex;gap:18px;flex-wrap:wrap;margin-top:14px}a{color:#006be9}.current-page{max-width:980px;margin:0 auto;padding:36px 5vw;line-height:1.6}img{max-width:100%;height:auto}`;

const redesignCss = `:root{--blue:#052049;--cyan:#00aeef;--green:#6ea400;--gold:#f2a900;--ink:#1b1f24;--muted:#5d6874;--line:#d9e1e8;--bg:#f6f8fa}*{box-sizing:border-box}body{margin:0;font-family:Arial,Helvetica,sans-serif;color:var(--ink);background:#fff}a{color:#006be9}.ucsf-header{border-top:6px solid var(--cyan);background:#fff}.topbar{display:flex;justify-content:space-between;padding:8px 6vw;background:var(--blue)}.topbar a{color:#fff;text-decoration:none;font-weight:700}.masthead{display:flex;align-items:flex-end;justify-content:space-between;gap:24px;padding:28px 6vw;border-bottom:1px solid var(--line)}.identity{font-size:30px;line-height:1.1;color:var(--blue);font-weight:800;text-decoration:none}.masthead nav{display:flex;gap:18px;flex-wrap:wrap}.masthead nav a{text-decoration:none;color:var(--ink);font-weight:700}.hero{min-height:330px;display:grid;align-items:end;padding:64px 6vw 42px;background:linear-gradient(135deg,var(--blue),#005581 55%,#0085ad);color:#fff}.hero div{max-width:880px}.eyebrow{text-transform:uppercase;letter-spacing:.08em;font-weight:800;color:#b7e4f5}.hero h1{font-size:clamp(38px,7vw,76px);line-height:.98;margin:10px 0 18px}.hero p{font-size:20px;line-height:1.5;max-width:760px}.feature-band{display:grid;grid-template-columns:minmax(0,1fr) minmax(280px,520px);gap:36px;padding:42px 6vw;background:var(--gold);color:#191919}.feature-band h2{font-size:34px;margin:0 0 10px}.quick-links{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}.quick-links a{background:#fff;color:var(--blue);font-weight:800;text-decoration:none;padding:14px 16px;border-left:5px solid var(--green)}.content-layout{display:grid;grid-template-columns:280px minmax(0,900px);gap:48px;align-items:start;padding:54px 6vw}aside{position:sticky;top:18px;border-top:6px solid var(--green);background:var(--bg);padding:22px}aside h2{margin:0 0 14px;font-size:20px}aside a{display:block;padding:10px 0;border-top:1px solid var(--line);font-weight:700;text-decoration:none}.content{font-size:18px;line-height:1.65}.content h1:first-child{display:none}.content h2{font-size:32px;line-height:1.15;color:var(--blue);margin-top:34px}.content img{max-width:100%;height:auto}.related{padding:48px 6vw 70px;background:var(--bg)}.related>h2{font-size:34px;margin-top:0}.card-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:18px}.link-card{background:#fff;border:1px solid var(--line);border-radius:6px;padding:20px;min-height:190px}.link-card span{color:var(--green);font-weight:800;text-transform:uppercase;font-size:12px}.link-card h3{font-size:21px;line-height:1.2}.link-card a{text-decoration:none;color:var(--blue)}.link-card p{color:var(--muted);line-height:1.45}footer{padding:32px 6vw;background:var(--blue);color:#fff;font-weight:800}@media(max-width:820px){.masthead{align-items:flex-start;flex-direction:column}.feature-band,.content-layout{grid-template-columns:1fr}.card-grid{grid-template-columns:1fr}.hero h1{font-size:42px}aside{position:static}.quick-links{grid-template-columns:1fr}}`;

await rm(outRoot, { recursive: true, force: true });
await mkdir(outRoot, { recursive: true });
await writeFile(new URL("styles.css", outRoot), mode === "current" ? currentCss : redesignCss);
for (const page of pages) {
  await writeFile(new URL(`${page.slug}.html`, outRoot), mode === "current" ? currentTemplate(page) : redesignTemplate(page));
}
console.log(`Built ${pages.length} ${mode} pages in ${outRoot.pathname}`);
