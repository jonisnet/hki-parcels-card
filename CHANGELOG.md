# Changelog

## [Unreleased]

### Changed

- **Step hero time/date info restyled** — the label (e.g. "Bezorgd op") and the actual time/date
  are now on separate lines instead of one sentence, with the time/date bigger and bold so it's
  the part that stands out at a glance.

### Fixed

- **Step icons were nearly invisible on a light/white theme** — the registered/sorting/delivered
  illustrations use a near-white body, and their outline stroke was thin enough in the source SVG
  (1.5px at a 200-unit viewBox) that it became sub-pixel and got anti-aliased away once scaled
  down to the 72px tile size, leaving a washed-out shape with almost no contrast against a white
  card background. Outline stroke width and opacity roughly doubled, the isometric shading steps
  darkened, and `.status-step-icon-wrap` gained a `1px solid var(--divider-color)` border so every
  tile is clearly delineated regardless of theme.

- **DHL logo reverted to red-on-yellow, now in the exact official brand colours** — a transparent
  wordmark was the wrong idea for DHL specifically: unlike the other carriers, DHL's mark is
  always shown on its yellow field, not as a free-floating red shape. `DHL_logo.png` is a cropped,
  colour-corrected slice of `DHL_banner.png`, both now recoloured to DHL's exact brand hex values
  (`#FFCC00` yellow, `#D40511` red — Pantone 116C / 199C) instead of the original artwork's
  approximate colours. `DHL_step_sorting.png`'s signboard picks up the corrected logo too.
  `.header-logo` gained `max-width: 110px` so a wide-aspect logo like this one can't crowd the
  header.

### Added

- **Time/date detail beside the step tracker hero** — registered shows the time it was
  registered, sorting centre shows the time it arrived there (both need the integration's
  optional "include history" setting to have data — hidden otherwise), out for delivery shows
  the expected delivery window ("between 16:00 and 18:00"), and delivered shows the delivery
  date and time. Sits to the right of the hero illustration.

### Changed

- **DHL logo replaced with the wordmark from the banner** — the previous rounded-badge crop
  didn't read as authentically "DHL" as the plain red wordmark does; extracted via chroma-key
  from `DHL_banner.png` onto a transparent background.
- **Registered/delivered mini icons no longer carry a baked-in checkmark** — only the large hero
  illustration keeps it (as a permanent "this stage happened" marker); the small step-row icon
  relies solely on the separate checkmark badge that already appears once a step is done, so a
  parcel that's merely *at* the registered/delivered step no longer looks complete before it
  actually is. Sorting/transit icons were unaffected since they never had a baked-in checkmark.

### Fixed

- **"Onderweg" step icon reverted to the real van artwork** — the hand-drawn vector van from the
  previous update looked out of place next to the actual illustrated vans. It's back to being a
  cropped frame from each carrier's own van GIF (same source as the "out for delivery" hero), at
  native resolution instead of artificially upscaled.
- **`GLS_logo.png` had a solid blue background** — every other carrier logo is transparent (used
  on tinted panels, colored backgrounds, etc.), but GLS's used the square brand-icon variant with
  an opaque blue fill. Replaced with the official transparent wordmark (same source as the GLS
  banner). `DHL_logo.png` also had a soft dark glow baked into its "transparent" edges instead of
  clean alpha=0; cropped to the solid icon, removing the halo.
- **Status-step row no longer capped at 480px** — it was centered with a fixed max-width, leaving
  empty space on wider cards instead of stretching edge to edge like the rest of the card.

### Changed

- **Step tracker icons are bigger and sharper** — 72px icon tiles (was 40px), a bigger checkmark
  badge, and larger labels. All 16 step illustrations were re-exported at 1200px source width
  (was 600px) for headroom at the new size. The "onderweg" (out for delivery) mini icon is now a
  small vector van illustration in the same flat style as the other three steps, instead of a
  cropped frame from the 200x142 van GIF — that source was too low-res to hold up at a larger
  size. The large out-for-delivery illustration still uses the real van animation, unchanged.

### Fixed

- **"Out for delivery" hero showed the house next to the van instead of across the card** —
  `.visual-road` lost its full width once it moved inside the step tracker's flex column
  (`align-items: center` shrinks flex children to their content width instead of stretching
  them), so `right: 0` (house) and `left: 25%` (van) were both resolving against a near-zero-width
  box. Restored with `width: 100%` — the van is back on the left, driving toward the house on the
  right, across the full card.
- **"Onderweg" step icon replaced** — the hand-drawn placeholder truck is gone; the step icon is
  now a cropped still frame from each carrier's own van animation, so it actually matches the
  large "out for delivery" illustration instead of looking like a different, lower-quality van.

### Changed

- **Image assets reorganised into per-carrier folders** — `images/postnl/`, `images/dhl/`,
  `images/dpd/`, `images/gls/` and `images/shared/` (for the generic combo-banner placeholders),
  instead of one flat folder of prefixed filenames. No config changes needed — this only affects
  the repo layout and the internal asset URLs the card already builds itself.

