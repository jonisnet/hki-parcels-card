# Changelog

## [1.0.4] — 2026-06-28

### Added

- **Split "Letters" tab** — the Letters tab is now divided into two clearly labelled sections: *Still to be delivered* and *Delivered*. Previously, once a letter was marked as delivered it moved out of the Letters tab entirely and into the general "Delivered" tab alongside parcels. Delivered letters now stay in the Letters tab, in their own section, while still respecting `days_back` for how long they remain visible.
- **Split "Sent" tab** — the Sent tab now has the same two-section layout (*Still to be delivered* / *Delivered*) as Letters. This introduces a new optional sensor field per carrier, `entity_outgoing_delivered`, alongside the existing `entity_outgoing`. Unlike Letters, the split here is based purely on which sensor reports the parcel (active vs. delivered), not on a date cutoff — so a delivered outgoing parcel stays visible for as long as the sensor itself reports it, regardless of age.
  - Auto-templated as `sensor.<user>_<carrier>_outgoing_delivered_parcels` when using the account field, same as the other sensors.
  - Configurable manually via the editor's "Advanced: override sensors" section, or via YAML.
  - `postnl_legacy` (single-entity / arjenbos/ha-postnl) mode is unaffected — it has no concept of a separate delivered-outgoing sensor and keeps its previous combined behaviour.

### Fixed

- **Carrier colors no longer default to orange for every carrier** — appearance fields (carrier section headers, status chips, icons) now fall back to each carrier's own preset colour (PostNL orange `#ed8c00`, DHL yellow `#ffcc00`, DPD red `#dc0032`) when no custom `color` is set on the carrier. Previously, any carrier without an explicit `color` override fell back to a single hardcoded orange default, so DHL and DPD looked identical to PostNL out of the box. The visual editor already showed the correct preset colour in its preview; the card itself did not.

---

## [1.0.3] — 2026-06-26

### Added

- **PHU icon auto-detection** — if the [custom-brand-icons](https://github.com/elax46/custom-brand-icons) HACS integration is installed, carrier icons default to `phu:postnl`, `phu:dhl` and `phu:dpd`. Falls back to MDI icons when PHU is not available.
- **Image selector for logo and banner** — the appearance override section now uses the Home Assistant image selector (`ha-selector` with `{ image: {} }`) for Logo and Banner. This adds a Browse button that opens the local HA media library, in addition to manual URL input. The vehicle GIF field remains a URL-only input since GIF animations are typically not stored in the media library.

---

## [1.0.2] — 2026-06-26

### Fixed

- Minor bug fixes.

---

## [1.0.1] — 2026-06-26

### Added

- **Multilingual UI** — the card and editor follow the Home Assistant language setting (`hass.language`). Dutch (`nl`) and English (`en`) are fully supported; any other language falls back to English.
- **Sensor auto-detection in the editor** — when opening a carrier, the card searches for matching sensors automatically:
  - Exactly one account found → auto-filled with a confirmation badge
  - Multiple accounts found → dropdown to choose from
  - None found → manual input with automatic sanitization (special characters replaced by `_`)
  - A pencil button allows overriding the auto-detected value at any time
- **`show_tracking_link` option** — hides the "Open Tracking" button per carrier detail panel. Useful for kiosk and touch-only setups where an accidental tap would open a full-screen browser page. Configurable via the editor (Display Options) or YAML (`show_tracking_link: false`).
- **Improved appearance override** — the advanced appearance panel now uses:
  - `ha-icon-picker` — native HA icon search picker with live preview
  - Color swatch — visual color picker showing the hex value and a live icon preview in the chosen color
  - URL fields with image preview — logo, vehicle GIF and banner show a thumbnail as soon as a URL is entered

---

## [1.0.0] — 2026-06-25

First stable release.

### Features

- **Multi-carrier** support: PostNL, DHL and DPD in a single card
- **Automatic sensor templating** based on the account field (`sensor.<user>_<carrier>_incoming_parcels` etc.)
- **Canonical schema** for DHL and DPD (harmonised attribute structure with `status` enum, `delivered` bool, `planned_from`/`planned_to`, `pickup_point`)
- **Legacy schema** for PostNL v3.x (peternijssen/ha-postnl)
- **PostNL (Legacy) mode** for arjenbos/ha-postnl — single combined entity
- **Tabs**: In Transit / Delivered / Sent / Letters
- **Parcel detail panel** with tracking number, delivery method and tracking link
- **Letters tab** (PostNL) with automatically matched `image.*` entities per date
- **Letter scan popup** for full-size image view
- **Animation block** with vehicle GIF or carrier chip when a parcel is selected
- **Customisable appearance** per carrier: logo, GIF, banner, icon, colour
- **Layout order** configurable via editor
- **Visual editor** with automatic sensor preview and collapsible sections
- Based on [jimz011/hki-elements](https://github.com/jimz011/hki-elements)
