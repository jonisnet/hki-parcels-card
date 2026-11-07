# Installation

## Via the Marketplace (recommended)

Home Assistant 2026.11 and newer have HACS built in as the **Marketplace**.

[![Open in the Marketplace](https://my.home-assistant.io/badges/hacs_repository.svg)](https://my.home-assistant.io/redirect/hacs_repository/?owner=jonisnet&repository=hki-parcels-card&category=plugin)

1. Click the button above, or go to **Settings → Marketplace → Add from link** and enter `https://github.com/jonisnet/hki-parcels-card` (this needs the Marketplace's GitHub connection)
2. Install **HKI Parcels Card**
3. Reload your browser — no restart needed

---

## Via HACS (Home Assistant before 2026.11)

1. Go to **HACS → Dashboard → ⋮ → Custom repositories**
2. Add `https://github.com/jonisnet/hki-parcels-card` with category **Dashboard**
3. Search for **HKI Parcels Card** and click Install
4. Reload your browser (Ctrl+Shift+R)

On updating to Home Assistant 2026.11, an installation from HACS moves to the Marketplace by itself.

---

## Manual

1. Download `hki-parcels-card.js` from the [latest release](https://github.com/jonisnet/hki-parcels-card/releases/latest)
2. Place the file at `/config/www/hki-parcels-card.js`
3. Go to **Settings → Dashboards → Resources** and add:

```
/local/hki-parcels-card.js
```

Select type: **JavaScript module**

4. Clear your browser cache (Ctrl+Shift+R / Cmd+Shift+R)

---

## Required integrations

Install the integration for each carrier you use **before** adding the card. All of them are part of the [ha-parcel-integrations](https://github.com/ha-parcel-integrations) family, publishing the same canonical parcel format — which is what lets one card support all of them.

!!! note "About the links below"
    Several of these integrations started as personal repos (`peternijssen/ha-*`, `HummelsTech/ha-dragonfly`) and were later moved into the `ha-parcel-integrations` org to be maintained together. The org repos are the actively maintained ones and are generally ahead in version — this documentation and the card's own "integration not found" links point there instead of the old personal forks.

### PostNL

The card supports three PostNL variants.

| Label | Card type | Integration | When to use |
| ----- | --------- | ----------- | ----------- |
| **PostNL** | `postnl_v4` | [ha-parcel-integrations/ha-postnl](https://github.com/ha-parcel-integrations/ha-postnl) ≥ 4.0.0 | **Recommended** — new installs and upgrades |
| **PostNL (<v4.x)** | `postnl` | [ha-parcel-integrations/ha-postnl](https://github.com/ha-parcel-integrations/ha-postnl) ≤ 3.x | Still on version 3.x |
| **PostNL (ArjenBos)** | `postnl_legacy` | [arjenbos/ha-postnl](https://github.com/arjenbos/ha-postnl) | Single-entity legacy mode |

!!! tip "Upgrading from ha-postnl v3 to v4?"
    Change the card type from `postnl` to `postnl_v4`. Your sensor entity IDs stay the same.

!!! warning "Deprecation notice"
    **PostNL (<v4.x)** will no longer be supported starting from HKI Parcels Card v2.0 — upgrade to `ha-postnl` ≥ 4.0.0 and switch the card type to `postnl_v4` before then.

    **PostNL (ArjenBos)** will also be removed starting from v2.0, unless [arjenbos/ha-postnl](https://github.com/arjenbos/ha-postnl) receives an update of its own before that point.

### DHL, DPD, Vinted Go and GLS

| Carrier | Integration |
| ------- | ----------- |
| **DHL** | [ha-parcel-integrations/ha-dhl-nl](https://github.com/ha-parcel-integrations/ha-dhl-nl) |
| **DPD** | [ha-parcel-integrations/ha-dpd](https://github.com/ha-parcel-integrations/ha-dpd) |
| **Vinted Go** | [ha-parcel-integrations/ha-vinted-go](https://github.com/ha-parcel-integrations/ha-vinted-go) |
| **GLS** | [ha-parcel-integrations/ha-gls](https://github.com/ha-parcel-integrations/ha-gls) |

!!! note "GLS has no sender/account"
    You track parcels by tracking number and postal code, not a login. The card's `user` field maps to the hub's postal code (e.g. `1234ab`), and the Sent tab is not available for this carrier.

!!! note "Vinted Go logs in with e-mail, not a password"
    Login is an e-mail address plus a verification link — there's no password and no way to register a tracking number directly, so like PostNL/DHL/DPD it has no `track_parcel` service and doesn't get the card's "+ Add parcel" control. Unlike PostNL/DHL/DPD and every account-less carrier below, Vinted Go tracks both incoming *and* outgoing parcels (it's built around Vinted's peer-to-peer resale marketplace). There's no `next_delivery`/ETA sensor for this integration at all.

### Dragonfly, Trunkrs, Cainiao, Hermes, Packeta, Correos, PostNord, Sameday, Swiss Post, Planzer, Austrian Post, Helthjem, Dynalogic, Budbee, Nova Post, Delhivery and SunYou

These, together with GLS above, are the "account-less" carriers in the family: instead of logging into an account, you register individual parcels by tracking number (plus a postal code for GLS and Trunkrs). None of them have a Sent tab except Budbee, since there's no sender/account concept to distinguish outgoing parcels for the rest.

| Carrier | Integration | Identified by |
| ------- | ----------- | ------------- |
| **Dragonfly** | [ha-parcel-integrations/ha-dragonfly](https://github.com/ha-parcel-integrations/ha-dragonfly) | Track & Trace code only — no account, no postal code |
| **Trunkrs** | [ha-parcel-integrations/ha-trunkrs](https://github.com/ha-parcel-integrations/ha-trunkrs) | Trunkrs number + postal code (one hub per postal code) |
| **Cainiao** | [ha-parcel-integrations/ha-cainiao](https://github.com/ha-parcel-integrations/ha-cainiao) | Tracking number only — cross-border parcels (AliExpress, Temu, Shein, ...) that haven't reached a local carrier yet |
| **Hermes** | [ha-parcel-integrations/ha-hermes](https://github.com/ha-parcel-integrations/ha-hermes) | 14-digit tracking code only — no account, no postal code. Germany ("Hermes Paket" / myhermes.de) |
| **Packeta** | [ha-parcel-integrations/ha-packeta](https://github.com/ha-parcel-integrations/ha-packeta) | "Z" tracking code only — no account, no postal code. Central Europe (CZ, SK, HU, PL, RO) pickup-point network, also known as Zásilkovna |
| **Correos** | [ha-parcel-integrations/ha-correos](https://github.com/ha-parcel-integrations/ha-correos) | Tracking code only — no account, no postal code. Spain's national postal service |
| **PostNord** | [ha-parcel-integrations/ha-postnord](https://github.com/ha-parcel-integrations/ha-postnord) | Tracking code only — no account, no postal code. Nordic postal service (Sweden, Denmark, Norway, Finland) |
| **Sameday** | [ha-parcel-integrations/ha-sameday](https://github.com/ha-parcel-integrations/ha-sameday) | AWB tracking code only — no account, no postal code. Romania-based courier |
| **Swiss Post** | [ha-parcel-integrations/ha-swiss-post](https://github.com/ha-parcel-integrations/ha-swiss-post) | Tracking code only — no account, no postal code. Switzerland's national postal service |
| **Planzer** | [ha-parcel-integrations/ha-planzer](https://github.com/ha-parcel-integrations/ha-planzer) | Shipment number only — no account, no postal code. Switzerland |
| **Austrian Post** | [ha-parcel-integrations/ha-oesterreichische-post](https://github.com/ha-parcel-integrations/ha-oesterreichische-post) | Tracking code only — no account, no postal code. Austria's national postal service (Österreichische Post) |
| **Helthjem** | [ha-parcel-integrations/ha-helthjem](https://github.com/ha-parcel-integrations/ha-helthjem) | Tracking code only — no account, no postal code. Norway |
| **Dynalogic** | [ha-parcel-integrations/ha-dynalogic](https://github.com/ha-parcel-integrations/ha-dynalogic) | Tracking code only — no account. Netherlands; the integration's `track_parcel` service also accepts an optional postal code as a lookup aid, but the card doesn't need to send one |
| **Budbee** | [ha-parcel-integrations/ha-budbee](https://github.com/ha-parcel-integrations/ha-budbee) | Tracking code only — no account, no postal code. Sweden-based last-mile delivery; unlike every other carrier in this table, it tracks both incoming *and* outgoing parcels, so the Sent tab works normally |
| **Nova Post** | [ha-parcel-integrations/ha-nova-post](https://github.com/ha-parcel-integrations/ha-nova-post) | Tracking code only — no account, no postal code. Ukraine's largest private courier network (Nova Poshta) |
| **Delhivery** | [ha-parcel-integrations/ha-delhivery](https://github.com/ha-parcel-integrations/ha-delhivery) | Tracking code only — no account, no postal code. India-based logistics company |
| **SunYou** | [ha-parcel-integrations/ha-sunyou](https://github.com/ha-parcel-integrations/ha-sunyou) | Tracking code only — no account, no postal code. China-based cross-border courier (SYPost) |

!!! info "Dragonfly's original integration"
    Dragonfly support was created by [Alwin Hummels (@HummelsTech)](https://github.com/HummelsTech), who maintains it standalone at [HummelsTech/ha-dragonfly](https://github.com/HummelsTech/ha-dragonfly) as well as the mirror in ha-parcel-integrations linked above — either one works with this card. These docs default to the ha-parcel-integrations link to keep every integration under one roof, but the original repo is just as valid a choice, and updates may land there first.

!!! warning "Trunkrs is an early release"
    The integration only recognises the `SHIPMENT_DELIVERED` status so far; every other state currently shows as `unknown` rather than guessing. It will improve as more statuses get mapped upstream.

!!! note "Packeta and Correos expose no ETA"
    Neither integration's public tracking includes an expected delivery time. The `next_delivery` sensor and Deliveries calendar stay empty for these two carriers, and no `delivery_time_changed` event ever fires — this is expected, not a bug.

For all of these, the card's "+ Add parcel" control can register a new parcel directly from the dashboard by calling the integration's own `track_parcel` service — no need to open the integration's own Configure dialog. See [Add parcel support](card/overview.md#add-parcel-support) for why PostNL/DHL/DPD/Vinted Go don't have this control.

---

## Optional: PHU carrier icons

Install [custom-brand-icons](https://github.com/elax46/custom-brand-icons) from the Marketplace (or HACS) to get branded `phu:` carrier icons. The card detects this automatically — no configuration needed.

Coverage varies by carrier:

| Carrier | PHU icon |
| ------- | :------: |
| PostNL | ✅ real logo |
| DHL | ✅ real logo |
| DPD | ✅ (basic placeholder-style artwork, not the official red DPD logo) |
| GLS | ✅ (plain "GLS" text mark, not the official logo) |
| Dragonfly | ✅ real logo |
| Trunkrs | ❌ not available yet |
| Cainiao | ❌ not available yet |
| Hermes | ✅ real logo |
| Packeta | ✅ real logo |
| Correos | ✅ real logo |
| Vinted Go | ❌ not available yet |
| PostNord | ❌ wordmark-only brand, no standalone icon mark exists |
| Sameday | ❌ not submitted upstream yet |
| Swiss Post | ✅ real logo |
| Planzer | ❌ wordmark-only brand, no standalone icon mark exists |
| Austrian Post | ✅ real logo |
| Helthjem | ❌ not submitted upstream yet |
| Dynalogic | ❌ wordmark-only brand, no standalone icon mark exists |
| Budbee | ❌ not available yet |
| Nova Post | ❌ not available yet |
| Delhivery | ❌ not available yet |
| SunYou | ✅ real logo |

Carriers without a proper branded icon yet fall back to a generic `mdi:package-variant-closed` icon.

---

## Tested versions

| Integration | Tested version |
| ----------- | -------------- |
| ha-parcel-integrations/ha-postnl | 4.6.0 |
| ha-parcel-integrations/ha-dhl-nl | 2.6.0 |
| ha-parcel-integrations/ha-dpd | 2.7.0 |
| ha-parcel-integrations/ha-gls | 1.2.0 |
| ha-parcel-integrations/ha-dragonfly | — |
| ha-parcel-integrations/ha-trunkrs | — (early release) |
| ha-parcel-integrations/ha-cainiao | 0.9.0 (early release) |
| ha-parcel-integrations/ha-hermes | — (added 2026-07-23) |
| ha-parcel-integrations/ha-packeta | — (added 2026-07-29) |
| ha-parcel-integrations/ha-correos | — (added 2026-07-29) |
| ha-parcel-integrations/ha-vinted-go | — (added 2026-07-30) |
| ha-parcel-integrations/ha-postnord | — (added 2026-08-05) |
| ha-parcel-integrations/ha-sameday | — (added 2026-08-05) |
| ha-parcel-integrations/ha-swiss-post | — (added 2026-08-05) |
| ha-parcel-integrations/ha-planzer | — (added 2026-08-05) |
| ha-parcel-integrations/ha-oesterreichische-post | — (added 2026-08-05) |
| ha-parcel-integrations/ha-helthjem | — (added 2026-08-05) |
| ha-parcel-integrations/ha-dynalogic | — (added 2026-08-05) |
| ha-parcel-integrations/ha-budbee | — (added 2026-08-05) |
| ha-parcel-integrations/ha-nova-post | — (added 2026-08-10) |
| ha-parcel-integrations/ha-delhivery | — (added 2026-08-10) |
| ha-parcel-integrations/ha-sunyou | 0.9.0 (added 2026-08-07) |