### Added

- **4-step delivery tracker** — selecting a parcel now shows a labelled progress row (Registered ·
  Sorting centre · Out for delivery · Delivered), each step with its own small carrier-branded
  icon, plus a large illustration for the current step below. A step's mini icon only gets a
  checkmark badge once that step is actually completed — reaching the final "Delivered" step
  marks all four as done. New illustrations per carrier (PostNL, DHL, DPD, GLS): a labelled
  parcel with a "registered" check badge, a sorting-centre building with a loading dock (a small
  van docks to unload), a van "on the way" icon, and a house with the parcel delivered on the
  doorstep. The existing driving-van animation is kept as the large illustration for the "out for
  delivery" step — it already showed exactly that. Parcels with a status outside this happy path
  (`at_pickup_point`, `returning`, `problem`, `unknown`) or on a non-canonical schema (legacy
  PostNL, single-entity, custom) keep the previous plain van/chip + status-text treatment.
- **Combo banner redesign** — the no-selection banner for 2+ carriers now fills the full card
  width with equal-width panels per carrier (subtle brand-colour tint, thin divider, centred
  logo) instead of a cluster of logos floating in the middle with empty space on both sides.

### Fixed

- **Duplicate parcels when switching a carrier's type** — switching a carrier's type in the editor
  (e.g. from `postnl_v4` to `gls`) could leave `entity_outgoing`/`entity_outgoing_delivered`
  pointing at the *previous* carrier's sensor, because the fallback chain read the old value
  instead of clearing it for carriers that don't support outgoing (`supports_outgoing: false`).
  In practice this meant a GLS (or any outgoing-unsupported) carrier could silently re-read and
  display PostNL's sent/delivered parcels a second time under its own name. Fixed at both the
  editor (no longer carries the stale value over) and the card's data read (ignores the field
  outright for carriers that don't support it), so existing saved configs self-heal too.
- **GLS account field now accepts a postal code cleanly** — "1234 AB" is sanitised to "1234ab"
  (space stripped, not turned into an underscore) so it matches `sensor.gls_1234ab_incoming_parcels`.
  The account field also shows a GLS-specific placeholder/help text explaining it's the hub's
  postal code rather than a login account.

### Added

- **Dynamic combo banner** — the no-selection banner shown for 2+ carriers is no longer a single
  static image with every possible carrier on it. It's now built automatically from the logos of
  only the carriers you've actually configured (e.g. PostNL + GLS shows just those two), using
  each carrier's own logo asset. A user-supplied `placeholder_image` still overrides this.
