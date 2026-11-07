# Tips & Tricks

## Choosing the right PostNL type

The card supports three PostNL variants. Use the table below to pick the right one.

| Situation | Use type | Label |
| --------- | -------- | ----- |
| Fresh install, ha-postnl ≥ 4.0.0 | `postnl_v4` | PostNL |
| Existing install, ha-postnl ≤ 3.x | `postnl` | PostNL (<v4.x) |
| Using arjenbos/ha-postnl | `postnl_legacy` | PostNL (ArjenBos) |

!!! tip
    If you upgrade from ha-postnl v3.x to v4.x, change `type: postnl` to `type: postnl_v4` in the card configuration. Your sensor entity IDs stay the same — only the card type needs to change.

!!! warning "PostNL (<v4.x) and PostNL (ArjenBos) are being phased out"
    Both will no longer be supported starting from HKI Parcels Card v2.0 — PostNL (ArjenBos) only sticks around past that point if arjenbos updates the integration before then. See [Installation](../installation.md#postnl).

---

## Sensors without a username prefix

Some setups create sensors without a username prefix, for example `sensor.postnl_incoming_parcels` instead of `sensor.john_postnl_incoming_parcels`. In this case, leave the `user` field empty:

```yaml
carriers:
  - type: postnl_v4
    user: ""
```

The editor's auto-detection also handles this case automatically.

---

## Registering a parcel without opening the integration

For GLS, Dragonfly, Trunkrs, Cainiao, Hermes, Packeta, Correos, PostNord, Sameday, Swiss Post, Planzer, Austrian Post, Helthjem, Dynalogic, Budbee, Nova Post, Delhivery and SunYou, use the "+ Add parcel" control at the bottom of the card instead of switching to the integration's own Configure dialog — it calls the same `track_parcel` service directly, so the parcel shows up in the card immediately. See [Add parcel support](overview.md#add-parcel-support) for why this isn't available for PostNL/DHL/DPD/Vinted Go.

---

## Naming a parcel

Open a parcel's detail panel and click "+ Add name" to give it a short label of your own — "Birthday gift" is a lot easier to spot than a bare tracking code. By default (`custom_name_scope: everyone`) the name is saved instance-wide with live updates for every Home Assistant user — adding or editing one requires an admin account, though everyone can see the names. Set `custom_name_scope: me` to save it to your own Home Assistant account instead (synced across your own devices only), `device` to keep it in this browser only, or `off` to hide the control entirely.

---

## Changing how parcels are sorted and grouped

By default, In Transit and Sent show the soonest-arriving parcel first within each carrier's own section (Delivered shows the most recent first), and carrier sections aren't in a fixed order — whichever carrier's next parcel is soonest shows first. Set `group_by_carrier: false` for one flat list instead, where parcels from different carriers interleave directly by date rather than being grouped — e.g. a PostNL parcel, then two DHL parcels, then three more PostNL parcels, purely in delivery-time order. Set `sort_order: newest_first` or `oldest_first` to pin one fixed direction everywhere instead of the automatic soonest/most-recent split.

---

## Limiting the history period

Use `days_back` to control how far back delivered parcels are shown. A shorter period keeps the Delivered tab manageable.

```yaml
days_back: 7   # Show only the last 7 days
```

---

## Hiding unused tabs

If you don't send parcels, or don't use PostNL, you can hide the tabs you don't need:

```yaml
show_sent: false
show_letters: false
```

---

## Using the carrier overview popup

With two or more carriers configured, click any logo in the combo banner to see everything for that carrier — In Transit, Delivered, Sent and Letters — in one popup, without switching tabs. It's a quick way to check "has anything from GLS shown up yet?" without hunting across every tab.

---

## Showing the carrier's own status text

By default the card shows a generic translated status ("In transit", "Delivered", ...) so every carrier reads the same. Set `show_raw_status: true` to show each carrier's own status text instead (e.g. GLS's "Onderweg - geladen voor aflevering") when the integration provides one — falls back to the generic label for any parcel without one.

```yaml
show_raw_status: true
```

---

## Using PHU carrier icons

If you have [custom-brand-icons](https://github.com/elax46/custom-brand-icons) installed (from the Marketplace or HACS), the card automatically uses branded carrier icons where available. No configuration is needed — icons are resolved at render time. Coverage currently varies by carrier; see [Installation](../installation.md#optional-phu-carrier-icons) for the full breakdown.

---

## Multiple cards for different purposes

Consider using two separate cards: one focused on active deliveries and one showing history.

```yaml
# Active deliveries card
type: custom:hki-parcels-card
title: Onderweg
show_delivered: false
show_sent: false
show_letters: false
carriers:
  - type: postnl_v4
    user: my_account

# History card
type: custom:hki-parcels-card
title: Ontvangen
show_delivered: true
show_sent: true
days_back: 30
show_animation: false
show_placeholder: false
carriers:
  - type: postnl_v4
    user: my_account
```

---

## Colour theming

Use CSS variables for colours that automatically adapt to your Home Assistant theme:

```yaml
header_color: "var(--primary-color)"
header_text_color: "var(--text-primary-color)"
```

Or use explicit hex values for a fixed colour scheme:

```yaml
header_color: "#1a1a2e"
header_text_color: "#e0e0e0"
```

---

## Reordering card sections

Change the visual order of the header, animation, tabs and list sections:

```yaml
layout_order:
  - animation
  - header
  - tabs
  - list
```
