# HKI Parcels Card

A multi-carrier parcel tracking card for Home Assistant. Track parcels from PostNL, DHL and DPD in a single unified view.

> **Based on** [jimz011/hki-elements](https://github.com/jimz011/hki-elements) — the original PostNL card from the HKI project.

---

## Quick Start

```yaml
type: custom:hki-parcels-card
title: My Parcels
carriers:
  - type: postnl_v4
    user: my_account
```

→ [Installation](installation.md) · [Configuration](card/configuration.md) · [Examples](card/examples.md)

---

## Supported Carriers

| Carrier | Integration |
| ------- | ----------- |
| **PostNL** (v4.x) | [peternijssen/ha-postnl](https://github.com/peternijssen/ha-postnl) ≥ 4.0.0 |
| **PostNL** (v3.x) | [peternijssen/ha-postnl](https://github.com/peternijssen/ha-postnl) ≤ 3.x |
| **PostNL** (arjenbos) | [arjenbos/ha-postnl](https://github.com/arjenbos/ha-postnl) |
| **DHL** | [peternijssen/ha-dhl-nl](https://github.com/peternijssen/ha-dhl-nl) |
| **DPD** | [peternijssen/ha-dpd](https://github.com/peternijssen/ha-dpd) |

---

## Features at a Glance

- **Multi-carrier** — PostNL, DHL and DPD in one card
- **Automatic sensor names** — enter only the account name
- **Letters tab** — PostNL letterbox mail with scan images
- **Tabs** — In Transit / Delivered / Sent / Letters
- **Visual editor** — full configuration through the Home Assistant UI
- **PHU icons** — automatic carrier icons via [custom-brand-icons](https://github.com/elax46/custom-brand-icons)
- **Animation** — van animation for the selected parcel
- **Carrier colours** — PostNL orange, DHL yellow, DPD red

!!! note
    This card is also available as part of [jimz011/hki-elements](https://github.com/jimz011/hki-elements).
