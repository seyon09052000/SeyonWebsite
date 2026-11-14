# Putting the website live (Render + a GoDaddy domain)

The site is a small Node.js server that stores its data in files, so it needs a host with a **permanent disk**.
Render (render.com) does this and connects straight to the private GitHub repo.

## 1. Create the service on Render
1. Sign up at render.com and connect your GitHub account (allow it to read the `SeyonWebsite` repo).
2. **New +  >  Blueprint**, pick the `SeyonWebsite` repo. Render reads `render.yaml` and creates the web service plus a 1 GB disk.
3. When asked, set **ADMIN_PASSWORD** to a long password only you know. This protects `/admin`.
   Optional: **NOTIFY_WEBHOOK_URL** (Slack/Discord/Zapier address) for new-lead alerts.
4. The Starter plan is needed for the disk (free plans lose data on restart). Approve and wait for the first deploy.
5. Open the `https://seyon-website.onrender.com` address Render shows and check the site.

## 2. Connect your GoDaddy domain
1. In Render: the service > **Settings > Custom Domains > Add**. Add both `yourdomain.com` and `www.yourdomain.com`.
2. Render shows the DNS records to create. In GoDaddy: **My Products > your domain > DNS > Manage DNS**:
   - **www**: a `CNAME` record pointing to `seyon-website.onrender.com`.
   - **@** (the bare domain): the `A` record Render shows (remove GoDaddy's default parked `A` record first).
3. Wait 10 to 60 minutes. Render then issues the free HTTPS certificate on its own.
4. In Render, set the www or non-www version as the main one (the other redirects).

## 3. After it is live
- Log in at `/admin` (any username, your ADMIN_PASSWORD), then set each product's status and links.
- Content edited in `/admin` is saved on the disk and is **not** overwritten by later deploys.
  (Changes to `data/*.json` in GitHub only apply on the very first start with an empty disk.)
- Data (enquiries, waitlist, products) and daily backups live on the disk at `/var/data`.
- Add the live address to Google Search Console and submit `/sitemap.xml`.

## Environment variables
| Variable | Purpose |
|---|---|
| `NODE_ENV=production` | Turns on HTTPS headers and trusts the host's proxy |
| `DATA_DIR=/var/data` | Where editable data and backups are kept (the permanent disk) |
| `ADMIN_PASSWORD` | Password for `/admin` |
| `NOTIFY_WEBHOOK_URL` | Optional: lead alerts |
| `PORT` | Set by Render automatically |
