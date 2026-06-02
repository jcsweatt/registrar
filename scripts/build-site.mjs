import { mkdir, readFile, rm, writeFile } from "node:fs/promises";

const mode = process.argv[2] || "redesign";
const data = JSON.parse(await readFile(new URL("../data/registrar-pages.json", import.meta.url), "utf8"));
const pages = data.pages;
const outRoot = new URL(mode === "current" ? "../current-site/" : "../public/", import.meta.url);
const registrarOrigin = "https://registrar.ucsf.edu";
const commsOrigin = "https://www.ucsf.edu";

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
    const url = href.startsWith("/") ? new URL(href, registrarOrigin) : new URL(href);
    if (url.hostname !== "registrar.ucsf.edu") return href;
    const page = pages.find((candidate) => candidate.path === url.pathname || `${candidate.path}/` === url.pathname);
    return page ? `${page.slug}.html` : url.href;
  } catch {
    return href;
  }
}

function rewriteLinks(html = "") {
  return html.replace(/\s(href)=["']([^"']+)["']/gi, (_match, attr, href) => ` ${attr}="${esc(localHref(href))}"`);
}

function absolutizeAssets(html = "", origin = registrarOrigin) {
  return html
    .replace(/\s(src|poster)=["'](\/[^"']*)["']/gi, (_match, attr, url) => ` ${attr}="${origin}${esc(url)}"`)
    .replace(/\s(srcset)=["']([^"']+)["']/gi, (_match, attr, value) => {
      const rewritten = value
        .split(",")
        .map((part) => {
          const trimmed = part.trim();
          if (!trimmed.startsWith("/")) return trimmed;
          const [url, ...rest] = trimmed.split(/\s+/);
          return [origin + url, ...rest].join(" ");
        })
        .join(", ");
      return ` ${attr}="${esc(rewritten)}"`;
    });
}

