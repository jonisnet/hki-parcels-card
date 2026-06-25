# Changelog

## [1.0.0] — 2026-06-25

Eerste stabiele release.

### Functies

- **Multi-carrier** ondersteuning: PostNL, DHL en DPD in één kaart
- **Automatische sensor-templating** op basis van het account-veld (`sensor.<user>_<carrier>_incoming_parcels` etc.)
- **Canonical schema** voor DHL en DPD (geharmoniseerde attribuutstructuur met `status`-enum, `delivered` bool, `planned_from`/`planned_to`, `pickup_point`)
- **Legacy schema** voor PostNL v3.x (peternijssen/ha-postnl)
- **PostNL (Legacy) modus** voor arjenbos/ha-postnl — één gecombineerde entity
- **Tabbladen**: Onderweg / Bezorgd / Verzonden / Post
- **Pakket-detailpaneel** met Track & Trace nummer, bezorgwijze en trackinglink
- **Brievenpost tab** (PostNL) met automatisch gekoppelde `image.*`-entiteiten per datum
- **Popup** voor brief-scan afbeeldingen
- **Animatieblok** met voertuig-GIF of carrier-chip bij pakket-selectie
- **Aanpasbaar uiterlijk** per carrier: logo, GIF, banner, icoon, kleur
- **Layout-volgorde** aanpasbaar via editor
- **Visuele editor** met automatische sensoren-preview en collapseerbare secties
- Gebaseerd op [jimz011/hki-elements](https://github.com/jimz011/hki-elements)
