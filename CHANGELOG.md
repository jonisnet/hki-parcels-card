# Changelog

## [1.1.1] — 2026-06-30

### Fixed

- **Letter images now display correctly** — when a HA `image.*` entity for a letter could not be matched (e.g. because the integration names its image entities differently), the card returned an empty thumbnail instead of falling back to the `image_url` that ha-postnl v4.x provides directly in the sensor attributes. The card now always falls back to `image_url` when `image_entity_picture` is unavailable.

---

## [1.1.0] — 2026-06-29

### Added

- **Three distinct PostNL carrier types** — the single `postnl` type has been split into three explicitly labelled options to eliminate schema guesswork:

  | Type | Label | Integration | Schema |
  |---|---|---|---|
  | `postnl_v4` | PostNL (peternijssen v4.x) | peternijssen/ha-postnl ≥ 4.0.0 | canonical |
  | `postnl` | PostNL (peternijssen v3.x) | peternijssen/ha-postnl ≤ 3.x | legacy |
  | `postnl_legacy` | PostNL (arjenbos) | arjenbos/ha-postnl | single_entity |

  **Existing configurations are not broken** — `type: postnl` still maps to the v3.x legacy preset. To use the v4.x canonical schema, change `type` to `postnl_v4`.

- **Default carrier in the editor is now PostNL (v4.x)** — clicking "Add carrier" opens the v4.x preset by default, since that is the current recommended integration.

### Changed

- Editor dropdown now shows all three PostNL options with explicit version labels.
- Editor intro text updated to guide users to the correct PostNL type.

---

## [1.0.9] — 2026-06-29

### Fixed — ha-postnl v4.1.0 compatibility

- **Status labels now show correctly for PostNL v4.x** — ha-postnl v4.x returns uppercase status enums (`IN_TRANSIT`, `OUT_FOR_DELIVERY`, `DELIVERED`, etc.). The card's status label map used lowercase keys, so every status fell through and displayed as raw enum text. Fixed by lowercasing the enum before lookup; DHL and DPD are unaffected.
- **Delivered PostNL parcels no longer disappear** — with `schema: legacy`, the cutoff filter looked for `delivery_date` or `planned_date` fields that do not exist in ha-postnl v4.x data (which uses `delivered_at` and `planned_from` instead). The result was epoch (1 Jan 1970), older than any cutoff, causing all delivered parcels to be silently discarded. The legacy normalizer now maps `delivered_at → delivery_date` and `planned_from → planned_date` as a fallback.
- **Dutch status message shown in detail panel** — ha-postnl v4.x provides a `raw_status` field with the original Dutch status text. This is now used as `status_message` in the legacy normalizer instead of the enum string.
- **`CANONICAL_DELIVERED_STATUSES` extended** — added uppercase `'DELIVERED'` alongside lowercase `'delivered'` so the enum-based delivered fallback works correctly for both ha-postnl v4.x (uppercase) and other integrations (lowercase).

---

## [1.0.8] — 2026-06-29

### Fixed

- **Delivered letters no longer appear in the Bezorgd tab** — if ha-postnl reports the same letter in both `entity_delivered` (parcels sensor) and `entity_letters`, the duplicate is now removed from the Bezorgd tab. Letters are exclusively shown in the Post tab (upcoming section or delivered section). The same deduplication also prevents any sent items that appear in multiple sensors from leaking into the Bezorgd tab.
- **Letters without a delivery date are no longer silently dropped** — previously, a letter with no `delivery_date` was converted to epoch (1 Jan 1970) which is older than the cutoff, so it was discarded entirely. Letters without a date are now placed in the Post → upcoming section.

---

## [1.0.7] — 2026-06-29

### Fixed

- **Auto account detection now works without a username prefix** — sensors named `sensor.postnl_incoming_parcels` (without a `<user>_` prefix) are now correctly detected and the card generates matching entity names (`sensor.postnl_incoming_parcels`, `sensor.postnl_delivered_parcels`, etc.). Previously the auto-detect regex required a username prefix and silently returned nothing for prefix-free sensor setups, causing the editor to show "No sensors found" and leaving all entity fields empty.

---

## [1.0.6] — 2026-06-29

### Fixed

- **Advanced sensor fields now accept free text** — the entity pickers in "Advanced: override sensors" are replaced with text fields so you can type any entity name, including sensors that do not yet exist in Home Assistant. Previously the `ha-selector entity` picker only allowed selecting from entities already present in HA.
- **Carrier colors applied to individual parcel items** — the status icon, "Open Tracking" button, expand chevron and delivery-complete icon in the animation block now use the carrier's own colour. Previously these elements always used the global orange accent colour regardless of carrier.
- **PHU icons apply to existing configurations** — carrier icons are now resolved at render time. If the [custom-brand-icons](https://github.com/elax46/custom-brand-icons) integration is installed after the card was already configured, `phu:postnl` / `phu:dhl` / `phu:dpd` now activate automatically without reconfiguring the carrier.

---

## [1.0.5] — 2026-06-28

### Added

- **Split "Letters" tab** — the Letters tab is now divided into two clearly labelled sections: *Still to be delivered* and *Delivered*. Previously, once a letter was marked as delivered it moved out of the Letters tab entirely and into the general "Delivered" tab alongside parcels. Delivered letters now stay in the Letters tab, in their own section, while still respecting `days_back` for how long they remain visible.
- **Split "Sent" tab** — the Sent tab now has the same two-section layout (*Still to be delivered* / *Delivered*) as Letters. This introduces a new optional sensor field per carrier, `entity_outgoing_delivered`, alongside the existing `entity_outgoing`. Unlike Letters, the split here is based purely on which sensor reports the parcel (active vs. delivered), not on a date cutoff — so a delivered outgoing parcel stays visible for as long as the sensor itself reports it, regardless of age.
  - Auto-templated as `sensor.<user>_<carrier>_outgoing_delivered_parcels` when using the account field, same as the other sensors.
  - Configurable manually via the editor's "Advanced: override sensors" section, or via YAML.
  - `postnl_legacy` (single-entity / arjenbos/ha-postnl) mode is unaffected — it has no concept of a separate delivered-outgoing sensor and keeps its previous combined behaviour.

### Fixed

- **Carrier colors no longer default to orange for every carrier** — appearance fields (carrier section headers, status chips, icons) now fall back to each carrier's own preset colour (PostNL orange `#ed8c00`, DHL yellow `#ffcc00`, DPD red `#dc0032`) when no custom `color` is set on the carrier. Previously, any carrier without an explicit `color` override fell back to a single hardcoded orange default, so DHL and DPD looked identical to PostNL out of the box. The visual editor already showed the correct preset colour in its preview; the card itself did not.
- **Carrier colors applied to individual parcel items** — the status icon, "Open Tracking" button, expand chevron and delivery-complete icon in the animation block now all use the carrier's own colour. Previously these elements always used the global accent colour (orange) regardless of carrier.
- **PHU icons now apply to existing configurations** — previously, `phu:postnl` / `phu:dhl` / `phu:dpd` were only selected at the moment a carrier was added in the editor. If PHU icons were installed after the card was already configured, the saved `mdi:package-variant-closed` value would always win. The card now resolves the icon at render time, so PHU icons activate automatically without reconfiguring the carrier.

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
