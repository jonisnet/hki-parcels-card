# HKI Parcels Card

Een Home Assistant Lovelace card voor het bijhouden van pakketten van meerdere bezorgdiensten (PostNL, DHL, DPD) in één overzicht.

> **Gebaseerd op** [jimz011/hki-elements](https://github.com/jimz011/hki-elements) — de originele PostNL-kaart uit het HKI project. Deze fork is uitgebreid met multi-carrier ondersteuning, automatische sensor-templating en briefpost-weergave.

---

## Vereiste integraties

Deze kaart haalt data op uit Home Assistant sensor-entiteiten die worden aangemaakt door de onderstaande integraties. **Installeer de integraties voor de bezorgdiensten die je gebruikt vóórdat je de kaart instelt.**

| Bezorgdienst | Integratie | Schema |
|---|---|---|
| **PostNL** | [peternijssen/ha-postnl](https://github.com/peternijssen/ha-postnl) | `legacy` (v3.x) · `canonical` (v4.0.0+) |
| **DHL** | [peternijssen/ha-dhl-nl](https://github.com/peternijssen/ha-dhl-nl) | `canonical` |
| **DPD** | [peternijssen/ha-dpd](https://github.com/peternijssen/ha-dpd) | `canonical` |

> **PostNL v4.0.0:** De ha-postnl integratie wordt bijgewerkt naar v4.0.0, waarbij sensoren en attributen gelijk worden aan DHL en DPD. Gebruik dan schema `canonical` in de kaart-configuratie.

---

## PostNL Legacy — geen verdere updates

De kaart heeft een **PostNL (Legacy)** modus die gebaseerd is op de integratie van [arjenbos/ha-postnl](https://github.com/arjenbos/ha-postnl). **Deze modus krijgt geen verdere updates zolang die repository niet actief wordt bijgehouden.** Gebruik de standaard PostNL-optie (peternijssen/ha-postnl) voor nieuwe installaties.

---

## Installatie

### Via HACS (aanbevolen)

1. Ga in Home Assistant naar **HACS → Dashboard → Aangepaste repositories**
2. Voeg `https://github.com/jonisnet/hki-parcels-card` toe als categorie **Dashboard**
3. Zoek naar **HKI Parcels Card** en installeer
4. Herstart Home Assistant of vernieuw de browsercache

### Handmatig

1. Download `hki-parcels-card.js` uit deze repository
2. Plaats het bestand in `/config/www/hki-parcels-card.js`
3. Ga naar **Instellingen → Dashboards → Bronnen** en voeg toe:
   ```
   /local/hki-parcels-card.js
   ```
   (Type: JavaScript module)
4. Vernieuw de browsercache (Ctrl+Shift+R)

---

## Configuratie

### Minimale configuratie (één carrier)

```yaml
type: custom:hki-parcels-card
title: Mijn Pakketten
carriers:
  - type: dhl
    user: mijn_account
```

Het `user`-veld is het deel van je sensornaam vóór `_dhl_incoming_parcels`. De kaart bouwt de sensornamen automatisch op.

### Meerdere carriers

```yaml
type: custom:hki-parcels-card
title: Pakketten
carriers:
  - type: postnl
    user: jouw_naam
  - type: dhl
    user: jouw_naam
  - type: dpd
    user: jouw_naam
```

### Alle opties

```yaml
type: custom:hki-parcels-card
title: Pakketten
days_back: 90               # Hoeveel dagen bezorgde pakketten tonen
show_delivered: true        # Tab "Bezorgd" tonen
show_sent: true             # Tab "Verzonden" tonen
show_letters: true          # Tab "Post" tonen (PostNL-brieven)
show_animation: true        # Animatieblok tonen bij pakket-selectie
show_header: true           # Header met titel en statistieken tonen
show_placeholder: true      # Achtergrondafbeelding tonen
header_color: ''            # Achtergrondkleur van de header
header_text_color: ''       # Tekstkleur van de header
placeholder_image: ''       # URL naar een eigen achtergrondafbeelding
layout_order:               # Volgorde van de blokken
  - header
  - animation
  - tabs
  - list
carriers:
  - type: postnl            # postnl · dhl · dpd · postnl_legacy · custom
    user: jouw_naam         # Account-deel van de sensornaam
    # Optioneel uiterlijk overschrijven:
    name: PostNL
    icon: mdi:email-fast
    color: '#ed8c00'
    logo_path: ''
    van_path: ''
    banner_path: ''
    # Sensoren handmatig overschrijven (normaal niet nodig):
    entity_incoming: sensor.jouw_naam_postnl_incoming_parcels
    entity_delivered: sensor.jouw_naam_postnl_delivered_parcels
    entity_outgoing: sensor.jouw_naam_postnl_outgoing_parcels
    entity_letters: sensor.jouw_naam_postnl_letters
```

### PostNL (Legacy) — arjenbos/ha-postnl

```yaml
carriers:
  - type: postnl_legacy
    entity: sensor.postnl_delivery
    distribution_entity: sensor.postnl_distribution   # optioneel
```

> **Let op:** deze modus ontvangt geen verdere updates zolang [arjenbos/ha-postnl](https://github.com/arjenbos/ha-postnl) niet wordt bijgewerkt.

---

## Sensor-schema's

| Schema | Wanneer gebruiken |
|---|---|
| `legacy` | PostNL via peternijssen/ha-postnl v3.x (huidige standaard) |
| `canonical` | DHL, DPD, en PostNL v4.0.0+ |
| `single_entity` | PostNL via arjenbos/ha-postnl (automatisch bij type `postnl_legacy`) |

---

## Functies

- **Multi-carrier** — PostNL, DHL en DPD naast elkaar in één kaart
- **Automatische sensornamen** — vul alleen het account-deel in, de rest wordt automatisch opgebouwd
- **Tabbladen** — Onderweg / Bezorgd / Verzonden / Post
- **Pakket-details** — klik op een pakket voor Track & Trace, bezorgwijze en directe trackinglink
- **Brievenpost** — PostNL-brieven met scan-afbeeldingen uit `image.*`-entiteiten
- **Animatie** — voertuig-animatie bij geselecteerd pakket
- **Aanpasbaar uiterlijk** — eigen logo, GIF, banner en kleuren per carrier

---

## Attribuut-ondersteuning per schema

| Attribuut | canonical (DHL/DPD/PostNL v4+) | legacy (PostNL v3) |
|---|---|---|
| `barcode` | ✅ | ✅ |
| `sender` | ✅ | ✅ |
| `status` (enum) | ✅ | — (vrije tekst) |
| `raw_status` | ✅ | ✅ |
| `delivered` (bool) | ✅ | afgeleid uit status |
| `delivered_at` | ✅ | — |
| `planned_from` / `planned_to` | ✅ | `delivery_date` |
| `pickup` / `pickup_point` | ✅ | — |
| `url` | ✅ | ✅ |

---

## Licentie

Zie het [LICENSE](LICENSE) bestand.

---

## Dankwoord

- [jimz011/hki-elements](https://github.com/jimz011/hki-elements) — originele PostNL-kaart en visueel ontwerp waarop deze fork is gebaseerd
- [peternijssen/ha-postnl](https://github.com/peternijssen/ha-postnl) — PostNL integratie
- [peternijssen/ha-dhl-nl](https://github.com/peternijssen/ha-dhl-nl) — DHL integratie
- [peternijssen/ha-dpd](https://github.com/peternijssen/ha-dpd) — DPD integratie
- [arjenbos/ha-postnl](https://github.com/arjenbos/ha-postnl) — legacy PostNL integratie
