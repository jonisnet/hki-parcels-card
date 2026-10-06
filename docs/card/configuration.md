# Configuration

## Card options

These options apply to the card as a whole.

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
| `placeholder_image` | string | _(built-in)_ | URL to a custom background image. Overrides the automatic combo banner — set to a fixed picture if you'd rather always show the same image |
| `show_add_parcel` | boolean | `true` | Show the "+ Add parcel" control at the bottom of the card (only appears when at least one configured carrier supports it — GLS, Dragonfly, Trunkrs, Cainiao, Hermes, Packeta, Correos, PostNord, Sameday, Swiss Post, Planzer, Austrian Post, Helthjem, Dynalogic, Budbee, Nova Post, Delhivery, SunYou) |
| `show_raw_status` | boolean | `false` | Show the carrier's own raw status text (e.g. GLS's "Onderweg - geladen voor aflevering") as the main status message instead of the card's generic translated label ("In transit"). Falls back to the generic label when a parcel has no raw status |
| `custom_name_scope` | string | `everyone` | Show a "+ Add name" control in each parcel's detail panel, letting you give it a short custom label (e.g. "Birthday gift") instead of just a tracking code. `off` hides the control entirely; `device` saves names in this browser only; `me` saves them to your Home Assistant account (synced across your own devices); `everyone` saves them instance-wide for every user to see. See the note below |
| `sort_order` | string | `auto` | `auto` (recommended) shows the soonest-arriving parcel first in In Transit and Sent, and the most recently delivered parcel first in Delivered. `newest_first`/`oldest_first` pin one direction everywhere instead. See the note below |
| `group_by_carrier` | boolean | `true` | Group parcels into per-carrier sections. Set to `false` for one flat list sorted purely by `sort_order`, interleaving carriers directly instead of showing all of one carrier's parcels before the next |
| `layout_order` | list | `[header, animation, tabs, list]` | Order of card sections |
| `carriers` | list | — | **Required.** List of carrier configurations (see below) |

\* When the card is first added, `days_back` is pre-filled from your actual delivered-parcel history (the oldest delivered parcel currently visible, across every detected carrier) when that is longer than `90`; it never goes below `90`. This is a one-time default, not a live setting. `days_back` applies to delivered parcels only — the Letters tab always shows every letter the integration reports.

!!! note "Custom parcel names: three scopes"
    There's no backend to write a custom name into an integration's own sensor data, and a live dashboard card can't persist into its own stored YAML config either (only the editor can, while you're editing the dashboard) — so this has to live somewhere else:

    - `custom_name_scope: device` saves names in the browser's local storage. Simple, but a name you set on your phone won't show up on a tablet or another device — each browser keeps its own labels.
    - `custom_name_scope: me` saves names to Home Assistant's own per-user storage instead (the same mechanism HA's own frontend uses for small preferences), via the `frontend/get_user_data`/`frontend/set_user_data` websocket calls. That's server-side, so it's the same for every device signed in with *your* HA account — but a different HA user on the same instance won't see it.
    - `custom_name_scope: everyone` (the default) saves names instance-wide, via Home Assistant's `frontend/get_system_data`/`set_system_data`/`subscribe_system_data` websocket calls — visible to every user of this Home Assistant instance, with live updates (no refresh needed to see a name someone else just added). Reading is open to everyone, but **adding or editing a name requires an administrator account** — HA enforces that server-side. Non-admin users still see existing shared names, just without the "+ Add name"/edit controls. This also needs a reasonably recent Home Assistant core (the system-data API landed in HA core ~2025.12); on an older core it degrades to showing no shared names rather than erroring.
    - `custom_name_scope: off` hides the control entirely.

    Switching between scopes starts with a blank set of names for the new scope — the stores aren't merged or migrated automatically. `shared` is still accepted as a legacy alias for `me`, from before this option split into `me` and `everyone`.

!!! note "Parcel order and grouping"
    By default (`sort_order: auto`, `group_by_carrier: true`) In Transit and Sent show the parcel arriving soonest first *within* each carrier's own section, and the carrier whose next parcel is soonest gets its section shown first — the sections aren't in a fixed order. Delivered shows the most recently delivered parcel first. Set `group_by_carrier: false` for one flat, ungrouped list instead — parcels from different carriers then interleave directly by date (e.g. a PostNL parcel, then two DHL parcels, then three more PostNL parcels, purely in delivery-time order) rather than being grouped into contiguous per-carrier sections. `sort_order: newest_first`/`oldest_first` override the automatic soonest/most-recent split and pin one fixed direction across every tab.

---

## Carrier options

Each entry in the `carriers` list supports the following options.

### Common options

