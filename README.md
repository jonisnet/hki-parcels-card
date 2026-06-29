# HKI Parcels Card

A Home Assistant Lovelace card for tracking parcels from multiple carriers (PostNL, DHL, DPD) in a single unified view.

> **Based on** [jimz011/hki-elements](https://github.com/jimz011/hki-elements) — the original PostNL card from the HKI project. This fork has been extended with multi-carrier support, automatic sensor templating, and letterbox mail display.

---

## Required integrations

Install the integrations for the carriers you use **before** configuring the card.

### PostNL

The card supports three PostNL variants. Pick the one that matches your integration:

| Card type | Integration | When to use |
| --------- | ----------- | ------------ |
| **PostNL (peternijssen v4.x)** | [peternijssen/ha-postnl](https://github.com/peternijssen/ha-postnl) ≥ 4.0.0 | New installations, canonical sensor schema |
| **PostNL (peternijssen v3.x)** | [peternijssen/ha-postnl](https://github.com/peternijssen/ha-postnl) ≤ 3.x | Older installations, legacy sensor schema |
| **PostNL (arjenbos)** | [arjenbos/ha-postnl](https://github.com/arjenbos/ha-postnl) | Single-entity legacy mode — no further updates |

> **Upgrading from peternijssen v3.x to v4.x?** Change the card type from `postnl` to `postnl_v4` after upgrading the integration. Existing sensor entity IDs stay the same.

### DHL and DPD

| Carrier | Integration |
| ------- | ----------- |
| **DHL** | [peternijssen/ha-dhl-nl](https://github.com/peternijssen/ha-dhl-nl) |
| **DPD** | [peternijssen/ha-dpd](https://github.com/peternijssen/ha-dpd) |

### Tested versions

| Integration | Tested version |
| ----------- | --------------- |
| [peternijssen/ha-postnl](https://github.com/peternijssen/ha-postnl) | 4.1.0 |
| [peternijssen/ha-dhl-nl](https://github.com/peternijssen/ha-dhl-nl) | 2.2.0 |
| [peternijssen/ha-dpd](https://github.com/peternijssen/ha-dpd) | 2.2.0 |

---

## Installation

### Via HACS (recommended)

1. In Home Assistant go to **HACS → Dashboard → Custom repositories**
2. Add `https://github.com/jonisnet/hki-parcels-card` as category **Dashboard**
3. Search for **HKI Parcels Card** and install
4. Restart Home Assistant or clear your browser cache

### Manual

1. Download `hki-parcels-card.js` from this repository
2. Place the file at `/config/www/hki-parcels-card.js`
3. Go to **Settings → Dashboards → Resources** and add:

```
/local/hki-parcels-card.js
```

(Type: JavaScript module)

4. Clear your browser cache (Ctrl+Shift+R)

---

## Configuration

### Minimal configuration (single carrier)

```yaml
type: custom:hki-parcels-card
title: My Parcels
carriers:
  - type: postnl_v4
    user: my_account
```

The `user` field is the account part of your sensor name (the part before `_postnl_incoming_parcels`). The card builds all sensor names automatically. If your sensors have no user prefix (e.g. `sensor.postnl_incoming_parcels`), leave `user` empty.

### Multiple carriers

```yaml
type: custom:hki-parcels-card
title: Parcels
carriers:
  - type: postnl_v4
    user: your_name
  - type: dhl
    user: your_name
  - type: dpd
    user: your_name
```

### All options

```yaml
type: custom:hki-parcels-card
title: Parcels
days_back: 90                # How many days to show delivered parcels
show_delivered: true         # Show "Delivered" tab
show_sent: true              # Show "Sent" tab (split into "Still to be delivered" / "Delivered" sections)
show_letters: true           # Show "Letters" tab (PostNL letterbox mail, split into sections)
show_animation: true         # Show animation block when a parcel is selected
show_header: true            # Show header with title and statistics
show_placeholder: true       # Show background image
header_color: ''             # Header background color
header_text_color: ''        # Header text color
placeholder_image: ''        # URL to a custom background image
layout_order:
  - header
  - animation
  - tabs
  - list
carriers:
  - type: postnl_v4          # postnl_v4 · postnl · dhl · dpd · postnl_legacy · custom
    user: your_name          # Account part of the sensor name (may be empty)
    # Optional appearance overrides:
    name: PostNL
    icon: mdi:package-variant-closed
    color: '#ed8c00'
    logo_path: ''
    van_path: ''
    banner_path: ''
    # Override sensors manually (normally not needed):
    entity_incoming: sensor.your_name_postnl_incoming_parcels
    entity_delivered: sensor.your_name_postnl_delivered_parcels
    entity_outgoing: sensor.your_name_postnl_outgoing_parcels
    entity_outgoing_delivered: sensor.your_name_postnl_outgoing_delivered_parcels
    entity_letters: sensor.your_name_postnl_letters
```

### PostNL (arjenbos) — single-entity mode

```yaml
carriers:
  - type: postnl_legacy
    entity: sensor.postnl_delivery
    distribution_entity: sensor.postnl_distribution   # optional
```

> **Note:** this mode will not receive further updates as long as [arjenbos/ha-postnl](https://github.com/arjenbos/ha-postnl) is not actively maintained.

---

## Carrier types reference

| Type | Label in editor | Integration | Schema | Letters |
| ---- | --------------- | ----------- | ------ | ------- |
| `postnl_v4` | PostNL (peternijssen v4.x) | peternijssen/ha-postnl ≥ 4.0.0 | canonical | ✅ |
| `postnl` | PostNL (peternijssen v3.x) | peternijssen/ha-postnl ≤ 3.x | legacy | ✅ |
| `dhl` | DHL | peternijssen/ha-dhl-nl | canonical | — |
| `dpd` | DPD | peternijssen/ha-dpd | canonical | — |
| `postnl_legacy` | PostNL (arjenbos) | arjenbos/ha-postnl | single_entity | — |
| `custom` | Custom | any | canonical | — |

---

## Letters and Sent tabs

Both the **Letters** tab and the **Sent** tab show two sections:

- **Still to be delivered**
- **Delivered**

| Tab | How the split works |
| --- | ------------------- |
| Letters | Date-based: today or later → "Still to be delivered"; older → "Delivered". Delivered letters remain visible for `days_back` days. |
| Sent | Sensor-based: items from `entity_outgoing` → "Still to be delivered"; items from `entity_outgoing_delivered` → "Delivered". No date cutoff. |

`entity_outgoing_delivered` is optional. If not configured, the "Delivered" section under Sent stays empty.

---

## Sensor schemas

| Schema | Used by |
| ------ | ------- |
| `canonical` | PostNL v4.x, DHL, DPD — shared parcel shape with `status` enum, `delivered` bool, `delivered_at`, `planned_from`/`planned_to` |
| `legacy` | PostNL v3.x — Dutch free-text status, date fields vary per version |
| `single_entity` | arjenbos/ha-postnl — one combined entity for all parcels |

---

## Attribute support per schema

| Attribute | canonical (PostNL v4.x, DHL, DPD) | legacy (PostNL v3.x) |
| --------- | ---------------------------------- | --------------------- |
| `barcode` | ✅ | ✅ |
| `sender` | ✅ | ✅ |
| `status` (enum) | ✅ | — (free text) |
| `raw_status` | ✅ | ✅ |
| `delivered` (bool) | ✅ | derived from status text |
| `delivered_at` | ✅ | — |
| `planned_from` / `planned_to` | ✅ | — |
| `pickup` / `pickup_point` | ✅ | — |
| `url` | ✅ | ✅ |

---

## Features

- **Multi-carrier** — PostNL, DHL and DPD side by side in one card
- **Automatic sensor names** — enter only the account part, the rest is built automatically
- **Tabs** — In Transit / Delivered / Sent / Letters
- **Sent and Letters split into sections** — "Still to be delivered" and "Delivered" shown separately
- **Parcel details** — click a parcel for tracking number, delivery method and direct tracking link
- **Letterbox mail** — PostNL letters with scan images from `image.*` entities
- **Animation** — vehicle animation for the selected parcel
- **Customisable appearance** — custom logo, GIF, banner and colours per carrier
- **PHU icons** — automatic carrier icons via [custom-brand-icons](https://github.com/elax46/custom-brand-icons) when installed

---

## License

See the [LICENSE](https://github.com/jonisnet/hki-parcels-card/blob/main/LICENSE) file.

---

## Credits

- [jimz011/hki-elements](https://github.com/jimz011/hki-elements) — original PostNL card and visual design
- [peternijssen/ha-postnl](https://github.com/peternijssen/ha-postnl) — PostNL integration
- [peternijssen/ha-dhl-nl](https://github.com/peternijssen/ha-dhl-nl) — DHL integration
- [peternijssen/ha-dpd](https://github.com/peternijssen/ha-dpd) — DPD integration
- [arjenbos/ha-postnl](https://github.com/arjenbos/ha-postnl) — legacy PostNL integration
