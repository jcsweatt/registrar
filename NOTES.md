# Redesign Notes

## Reference Structure Used

The Office of Communications page was used as a structural and layout reference only. The redesigned Registrar site uses a UCSF-style institutional top bar, department masthead, large introductory hero, prominent service navigation, sidebar exploration, main content column, and related-page card sections.

## Registrar Content Mapping

Registrar content was grouped into service-oriented sections:

- Registration pages map to primary service navigation and related registration cards.
- Transcripts, diplomas, verifications, and student-record pages map to a Student Records service family.
- Academic calendar, deadlines, course, catalog, and fee pages map to Academics or Registrar Services depending on page path.
- Faculty/Staff and New Students pages remain preserved as individual pages and are surfaced through related cards.
- Forms and policy-oriented pages map to Forms & Policies.

Pages that did not map cleanly to a small Office of Communications-style hierarchy were preserved as individual static pages and exposed through related-page cards rather than forced into a misleading navigation bucket.

## Internal Links

Internal Registrar links were rewritten to point to the generated static HTML page when the target page was captured. External links and uncaptured document links remain as their original URLs.

## Capture Limitations

The capture was a bounded crawl of 120 same-domain Registrar pages starting from the homepage. It intentionally skipped search, login, system, and static asset paths. Some document-style Drupal URLs were captured as HTML wrapper pages when the live site exposed them that way. Binary PDF and document files were not mirrored; their links remain pointed at the live Registrar site. One Cloudflare email-protection endpoint returned `404` and was not included.
