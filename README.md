# HKI Parcels Card

[![Version](https://img.shields.io/badge/version-v1.4.0b4-blue?style=flat-square)](https://github.com/jonisnet/hki-parcels-card/releases/latest)
[![HACS](https://img.shields.io/badge/HACS-Custom-orange?style=flat-square)](https://hacs.xyz)
[![License](https://img.shields.io/badge/license-MIT-green?style=flat-square)](https://github.com/jonisnet/hki-parcels-card/blob/main/LICENSE)
[![HA](https://img.shields.io/badge/Home%20Assistant-2026.7%2B-41bdf5?style=flat-square)](https://www.home-assistant.io)
[![Downloads](https://img.shields.io/github/downloads/jonisnet/hki-parcels-card/total?style=flat-square&label=downloads)](https://github.com/jonisnet/hki-parcels-card/releases)
[![Sponsor](https://img.shields.io/badge/sponsor-%E2%9D%A4-ea4aaa?style=flat-square&logo=githubsponsors)](https://github.com/sponsors/jonisnet)

**Track parcels from PostNL, DHL, DPD and GLS in a single Home Assistant card** — with animated banners, letter scan images, automatic sensor detection and a full visual editor.

![Dashboard screenshot](https://raw.githubusercontent.com/jonisnet/hki-parcels-card/main/images/screenshot-dashboard.png)

*Parcel detail with the 4-step delivery tracker*

> Based on [jimz011/hki-elements](https://github.com/jimz011/hki-elements) — the original PostNL card from the HKI project, extended with multi-carrier support, automatic sensor templating and letterbox mail.

---

## Contents

- [Features](#features)
- [Required integrations](#required-integrations)
- [Installation](#installation)
- [Quick start](#quick-start)
- [Configuration](#configuration)
- [Sensor naming](#sensor-naming)
- [Carrier types reference](#carrier-types-reference)
- [Sponsor](#sponsor)
- [Credits](#credits)

---

## Features

### 📦 Parcel tracking

- **Multi-carrier** — PostNL, DHL, DPD and GLS side by side in one card; add the same carrier multiple times for multiple accounts
- **Four tabs** — In Transit · Delivered · Sent · Letters
- **Split sections** — both Sent and Letters are split into *Still to be delivered* and *Delivered*
- **Parcel details** — click any parcel for barcode, delivery type and a direct tracking link
- **4-step delivery tracker** — selecting a parcel shows a progress row (Registered · Sorting centre · Out for delivery · Delivered) with a carrier-branded illustration for the current step, plus a time/date detail (registered and sorting-centre times need the integration's optional "include history" setting; the delivery window and delivered timestamp work without it)
- **Historical tracking** — configure how many days back delivered parcels remain visible

### 💌 Letterbox mail

- **PostNL letters** — dedicated tab with scan images matched automatically from `image.*` entities
- **Works across ha-postnl versions** — matching is based on the `mailitem-xxx` ID, not the entity name, so it survives integration updates

### 🎨 Visual editor

- **Full UI configuration** — no YAML required; the editor covers every option
- **Auto sensor detection** — enter your account name and all entity IDs are filled in automatically, for both `sensor.<user>_<carrier>_*` and `sensor.<carrier>_<user>_*` naming schemes
- **Media browser** — browse the HA media library directly from the editor to pick logos, banners and placeholder images
- **Colour picker** — per-carrier accent colour with hex input and one-click reset to the carrier default
- **Live preview** — the card renders in real time next to the editor

![Editor screenshot](https://raw.githubusercontent.com/jonisnet/hki-parcels-card/main/images/screenshot-editor-preview.png)

*Visual editor with live preview*

### ✨ Appearance

- **Carrier banners** — animated banner shown when no parcel is selected. With one carrier configured, that carrier's own banner/logo is shown. With two or more, the card automatically builds a combo banner from the logos of *only the carriers you've actually configured* — add GLS and it appears; leave out DPD and it doesn't. Set `placeholder_image` to override this with your own picture.
- **Custom branding** — set a custom logo, van animation and banner per carrier
- **PHU icons** — carrier icons via [custom-brand-icons](https://github.com/elax46/custom-brand-icons) activate automatically when installed
- **Layout control** — reorder the header, animation, tabs and list sections

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

---

## Required integrations

Install the integrations for the carriers you use **before** adding the card.

### PostNL

The card supports three PostNL variants:

| Card type | Integration | When to use |
| --------- | ----------- | ----------- |
| `postnl_v4` | [peternijssen/ha-postnl](https://github.com/peternijssen/ha-postnl) ≥ 4.0.0 | **Recommended** — new installs and upgrades |
| `postnl` | [peternijssen/ha-postnl](https://github.com/peternijssen/ha-postnl) ≤ 3.x | Still on version 3.x |
| `postnl_legacy` | [arjenbos/ha-postnl](https://github.com/arjenbos/ha-postnl) | Single-entity legacy mode |

> **Upgrading from ha-postnl v3 to v4?** Change the card type from `postnl` to `postnl_v4`. Your sensor entity IDs stay the same.

### DHL, DPD and GLS

| Carrier | Integration |
| ------- | ----------- |
| **DHL** | [peternijssen/ha-dhl-nl](https://github.com/peternijssen/ha-dhl-nl) |
| **DPD** | [peternijssen/ha-dpd](https://github.com/peternijssen/ha-dpd) |
| **GLS** | [peternijssen/ha-gls](https://github.com/peternijssen/ha-gls) |

> **GLS has no sender/account** — you track parcels by tracking number and postal code, not a login. The card's `user` field maps to the hub's postal code (e.g. `1234ab`), and the Sent tab is not available for this carrier.

### Tested versions

| Integration | Version |
| ----------- | ------- |
| peternijssen/ha-postnl | 4.3.0 |
| peternijssen/ha-dhl-nl | 2.4.0 |
| peternijssen/ha-dpd | 2.4.0 |
| peternijssen/ha-gls | 1.0.0 |

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

### Optional: PHU carrier icons

Install [custom-brand-icons](https://github.com/elax46/custom-brand-icons) via HACS to get branded `phu:postnl`, `phu:dhl`, `phu:dpd` and `phu:gls-group` icons. The card detects this automatically — no configuration needed.

---

## Quick start

Add the card to your dashboard and open the visual editor. The editor auto-detects your installed carriers and fills in the sensor entity IDs automatically. You only need to pick your carrier type and confirm the account.

Alternatively, add it via YAML:

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
```

---

## Configuration

### Card options

| Option | Type | Default | Description |
| ------ | ---- | ------- | ----------- |
| `title` | string | `Parcels` | Title shown in the card header |
| `days_back` | number | `90` | Days to keep delivered parcels visible |
| `show_delivered` | boolean | `true` | Show the Delivered tab |
| `show_sent` | boolean | `true` | Show the Sent tab |
| `show_letters` | boolean | `true` | Show the Letters tab (PostNL only) |
| `show_animation` | boolean | `true` | Show the van animation when a parcel is selected |
| `show_header` | boolean | `true` | Show the header with title and statistics |
| `show_placeholder` | boolean | `true` | Show the background image when no parcel is selected |
| `header_color` | string | _(theme)_ | Header background colour |
| `header_text_color` | string | _(theme)_ | Header text colour |
| `placeholder_image` | string | _(built-in)_ | URL to a custom background image. Overrides the automatic combo banner (see [Carrier banners](#-appearance)) — set to a fixed picture if you'd rather always show the same image than the auto-built combo banner |
| `layout_order` | list | `[header, animation, tabs, list]` | Order of card sections |
| `carriers` | list | — | **Required.** List of carrier configurations |

### Carrier options

| Option | Type | Default | Description |
| ------ | ---- | ------- | ----------- |
| `type` | string | — | **Required.** See [Carrier types reference](#carrier-types-reference) |
| `user` | string | `""` | Account part of the sensor name — see [Sensor naming](#sensor-naming) |
| `name` | string | _(carrier label)_ | Display name |
| `icon` | string | _(carrier icon)_ | Icon (`mdi:` or `phu:` prefix) |
| `color` | string | _(carrier colour)_ | Accent colour |
| `logo_path` | string | _(carrier logo)_ | URL to a custom logo |
| `van_path` | string | _(carrier van GIF)_ | URL to a custom van animation |
| `banner_path` | string | _(carrier banner)_ | URL to a custom banner image |
| `show_tracking_link` | boolean | `true` | Show the Open Tracking button in the detail panel |

#### Sensor overrides

Normally the card generates sensor entity IDs automatically. Use these only if your sensor names differ from the expected pattern.

| Option | Description |
| ------ | ----------- |
| `entity_incoming` | Incoming parcels in transit |
| `entity_delivered` | Delivered incoming parcels |
| `entity_outgoing` | Outgoing parcels in transit (not available for GLS) |
| `entity_outgoing_delivered` | Delivered outgoing parcels (not available for GLS) |
| `entity_letters` | PostNL letterbox mail (PostNL only) |

#### PostNL Legacy (arjenbos)

When `type: postnl_legacy` use these instead:

| Option | Description |
| ------ | ----------- |
| `entity` | **Required.** Combined PostNL delivery sensor |
| `distribution_entity` | Optional. PostNL distribution (sent) sensor |

### Full example

```yaml
type: custom:hki-parcels-card
title: Parcels
days_back: 90
show_delivered: true
show_sent: true
show_letters: true
show_animation: true
show_header: true
show_placeholder: true
header_color: ""
header_text_color: ""
placeholder_image: ""
layout_order:
  - header
  - animation
  - tabs
  - list
carriers:
  - type: postnl_v4
    user: my_account
    name: PostNL
    icon: phu:postnl
    color: "#ed8c00"
    logo_path: ""
    van_path: ""
    banner_path: ""
    show_tracking_link: true
  - type: dhl
    user: my_account
  - type: dpd
    user: my_account
  - type: gls
    user: "1234ab"
```

---

## Sensor naming

The `user` field is the account part of the sensor name. The card builds all entity IDs automatically and supports both naming schemes used by the supported integrations:

| Scheme | Example |
| ------ | ------- |
| `sensor.<user>_<carrier>_*` | PostNL, DHL — `sensor.my_account_postnl_incoming_parcels` |
| `sensor.<carrier>_<user>_*` | DPD, GLS — `sensor.dpd_my_account_binnenkomende_pakketten`, `sensor.gls_1234ab_incoming_parcels` |

The correct scheme is detected automatically. Leave `user` empty if your sensors have no account prefix (e.g. `sensor.postnl_incoming_parcels`).

---

## Carrier types reference

| Type | Label | Integration | Schema | Letters |
| ---- | ----- | ----------- | ------ | ------- |
| `postnl_v4` | PostNL | peternijssen/ha-postnl ≥ 4.0.0 | canonical | ✅ |
| `postnl` | PostNL (peternijssen v3.x) | peternijssen/ha-postnl ≤ 3.x | legacy | ✅ |
| `dhl` | DHL | peternijssen/ha-dhl-nl | canonical | — |
| `dpd` | DPD | peternijssen/ha-dpd | canonical | — |
| `gls` | GLS | peternijssen/ha-gls | canonical | — |
| `postnl_legacy` | PostNL (arjenbos) | arjenbos/ha-postnl | single_entity | — |
| `custom` | Custom | any | canonical | — |

> **Note:** `gls` has no Sent tab — GLS tracks parcels by number/postal code with no sender/account concept, so `entity_outgoing` and `entity_outgoing_delivered` are not applicable.

---

## Sponsor

This card is free and maintained in my spare time. If it's useful to you, a small contribution is very welcome and appreciated:

[![Sponsor on GitHub](https://img.shields.io/badge/Sponsor-%E2%9D%A4-ea4aaa?style=for-the-badge&logo=githubsponsors)](https://github.com/sponsors/jonisnet)

---

## Credits

- [jimz011/hki-elements](https://github.com/jimz011/hki-elements) — original PostNL card and visual design
- [peternijssen/ha-postnl](https://github.com/peternijssen/ha-postnl) — PostNL integration
- [peternijssen/ha-dhl-nl](https://github.com/peternijssen/ha-dhl-nl) — DHL integration
- [peternijssen/ha-dpd](https://github.com/peternijssen/ha-dpd) — DPD integration
- [peternijssen/ha-gls](https://github.com/peternijssen/ha-gls) — GLS integration
- [arjenbos/ha-postnl](https://github.com/arjenbos/ha-postnl) — legacy PostNL integration

---

## License

[MIT](LICENSE)
