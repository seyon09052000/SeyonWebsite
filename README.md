# Seyon Solutions website

Zero-dependency Node site. Run `node server.js`, then open http://localhost:4000 (set `PORT` to change). Restart the server after editing `server.js`; HTML, CSS, JS and data edits show on refresh.

## Where things live
| What | File |
|---|---|
| Company text, phone numbers, WhatsApp, email | `data/site.json` |
| Products, features, FAQs, status, links | `data/products.json` (or edit in `/admin`) |
| Enquiries and waitlist sign-ups | `data/submissions/*.json` (also visible in `/admin`) |
| Pages | `public/*.html` (home, products, product, about, contact, privacy, terms, 404) |

## Admin
`/admin` uses HTTP Basic auth (any username). Set your own password with the `ADMIN_PASSWORD` environment variable. Without it, a random one is saved in `data/.admin-password` and printed at startup.

## Notifications for new leads
Every enquiry and waitlist sign-up is printed to the server log. To also get it in Slack, Discord, Zapier, Make or similar, set `NOTIFY_WEBHOOK_URL` to the webhook address. The server posts JSON `{ "text": "...", "content": "..." }`.

## Backups
On start and every 24 hours the `data/` folder is copied to `backups/<timestamp>/` (the admin password file is left out). The newest 14 are kept. Copy `backups/` somewhere off the server too.

## Before going public
- [ ] Set each product's status and its app/demo/download/docs links in `/admin`.
- [ ] Set a strong `ADMIN_PASSWORD`.
- [ ] Serve the site over HTTPS (host or reverse proxy with a certificate); sitemap and canonical links use the host name of the request.
- [ ] Have the Privacy Policy and Terms reviewed by a lawyer.
- [ ] Add real product screenshots to `public/assets/products/<slug>/` and list them in `screenshots` in `products.json`.
- [ ] Add real testimonials or case studies, and pricing guidance, when you have them.
