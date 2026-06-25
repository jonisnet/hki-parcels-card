# Changelog

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
