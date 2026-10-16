# Household privacy checklist

Most of this needs no server. It's settings on devices and accounts that can be done today. The [lab section](#after-the-lab-is-up) unlocks as the roadmap phases land.

Menu names drift between OS versions and model years. If a path doesn't match, search the device's settings for the setting's name.

---

## Do now (no lab needed)

### Windows 11 (2 laptops + desktop)
- [ ] Settings → Privacy & security → General: turn off **"Let apps show me personalized ads by using my advertising ID"** and the other toggles on that page
- [ ] Settings → Privacy & security → Diagnostics & feedback: turn off **Optional diagnostic data** and **Tailored experiences**
- [ ] Settings → Personalization → Start: turn off **"Show recommendations for tips, shortcuts, new apps, and more"**

### Firefox
- [ ] Settings → Privacy & Security → Enhanced Tracking Protection: **Strict**. If a site breaks, click the shield icon in the address bar to turn it off for that site only.
- [ ] Settings → Privacy & Security → Website Privacy Preferences: tick **"Tell websites not to sell or share my data"** (Global Privacy Control, a legal opt-out in many states)
- [ ] Adblock Plus settings: turn off **Allow Acceptable Ads**
- [ ] Settings → Privacy & Security → DNS over HTTPS: leave it on **Default Protection** (or Off). "Increased" or "Max" would bypass Pi-hole once it's running.

### Chrome and Edge (Chromebooks, plus any PC that uses them)
- [ ] Chrome: Settings → Privacy and security → Third-party cookies → **Block third-party cookies**
- [ ] Chrome: install **uBlock Origin Lite** (blocks ads and trackers) and **Privacy Badger** (also sends Global Privacy Control, which Chrome lacks)
- [ ] Edge: Settings → Privacy, search, and services → Tracking prevention → **Strict**
- [ ] Secure DNS: leave it on **"With your current service provider"** so Pi-hole still works later, rather than picking Google or Cloudflare.

### iPhones (3) and iPad
- [ ] Settings → Privacy & Security → Tracking: turn off **"Allow Apps to Request to Track"**
- [ ] Settings → Privacy & Security → Apple Advertising: turn off **Personalized Ads**
- [ ] Settings → Apps → Safari (older iOS: Settings → Safari):
  - [ ] **Prevent Cross-Site Tracking**: on
  - [ ] **Hide IP Address**: From Trackers
  - [ ] Advanced → **Advanced Tracking and Fingerprinting Protection**: All Browsing
- [ ] Settings → Apps → Mail → Privacy Protection: turn on **Protect Mail Activity**, which blocks the invisible tracking pixels in emails
- [ ] Install a Safari content blocker (AdGuard, 1Blocker or Wipr), then enable it under Safari → Extensions
- [ ] If you pay for iCloud+: use **Hide My Email** for new sign-ups (Settings → your name → iCloud → Hide My Email)

### Chromebooks (2)
- [ ] Do the Chrome steps above
- [ ] ChromeOS Settings → Security and privacy → **Use secure DNS**: leave it on your current service provider (same reason as above)

### Samsung TVs (2)
Usually Settings → General & Privacy → Terms & Privacy. On older models, try Settings → Support → Terms & Policy.
- [ ] **Viewing Information Services**: off. It recognizes what's on screen, including from the HDMI inputs, and reports it.
- [ ] **Interest-Based Advertisement**: off
- [ ] **Voice Recognition Services**: off, unless you use voice control

### Online accounts
- [ ] **Google** ([myadcenter.google.com](https://myadcenter.google.com)): turn off **Personalized ads**. In My Activity, set Web & App Activity to auto-delete.
- [ ] **Meta** (Facebook/Instagram): Accounts Center → Your information and permissions → **Your activity off Meta technologies**: clear previous activity and disconnect future activity. This cuts the link from tracking pixels on other sites to your account.
- [ ] **Amazon** ([amazon.com/adprefs](https://www.amazon.com/adprefs)): turn off interest-based ads

### Data brokers
- [ ] **California residents:** file one request through [DROP](https://www.cppa.ca.gov/data_brokers/) to reach every registered data broker
- [ ] **Elsewhere:** a paid removal service (DeleteMe, Optery, Incogni) files requests broker by broker, or you can do it by hand with their free reports

---

## After the lab is up

### Phase 1: Pi-hole on `beacon`
- [ ] Router DHCP hands out Pi-hole as the only DNS server
- [ ] If the router allows it, block outbound DNS (port 53) from every device except Pi-hole. This catches TVs and apps with a hard-coded DNS server.
- [ ] Watch the query log for a week and allowlist anything the household actually needs
- [ ] Tailscale admin console → DNS: use Pi-hole as the nameserver, so blocking follows the phones away from home

### Phase 4: Email aliases on our own domain
- [ ] Once the domain is on Cloudflare, enable **Email Routing** with a catch-all forward to your real inbox
- [ ] Sign up for each site with its own address, e.g. `shop-target@<domain>`. When an address gets spam, you know who leaked or sold it. Block that one alias and move on.

---

## Habits

- **Sign up with an alias,** not your real email, and skip "Sign in with Google/Facebook" buttons. They link the site to your main account. "Sign in with Apple" with Hide My Email is the exception.
- **Check sensitive sites before trusting them.** Before entering health, money or legal information on a site you haven't used, scan it with [Blacklight](https://themarkup.org/blacklight). If it shows session recording or key logging, don't type anything you wouldn't want recorded.
- **Test your browser's fingerprint** with [Cover Your Tracks](https://coveryourtracks.eff.org) after changing settings.

## Check-ups

| How often | What |
|---|---|
| Monthly | Pi-hole dashboard: top domains per device. Look for a device that's suddenly chatty. |
| Every few months | Re-check phone and TV settings after big OS updates, which sometimes switch things back on |
| Yearly | Re-file data broker removals (outside California; DROP repeats automatically) |

## Device tracker

Fill in owners and the date each device was done.

| Device | Owner | "Do now" done |
|---|---|---|
| Win11 desktop | | |
| Win11 laptop 1 | | |
| Win11 laptop 2 | | |
| iPhone 1 | | |
| iPhone 2 | | |
| iPhone 3 | | |
| iPad | | |
| Chromebook 1 | | |
| Chromebook 2 | | |
| Samsung TV 1 | | |
| Samsung TV 2 | | |
