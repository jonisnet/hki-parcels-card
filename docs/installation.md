# Installation

## Via HACS (recommended)

1. In Home Assistant go to **HACS → Dashboard → Custom repositories**
2. Add `https://github.com/jonisnet/hki-parcels-card` as category **Dashboard**
3. Search for **HKI Parcels Card** and install
4. Restart Home Assistant or clear your browser cache

---

## Manual

1. Download `hki-parcels-card.js` from the [latest release](https://github.com/jonisnet/hki-parcels-card/releases/latest)
2. Place the file at `/config/www/hki-parcels-card.js`
3. Go to **Settings → Dashboards → Resources** and add:

```
/local/hki-parcels-card.js
```

Select type: **JavaScript module**

4. Clear your browser cache (Ctrl+Shift+R / Cmd+Shift+R)

---

## Required Integrations

Install the integrations for the carriers you want to track **before** adding the card.

### PostNL

| Integration | When to use |
| ----------- | ------------ |
| [peternijssen/ha-postnl](https://github.com/peternijssen/ha-postnl) ≥ 4.0.0 | New installs — use card type `postnl_v4` |
| [peternijssen/ha-postnl](https://github.com/peternijssen/ha-postnl) ≤ 3.x | Older installs — use card type `postnl` |
| [arjenbos/ha-postnl](https://github.com/arjenbos/ha-postnl) | Legacy single-entity — use card type `postnl_legacy` |

### DHL and DPD

| Carrier | Integration |
| ------- | ----------- |
| DHL | [peternijssen/ha-dhl-nl](https://github.com/peternijssen/ha-dhl-nl) |
| DPD | [peternijssen/ha-dpd](https://github.com/peternijssen/ha-dpd) |

---

## Optional: PHU Carrier Icons

Install [custom-brand-icons](https://github.com/elax46/custom-brand-icons) via HACS to get branded carrier icons (`phu:postnl`, `phu:dhl`, `phu:dpd`). The card detects the integration automatically — no configuration needed.

---

## Tested Versions

| Integration | Tested version |
| ----------- | --------------- |
| peternijssen/ha-postnl | 4.1.0 |
| peternijssen/ha-dhl-nl | 2.2.0 |
| peternijssen/ha-dpd | 2.2.0 |
