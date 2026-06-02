# UCSF Office of the Registrar Redesign

This repository contains a development recreation and redesign of the UCSF Office of the Registrar website.

## Current Registrar Site Capture

The live Registrar site at <https://registrar.ucsf.edu/> was crawled as the source of truth for content. The crawl captured 120 same-domain pages, including the homepage and major Registration, Transcripts, Diplomas, Verifications, Student Records, Faculty/Staff, New Students, Academic Calendar, Forms, Fees, and deadline pages.

Captured source data lives in `data/registrar-pages.json`. A plain static recreation of the captured current site lives in `current-site/`.

The crawl was bounded and did not mirror every binary asset. It skipped obvious external, search, login, system, and static asset URLs. One Cloudflare email-protection URL returned `404` and was not captured.

## Redesign Branch

The redesigned development version is on:

`dev-redesign-office-of-communications-structure`

The redesign uses the Registrar content captured from the live site and adapts it into a UCSF Office of Communications-inspired structure: institutional top bar, large department hero, prominent service navigation, sidebar exploration, content body, and related page cards.

## Local Preview

To preview the current-site recreation:

```sh
/Applications/Codex.app/Contents/Resources/node scripts/build-site.mjs current
python3 -m http.server 4173
```

Then open <http://localhost:4173/current-site/>.

To preview the redesigned development site from the redesign branch:

```sh
/Applications/Codex.app/Contents/Resources/node scripts/build-site.mjs redesign
python3 -m http.server 4173
```

Then open <http://localhost:4173/public/>.

## Assumptions and Limitations

- The live Registrar site is treated as the source of truth for text, headings, links, and navigation.
- The UCSF Office of Communications page is treated as a structure and design reference only.
- The development site is static HTML/CSS generated from captured Registrar page data.
- Some embedded Drupal behaviors, forms, scripts, and protected email-obfuscation behavior are not reproduced.
- Binary documents linked from Registrar pages are preserved as outbound links when they were not practical to mirror as static files.
