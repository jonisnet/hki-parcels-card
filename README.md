# HKI Parcels Card

A generic, multi-carrier parcel-tracking card for Home Assistant. Track
PostNL, DHL, DPD (and in principle any future carrier with a similar
sensor naming pattern) in a single Lovelace card, with automatic
per-carrier sensor templating, carrier-grouped lists, and a dedicated
"Post" tab for PostNL letterbox mail.

## Attribution

This card started as a fork of the PostNL card from
[jimz011/hki-elements](https://github.com/jimz011/hki-elements), originally
a single-carrier PostNL tracking card with a nice truck animation and
expandable parcel list. All credit for the original visual design and the
PostNL card concept goes to **jimz011** — this repository would not exist
without that starting point.

Since forking, the card has been substantially rewritten to:
- support multiple carriers in one card instead of just PostNL,
- support multiple accounts ("users") per carrier,
- automatically template sensor entity_ids from a single account field,
- match PostNL letter scans to Home Assistant's local `image.*` entities
  instead of relying on PostNL's external (login-gated) image URLs,
- show a clickable popup for letter scans,
- show a carrier-specific logo/vehicle GIF in the animation panel.

If you're looking for the original, single-carrier PostNL card, see
[jimz011/hki-elements](https://github.com/jimz011/hki-elements).

## Features

- **Multiple carriers in one card** — PostNL, DHL, DPD, or a custom carrier
  type, each shown as its own section within the Onderweg / Bezorgd /
  Verzonden / Post tabs.
- **Automatic sensor templating** — enter your account's sensor-name slug
  once per carrier and all four entity_ids
  (`entity_incoming` / `entity_delivered` / `entity_outgoing` /
  `entity_letters`) are built automatically. Manual overrides remain
  available for non-standard sensor names.
- **PostNL letter support** — a dedicated "Post" tab shows letterbox mail,
  with scan images matched to Home Assistant's local `image.*` entities
  (no external PostNL login required) and a clickable popup for the
  full-size scan.
- **Per-carrier branding** — optional logo and animated vehicle GIF per
  carrier, shown in the card's animation panel.
- **Collapsible, guided editor** — carrier sections collapse once
  configured, and the intro/help text can be collapsed too.

## Requirements

This card displays data — it does not fetch it. You need at least one of
the following integrations installed and configured first:

- [arjenbos/ha-postnl](https://github.com/arjenbos/ha-postnl) or
  [peternijssen/ha-postnl](https://github.com/peternijssen/ha-postnl) for
  PostNL tracking and letterbox mail.
- A DHL integration following the same
  `sensor.<user>_dhl_<incoming|delivered|outgoing>_parcels` naming pattern
  (e.g. `ha-dhl-nl`).
- A DPD integration following the equivalent `..._dpd_...` pattern, once
  available.

## Installation

### Via HACS (custom repository)

1. In Home Assistant, go to **HACS → Frontend**.
2. Click the three dots in the top-right corner → **Custom repositories**.
3. Add this repository's URL and select category **Dashboard**.
4. Find **HKI Parcels Card** in the list and install it.
5. Add the resource if it wasn't added automatically (**Settings →
   Dashboards → ⋮ → Resources**).

### Manual installation

1. Download `hki-parcels-card.js` from this repository.
2. Copy it to `/config/www/hki-parcels-card.js` in your Home Assistant
   instance.
3. Add it as a Lovelace resource: **Settings → Dashboards → ⋮ →
   Resources → Add resource**, with URL `/local/hki-parcels-card.js` and
   resource type **JavaScript Module**.

## Configuration

Add a new card with type `custom:hki-parcels-card`. The easiest way is via
the visual editor — add a carrier, pick its type (PostNL/DHL/DPD), and
enter the account slug from your sensor names. For example, if your PostNL
sensors are named `sensor.<account>_postnl_incoming_parcels`, etc., just
enter `<account>` in the "Account" field for that carrier and all four
entities are filled in automatically.

### Example YAML

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
placeholder_image: https://github.com/jonisnet/hki-parcels-card/blob/main/images/dutch-parcels.png?raw=true
carriers:
  - type: postnl
    name: PostNL
    user: your_account_slug
    icon: mdi:email-fast
    color: "#ed8c00"
    schema: legacy
    entity_incoming: sensor.your_account_slug_postnl_incoming_parcels
    entity_delivered: sensor.your_account_slug_postnl_delivered_parcels
    entity_outgoing: sensor.your_account_slug_postnl_outgoing_parcels
    entity_letters: sensor.your_account_slug_postnl_letters
  - type: dhl
    name: DHL
    user: your_account_slug
    icon: mdi:truck
    color: "#ffcc00"
    schema: canonical
    entity_incoming: sensor.your_account_slug_dhl_incoming_parcels
    entity_delivered: sensor.your_account_slug_dhl_delivered_parcels
    entity_outgoing: sensor.your_account_slug_dhl_outgoing_parcels
layout_order:
  - header
  - animation
  - tabs
  - list
```

### Carrier options

| Option | Description |
|---|---|
| `type` | `postnl`, `dhl`, `dpd`, or `custom`. Determines the default icon/color/schema and whether the Post/letters field is shown. |
| `user` | The account-specific part of your sensor names. Used to auto-build the four entity_ids below. |
| `name` | Display name. Auto-filled from `type`, editable for `custom`. |
| `icon` / `color` | Display icon and accent color. Auto-filled from `type`, can be overridden. |
| `logo_path` | Optional URL to a carrier logo. Defaults to a built-in logo for `postnl`/`dhl`/`dpd` (see [Images](#images) below) when left blank. |
| `van_path` | Optional URL to an animated vehicle GIF, shown in the animation panel for in-transit/delivered parcels. Defaults to a built-in GIF for `postnl` when left blank (no built-in van asset yet for `dhl`/`dpd`). |
| `banner_path` | Optional URL to a wide banner image, shown as the animation panel background when this carrier is the only one configured. Defaults to a built-in banner for `postnl`/`dhl` when left blank. |
| `schema` | `legacy` (current PostNL sensor shape: free-text status) or `canonical` (the shared `normalize_parcel()` shape used by newer carrier integrations). |
| `entity_incoming` / `entity_delivered` / `entity_outgoing` / `entity_letters` | Sensor entity_ids. Auto-built from `user` + `type`; can be overridden manually for non-standard naming. |

## Images

This card ships with built-in logo and banner assets for PostNL, DHL, and
DPD (PostNL additionally has a van GIF; DHL/DPD don't have one yet),
hosted in this repository's [`images/`](images/) folder. They're used
automatically whenever a carrier's `logo_path` / `van_path` /
`banner_path` is left blank — you don't need to configure anything for
the default look to work, the same way the original `hki-postnl-card`
always had a working PostNL logo/van/banner out of the box.

If you'd rather use your own images (a different style, or assets for a
`custom` carrier type), just set `logo_path` / `van_path` / `banner_path`
on that carrier and your URL takes priority over the built-in default.

## Known limitations

- DPD support follows the same `canonical` schema as DHL but hasn't been
  tested against a real DPD integration yet.
- Letter-image matching assumes Home Assistant slugifies a letter's title
  the same way as observed in testing (e.g. `"18 juni"` →
  `..._18_juni`). If a title contains characters HA slugifies differently,
  the card falls back to showing a "no image" placeholder for that letter
  rather than guessing wrong.

## License

See [LICENSE](LICENSE).