function rewriteCurrentPage(page) {
  const full = page.fullHtml || currentTemplate(page);
  return absolutizeAssets(rewriteLinks(full), registrarOrigin)
    .replace(/<base[^>]*>/gi, "")
    .replace(/<title[^>]*>[\s\S]*?<\/title>/i, `<title>${esc(page.title)} | Office of the Registrar</title>`)
    .replace(/<link([^>]+href=["'])\/(sites|themes|modules|core|cdn-cgi)\//gi, `<link$1${registrarOrigin}/$2/`)
    .replace(/<script([^>]+src=["'])\/(sites|themes|modules|core|cdn-cgi)\//gi, `<script$1${registrarOrigin}/$2/`);
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

function commsTemplateSource() {
  return readFile(new URL("../data/communications-page.html", import.meta.url), "utf8");
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
  throw new Error("redesignTemplate requires the Communications template source");
}

const currentCss = `body{margin:0;font-family:Arial,Helvetica,sans-serif;color:#1f1f1f;background:#fff}.site-header{border-bottom:1px solid #ddd;padding:18px 5vw}.brand{font-size:24px;font-weight:700;color:#052049;text-decoration:none}nav{display:flex;gap:18px;flex-wrap:wrap;margin-top:14px}a{color:#006be9}.current-page{max-width:980px;margin:0 auto;padding:36px 5vw;line-height:1.6}img{max-width:100%;height:auto}`;

function registrarResources(page) {
  return `<div class="layout-columns__3 bg-white" style="">
  <h2 class="layout__heading">Registrar Resources</h2>
  <div class="layout__heading-description"><p>${esc(page.summary || "Find registration, records, transcript, calendar, and form information from the Office of the Registrar.")}</p></div>
  <div class="field field-content-wrapper-content field--type-entity-reference-revisions field--label-hidden field__items">
    ${[
      ["accent-blue", "Registration", pages.filter((candidate) => candidate.path.startsWith("/registration")).slice(0, 5)],
      ["accent-purple", "Student Records", pages.filter((candidate) => /transcripts|diplomas|verifications|student-records/.test(candidate.path)).slice(0, 5)],
      ["accent-teal", "Calendars & Forms", pages.filter((candidate) => /calendar|forms|fees|deadlines/.test(candidate.path)).slice(0, 5)],
    ]
      .map(
        ([accent, heading, items]) => `<div class="layout-column"><div class="paragraph paragraph--type--column-content paragraph--view-mode--default"><div class="field field-column-content-content field--type-entity-reference-revisions field--label-hidden field__items"><div class="field__item"><div class="layout-column overlay-gray ${accent}">
      <div class="clearfix text-formatted field field-content-promotional-conten field--type-text-long field--label-hidden field__item"><h3>${heading}</h3><p>${items.map((item) => `<a class="link--cta" href="${item.slug}.html">${esc(item.title)}</a>`).join("<br>")}</p></div>
    </div></div></div></div></div>`
      )
      .join("")}
  </div>
</div>`;
}

function pageForPath(path) {
  return pages.find((page) => page.path.toLowerCase() === path.toLowerCase());
}

function menuSections() {
  const sectionConfig = [
    ["registration", "Registration", ["/registration/summer-2026-registration", "/registration/spring-2026-registration", "/registration/how-register", "/registration/fees", "/registration/paying-fees", "/registration/study-list-filing", "/registration/deadlineshome", "/registration/change-study-list", "/registration/residency", "/registration/withdrawal", "/registration/refunds", "/registration/readmission", "/registration/id-cards", "/registration/intercampus-exchange", "/registration/sf-consortium", "/registration/stanford-exchange", "/registration/reduced-fee-enrollment", "/registration/part-time-enrollment", "/registration/summer-session-info"]],
    ["transcripts", "Transcripts", ["/transcripts/ordering-transcripts", "/transcripts/transcripts-fees", "/transcripts/transcript-request-forms", "/transcripts/transcript-pickup", "/transcripts/transcript-guide-and-grading-key", "/transcripts/catalogarchives"]],
    ["diplomas", "Diplomas", ["/diplomas/diploma-overview", "/diplomas/how-obtain-your-diploma", "/diplomas/diploma-or-certificate-reissue", "/diplomas/diploma-certification-boards", "/diplomas/diploma-mailing-request-form", "/diplomas/access-electronic-systems-after-graduation"]],
    ["verifications", "Verifications", ["/verifications/current-students", "/verifications/alumni", "/verifications/residency", "/verifications/employment-verification"]],
    ["student-records", "Student Records", ["/student-records/name-change", "/student-records/preferred", "/student-records/substitution", "/student-records/examination", "/student-records/disclosure", "/student-records/grades", "/student-records/dns", "/student-records/nondisc", "/student-records/alumni-portal-access"]],
    ["faculty-staff", "Faculty & Staff", ["/faculty-staff/faculty-portal-grading", "/faculty-staff/scheduling", "/faculty-staff/course-evaluations", "/faculty-staff/course-review", "/faculty-staff/degree-management-system", "/faculty-staff/ferpa-privacy", "/faculty-staff/ucsf-general-catalog", "/faculty-staff/student-information-system"]],
    ["new-students", "New Students", ["/new-students/new-students-landing", "/new-students/studentportal", "/new-students/registration", "/new-students/general-catalog", "/new-students/financial-aid", "/new-students/its", "/new-students/food", "/new-students/housing", "/new-students/studenthealth", "/new-students/immunization", "/new-students/shipwaiver", "/new-students/student-disability-services", "/new-students/first-gen", "/new-students/guardian", "/new-students/weid", "/new-students/warnme", "/new-students/library", "/new-students/success", "/new-students/clery-act", "/new-students/tobacco-free-policies", "/new-students/useful-links"]],
  ];

  return sectionConfig.map(([id, title, paths]) => ({
    id,
    title,
    items: paths.map(pageForPath).filter(Boolean),
  }));
}

function registrarDesktopNav() {
  return `<nav aria-label="Main" id="block-ucsf-main-menu-desktop" class="block block-menu navigation menu--main main-nav">
  <ul block="block-ucsf-main-menu-desktop" class="main-nav__menu">
    ${menuSections()
      .map(
        (section) => `<li class="menu-item menu-item--expanded main-nav__submenu-wrapper">
      <button class="main-nav__toggle menu-item-${section.id}" aria-controls="aria-${section.id}-menu" aria-expanded=false>
        ${esc(section.title)}
      </button>
      <div id="aria-${section.id}-menu" aria-labelledby="aria-label-${section.id}-menu" class="main-submenu main-submenu--0" data-level="level-0">
        <button class="menu-item-close" aria-controls="aria-${section.id}-menu" aria-expanded=false>
          Close ${esc(section.title)} menu.
        </button>
        <div data-section="section-${section.id}-menu" class="main-submenu__label main-submenu__label--0">
          <span id="aria-label-${section.id}-menu" class="main-submenu__label-text">${esc(section.title)}</span>
        </div>
        <ul class="main-submenu__menu">
          ${section.items
            .map(
              (item) => `<li class="menu-item">
            <a href="${item.slug}.html"><span>${esc(item.title)}</span></a>
          </li>`
            )
            .join("")}
        </ul>
      </div>
    </li>`
      )
      .join("")}
  </ul>
</nav>`;
}

function registrarMobileNav() {
  return `<nav aria-label="Main" id="block-ucsf-main-menu" class="block block-menu navigation menu--main main-menu--mobile main-nav">
  <ul block="block-ucsf-main-menu" class="menu-parent-wrapper">
    ${menuSections()
      .map(
        (section) => `<li class="menu-item menu-item--expanded">
      <span class="main-navigation__link dropdown-menu__link">${esc(section.title)}</span>
      <ul class="menu">
        ${section.items
          .map(
            (item) => `<li class="menu-item">
          <a href="${item.slug}.html" class="main-navigation__link dropdown-menu__link">${esc(item.title)}</a>
        </li>`
          )
          .join("")}
      </ul>
    </li>`
      )
      .join("")}
  </ul>
</nav>`;
}

function replaceNavigation(template) {
  return template
    .replace(/<nav aria-label="Main"\s+id="block-ucsf-main-menu"[\s\S]*?<\/nav>/, registrarMobileNav())
    .replace(/<nav aria-label="Main"\s+id="block-ucsf-main-menu-desktop"[\s\S]*?<\/nav>/, registrarDesktopNav());
}

function communicationShellPage(template, page) {
  const banner = `<header class="basic-header full-width-page-banner full-width-has-image ">
    <figure>
      <picture class="field field-banner-image field--type-entity-reference field--label-hidden field__item"><img loading="eager" src="${commsOrigin}/sites/default/files/styles/full_width_page_banner__image/public/2022-07/Bay-Area-Science-Festival-2018.jpg" width="795" height="530" alt="UCSF campus event banner" class="element-fade"></picture>
    </figure>
    <div class="full-width-page-banner__header">
      <h1 class="full-width-page__header-title"><span class="field field--name-title field--type-string field--label-hidden">${esc(page.title === "Welcome" ? "Office of the Registrar" : page.title)}</span></h1>
      <div class="field field-banner-description field--type-text-long field--label-hidden"><p class="null">${esc(page.summary || "The Office of the Registrar supports UCSF learners with registration, student records, transcripts, diplomas, verifications, calendars, forms, and academic services.")}</p></div>
    </div>
  </header>`;
  const body = `<div class="full-width-page-wrapper">
  <main class="main">
    <a id="main-content" tabindex="-1"></a>
    <div class="main-content full-width-page">
      <div class="field field-content-panel field--type-entity-reference-revisions field--label-hidden field__items">
        <div class="field__item">${registrarResources(page)}</div>
        <div class="field__item"><div class="paragraph-text-block">${rewriteLinks(page.articleHtml || page.bodyHtml)}</div></div>
      </div>
    </div>
  </main>
</div>`;
  const contentStart = template.indexOf('  <header class="basic-header');
  const contentEnd = template.indexOf('  <div class="footer-ctas-wrapper"', contentStart);
  if (contentStart === -1 || contentEnd === -1) {
    throw new Error("Could not locate Communications page content region");
  }
  const withRegistrarContent = `${template.slice(0, contentStart)}${banner}\n\n${body}\n${template.slice(contentEnd)}`;
  return absolutizeAssets(
    replaceNavigation(withRegistrarContent)
      .replace(/<title[^>]*>[\s\S]*?<\/title>/i, `<title>${esc(page.title)} | UC San Francisco</title>`)
      .replace(/Office of Communications/g, "Office of the Registrar")
      .replace(/<meta property="og:title" content="[^"]*"/i, `<meta property="og:title" content="${esc(page.title)}"`)
      .replace(/\s(href)=["']\/(?!\/)([^"']*)["']/gi, (_match, attr, url) => ` ${attr}="${commsOrigin}/${esc(url)}"`),
    commsOrigin
  );
}

await rm(outRoot, { recursive: true, force: true });
await mkdir(outRoot, { recursive: true });
if (mode === "current") {
  await writeFile(new URL("styles.css", outRoot), currentCss);
}
const commsTemplate = mode === "redesign" ? await commsTemplateSource() : "";
for (const page of pages) {
  await writeFile(new URL(`${page.slug}.html`, outRoot), mode === "current" ? rewriteCurrentPage(page) : communicationShellPage(commsTemplate, page));
}
console.log(`Built ${pages.length} ${mode} pages in ${outRoot.pathname}`);
