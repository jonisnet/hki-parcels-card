# HKI Parcels Card

[![Version](https://img.shields.io/badge/version-v1.7.3-blue?style=flat-square)](https://github.com/jonisnet/hki-parcels-card/releases/latest)
[![HACS](https://img.shields.io/badge/HACS-Custom-orange?style=flat-square)](https://hacs.xyz)
[![License](https://img.shields.io/badge/license-MIT-green?style=flat-square)](https://github.com/jonisnet/hki-parcels-card/blob/main/LICENSE)
[![HA](https://img.shields.io/badge/Home%20Assistant-2026.7%2B-41bdf5?style=flat-square)](https://www.home-assistant.io)
[![Downloads](https://img.shields.io/github/downloads/jonisnet/hki-parcels-card/total?style=flat-square&label=downloads)](https://github.com/jonisnet/hki-parcels-card/releases)
[![Sponsor](https://img.shields.io/badge/sponsor-%E2%9D%A4-ea4aaa?style=flat-square&logo=githubsponsors)](https://github.com/sponsors/jonisnet)

**Track parcels from PostNL, DHL, DPD, Vinted Go, GLS, Dragonfly, Trunkrs, Cainiao, Hermes, Packeta, Correos, PostNord, Sameday, Swiss Post, Planzer, Austrian Post, Helthjem, Dynalogic, Budbee, Nova Post, Delhivery and SunYou in a single Home Assistant card** — with animated banners, letter scan images, automatic sensor detection, a "+ Add parcel" control for account-less carriers, and a full visual editor.

📖 **Full documentation, configuration reference and screenshots:** **[jonisnet.github.io/hki-parcels-card](https://jonisnet.github.io/hki-parcels-card/)**

![Dashboard screenshot](https://raw.githubusercontent.com/jonisnet/hki-parcels-card/main/images/screenshot-dashboard.png)

*Parcel detail with the 4-step delivery tracker*

> Based on [jimz011/hki-elements](https://github.com/jimz011/hki-elements) — the original PostNL card from the HKI project, extended with multi-carrier support, automatic sensor templating and letterbox mail.

---

## Features

- **Multi-carrier** — PostNL, DHL, DPD, Vinted Go, GLS, Dragonfly, Trunkrs, Cainiao, Hermes, Packeta, Correos, PostNord, Sameday, Swiss Post, Planzer, Austrian Post, Helthjem, Dynalogic, Budbee, Nova Post, Delhivery and SunYou side by side in one card, each with its own branded logo, van animation and banner
- **Four tabs** — In Transit · Delivered · Sent · Letters, with parcel details, barcode and a direct tracking link
- **4-step delivery tracker** — a branded progress illustration (Registered · Sorting centre · Out for delivery · Delivered) when a parcel is selected
- **Carrier overview popup** — click a logo in the multi-carrier banner to see every parcel and letter for that carrier across all tabs in one popup, with details expandable in place
- **Add a parcel from the card** — account-less carriers (GLS, Dragonfly, Trunkrs, Cainiao, Hermes, Packeta, Correos, PostNord, Sameday, Swiss Post, Planzer, Austrian Post, Helthjem, Dynalogic, Budbee, Nova Post, Delhivery, SunYou) get a "+ Add parcel" control that registers a new Track & Trace number directly; see [Add parcel support](#add-parcel-support) below for why PostNL/DHL/DPD don't
- **Custom parcel names** — give any parcel a short label of your own (e.g. "Birthday gift") right from its detail panel, instead of just a tracking code; shared instance-wide with live updates by default, or scope it to just you or just this browser — see `custom_name_scope`
- **Flexible sorting & grouping** — soonest-arriving parcel on top by default, or pin newest/oldest-first everywhere; group parcels by carrier or show one flat, interleaved list — see `sort_order`/`group_by_carrier`
- **Letterbox mail** — PostNL letters get their own tab with scan images, matched automatically and resilient to ha-postnl updates
- **Full visual editor** — no YAML required, with auto sensor detection, a media browser for custom images, a colour picker and live preview
- **Automatic combo banner** — with two or more carriers configured, the card builds a combo banner from just the carriers you've actually added

![Editor screenshot](https://raw.githubusercontent.com/jonisnet/hki-parcels-card/main/images/screenshot-editor-carriers.png)

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
| **PostNL** | [ha-parcel-integrations/ha-postnl](https://github.com/ha-parcel-integrations/ha-postnl) ≥ 4.0.0 (older `postnl` / `postnl_legacy` variants are being phased out, see [Installation](https://jonisnet.github.io/hki-parcels-card/installation/#postnl)) | Account login |
| **DHL** | [ha-parcel-integrations/ha-dhl-nl](https://github.com/ha-parcel-integrations/ha-dhl-nl) | Account login |
| **DPD** | [ha-parcel-integrations/ha-dpd](https://github.com/ha-parcel-integrations/ha-dpd) | Account login |
| **Vinted Go** | [ha-parcel-integrations/ha-vinted-go](https://github.com/ha-parcel-integrations/ha-vinted-go) | Account login (e-mail + verification link, no password) |
| **GLS** | [ha-parcel-integrations/ha-gls](https://github.com/ha-parcel-integrations/ha-gls) | Tracking number + postal code |
| **Dragonfly** | [ha-parcel-integrations/ha-dragonfly](https://github.com/ha-parcel-integrations/ha-dragonfly) — created by [Alwin Hummels](https://github.com/HummelsTech), also maintained standalone at [HummelsTech/ha-dragonfly](https://github.com/HummelsTech/ha-dragonfly); either works with this card | Tracking number only |
| **Trunkrs** | [ha-parcel-integrations/ha-trunkrs](https://github.com/ha-parcel-integrations/ha-trunkrs) | Tracking number + postal code |
| **Cainiao** | [ha-parcel-integrations/ha-cainiao](https://github.com/ha-parcel-integrations/ha-cainiao) | Tracking number only |
| **Hermes** | [ha-parcel-integrations/ha-hermes](https://github.com/ha-parcel-integrations/ha-hermes) | Tracking number only |
| **Packeta** | [ha-parcel-integrations/ha-packeta](https://github.com/ha-parcel-integrations/ha-packeta) | Tracking number only |
| **Correos** | [ha-parcel-integrations/ha-correos](https://github.com/ha-parcel-integrations/ha-correos) | Tracking number only |
| **PostNord** | [ha-parcel-integrations/ha-postnord](https://github.com/ha-parcel-integrations/ha-postnord) | Tracking number only |
| **Sameday** | [ha-parcel-integrations/ha-sameday](https://github.com/ha-parcel-integrations/ha-sameday) | Tracking number only |
| **Swiss Post** | [ha-parcel-integrations/ha-swiss-post](https://github.com/ha-parcel-integrations/ha-swiss-post) | Tracking number only |
| **Planzer** | [ha-parcel-integrations/ha-planzer](https://github.com/ha-parcel-integrations/ha-planzer) | Tracking number only |
| **Austrian Post** | [ha-parcel-integrations/ha-oesterreichische-post](https://github.com/ha-parcel-integrations/ha-oesterreichische-post) | Tracking number only |
| **Helthjem** | [ha-parcel-integrations/ha-helthjem](https://github.com/ha-parcel-integrations/ha-helthjem) | Tracking number only |
| **Dynalogic** | [ha-parcel-integrations/ha-dynalogic](https://github.com/ha-parcel-integrations/ha-dynalogic) | Tracking number only |
| **Budbee** | [ha-parcel-integrations/ha-budbee](https://github.com/ha-parcel-integrations/ha-budbee) | Tracking number only |
| **Nova Post** | [ha-parcel-integrations/ha-nova-post](https://github.com/ha-parcel-integrations/ha-nova-post) | Tracking number only |
| **Delhivery** | [ha-parcel-integrations/ha-delhivery](https://github.com/ha-parcel-integrations/ha-delhivery) | Tracking number only |
| **SunYou** | [ha-parcel-integrations/ha-sunyou](https://github.com/ha-parcel-integrations/ha-sunyou) | Tracking number only |

Full version compatibility notes, PostNL variant details and sensor naming: [jonisnet.github.io/hki-parcels-card/card/configuration](https://jonisnet.github.io/hki-parcels-card/card/configuration/).

### Add parcel support

The card's "+ Add parcel" control only appears for carriers whose integration is **account-less** — they identify a parcel purely by tracking number (plus postal code for GLS/Trunkrs), so there's a `track_parcel` service to register one on demand. PostNL, DHL and DPD are **account-based**: every parcel sent to or from your account already appears automatically, and those integrations expose no equivalent service to register an arbitrary tracking number — so there's nothing for the card to call.

| Carrier | Add parcel from card | Why |
| ------- | :-------------------: | --- |
| PostNL | ❌ | Account-based — parcels appear automatically, no `track_parcel` service exists |
| DHL | ❌ | Account-based — parcels appear automatically, no `track_parcel` service exists |
| DPD | ❌ | Account-based — parcels appear automatically, no `track_parcel` service exists |
| Vinted Go | ❌ | Account-based — parcels appear automatically, no `track_parcel` service exists |
| GLS | ✅ | Account-less — tracked by number + postal code |
| Dragonfly | ✅ | Account-less — tracked by number only |
| Trunkrs | ✅ | Account-less — tracked by number + postal code |
| Cainiao | ✅ | Account-less — tracked by number only |
| Hermes | ✅ | Account-less — tracked by number only |
| Packeta | ✅ | Account-less — tracked by number only |
| Correos | ✅ | Account-less — tracked by number only |
| PostNord | ✅ | Account-less — tracked by number only |
| Sameday | ✅ | Account-less — tracked by number only |
| Swiss Post | ✅ | Account-less — tracked by number only |
| Planzer | ✅ | Account-less — tracked by number only |
| Austrian Post | ✅ | Account-less — tracked by number only |
| Helthjem | ✅ | Account-less — tracked by number only |
| Dynalogic | ✅ | Account-less — tracked by number only |
| Budbee | ✅ | Account-less — tracked by number only |
| Nova Post | ✅ | Account-less — tracked by number only |
| Delhivery | ✅ | Account-less — tracked by number only |
| SunYou | ✅ | Account-less — tracked by number only |

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
  - type: vinted_go
    user: my_account
  - type: gls
    user: "1234ab"
  - type: dragonfly
  - type: trunkrs
    user: "1234ab"
  - type: cainiao
  - type: hermes
  - type: packeta
  - type: correos
  - type: postnord
  - type: sameday
  - type: swiss_post
  - type: planzer
  - type: austrian_post
  - type: helthjem
  - type: dynalogic
  - type: budbee
  - type: nova_post
  - type: delhivery
  - type: sunyou
```

For the full list of card/carrier options, sensor naming schemes and the carrier types reference table, see the **[Configuration guide](https://jonisnet.github.io/hki-parcels-card/card/configuration/)**.

---

## Translations

The card automatically follows your Home Assistant UI language — no setting to configure. Currently available: 🇬🇧 English, 🇳🇱 Dutch, 🇩🇪 German, 🇫🇷 French, 🇪🇸 Spanish, 🇮🇹 Italian, 🇵🇱 Polish, 🇵🇹 Portuguese, 🇨🇿 Czech, 🇸🇰 Slovak, 🇭🇺 Hungarian, 🇷🇴 Romanian, 🇧🇬 Bulgarian, 🇺🇦 Ukrainian, 🇮🇳 Hindi, 🇸🇪 Swedish, 🇩🇰 Danish, 🇫🇮 Finnish, 🇳🇴 Norwegian (Bokmål) (any other language falls back to English) — chosen to match the languages the underlying carrier integrations themselves support. Want to add or improve one? See **[translations/README.md](translations/README.md)** — it's a single JSON file per language, no code changes needed.

---

## Sponsor

This card is free and maintained in my spare time. If it's useful to you, a small contribution is very welcome and appreciated:

[![Sponsor on GitHub](https://img.shields.io/badge/Sponsor-%E2%9D%A4-ea4aaa?style=for-the-badge&logo=githubsponsors)](https://github.com/sponsors/jonisnet)

---

## Credits

- [jimz011/hki-elements](https://github.com/jimz011/hki-elements) — original PostNL card and visual design
- [ha-parcel-integrations](https://github.com/ha-parcel-integrations) — PostNL, DHL, DPD, Vinted Go, GLS, Dragonfly, Trunkrs, Cainiao, Hermes, Packeta, Correos, PostNord, Sameday, Swiss Post, Planzer, Austrian Post, Helthjem, Dynalogic, Budbee, Nova Post, Delhivery and SunYou integrations, all sharing one canonical parcel format
- [Alwin Hummels (@HummelsTech)](https://github.com/HummelsTech) — created the Dragonfly integration ([HummelsTech/ha-dragonfly](https://github.com/HummelsTech/ha-dragonfly)), also mirrored into ha-parcel-integrations above
- [arjenbos/ha-postnl](https://github.com/arjenbos/ha-postnl) — legacy PostNL integration

---

## License

[MIT](LICENSE)
