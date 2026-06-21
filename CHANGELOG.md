# Changelog — HKI Parcels Card

All notable changes to this standalone fork are documented here.
GitHub release tags follow their own beta counter (`v1.0.bN`), separate
from the `CARD_VERSION` shown in the in-app console banner, which follows
semantic versioning.

## v1.5.0

### Added
- **New carrier type: "Postnl (Legacy)"** (`postnl_legacy`), recreating
  the original (pre-multi-carrier) `hki-postnl-card` exactly:
  - One combined `entity` field holding both en-route and delivered
    parcels, split by each item's own `delivered` flag — the same
    approach the original `getData()`/`getFilteredShipments()` used —
    instead of the four separate `entity_incoming` / `entity_delivered` /
    `entity_outgoing` / `entity_letters` fields the other carrier types
    use.
  - One `distribution_entity` field for sent parcels.
  - No letters/Post tab support and no sensor-name templating (no
    `user` field) — the original never had either, so this type
    doesn't either; the full entity_id is entered directly, exactly
    like the original card's editor.
  - Default logo/van/banner assets point to **jimz011's original**
    `hki-postnl-card` images (not this repository's own `images/`
    folder), since this type specifically recreates that exact look.
  - The editor hides the sensor-templating and "Geavanceerd: sensoren
    handmatig overschrijven" sections for this type (neither applies),
    while still allowing icon/color/logo/van/banner overrides under
    "Geavanceerd: uiterlijk overschrijven".

## v1.4.0

### Changed
- **Letters now move from "Post" to "Bezorgd" once their date has
  passed**, instead of the Post tab always showing every letter
  regardless of date. Post now shows only letters dated today or in the
  future; past letters appear in Bezorgd (subject to the same
  `days_back` cutoff as parcels), consistent with how the original
  request was meant to work.
- **Layout Volgorde's up/down buttons moved to the left** of each row,
  before the label — matching the left-aligned icon/chevron pattern used
  in the Carriers section, instead of being right-aligned.
- **"Geavanceerd: ..." sections and "+ Carrier toevoegen" are now styled
  as clear buttons** with a thin border, instead of looking like plain
  text. The unreliable `mwc-button` for "+ Carrier toevoegen" was also
  replaced with a plain HTML `<button>`, consistent with the earlier
  `ha-textfield` reliability fixes.

## v1.3.1

### Added
- **DPD now has a built-in banner asset** (`DPD_banner.png`), shown as
  the animation panel background when DPD is the only configured
  carrier — matching the existing PostNL and DHL banners. Only the van
  GIF remains unavailable for DHL/DPD.

## v1.3.0

### Added
- **All main editor sections are now collapsible** (Basis Instellingen,
  Carriers, Layout Volgorde, Weergave Opties, Uiterlijk), via native
  `<details>` elements with a rotating disclosure arrow.
- **Carrier logo in the header**, shown when exactly 1 carrier is
  configured — this existed in the original `hki-postnl-card` but had
  never actually been wired up in this fork until now.
- **"Bezorgwijze" (delivery method) detail row for DHL/DPD**, based on
  the confirmed `pickup` / `pickup_point` fields from the official
  `ha-dhl-nl` integration: shows "Thuisbezorging" or "Afhaalpunt
  (<name>)".
- **Universal "Type" detail row**: every item shows "Pakket" except
  PostNL letters, which show "Brief" — derived directly from the
  existing `is_letter` flag rather than a carrier-specific field (no
  such field exists in any of the supported integrations; the
  parcel-vs-letter distinction is PostNL-only by definition).
- **Delivered letters now also appear in the "Bezorgd" tab**, using the
  same `days_back` cutoff as parcels. The "Post" tab itself keeps
  showing every letter regardless of date — only the Bezorgd tab applies
  the time window, so "Bezorgd" consistently means "within the
  configured window" for both parcels and letters.

### Changed
- **Letter images no longer appear in the animation panel.** The Post
  tab's special-cased image display has been removed (the now-dead
  `_updateLetterImage` method too); the animation panel falls through to
  the normal no-selection background (carrier banner/logo or
  `placeholder_image`) for every tab, including Post. Letter images are
  now shown exclusively as a clickable thumbnail in the expanded list
  item, as intended.

### Fixed
- **"Uiterlijk" section showed no fields at all.** Same root cause as
  the earlier "Basis Instellingen" issue: `ha-textfield` elements failing
  to render in an environment running many other custom cards. Replaced
  with plain HTML inputs, consistent with the existing fix.
- **Placeholder-image letters still showed a thumbnail when a local
  `image.*` entity was available.** The `is_placeholder_image` check
  (detecting PostNL's generic `letter_placeholder.png`) only applied to
  the external `image_url` fallback path — not to the local
  `image_entity_picture` path that's actually used once a prefix is
  derived. The check now applies regardless of which image source ends
  up being used, so letters without a real scan never show a thumbnail.



### Fixed
- **Expanding a parcel in the list did nothing.** Clicking a parcel's
  header correctly tracked the selection and triggered a re-render, but
  the wrapping `.parcel` element never actually received the `selected`
  CSS class that the expand/collapse animation, the chevron rotation, and
  the additional info (including the Track & Trace link) all depend on.
  This bug had been present since the very first version of this card —
  it just hadn't surfaced yet. The selected state is now derived directly
  from `this._selectedParcel` every time a parcel row is rendered.

### Added
- **Letters-today count in the header.** The header stats line now shows
  a third number — `X onderweg • Y recent • Z brieven` — counting how
  many letters in the Post tab are dated today. Only appears when at
  least one configured carrier has a letters entity set; carriers without
  letter support (DHL, DPD) don't trigger it.

## v1.1.0 — built-in carrier assets

### Added
- **Built-in logo/van/banner per carrier type**, hosted in this
  repository's own `images/` folder, used automatically whenever a
  carrier's `logo_path` / `van_path` / `banner_path` is left blank —
  mirroring how the original `hki-postnl-card` always had a working
  PostNL logo/van/banner out of the box via hardcoded defaults, just
  applied per carrier type (`postnl`, `dhl`, `dpd`) instead of being a
  single global default. Manual overrides still take priority when set.
- New `banner_path` field per carrier: a wide background image shown in
  the animation panel specifically when that carrier is the only one
  configured — the same role the original card's `DEFAULT_BANNER` played,
  kept separate from the smaller `logo_path` used for branding.
- DPD currently only ships a logo asset; its `van`/`banner` defaults are
  `null` until those assets exist, so the card shows no image for that
  slot rather than guessing a wrong URL.

## v1.0.0 — initial standalone release

Forked from the PostNL card in
[jimz011/hki-elements](https://github.com/jimz011/hki-elements) and
rebuilt as `hki-parcels-card`, a generic multi-carrier parcel tracker.
See the README for the full feature list carried over and added since
the fork (multi-carrier support, sensor templating, letter-image
matching, collapsible editor sections, and more).
