# Changelog — HKI Parcels Card

All notable changes to this standalone fork are documented here.
GitHub release tags follow their own beta counter (`v1.0.bN`), separate
from the `CARD_VERSION` shown in the in-app console banner, which follows
semantic versioning.

## v1.2.0 — GitHub release `v1.0.b2` ("Beta2")

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
