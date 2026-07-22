# HKI Parcels Card

[![Version](https://img.shields.io/badge/version-v1.5.0b1-blue?style=flat-square)](https://github.com/jonisnet/hki-parcels-card/releases/latest)
[![HACS](https://img.shields.io/badge/HACS-Custom-orange?style=flat-square)](https://hacs.xyz)
[![License](https://img.shields.io/badge/license-MIT-green?style=flat-square)](https://github.com/jonisnet/hki-parcels-card/blob/main/LICENSE)
[![HA](https://img.shields.io/badge/Home%20Assistant-2026.7%2B-41bdf5?style=flat-square)](https://www.home-assistant.io)
[![Downloads](https://img.shields.io/github/downloads/jonisnet/hki-parcels-card/total?style=flat-square&label=downloads)](https://github.com/jonisnet/hki-parcels-card/releases)
[![Sponsor](https://img.shields.io/badge/sponsor-%E2%9D%A4-ea4aaa?style=flat-square&logo=githubsponsors)](https://github.com/sponsors/jonisnet)

**Track parcels from PostNL, DHL, DPD, GLS, Dragonfly, Trunkrs and Cainiao in a single Home Assistant card** — with animated banners, letter scan images, automatic sensor detection, a "+ Add parcel" control for account-less carriers, and a full visual editor.

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

- **Multi-carrier** — PostNL, DHL, DPD, GLS, Dragonfly, Trunkrs and Cainiao side by side in one card; add the same carrier multiple times for multiple accounts or hubs
- **Add a parcel from the card** — for the account-less carriers (GLS, Dragonfly, Trunkrs, Cainiao) a "+ Add parcel" control lets you type a Track & Trace number straight into the card; it calls the integration's own `track_parcel` service, so the parcel is actually registered, not just displayed. Toggle it off via `show_add_parcel: false` if you'd rather add parcels through the integration itself
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

Install the integrations for the carriers you use **before** adding the card. All carriers below
are part of the [ha-parcel-integrations](https://github.com/ha-parcel-integrations) family — a set
of Home Assistant integrations that all publish the same canonical parcel format, statuses and
events, which is what lets one card support all of them with the same logic.

> **Note on links:** several of these integrations started as personal repos (`peternijssen/ha-*`,
> `HummelsTech/ha-dragonfly`) and were later moved into the `ha-parcel-integrations` org so they
> could be maintained together. The org repos are the actively maintained ones and are generally
> ahead in version — this README and the card's own "integration not found" links now point there
> instead of the old personal forks (one of which, `peternijssen/ha-gls`, has had no release since
> the move).

### PostNL

The card supports three PostNL variants:

| Card type | Integration | When to use |
| --------- | ----------- | ----------- |
| `postnl_v4` | [ha-parcel-integrations/ha-postnl](https://github.com/ha-parcel-integrations/ha-postnl) ≥ 4.0.0 | **Recommended** — new installs and upgrades |
| `postnl` | [ha-parcel-integrations/ha-postnl](https://github.com/ha-parcel-integrations/ha-postnl) ≤ 3.x | Still on version 3.x |
| `postnl_legacy` | [arjenbos/ha-postnl](https://github.com/arjenbos/ha-postnl) | Single-entity legacy mode |

> **Upgrading from ha-postnl v3 to v4?** Change the card type from `postnl` to `postnl_v4`. Your sensor entity IDs stay the same.

### DHL, DPD, GLS and Dragonfly

| Carrier | Integration |
| ------- | ----------- |
| **DHL** | [ha-parcel-integrations/ha-dhl-nl](https://github.com/ha-parcel-integrations/ha-dhl-nl) |
| **DPD** | [ha-parcel-integrations/ha-dpd](https://github.com/ha-parcel-integrations/ha-dpd) |
| **GLS** | [ha-parcel-integrations/ha-gls](https://github.com/ha-parcel-integrations/ha-gls) |

> **GLS has no sender/account** — you track parcels by tracking number and postal code, not a login. The card's `user` field maps to the hub's postal code (e.g. `1234ab`), and the Sent tab is not available for this carrier.

### Dragonfly, Trunkrs and Cainiao

These three, together with GLS above, are the "account-less" carriers in the family: instead of
logging into an account, you register individual parcels by tracking number (plus a postal code for
GLS and Trunkrs). None of them have a Sent tab, since there's no sender/account concept to
distinguish outgoing parcels.

| Carrier | Integration | Identified by |
| ------- | ----------- | ------------- |
| **Dragonfly** | [ha-parcel-integrations/ha-dragonfly](https://github.com/ha-parcel-integrations/ha-dragonfly) | Track & Trace code only — no account, no postal code |
| **Trunkrs** | [ha-parcel-integrations/ha-trunkrs](https://github.com/ha-parcel-integrations/ha-trunkrs) | Trunkrs number + postal code (one hub per postal code) |
| **Cainiao** | [ha-parcel-integrations/ha-cainiao](https://github.com/ha-parcel-integrations/ha-cainiao) | Tracking number only — cross-border parcels (AliExpress, Temu, Shein, ...) that haven't reached a local carrier yet |

> **Trunkrs is an early release** — the integration only recognises the `SHIPMENT_DELIVERED` status
> so far; every other state currently shows as `unknown` rather than guessing. It will improve as
> more statuses get mapped upstream — see that repo's README for how to help.

> **Trunkrs and Cainiao branding.** The logos are the carriers' real official artwork, and the
> accent colours (`#2ce27e` for Trunkrs, `#0066ff` for Cainiao) were confirmed by pixel-sampling
> those logos directly. The step icons and animated van, however, are *not* official art — they're
> produced by recolouring the same shared master illustration every other carrier's icons are
> drawn from (the technique the whole `images/` set already uses — e.g. DHL's yellow icons are the
> same drawing as GLS's blue ones, just hue-shifted) to match the confirmed accent colour, so they
> fit the house style pixel-for-pixel. The banner is a plain white background with that same real
> logo centred on it, since there's no official banner-style artwork to draw from.

For all four of these, the card's "+ Add parcel" control (see [Features](#-parcel-tracking)) can
register a new parcel directly from the dashboard by calling the integration's own `track_parcel`
service — no need to open the integration's own Configure dialog.

### Tested versions

| Integration | Version |
| ----------- | ------- |
| ha-parcel-integrations/ha-postnl | 4.6.0 |
| ha-parcel-integrations/ha-dhl-nl | 2.6.0 |
| ha-parcel-integrations/ha-dpd | 2.7.0 |
| ha-parcel-integrations/ha-gls | 1.2.0 |
| ha-parcel-integrations/ha-dragonfly | — |
| ha-parcel-integrations/ha-trunkrs | — (early release) |
| ha-parcel-integrations/ha-cainiao | 0.9.0 (early release) |

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

Add the card to your dashboard — it auto-detects every installed carrier integration (PostNL, DHL, DPD, GLS, Dragonfly, Trunkrs, Cainiao) and pre-fills a fully configured entry for each one it finds, including `days_back` (based on the oldest delivered parcel currently visible across your carriers). Open the visual editor afterwards only if you want to tweak something; the editor itself also auto-fills entity IDs when you pick a carrier type and confirm the account.

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
  - type: dragonfly
  - type: trunkrs
    user: "1234ab"
  - type: cainiao
```

---

## Configuration

### Card options

| Option | Type | Default | Description |
| ------ | ---- | ------- | ----------- |
| `title` | string | `Parcels` | Title shown in the card header |
| `days_back` | number | `90`* | Days to keep delivered parcels visible |
| `show_delivered` | boolean | `true` | Show the Delivered tab |
| `show_sent` | boolean | `true` | Show the Sent tab |
| `show_letters` | boolean | `true` | Show the Letters tab (PostNL only) |
| `show_animation` | boolean | `true` | Show the van animation when a parcel is selected |
| `show_header` | boolean | `true` | Show the header with title and statistics |
| `show_placeholder` | boolean | `true` | Show the background image when no parcel is selected |
| `header_color` | string | _(theme)_ | Header background colour |
| `header_text_color` | string | _(theme)_ | Header text colour |
| `placeholder_image` | string | _(built-in)_ | URL to a custom background image. Overrides the automatic combo banner (see [Carrier banners](#-appearance)) — set to a fixed picture if you'd rather always show the same image than the auto-built combo banner |
| `show_add_parcel` | boolean | `true` | Show the "+ Add parcel" control at the bottom of the card (only appears when at least one configured carrier supports it — GLS, Dragonfly, Trunkrs, Cainiao) |
| `layout_order` | list | `[header, animation, tabs, list]` | Order of card sections |
| `carriers` | list | — | **Required.** List of carrier configurations |

\* When the card is first added, `days_back` is pre-filled from your actual delivered-parcel history (the oldest delivered parcel currently visible, across every detected carrier) instead of the flat `90`. This is a one-time default, not a live setting — change it any time in the card options.

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
| `entity_outgoing` | Outgoing parcels in transit (not available for GLS, Dragonfly, Trunkrs, Cainiao) |
| `entity_outgoing_delivered` | Delivered outgoing parcels (not available for GLS, Dragonfly, Trunkrs, Cainiao) |
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
| `sensor.<carrier>_<user>_*` | DPD, GLS, Trunkrs — `sensor.dpd_my_account_binnenkomende_pakketten`, `sensor.gls_1234ab_incoming_parcels`, `sensor.trunkrs_1234ab_incoming_parcels` |
| `sensor.<carrier>_*` (no prefix) | Dragonfly, Cainiao — `sensor.dragonfly_incoming_parcels`, `sensor.cainiao_incoming_parcels` |

The correct scheme is detected automatically. Leave `user` empty if your sensors have no account prefix (e.g. `sensor.postnl_incoming_parcels`, or any Dragonfly/Cainiao sensor — those two have no account or postal code at all).

---

## Carrier types reference

| Type | Label | Integration | Schema | Letters | Add parcel from card |
| ---- | ----- | ----------- | ------ | ------- | --------------------- |
| `postnl_v4` | PostNL | ha-parcel-integrations/ha-postnl ≥ 4.0.0 | canonical | ✅ | — |
| `postnl` | PostNL (peternijssen v3.x) | ha-parcel-integrations/ha-postnl ≤ 3.x | legacy | ✅ | — |
| `dhl` | DHL | ha-parcel-integrations/ha-dhl-nl | canonical | — | — |
| `dpd` | DPD | ha-parcel-integrations/ha-dpd | canonical | — | — |
| `gls` | GLS | ha-parcel-integrations/ha-gls | canonical | — | ✅ |
| `dragonfly` | Dragonfly | ha-parcel-integrations/ha-dragonfly | canonical | — | ✅ |
| `trunkrs` | Trunkrs | ha-parcel-integrations/ha-trunkrs | canonical | — | ✅ |
| `cainiao` | Cainiao | ha-parcel-integrations/ha-cainiao | canonical | — | ✅ |
| `postnl_legacy` | PostNL (arjenbos) | arjenbos/ha-postnl | single_entity | — | — |
| `custom` | Custom | any | canonical | — | — |

> **Note:** `gls`, `dragonfly`, `trunkrs` and `cainiao` have no Sent tab — these carriers track parcels by number (plus postal code for GLS/Trunkrs) with no sender/account concept, so `entity_outgoing` and `entity_outgoing_delivered` are not applicable.

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
