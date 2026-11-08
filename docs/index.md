# HKI Parcels Card

!!! warning "HKI Parcels Card no longer gets updates"
    Its successor is [HA Parcel Card](https://github.com/jonisnet/ha-parcel-card): the same card,
    still maintained. Both cards can be installed side by side, and most settings carry over.
    [How to move to HA Parcel Card](https://jonisnet.github.io/ha-parcel-card/migrating/)

**Track parcels from PostNL, DHL, DPD, Vinted Go, GLS, Dragonfly, Trunkrs, Cainiao, Hermes, Packeta, Correos, PostNord, Sameday, Swiss Post, Planzer, Austrian Post, Helthjem, Dynalogic, Budbee, Nova Post, Delhivery and SunYou in a single Home Assistant card.**

Automatic sensor detection, animated banners, a 4-step delivery tracker, letterbox mail with scan images, a carrier overview popup, and a complete visual editor — no YAML required.

![Dashboard screenshot](images/screenshot-dashboard.png)

<div class="grid cards" markdown>

-   :package:{ .lg .middle } **Multi-carrier**

    ---

    PostNL, DHL, DPD, Vinted Go, GLS, Dragonfly, Trunkrs, Cainiao, Hermes, Packeta, Correos, PostNord, Sameday, Swiss Post, Planzer, Austrian Post, Helthjem, Dynalogic, Budbee, Nova Post, Delhivery and SunYou side by side. Add the same carrier multiple times for multiple accounts or hubs.

-   :magic_wand:{ .lg .middle } **Auto sensor detection**

    ---

    Enter your account name — the card finds your sensors and fills in all entity IDs automatically, for both known naming schemes.

-   :bell:{ .lg .middle } **Carrier overview popup**

    ---

    Click a carrier's logo in the combo banner to see every parcel and letter for that carrier across all tabs, expandable in place.

-   :heavy_plus_sign:{ .lg .middle } **Add a parcel from the card**

    ---

    Account-less carriers (GLS, Dragonfly, Trunkrs, Cainiao, Hermes, Packeta, Correos, PostNord, Sameday, Swiss Post, Planzer, Austrian Post, Helthjem, Dynalogic, Budbee, Nova Post, Delhivery, SunYou) get a "+ Add parcel" control that registers a tracking number directly.

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
        Use `postnl_v4` ("PostNL") for ha-postnl ≥ 4.0.0 (recommended). `postnl` ("PostNL (<v4.x)") and `postnl_legacy` ("PostNL (ArjenBos)") are being phased out — see [Installation](installation.md#postnl).

=== "DHL / DPD / Vinted Go / GLS"

    ```yaml
    type: custom:hki-parcels-card
    title: Parcels
    carriers:
      - type: dhl
        user: my_account
      - type: dpd
        user: my_account
      - type: vinted_go
        user: my_account
      - type: gls
        user: "1234ab"
    ```

    !!! note "GLS has no account"
        GLS tracks parcels by tracking number and postal code rather than a login — `user` maps to the hub's postal code.

    !!! note "Vinted Go is account-based"
        Vinted Go logs in with an e-mail address and a verification link (no password, no tracking-code entry) — like PostNL/DHL/DPD it has no `track_parcel` service, so it doesn't get the card's "+ Add parcel" control. Unlike every account-less carrier below, it tracks both incoming *and* outgoing parcels.

=== "Dragonfly / Trunkrs / Cainiao / Hermes / Packeta / Correos"

    ```yaml
    type: custom:hki-parcels-card
    title: Parcels
    carriers:
      - type: dragonfly
      - type: trunkrs
        user: "1234ab"
      - type: cainiao
      - type: hermes
      - type: packeta
      - type: correos
    ```

    These six (plus GLS) are a sample of the account-less carriers — register a parcel with the "+ Add parcel" control on the card itself instead of logging into an account. See the "Every carrier" tab for the complete list, and [Add parcel support](card/overview.md#add-parcel-support) for how it works.

=== "Every carrier"

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
      - type: vinted_go
        user: my_account
      - type: gls
        user: "1234ab"
      - type: dragonfly
      - type: trunkrs
        user: "1234ab"
      - type: cainiao
      - type: hermes
      - type: packeta
      - type: correos
      - type: postnord
      - type: sameday
      - type: swiss_post
      - type: planzer
      - type: austrian_post
      - type: helthjem
      - type: dynalogic
      - type: budbee
      - type: nova_post
      - type: delhivery
      - type: sunyou
    ```

Or skip the YAML entirely — add the card via the dashboard UI and it auto-detects every installed carrier integration, pre-filling a fully configured entry for each one it finds.

[Installation :material-arrow-right:](installation.md){ .md-button .md-button--primary }
[Configuration :material-arrow-right:](card/configuration.md){ .md-button }

---

## Supported carriers

All carriers below are part of the [ha-parcel-integrations](https://github.com/ha-parcel-integrations) family — Home Assistant integrations that publish a shared canonical parcel format, which is what lets one card support all of them with the same logic.

| Carrier | Integration | Card type | Account type |
| ------- | ----------- | --------- | ------------ |
| **PostNL** (recommended) | [ha-postnl](https://github.com/ha-parcel-integrations/ha-postnl) ≥ 4.0.0 | `postnl_v4` | Account login |
| **PostNL (<v4.x)**² | [ha-postnl](https://github.com/ha-parcel-integrations/ha-postnl) ≤ 3.x | `postnl` | Account login |
| **PostNL (ArjenBos)**² | [arjenbos/ha-postnl](https://github.com/arjenbos/ha-postnl) | `postnl_legacy` | Account login |
| **DHL** | [ha-dhl-nl](https://github.com/ha-parcel-integrations/ha-dhl-nl) | `dhl` | Account login |
| **DPD** | [ha-dpd](https://github.com/ha-parcel-integrations/ha-dpd) | `dpd` | Account login |
| **Vinted Go** | [ha-vinted-go](https://github.com/ha-parcel-integrations/ha-vinted-go) | `vinted_go` | Account login (e-mail + verification link) |
| **GLS** | [ha-gls](https://github.com/ha-parcel-integrations/ha-gls) | `gls` | Tracking number + postal code |
| **Dragonfly**¹ | [ha-dragonfly](https://github.com/ha-parcel-integrations/ha-dragonfly) | `dragonfly` | Tracking number only |
| **Trunkrs** | [ha-trunkrs](https://github.com/ha-parcel-integrations/ha-trunkrs) | `trunkrs` | Tracking number + postal code |
| **Cainiao** | [ha-cainiao](https://github.com/ha-parcel-integrations/ha-cainiao) | `cainiao` | Tracking number only |
| **Hermes** | [ha-hermes](https://github.com/ha-parcel-integrations/ha-hermes) | `hermes` | Tracking number only |
| **Packeta** | [ha-packeta](https://github.com/ha-parcel-integrations/ha-packeta) | `packeta` | Tracking number only |
| **Correos** | [ha-correos](https://github.com/ha-parcel-integrations/ha-correos) | `correos` | Tracking number only |
| **PostNord** | [ha-postnord](https://github.com/ha-parcel-integrations/ha-postnord) | `postnord` | Tracking number only |
| **Sameday** | [ha-sameday](https://github.com/ha-parcel-integrations/ha-sameday) | `sameday` | Tracking number only |
| **Swiss Post** | [ha-swiss-post](https://github.com/ha-parcel-integrations/ha-swiss-post) | `swiss_post` | Tracking number only |
| **Planzer** | [ha-planzer](https://github.com/ha-parcel-integrations/ha-planzer) | `planzer` | Tracking number only |
| **Austrian Post** | [ha-oesterreichische-post](https://github.com/ha-parcel-integrations/ha-oesterreichische-post) | `austrian_post` | Tracking number only |
| **Helthjem** | [ha-helthjem](https://github.com/ha-parcel-integrations/ha-helthjem) | `helthjem` | Tracking number only |
| **Dynalogic** | [ha-dynalogic](https://github.com/ha-parcel-integrations/ha-dynalogic) | `dynalogic` | Tracking number only |
| **Budbee** | [ha-budbee](https://github.com/ha-parcel-integrations/ha-budbee) | `budbee` | Tracking number only |
| **Nova Post** | [ha-nova-post](https://github.com/ha-parcel-integrations/ha-nova-post) | `nova_post` | Tracking number only |
| **Delhivery** | [ha-delhivery](https://github.com/ha-parcel-integrations/ha-delhivery) | `delhivery` | Tracking number only |
| **SunYou** | [ha-sunyou](https://github.com/ha-parcel-integrations/ha-sunyou) | `sunyou` | Tracking number only |

¹ Created by [Alwin Hummels (@HummelsTech)](https://github.com/HummelsTech), who also maintains it standalone at [HummelsTech/ha-dragonfly](https://github.com/HummelsTech/ha-dragonfly) — see [Installation](installation.md#dragonfly-trunkrs-cainiao-hermes-packeta-correos-postnord-sameday-swiss-post-planzer-austrian-post-helthjem-dynalogic-budbee-nova-post-delhivery-and-sunyou) for details.

² Being phased out — see the [deprecation notice](installation.md#postnl).

!!! note "Add parcel support"
    Only the account-less carriers (GLS, Dragonfly, Trunkrs, Cainiao, Hermes, Packeta, Correos, PostNord, Sameday, Swiss Post, Planzer, Austrian Post, Helthjem, Dynalogic, Budbee, Nova Post, Delhivery, SunYou) get the card's "+ Add parcel" control — PostNL, DHL, DPD and Vinted Go auto-sync every parcel tied to the logged-in account and don't expose a service to register one manually. Full explanation on the [Overview page](card/overview.md#add-parcel-support).

---

!!! note "Part of HKI Elements"
    This card is based on [jimz011/hki-elements](https://github.com/jimz011/hki-elements) — the original PostNL card from the HKI project, extended with multi-carrier support, a carrier overview popup and letterbox mail.
