# HKI Parcels Card

[![Version](https://img.shields.io/badge/version-v1.5.0b2-blue?style=flat-square)](https://github.com/jonisnet/hki-parcels-card/releases/latest)
[![HACS](https://img.shields.io/badge/HACS-Custom-orange?style=flat-square)](https://hacs.xyz)
[![License](https://img.shields.io/badge/license-MIT-green?style=flat-square)](https://github.com/jonisnet/hki-parcels-card/blob/main/LICENSE)
[![HA](https://img.shields.io/badge/Home%20Assistant-2026.7%2B-41bdf5?style=flat-square)](https://www.home-assistant.io)
[![Downloads](https://img.shields.io/github/downloads/jonisnet/hki-parcels-card/total?style=flat-square&label=downloads)](https://github.com/jonisnet/hki-parcels-card/releases)
[![Sponsor](https://img.shields.io/badge/sponsor-%E2%9D%A4-ea4aaa?style=flat-square&logo=githubsponsors)](https://github.com/sponsors/jonisnet)

**Track parcels from PostNL, DHL, DPD, GLS, Dragonfly, Trunkrs and Cainiao in a single Home Assistant card** — with animated banners, letter scan images, automatic sensor detection, a "+ Add parcel" control for account-less carriers, and a full visual editor.

📖 **Full documentation, configuration reference and screenshots:** **[jonisnet.github.io/hki-parcels-card](https://jonisnet.github.io/hki-parcels-card/)**

![Dashboard screenshot](https://raw.githubusercontent.com/jonisnet/hki-parcels-card/main/images/screenshot-dashboard.png)

*Parcel detail with the 4-step delivery tracker*

> Based on [jimz011/hki-elements](https://github.com/jimz011/hki-elements) — the original PostNL card from the HKI project, extended with multi-carrier support, automatic sensor templating and letterbox mail.

---

## Features

- **Multi-carrier** — PostNL, DHL, DPD, GLS, Dragonfly, Trunkrs and Cainiao side by side in one card, each with its own branded logo, van animation and banner
- **Four tabs** — In Transit · Delivered · Sent · Letters, with parcel details, barcode and a direct tracking link
- **4-step delivery tracker** — a branded progress illustration (Registered · Sorting centre · Out for delivery · Delivered) when a parcel is selected
- **Carrier overview popup** — click a logo in the multi-carrier banner to see every parcel and letter for that carrier across all tabs in one popup, with details expandable in place
- **Add a parcel from the card** — account-less carriers (GLS, Dragonfly, Trunkrs, Cainiao) get a "+ Add parcel" control that registers a new Track & Trace number directly; see [Add parcel support](#add-parcel-support) below for why PostNL/DHL/DPD don't
- **Letterbox mail** — PostNL letters get their own tab with scan images, matched automatically and resilient to ha-postnl updates
- **Full visual editor** — no YAML required, with auto sensor detection, a media browser for custom images, a colour picker and live preview
- **Automatic combo banner** — with two or more carriers configured, the card builds a combo banner from just the carriers you've actually added

![Editor screenshot](https://raw.githubusercontent.com/jonisnet/hki-parcels-card/main/images/screenshot-editor-preview.png)

*Visual editor with live preview*

<table>
<tr>
<td><img src="https://raw.githubusercontent.com/jonisnet/hki-parcels-card/main/images/screenshot-banners-dark.png" alt="Combo banner, dark theme"></td>
<td><img src="https://raw.githubusercontent.com/jonisnet/hki-parcels-card/main/images/screenshot-banners-light.png" alt="Combo banner, light theme"></td>
</tr>
<tr>
<td align="center"><em>Dark theme</em></td>
<td align="center"><em>Light theme</em></td>
</tr>
</table>

More screenshots and examples: [jonisnet.github.io/hki-parcels-card/card/screenshots](https://jonisnet.github.io/hki-parcels-card/card/screenshots/)

---

## Required integrations

Install the integration for each carrier you use **before** adding the card. All of them are part of the [ha-parcel-integrations](https://github.com/ha-parcel-integrations) family, publishing the same canonical parcel format — which is what lets one card support all of them.

| Carrier | Integration | Account type |
| ------- | ----------- | ------------ |
| **PostNL** | [ha-parcel-integrations/ha-postnl](https://github.com/ha-parcel-integrations/ha-postnl) (or [arjenbos/ha-postnl](https://github.com/arjenbos/ha-postnl) for legacy `postnl_legacy`) | Account login |
| **DHL** | [ha-parcel-integrations/ha-dhl-nl](https://github.com/ha-parcel-integrations/ha-dhl-nl) | Account login |
| **DPD** | [ha-parcel-integrations/ha-dpd](https://github.com/ha-parcel-integrations/ha-dpd) | Account login |
| **GLS** | [ha-parcel-integrations/ha-gls](https://github.com/ha-parcel-integrations/ha-gls) | Tracking number + postal code |
| **Dragonfly** | [ha-parcel-integrations/ha-dragonfly](https://github.com/ha-parcel-integrations/ha-dragonfly) | Tracking number only |
| **Trunkrs** | [ha-parcel-integrations/ha-trunkrs](https://github.com/ha-parcel-integrations/ha-trunkrs) | Tracking number + postal code |
| **Cainiao** | [ha-parcel-integrations/ha-cainiao](https://github.com/ha-parcel-integrations/ha-cainiao) | Tracking number only |

Full version compatibility notes, PostNL variant details and sensor naming: [jonisnet.github.io/hki-parcels-card/card/configuration](https://jonisnet.github.io/hki-parcels-card/card/configuration/).

### Add parcel support

The card's "+ Add parcel" control only appears for carriers whose integration is **account-less** — they identify a parcel purely by tracking number (plus postal code for GLS/Trunkrs), so there's a `track_parcel` service to register one on demand. PostNL, DHL and DPD are **account-based**: every parcel sent to or from your account already appears automatically, and those integrations expose no equivalent service to register an arbitrary tracking number — so there's nothing for the card to call.

| Carrier | Add parcel from card | Why |
| ------- | :-------------------: | --- |
| PostNL | ❌ | Account-based — parcels appear automatically, no `track_parcel` service exists |
| DHL | ❌ | Account-based — parcels appear automatically, no `track_parcel` service exists |
| DPD | ❌ | Account-based — parcels appear automatically, no `track_parcel` service exists |
| GLS | ✅ | Account-less — tracked by number + postal code |
| Dragonfly | ✅ | Account-less — tracked by number only |
| Trunkrs | ✅ | Account-less — tracked by number + postal code |
| Cainiao | ✅ | Account-less — tracked by number only |

---

## Installation

### Via HACS (recommended)

1. Go to **HACS → Dashboard → ⋮ → Custom repositories**
2. Add `https://github.com/jonisnet/hki-parcels-card` with category **Dashboard**
3. Search for **HKI Parcels Card** and click Install
4. Restart Home Assistant (or do a hard refresh: Ctrl+Shift+R)

### Manual

1. Download `hki-parcels-card.js` from the [latest release](https://github.com/jonisnet/hki-parcels-card/releases/latest)
2. Copy the file to `/config/www/hki-parcels-card.js`
3. Go to **Settings → Dashboards → Resources** and add `/local/hki-parcels-card.js` (type: JavaScript module)
4. Hard refresh your browser

Optional: install [custom-brand-icons](https://github.com/elax46/custom-brand-icons) via HACS for branded PHU carrier icons — detected automatically, no configuration needed.

Full installation guide: [jonisnet.github.io/hki-parcels-card/installation](https://jonisnet.github.io/hki-parcels-card/installation/).

---

## Quick start

Add the card to your dashboard — it auto-detects every installed carrier integration and pre-fills a fully configured entry for each one it finds. Open the visual editor afterwards only if you want to tweak something.

Or add it via YAML:

```yaml
type: custom:hki-parcels-card
title: Parcels
carriers:
  - type: postnl_v4
    user: my_account
  - type: dhl
    user: my_account
  - type: dpd
    user: my_account
  - type: gls
    user: "1234ab"
  - type: dragonfly
  - type: trunkrs
    user: "1234ab"
  - type: cainiao
```

For the full list of card/carrier options, sensor naming schemes and the carrier types reference table, see the **[Configuration guide](https://jonisnet.github.io/hki-parcels-card/card/configuration/)**.

---

## Sponsor

This card is free and maintained in my spare time. If it's useful to you, a small contribution is very welcome and appreciated:

[![Sponsor on GitHub](https://img.shields.io/badge/Sponsor-%E2%9D%A4-ea4aaa?style=for-the-badge&logo=githubsponsors)](https://github.com/sponsors/jonisnet)

---

## Credits

- [jimz011/hki-elements](https://github.com/jimz011/hki-elements) — original PostNL card and visual design
- [ha-parcel-integrations](https://github.com/ha-parcel-integrations) — PostNL, DHL, DPD, GLS, Dragonfly, Trunkrs and Cainiao integrations, all sharing one canonical parcel format
- [arjenbos/ha-postnl](https://github.com/arjenbos/ha-postnl) — legacy PostNL integration

---

## License

[MIT](LICENSE)