- **GLS banner asset** — `images/GLS_banner.png`, the official GLS wordmark (sourced from
  [Wikimedia Commons](https://commons.wikimedia.org/wiki/File:GLS_Logo_2021.svg)) on a white
  background, used as the single-carrier banner for `gls`.
- **`images/dutch-parcels-2.png`** — an updated 4-carrier (PostNL/DHL/DPD/GLS) static banner,
  replacing `dutch-parcels.png` as the built-in `DEFAULT_PLACEHOLDER_IMAGE` fallback (used when
  0 carriers are configured, or a single carrier with no logo asset). Also settable as a fixed
  `placeholder_image` for anyone who prefers it over the dynamic combo banner.
- **Branded van animations for DHL, DPD and GLS** — `images/DHL_van.gif`, `images/DPD_van.gif`
  and `images/GLS_van.gif`. Each is the existing PostNL driving animation (67 frames) recoloured
  to the carrier's brand colour via a hue shift, with the door badge swapped for that carrier's
  own logo mark. Previously only PostNL had a van animation; the others fell back to a plain
  colour-chip icon.

### Fixed

- **GLS accent colour corrected** — `#10218c` (estimate) → `#061ab1`, the exact GLS brand blue,
  confirmed against both the official Wikimedia logo and GLS's own brand assets.

## [1.3.0] — 2026-07-07

### Added

- **GLS carrier support** — new `gls` carrier type for [peternijssen/ha-gls](https://github.com/peternijssen/ha-gls).
  Supports the incoming and delivered sensors (auto-detected as `sensor.gls_<postcode>_incoming_parcels` /
  `sensor.gls_<postcode>_delivered_parcels`), carrier branding, and PHU icon (`phu:gls-group`) when
  custom-brand-icons is installed. GLS has no sender/account concept, so the Sent tab's outgoing fields
  are hidden for this carrier — the editor shows an explanatory note instead.

## [1.2.1] — 2026-07-04

### Added

- **PostNL outgoing delivered parcels** — the "Sent" tab's *Delivered* section now works with
  peternijssen/ha-postnl ≥ 4.3.1, which adds the `sensor.*_postnl_outgoing_delivered_parcels`
  sensor. The card was already templating this entity; it now has an actual sensor to connect to.
  No configuration change required — the sensor is picked up automatically when the account field
  is filled in.

---

## [1.2.0] — 2026-07-04

### Added

- **Media browser button on URL fields** — every URL input field (logo, vehicle GIF, banner, placeholder image) now has a Browse button. It opens a custom media browser overlay that uses the HA WebSocket API (`media_source/browse_media`) to browse the media library. Folders are clickable; a Back button navigates up. Images from the `www` folder are served via `/local/`. The selected URL is filled in automatically.
- **Integration link when carrier not found** — when no sensors are found for a carrier, the editor shows a direct link to the relevant integration repository instead of blank input fields. The ✎ button allows manual entry at any time.
- **"Default" colour button for carrier and header colours** — resets the colour to the carrier or header default. The button is always visible: active when a custom colour is set, greyed out when the default is already active.
- **Editable hex colour value** — a text field next to the colour picker shows the current hex value (`#rrggbb`) and accepts direct input. Input is validated before the colour is saved.

### Changed

- **`postnl_v4` carrier label simplified** — the label "PostNL (peternijssen v4.x)" has been shortened to "PostNL".
- **Carrier dropdown order updated** — new order: PostNL · DHL · DPD · PostNL (<v4.x) · PostNL (ArjenBos) · Custom.

### Fixed

- **Dual sensor naming schemes supported** — account auto-detection now recognises both `sensor.<carrier>_<user>_*` (DPD style) and `sensor.<user>_<carrier>_*` (PostNL/DHL style). Entity fields are populated using the correct scheme automatically.
- **DPD sensors auto-detected** — the DPD integration uses Dutch sensor names (`binnenkomende_pakketten`, `bezorgde_pakketten`, `uitgaande_pakketten`). Detection and entity generation now use these names for DPD.
- **Free text input in the account field** — the account field now accepts any characters (including `.`, `@`, `-`) while typing; sanitisation to underscores happens only when the field loses focus.
- **Logo, banner and vehicle GIF fields always visible** — these fields now use a plain text input with a live image preview instead of `ha-selector image:{}`, which did not render reliably inside the card editor Shadow DOM.
- **Banner with apostrophe in folder name now renders correctly** — `background-image` now uses double quotes so that an apostrophe in the path (e.g. `Logo's`) does not break the CSS string.
- **Default placeholder image when field is empty** — when `placeholder_image` is not set, the card now falls back to `dutch-parcels.png` from the repository instead of showing nothing.
- **Advanced sensor fields stay visible after HA re-render** — the open/closed state of the advanced sections is now managed by LitElement instead of the native `<details>` element, preventing the state from being lost on each re-render.
- **Advanced sensor fields always editable** — fields now use plain `<input>` elements instead of `ha-textfield`, which did not render correctly in some HA environments.

---

## [1.1.4] — 2026-06-30

### Fixed

- **Letter image matching rewritten — now works across all ha-postnl versions** — the previous approach derived an image entity prefix from the letters sensor name and matched by slugified date title. This broke in ha-postnl v4.1.0 which changed the image entity naming scheme from `image.<user>_postnl_letter_<date>` to `image.postnl_<user>_brief_<date>` (different order, Dutch "brief" instead of English "letter"). The matching now uses the unique `id` attribute (`mailitem-xxx`) that ha-postnl sets on both the letter item and its image entity, making it version-independent. Placeholder entities (`unavailable` state or "placeholder" in entity ID) are still excluded.

---

## [1.1.3] — 2026-06-30

### Fixed

- **Placeholder image entities are now skipped when matching letter images** — ha-postnl v4.x creates both a real scan image and a placeholder image entity per letter (e.g. `image.postnl_letter_30_juni` and `image.postnl_letter_30_juni_placeholder`). The matching loop now skips any entity whose ID contains "placeholder", so only the real scan image is assigned to the letter.
- **"Geen afbeelding" text now always shows when a letter image fails to load** — previously, if `letterThumb` was set to a URL that failed to load in the browser, `onerror` hid the `<img>` element but the "geen afbeelding" fallback text was never shown (because `letterThumb` was truthy). The "geen afbeelding" div is now always rendered for letters and hidden via CSS; `onerror` on the image makes it visible when the image fails.

---

## [1.1.2] — 2026-06-30

### Fixed

- **Letter images no longer flicker** — ha-postnl v4.x stores letter images as HA `image.*` entities whose `entity_picture` URL contains a `time=` timestamp that changes on every HA scan. Previously, `updateContent()` rebuilt the entire list DOM on every hass tick, destroying and recreating `<img>` elements even when no parcel data changed. The list is now only rebuilt when items actually change (key, delivered status, or status message). Tab switches and parcel selection always force a re-render as before.
- **Letter images now display correctly** — when a HA `image.*` entity for a letter could not be matched, the card returned an empty thumbnail instead of falling back to the `image_url` that ha-postnl v4.x provides directly in the sensor attributes. The card now always falls back to `image_url` when `image_entity_picture` is unavailable.

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