| Option | Type | Default | Description |
| ------ | ---- | ------- | ----------- |
| `type` | string | — | **Required.** Carrier type (see [Carrier types](#carrier-types)) |
| `user` | string | `""` | Account part of the sensor name (omit for prefix-free sensors, or use a postal code for GLS/Trunkrs). The card detects the correct naming scheme automatically — see [Sensor naming](#sensor-naming) |
| `name` | string | _(carrier label)_ | Display name for this carrier |
| `icon` | string | _(carrier icon)_ | Icon for this carrier (`mdi:` or `phu:` prefix) |
| `color` | string | _(carrier colour)_ | Accent colour for this carrier |
| `logo_path` | string | _(carrier logo)_ | URL to a custom logo image (use the Browse button in the editor to pick from the media library) |
| `van_path` | string | _(carrier van GIF)_ | URL to a custom van animation |
| `banner_path` | string | _(carrier banner)_ | URL to a custom banner image (use the Browse button in the editor to pick from the media library) |
| `show_tracking_link` | boolean | `true` | Show the "Open Tracking" button in the detail panel |

### Sensor overrides

Normally the card generates sensor entity IDs automatically from `type` and `user`. Use these only if your sensor names differ.

| Option | Type | Description |
| ------ | ---- | ----------- |
| `entity_incoming` | string | Sensor for incoming parcels in transit |
| `entity_delivered` | string | Sensor for delivered incoming parcels |
| `entity_outgoing` | string | Sensor for outgoing parcels in transit (not applicable for GLS, Dragonfly, Trunkrs, Cainiao, Hermes, Packeta, Correos, PostNord, Sameday, Swiss Post, Planzer, Austrian Post, Helthjem, Dynalogic, Nova Post, Delhivery, SunYou) |
| `entity_outgoing_delivered` | string | Sensor for delivered outgoing parcels (not applicable for GLS, Dragonfly, Trunkrs, Cainiao, Hermes, Packeta, Correos, PostNord, Sameday, Swiss Post, Planzer, Austrian Post, Helthjem, Dynalogic, Nova Post, Delhivery, SunYou) |
| `entity_letters` | string | Sensor for PostNL letterbox mail (PostNL only) |

### PostNL (ArjenBos) options

When `type: postnl_legacy` these options apply instead.

| Option | Type | Description |
| ------ | ---- | ----------- |
| `entity` | string | **Required.** Combined PostNL delivery sensor |
| `distribution_entity` | string | Optional. PostNL distribution (sent) sensor |

---

## Carrier types

| Type | Label in editor | Integration | Schema | Letters | Add parcel from card |
| ---- | ---------------- | ----------- | ------ | :-----: | :-------------------: |
| `postnl_v4` | PostNL | ha-parcel-integrations/ha-postnl ≥ 4.0.0 | canonical | ✅ | — |
| `postnl` | PostNL (<v4.x) | ha-parcel-integrations/ha-postnl ≤ 3.x | legacy | ✅ | — |
| `dhl` | DHL | ha-parcel-integrations/ha-dhl-nl | canonical | — | — |
| `dpd` | DPD | ha-parcel-integrations/ha-dpd | canonical | — | — |
| `vinted_go` | Vinted Go | ha-parcel-integrations/ha-vinted-go | canonical | — | — |
| `gls` | GLS | ha-parcel-integrations/ha-gls | canonical | — | ✅ |
| `dragonfly` | Dragonfly | ha-parcel-integrations/ha-dragonfly | canonical | — | ✅ |
| `trunkrs` | Trunkrs | ha-parcel-integrations/ha-trunkrs | canonical | — | ✅ |
| `cainiao` | Cainiao | ha-parcel-integrations/ha-cainiao | canonical | — | ✅ |
| `hermes` | Hermes | ha-parcel-integrations/ha-hermes | canonical | — | ✅ |
| `packeta` | Packeta | ha-parcel-integrations/ha-packeta | canonical | — | ✅ |
| `correos` | Correos | ha-parcel-integrations/ha-correos | canonical | — | ✅ |
| `postnord` | PostNord | ha-parcel-integrations/ha-postnord | canonical | — | ✅ |
| `sameday` | Sameday | ha-parcel-integrations/ha-sameday | canonical | — | ✅ |
| `swiss_post` | Swiss Post | ha-parcel-integrations/ha-swiss-post | canonical | — | ✅ |
| `planzer` | Planzer | ha-parcel-integrations/ha-planzer | canonical | — | ✅ |
| `austrian_post` | Austrian Post | ha-parcel-integrations/ha-oesterreichische-post | canonical | — | ✅ |
| `helthjem` | Helthjem | ha-parcel-integrations/ha-helthjem | canonical | — | ✅ |
| `dynalogic` | Dynalogic | ha-parcel-integrations/ha-dynalogic | canonical | — | ✅ |
| `budbee` | Budbee | ha-parcel-integrations/ha-budbee | canonical | — | ✅ |
| `nova_post` | Nova Post | ha-parcel-integrations/ha-nova-post | canonical | — | ✅ |
| `delhivery` | Delhivery | ha-parcel-integrations/ha-delhivery | canonical | — | ✅ |
| `sunyou` | SunYou | ha-parcel-integrations/ha-sunyou | canonical | — | ✅ |
| `postnl_legacy` | PostNL (ArjenBos) | arjenbos/ha-postnl | single_entity | — | — |
| `custom` | Custom | any | canonical | — | — |

!!! tip "Which PostNL type should I use?"
    Use `postnl_v4` ("PostNL") for new installations or if you have updated to ha-postnl 4.0.0 or later.
    Use `postnl` ("PostNL (<v4.x)") if you are still on version 3.x.
    Use `postnl_legacy` ("PostNL (ArjenBos)") only for the arjenbos/ha-postnl integration.

!!! warning "Deprecation notice"
    **PostNL (<v4.x)** will no longer be supported starting from HKI Parcels Card v2.0. **PostNL (ArjenBos)** will also be removed from v2.0, unless arjenbos updates that integration before then. See [Installation](../installation.md#postnl) for details.

!!! note
    `gls`, `dragonfly`, `trunkrs`, `cainiao`, `hermes`, `packeta`, `correos`, `postnord`, `sameday`, `swiss_post`, `planzer`, `austrian_post`, `helthjem`, `dynalogic`, `nova_post`, `delhivery` and `sunyou` have no Sent tab — these carriers track parcels by number (plus postal code for GLS/Trunkrs) with no sender/account concept, so `entity_outgoing` and `entity_outgoing_delivered` are not applicable. See [Add parcel support](overview.md#add-parcel-support) for why these carriers get the "+ Add parcel" control.

!!! note "Vinted Go"
    `vinted_go` is account-based (e-mail + verification link login, no password) like `postnl_v4`/`dhl`/`dpd`, so it has no `track_parcel_service` and doesn't get the "+ Add parcel" control either. Unlike those three, and unlike every account-less carrier above, it tracks both incoming *and* outgoing parcels — the Sent tab works normally. There is no `next_delivery`/ETA sensor for this integration at all.

!!! note "Budbee"
    `budbee` is account-less like the carriers above (tracked by number only, no postal code) and does get the "+ Add parcel" control — but unlike the rest of that group, it tracks both incoming *and* outgoing parcels, so the Sent tab works normally for Budbee.

---

## Sensor naming

The `user` field is the account part of the sensor name. The card builds all entity IDs automatically and supports both naming schemes used by the supported integrations:

| Scheme | Example |
| ------ | ------- |
| `sensor.<user>_<carrier>_*` | PostNL, DHL — `sensor.my_account_postnl_incoming_parcels` |
| `sensor.<carrier>_<user>_*` | DPD, Vinted Go, GLS, Trunkrs — `sensor.dpd_my_account_binnenkomende_pakketten`, `sensor.vinted_go_my_account_incoming_parcels`, `sensor.gls_1234ab_incoming_parcels`, `sensor.trunkrs_1234ab_incoming_parcels` |
| `sensor.<carrier>_*` (no prefix) | Dragonfly, Cainiao, Hermes, Packeta, Correos, PostNord, Sameday, Swiss Post, Planzer, Austrian Post, Helthjem, Dynalogic, Budbee, Nova Post, Delhivery, SunYou — `sensor.dragonfly_incoming_parcels`, `sensor.cainiao_incoming_parcels`, `sensor.hermes_incoming_parcels`, `sensor.packeta_incoming_parcels`, `sensor.correos_incoming_parcels`, `sensor.postnord_incoming_parcels`, `sensor.sameday_incoming_parcels`, `sensor.swiss_post_incoming_parcels`, `sensor.planzer_incoming_parcels`, `sensor.oesterreichische_post_incoming_parcels` (Austrian Post), `sensor.helthjem_incoming_parcels`, `sensor.dynalogic_incoming_parcels`, `sensor.budbee_incoming_parcels`, `sensor.nova_post_incoming_parcels`, `sensor.delhivery_incoming_parcels`, `sensor.sunyou_incoming_parcels` |

The correct scheme is detected automatically. Leave `user` empty if your sensors have no account prefix, or for any account-less no-prefix carrier (Dragonfly, Cainiao, Hermes, Packeta, Correos, PostNord, Sameday, Swiss Post, Planzer, Austrian Post, Helthjem, Dynalogic, Budbee, Nova Post, Delhivery, SunYou) — those carriers have no account or postal code at all.

---

## Full configuration example

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
show_add_parcel: true
show_raw_status: false
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
    # Optional sensor overrides — normally not needed:
    entity_incoming: sensor.my_account_postnl_incoming_parcels
    entity_delivered: sensor.my_account_postnl_delivered_parcels
    entity_outgoing: sensor.my_account_postnl_outgoing_parcels
    entity_outgoing_delivered: sensor.my_account_postnl_outgoing_delivered_parcels
    entity_letters: sensor.my_account_postnl_letters
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
```
