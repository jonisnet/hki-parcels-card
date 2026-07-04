# HKI Parcels Card

**Track parcels from PostNL, DHL and DPD in a single Home Assistant card.**

Automatic sensor detection, animated banners, letterbox mail with scan images, and a complete visual editor — no YAML required.

![Dashboard screenshot](https://raw.githubusercontent.com/jonisnet/hki-parcels-card/main/images/screenshot-dashboard.png)

<div class="grid cards" markdown>

-   :package:{ .lg .middle } **Multi-carrier**

    ---

    PostNL, DHL and DPD side by side. Add the same carrier multiple times for multiple accounts.

-   :magic_wand:{ .lg .middle } **Auto sensor detection**

    ---

    Enter your account name — the card finds your sensors and fills in all entity IDs automatically.

-   :frame_with_picture:{ .lg .middle } **Media browser**

    ---

    Browse the HA media library from the editor to pick logos, banners and placeholder images.

-   :envelope:{ .lg .middle } **Letterbox mail**

    ---

    PostNL letters with scan images, split into *Still to be delivered* and *Delivered* sections.

</div>

---

## Quick start

=== "PostNL"

    ```yaml
    type: custom:hki-parcels-card
    title: Parcels
    carriers:
      - type: postnl_v4
        user: my_account
    ```

    !!! tip "Which PostNL type?"
        Use `postnl_v4` for ha-postnl ≥ 4.0.0 (recommended), `postnl` for version 3.x, or `postnl_legacy` for arjenbos/ha-postnl.

=== "DHL"

    ```yaml
    type: custom:hki-parcels-card
    title: Parcels
    carriers:
      - type: dhl
        user: my_account
    ```

=== "DPD"

    ```yaml
    type: custom:hki-parcels-card
    title: Parcels
    carriers:
      - type: dpd
        user: my_account
    ```

=== "All carriers"

    ```yaml
    type: custom:hki-parcels-card
    title: Parcels
    carriers:
      - type: postnl_v4
        user: my_account
      - type: dhl
        user: my_account
      - type: dpd
        user: my_account
    ```

[Installation :material-arrow-right:](installation.md){ .md-button .md-button--primary }
[Configuration :material-arrow-right:](card/configuration.md){ .md-button }

---

## Supported carriers

| Carrier | Integration | Card type |
| ------- | ----------- | --------- |
| **PostNL** (recommended) | [peternijssen/ha-postnl](https://github.com/peternijssen/ha-postnl) ≥ 4.0.0 | `postnl_v4` |
| **PostNL** (v3.x) | [peternijssen/ha-postnl](https://github.com/peternijssen/ha-postnl) ≤ 3.x | `postnl` |
| **PostNL** (arjenbos) | [arjenbos/ha-postnl](https://github.com/arjenbos/ha-postnl) | `postnl_legacy` |
| **DHL** | [peternijssen/ha-dhl-nl](https://github.com/peternijssen/ha-dhl-nl) | `dhl` |
| **DPD** | [peternijssen/ha-dpd](https://github.com/peternijssen/ha-dpd) | `dpd` |

---

!!! note "Part of HKI Elements"
    This card is based on [jimz011/hki-elements](https://github.com/jimz011/hki-elements) — the original PostNL card from the HKI project, extended with multi-carrier support and letterbox mail.
