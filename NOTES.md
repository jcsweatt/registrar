# Redesign Notes

## Reference Structure Used

The Office of Communications page was used as the structural and layout reference. The redesigned Registrar site keeps the Communications-style UCSF header, navigation behavior, full-width banner, content-panel layout, and footer shell, then replaces the Communications page title, intro text, resource panels, and body content with Registrar content.

## Registrar Content Mapping

Registrar content was grouped into service-oriented sections:

- Registration pages map to primary service navigation and related registration cards.
- Transcripts, diplomas, verifications, and student-record pages map to a Student Records service family.
- Academic calendar, deadlines, course, catalog, and fee pages map to Academics or Registrar Services depending on page path.
- Faculty/Staff and New Students pages remain preserved as individual pages and are surfaced through related cards.
- Forms and policy-oriented pages map to Forms & Policies.

Pages that did not map cleanly to the Communications page structure were preserved as individual static pages. Each page uses the same Communications shell and receives Registrar-specific resource panels plus the captured Registrar page body.

## Internal Links

Internal Registrar links were rewritten to point to the generated static HTML page when the target page was captured. External links and uncaptured document links remain as their original URLs.

## Capture Limitations

The capture was a bounded crawl of 120 same-domain Registrar pages starting from the homepage. It intentionally skipped search, login, system, and static asset paths. Some document-style Drupal URLs were captured as HTML wrapper pages when the live site exposed them that way. Binary PDF and document files were not mirrored; their links remain pointed at the live Registrar site. One Cloudflare email-protection endpoint returned `404` and was not included.
