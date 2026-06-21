// ============================================================
// HKI Parcels Card (standalone fork)
// ============================================================
//
// A generic, multi-carrier parcel-tracking card for Home Assistant
// (PostNL, DHL, DPD, ...), with automatic per-carrier sensor templating
// and a dedicated "Post" tab for PostNL letterbox mail.
//
// This card started as a fork of the PostNL card from jimz011/hki-elements
// (https://github.com/jimz011/hki-elements), originally a single-carrier
// PostNL tracking card. It has since been substantially rewritten to
// support multiple carriers, multiple account "users" per carrier, and
// letter-image matching against Home Assistant's local image.* entities.
// All credit for the original visual design and the PostNL card concept
// goes to jimz011. See README.md for full attribution details.
//
// License: see LICENSE file in this repository.

// Self-contained Lit access: reuses the Lit instance Home Assistant's own
// frontend already loaded (via a known HA element's prototype chain),
// the same approach Home Assistant itself recommends for custom cards.
// This avoids a second network fetch of Lit and avoids depending on any
// global setup from another bundle (e.g. the original hki-elements.js).
window.HKI = window.HKI || {};

window.HKI.getLit = window.HKI.getLit || (() => {
  let cache = null;
  return () => {
    if (cache) return cache;
    const base =
      customElements.get("hui-masonry-view") ||
      customElements.get("ha-panel-lovelace") ||
      customElements.get("ha-app");
    const LitElementRef = base ? Object.getPrototypeOf(base) : window.LitElement;
    const htmlRef = LitElementRef?.prototype?.html || window.html;
    const cssRef = LitElementRef?.prototype?.css || window.css;
    cache = { LitElement: LitElementRef, html: htmlRef, css: cssRef };
    return cache;
  };
})();

// Normalize value extraction for HA select/text events across versions.
window.HKI.getSelectValue = window.HKI.getSelectValue || ((ev, options = null) => {
  const detailValue = ev?.detail?.value;
  if (detailValue !== undefined && detailValue !== null) return detailValue;
  const targetValue = ev?.target?.value;
  if (targetValue !== undefined && targetValue !== null) return targetValue;
  const currentValue = ev?.currentTarget?.value;
  if (currentValue !== undefined && currentValue !== null) return currentValue;
  const idx = Number(ev?.detail?.index);
  if (Number.isInteger(idx) && idx >= 0) {
    if (Array.isArray(options)) {
      const opt = options[idx];
      if (opt && typeof opt === "object") {
        if (opt.value !== undefined) return opt.value;
        if (opt.label !== undefined) return opt.label;
      }
      if (opt !== undefined) return opt;
    }
    const listItems = ev?.currentTarget?.items || ev?.target?.items;
    const item = Array.isArray(listItems)
      ? listItems[idx]
      : (listItems?.item ? listItems.item(idx) : null);
    const itemValue = item?.value ?? item?.getAttribute?.("value");
    if (itemValue !== undefined && itemValue !== null) return itemValue;
  }
  return undefined;
});


// ============================================================
// hki-parcels-card
// ============================================================

(() => {
// HKI Parcels Card — generic multi-carrier parcel tracker.
// Supports any number of carriers (PostNL, DHL, DPD, ...) in one card,
// each contributing up to 4 sensors: incoming, delivered, outgoing, letters.
//
// Two source data shapes are supported per carrier via `schema`:
//   - "canonical": the normalize_parcel() shape used by ha-dhl-nl and any
//     future carrier integration that's been aligned to it. Fields:
//     carrier, barcode, sender, status (ParcelStatus enum string), raw_status,
//     delivered (bool), delivered_at, planned_from, planned_to, pickup,
//     pickup_point, url, raw.
//   - "legacy": the current peternijssen/arjenbos ha-postnl shape, which has
//     not been aligned to the canonical schema yet. Fields seen in practice:
//     barcode, sender, status (free text), delivery_date. No "delivered"
//     boolean, no canonical status enum.
const { LitElement, html, css } = window.HKI.getLit();
const CARD_VERSION = 'v1.2.0';
console.info(`%c HKI-PARCELS-CARD %c ${CARD_VERSION} `, 'color: white; background: #ed8c00; font-weight: bold;', 'color: #ed8c00; background: white; font-weight: bold;');

const DEFAULT_CARRIER_ICON = 'mdi:package-variant-closed';
const DEFAULT_CARRIER_COLOR = '#ed8c00';
const DEFAULT_PLACEHOLDER_IMAGE = 'https://github.com/jonisnet/hki-parcels-card/blob/main/images/dutch-parcels.png?raw=true';

// Per-carrier-type default assets (logo, van GIF, banner) hosted in this
// repository's own images/ folder, mirroring how the original
// hki-postnl-card hardcoded DEFAULT_LOGO/DEFAULT_VAN/DEFAULT_BANNER as
// always-working fallbacks. These are used whenever a carrier's own
// logo_path/van_path/banner_path field is left blank, so PostNL/DHL/DPD
// work visually out of the box without the user having to supply any URLs.
// DPD currently only has a logo asset available; its van/banner fields are
// left null until those assets exist, in which case the card simply shows
// no image for that slot rather than guessing a wrong URL.
const CARRIER_ASSETS = {
    postnl: {
        logo: 'https://github.com/jonisnet/hki-parcels-card/blob/main/images/postnl-logo.png?raw=true',
        van: 'https://github.com/jonisnet/hki-parcels-card/blob/main/images/postnl-van.gif?raw=true',
        banner: 'https://github.com/jonisnet/hki-parcels-card/blob/main/images/postnl-banner.jpg?raw=true'
    },
    dhl: {
        logo: 'https://github.com/jonisnet/hki-parcels-card/blob/main/images/DHL_logo.png?raw=true',
        van: null,
        banner: 'https://github.com/jonisnet/hki-parcels-card/blob/main/images/DHL_banner.png?raw=true'
    },
    dpd: {
        logo: 'https://github.com/jonisnet/hki-parcels-card/blob/main/images/DPD_logo.png?raw=true',
        van: null,
        banner: null
    },
    custom: { logo: null, van: null, banner: null }
};

// Per-carrier-type defaults used to auto-fill icon/color/schema when the
// user picks a carrier type in the editor. supports_letters controls
// whether the "Post / Brieven" entity field is shown at all for that type —
// only PostNL has a letters concept in the real integrations this card
// targets (peternijssen/ha-postnl). User-entered values always take
// precedence over these defaults; they're just the starting point.
// sensor_slug is the carrier-specific part of the entity_id pattern used by
// these integrations: sensor.<user>_<sensor_slug>_incoming_parcels, etc.
// "custom" has no fixed pattern (null), so its entities must be entered
// manually — there's nothing to template against.
const CARRIER_PRESETS = {
    postnl: { label: 'PostNL', icon: 'mdi:email-fast', color: '#ed8c00', schema: 'legacy', supports_letters: true, sensor_slug: 'postnl' },
    dhl: { label: 'DHL', icon: 'mdi:truck', color: '#ffcc00', schema: 'canonical', supports_letters: false, sensor_slug: 'dhl' },
    dpd: { label: 'DPD', icon: 'mdi:truck-fast', color: '#dc0032', schema: 'canonical', supports_letters: false, sensor_slug: 'dpd' },
    custom: { label: 'Anders / Custom', icon: 'mdi:package-variant-closed', color: '#ed8c00', schema: 'canonical', supports_letters: false, sensor_slug: null }
};

// Builds the four standard entity_ids for a carrier from its "user" account
// slug, following the sensor.<user>_<carrier>_<suffix> pattern used by the
// ha-postnl / ha-dhl-nl family of integrations. Returns null fields when no
// pattern applies (custom carrier, or no user value entered yet) so callers
// can tell "not applicable" apart from "deliberately blank".
function buildTemplatedEntities(user, carrierType) {
    const preset = CARRIER_PRESETS[carrierType] || CARRIER_PRESETS.custom;
    const slug = preset.sensor_slug;
    const u = String(user || '').trim();
    if (!u || !slug) {
        return { entity_incoming: null, entity_delivered: null, entity_outgoing: null, entity_letters: null };
    }
    return {
        entity_incoming: `sensor.${u}_${slug}_incoming_parcels`,
        entity_delivered: `sensor.${u}_${slug}_delivered_parcels`,
        entity_outgoing: `sensor.${u}_${slug}_outgoing_parcels`,
        entity_letters: preset.supports_letters ? `sensor.${u}_${slug}_letters` : null
    };
}

// Canonical ParcelStatus values (mirrors const.py ParcelStatus in ha-dhl-nl).
// Used to interpret "canonical" schema parcels without guessing.
const CANONICAL_DELIVERED_STATUSES = new Set(['delivered']);

class HkiParcelsCard extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this._activeTab = 'onderweg';
        this._selectedParcel = null;
        this._isRendered = false;
    }

    set hass(hass) {
        this._hass = hass;
        if (this.config && this._isRendered) {
            this.updateContent();
        } else if (this.config) {
            this.render();
        }
    }

    setConfig(config) {
        this.config = {
            title: 'Pakketten',
            days_back: 90,
            show_delivered: true,
            show_sent: true,
            show_letters: true,
            show_animation: true,
            show_header: true,
            show_placeholder: true,
            header_color: '',
            header_text_color: '',
            placeholder_image: DEFAULT_PLACEHOLDER_IMAGE,
            carriers: [],
            layout_order: ['header', 'animation', 'tabs', 'list'],
            ...config
        };

        if (!Array.isArray(this.config.carriers)) {
            this.config.carriers = [];
        }

        if (!Array.isArray(this.config.layout_order) || this.config.layout_order.length === 0) {
            this.config.layout_order = ['header', 'animation', 'tabs', 'list'];
        }

        if (this._hass) {
            this.render();
        }
    }

    static getConfigElement() {
        return document.createElement("hki-parcels-card-editor");
    }

    static getStubConfig() {
        return {
            title: "Pakketten",
            days_back: 90,
            show_delivered: true,
            show_sent: true,
            show_letters: true,
            show_animation: true,
            show_header: true,
            show_placeholder: true,
            header_color: '',
            header_text_color: '',
            placeholder_image: DEFAULT_PLACEHOLDER_IMAGE,
            carriers: [
                {
                    type: 'postnl',
                    name: 'PostNL',
                    icon: 'mdi:email-fast',
                    color: '#ed8c00',
                    schema: 'legacy',
                    logo_path: '',
                    van_path: '',
                    banner_path: '',
                    entity_incoming: 'sensor.postnl_incoming_parcels',
                    entity_delivered: 'sensor.postnl_delivered_parcels',
                    entity_outgoing: 'sensor.postnl_outgoing_parcels',
                    entity_letters: 'sensor.postnl_letters'
                },
                {
                    type: 'dhl',
                    name: 'DHL',
                    icon: 'mdi:truck',
                    color: '#ffcc00',
                    schema: 'canonical',
                    logo_path: '',
                    van_path: '',
                    banner_path: '',
                    entity_incoming: 'sensor.dhl_incoming_parcels',
                    entity_delivered: 'sensor.dhl_delivered_parcels',
                    entity_outgoing: 'sensor.dhl_outgoing_parcels',
                    entity_letters: ''
                }
            ],
            layout_order: ['header', 'animation', 'tabs', 'list']
        };
    }

    getCardSize() {
        return 4;
    }

    formatDate(dateStr) {
        if (!dateStr) return "";
        return new Date(dateStr).toLocaleDateString('nl-NL', {
            day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
        });
    }

    // ------------------------------------------------------------------
    // Per-carrier, per-schema normalization
    // ------------------------------------------------------------------

    // Pull the raw parcel array out of a sensor's attributes, regardless of
    // which attribute name the integration chose to expose it under.
    _extractRawList(attrs) {
        if (!attrs) return [];
        if (Array.isArray(attrs)) return attrs;

        const normalized = Object.entries(attrs).reduce((acc, [key, value]) => {
            acc[String(key).toLowerCase()] = value;
            return acc;
        }, {});

        const groupedKeys = ['enroute', 'en_route', 'delivered'];
        const groupedShipments = groupedKeys.flatMap((key) => Array.isArray(normalized[key]) ? normalized[key] : []);
        if (groupedShipments.length) return groupedShipments;

        if (Array.isArray(normalized.shipments)) return normalized.shipments;
        if (Array.isArray(normalized.parcels)) return normalized.parcels;
        if (Array.isArray(normalized.letters)) return normalized.letters;

        return Object.values(attrs).filter((item) => item && typeof item === 'object');
    }

    // "canonical" schema (normalize_parcel() shape from ha-dhl-nl, and any
    // future carrier aligned to it): fields are already clean, just carry
    // them through and make sure key/name/status_message exist.
    // Centralizes the per-carrier branding fields so all three normalization
    // sites (canonical parcels, legacy parcels, letters) stay in sync when a
    // new branding field is added, instead of repeating the same fallbacks
    // in three places.
    //
    // logo/van/banner fall back to this carrier type's built-in asset (see
    // CARRIER_ASSETS) when the user hasn't set their own — the same
    // always-works-out-of-the-box behaviour the original hki-postnl-card
    // had via its hardcoded DEFAULT_LOGO/DEFAULT_VAN/DEFAULT_BANNER, just
    // applied per carrier type instead of being a single global default.
    _carrierBranding(carrier) {
        const assets = CARRIER_ASSETS[carrier.type] || CARRIER_ASSETS.custom;
        return {
            carrier_name: carrier.name,
            carrier_icon: carrier.icon || DEFAULT_CARRIER_ICON,
            carrier_color: carrier.color || DEFAULT_CARRIER_COLOR,
            carrier_logo: carrier.logo_path || assets.logo || '',
            carrier_van: carrier.van_path || assets.van || '',
            carrier_banner: carrier.banner_path || assets.banner || ''
        };
    }

    _normalizeCanonical(item, carrier) {
        const statusEnum = item.status || 'unknown';
        const delivered = typeof item.delivered === 'boolean'
            ? item.delivered
            : CANONICAL_DELIVERED_STATUSES.has(statusEnum);

        return {
            ...item,
            key: item.barcode || item.key || item.id,
            name: item.sender ? `Pakket van ${item.sender}` : (item.name || 'Onbekend'),
            status_message: this._canonicalStatusLabel(statusEnum, item.pickup),
            delivered,
            delivery_date: item.delivered_at || item.planned_from || item.delivery_date,
            planned_date: item.planned_from,
            ...this._carrierBranding(carrier)
        };
    }

    // Human-readable (Dutch) label for a canonical ParcelStatus enum value.
    _canonicalStatusLabel(statusEnum, pickup) {
        const labels = {
            registered: 'Aangemeld',
            in_transit: 'Onderweg',
            out_for_delivery: 'Vandaag bezorgd',
            at_pickup_point: pickup ? 'Te afhalen' : 'Bij afhaalpunt',
            delivered: 'Bezorgd',
            returning: 'Retour naar verzender',
            problem: 'Probleem',
            unknown: 'Onbekend'
        };
        return labels[statusEnum] || statusEnum;
    }

    // "legacy" schema (current peternijssen/arjenbos ha-postnl shape):
    // barcode/sender/status(free text)/delivery_date, no canonical enum,
    // no explicit "delivered" boolean for the combined-sensor case.
    _normalizeLegacy(item, carrier) {
        const key = item.key || item.barcode || item.id || item.trackingcode || item.tracking_number;
        const name = item.name
            || (item.sender ? `Pakket van ${item.sender}` : null)
            || item.description
            || item.title;
        const statusMessage = item.status_message || item.status || item.statusdescription;

        let delivered = item.delivered;
        if (delivered === undefined || delivered === null) {
            const statusLower = String(statusMessage || '').toLowerCase();
            delivered = statusLower.includes('bezorgd') || statusLower.includes('afgeleverd') || statusLower.includes('delivered');
        }

        return {
            ...item,
            key,
            name: name || 'Onbekend',
            status_message: statusMessage,
            delivered: !!delivered,
            ...this._carrierBranding(carrier)
        };
    }

    _normalizeItem(item, carrier) {
        if (!item || typeof item !== 'object') return null;
        return carrier.schema === 'canonical'
            ? this._normalizeCanonical(item, carrier)
            : this._normalizeLegacy(item, carrier);
    }

    _getCarrierSensorItems(carrier, entityField) {
        const entityId = carrier[entityField];
        if (!entityId || !this._hass) return [];
        const stateObj = this._hass.states[entityId];
        if (!stateObj) return [];
        return this._extractRawList(stateObj.attributes)
            .map(item => this._normalizeItem(item, carrier))
            .filter(Boolean);
    }

    // ------------------------------------------------------------------
    // Aggregated data across all configured carriers
    // ------------------------------------------------------------------

    // Returns { onderweg: [...], bezorgd: [...], verzonden: [...], post: [...] },
    // each item carrying carrier_name/carrier_icon/carrier_color so the list
    // can render grouped-by-carrier sections, or null if no carrier sensors
    // are configured/found at all (used to show the setup error state).
    getData() {
        const carriers = this.config.carriers || [];
        if (carriers.length === 0) return null;

        const anyConfigured = carriers.some(c => c.entity_incoming || c.entity_delivered || c.entity_outgoing || c.entity_letters);
        if (!anyConfigured) return null;

        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - (this.config.days_back || 90));

        let onderweg = [];
        let bezorgd = [];
        let verzonden = [];
        let post = [];

        carriers.forEach(carrier => {
            const incoming = this._getCarrierSensorItems(carrier, 'entity_incoming').map(i => ({ ...i, delivered: false }));
            const delivered = this._getCarrierSensorItems(carrier, 'entity_delivered').map(i => ({ ...i, delivered: true }));

            // De-duplicate by key in case a parcel briefly appears in both
            // sensors during a status transition; keep the delivered version.
            const byKey = new Map();
            incoming.concat(delivered).forEach(item => {
                const key = item.key || JSON.stringify(item);
                const existing = byKey.get(key);
                if (!existing || item.delivered) byKey.set(key, item);
            });

            const merged = Array.from(byKey.values()).filter(item => {
                if (!item.delivered) return true;
                const dDate = new Date(item.delivery_date || item.planned_date || 0);
                return dDate >= cutoffDate;
            });

            onderweg = onderweg.concat(merged.filter(i => !i.delivered));
            bezorgd = bezorgd.concat(merged.filter(i => i.delivered));

            verzonden = verzonden.concat(this._getCarrierSensorItems(carrier, 'entity_outgoing'));

            post = post.concat(this._getCarrierLetters(carrier));
        });

        return { onderweg, bezorgd, verzonden, post };
    }

    // Letters have their own shape entirely (id/title/date/unread/image_url),
    // unrelated to the parcel-oriented legacy/canonical schemas, so they get
    // their own normalization path instead of going through _normalizeItem().
    // Mirrors how Home Assistant slugifies entity names from a friendly title:
    // lowercase, spaces become underscores. This is a best-effort approximation
    // based on observed entity_ids ("18 juni" -> "18_juni") — if a title ever
    // contains characters HA slugifies differently, the count-check in
    // _getCarrierLetters will catch the resulting mismatch and fall back safely.
    _slugify(text) {
        return String(text || '')
            .toLowerCase()
            .trim()
            .replace(/[^a-z0-9]+/g, '_')
            .replace(/^_+|_+$/g, '');
    }

    // Derives the image.* entity prefix from the letters sensor's own
    // entity_id, since both are generated by the same ha-postnl integration
    // from the same account name: "sensor.<account>_postnl_letters" becomes
    // "image.<account>_postnl_letter". No manual configuration needed.
    // Returns null if entityId doesn't match the expected "..._letters"
    // pattern, so the caller can fall back to the external image_url instead
    // of guessing a wrong prefix.
    _deriveLetterImagePrefix(entityId) {
        const match = /^sensor\.(.+)_letters$/.exec(entityId || '');
        if (!match) return null;
        return `image.${match[1]}_letter`;
    }

    _getCarrierLetters(carrier) {
        const entityId = carrier.entity_letters;
        if (!entityId || !this._hass) return [];
        const stateObj = this._hass.states[entityId];
        if (!stateObj) return [];

        const rawList = this._extractRawList(stateObj.attributes);
        const imagePrefix = this._deriveLetterImagePrefix(entityId);

        const letters = rawList.map((item, idx) => {
            const dateStr = item.date || item.delivery_date || null;
            const isPlaceholder = !!(item.image_url && /letter_placeholder/i.test(item.image_url));

            return {
                is_letter: true,
                delivered: true,
                key: item.id || item.key || `letter-${carrier.name}-${idx}`,
                name: item.title || (dateStr ? `Post van ${dateStr}` : 'Brievenbuspost'),
                status_message: item.unread ? 'Ongelezen' : 'Brievenbuspost',
                delivery_date: dateStr,
                unread: !!item.unread,
                image_url: item.image_url || '',
                is_placeholder_image: isPlaceholder,
                // Filled in below if a matching image.* entity is found.
                image_entity_picture: '',
                // When true, the external image_url is never used as a display
                // fallback — a missing/mismatched local entity shows the
                // "no match" placeholder instead, since the external scan URL
                // is known to be unreliable (requires a PostNL browser login).
                has_image_prefix: !!imagePrefix,
                ...this._carrierBranding(carrier)
            };
        });

        if (imagePrefix) {
            this._matchLetterImageEntities(letters, imagePrefix, carrier.name);
        } else {
            console.warn(
                `[hki-parcels-card] Could not derive an image entity prefix from "${entityId}" — ` +
                `expected it to end in "_letters". Falling back to the external image_url for carrier "${carrier.name}".`
            );
        }

        return letters;
    }

    // Attempts to attach a local image.* entity_picture to each letter, grouped
    // by title (HA appends _2, _3, ... for repeated titles on the same day).
    // Best-effort, per-letter: searches open-ended for "<prefix>_<slug>",
    // "<prefix>_<slug>_2", "_3", ... until one is missing, then pairs whatever
    // was found with the letters in that group, in order. If there are more
    // letters than matching image entities, the leftover letters simply get
    // no image_entity_picture (the rendering layer shows the "no match"
    // placeholder for those) — this is the expected, normal case, not an
    // error, so no warning is logged for it. A warning is only logged when a
    // group finds zero matches at all, since that's more likely a
    // misconfigured prefix than a missing scan.
    _matchLetterImageEntities(letters, prefix, carrierName) {
        if (!this._hass) return;

        const groupsByTitle = new Map();
        letters.forEach(letter => {
            const title = letter.name;
            if (!groupsByTitle.has(title)) groupsByTitle.set(title, []);
            groupsByTitle.get(title).push(letter);
        });

        groupsByTitle.forEach((group, title) => {
            const slug = this._slugify(title);
            if (!slug) return;

            const foundStates = [];
            for (let i = 0; ; i++) {
                const id = i === 0 ? `${prefix}_${slug}` : `${prefix}_${slug}_${i + 1}`;
                const stateObj = this._hass.states[id];
                if (!stateObj) break;
                foundStates.push(stateObj);
            }

            if (foundStates.length === 0) {
                console.warn(
                    `[hki-parcels-card] No image entity found for carrier "${carrierName}", title "${title}" ` +
                    `(expected something matching "${prefix}_${slug}"). These letters will show the "no match" placeholder.`
                );
                return;
            }

            // Pair as many letters as possible with the found image entities,
            // in order. Any leftover letters (more letters than images) are
            // left without image_entity_picture on purpose.
            group.forEach((letter, i) => {
                const stateObj = foundStates[i];
                if (!stateObj) return;
                const picture = stateObj.attributes?.entity_picture;
                if (picture) {
                    letter.image_entity_picture = picture;
                }
            });
        });
    }

    hasAnyLettersConfigured() {
        return (this.config.carriers || []).some(c => !!c.entity_letters);
    }

    // Counts letters whose delivery_date (the "date" field from the letters
    // sensor) matches today's date, comparing only year/month/day so the
    // time-of-day on either side never causes a false mismatch.
    _countLettersToday(data) {
        const post = data?.post || [];
        const todayStr = new Date().toDateString();
        return post.filter(letter => {
            if (!letter.delivery_date) return false;
            const d = new Date(letter.delivery_date);
            return !isNaN(d) && d.toDateString() === todayStr;
        }).length;
    }

    getFilteredShipments(data) {
        if (!data) return [];
        const list = data[this._activeTab] || [];
        const sorted = [...list].sort((a, b) => {
            const dateA = new Date(a.delivery_date || a.planned_date || a.expected_datetime || 0);
            const dateB = new Date(b.delivery_date || b.planned_date || b.expected_datetime || 0);
            return dateB - dateA;
        });
        return sorted;
    }

    // Groups an already-filtered/sorted list into carrier sections,
    // preserving the relative order carriers were first encountered in.
    _groupByCarrier(items) {
        const order = [];
        const groups = new Map();
        items.forEach(item => {
            const name = item.carrier_name || 'Onbekend';
            if (!groups.has(name)) {
                groups.set(name, { name, icon: item.carrier_icon, color: item.carrier_color, items: [] });
                order.push(name);
            }
            groups.get(name).items.push(item);
        });
        return order.map(name => groups.get(name));
    }

    handleTabClick(e) {
        const tab = e.currentTarget.dataset.tab;
        if (tab === this._activeTab) return;
        this._activeTab = tab;
        this._selectedParcel = null;
        this.updateContent();
    }

    handleParcelClick(e) {
        const key = e.currentTarget.dataset.key;
        this._selectedParcel = (this._selectedParcel === key) ? null : key;
        this.updateContent();
    }

    // Determines what the animation panel's background should show when
    // nothing is selected: with 2+ configured carriers there's no single
    // "the" carrier to represent, so the generic placeholder_image is always
    // used. With exactly 1 carrier, that carrier's own banner takes priority
    // (a wide/landscape asset purpose-built for this background role, same
    // idea as the original hki-postnl-card's DEFAULT_BANNER) — falls back to
    // the carrier's logo if no banner is set, then to placeholder_image if
    // neither is available.
    _getNoSelectionBackground() {
        const carriers = this.config.carriers || [];
        if (carriers.length >= 2) {
            return { image: this.config.placeholder_image || '', showText: !this.config.placeholder_image };
        }
        if (carriers.length === 1) {
            const branding = this._carrierBranding(carriers[0]);
            const image = branding.carrier_banner || branding.carrier_logo;
            if (image) return { image, showText: false };
            return { image: this.config.placeholder_image || '', showText: !this.config.placeholder_image };
        }
        return { image: this.config.placeholder_image || '', showText: !this.config.placeholder_image };
    }

    // Opens the letter image popup. stopPropagation prevents this click from
    // also bubbling to the parcel-header click handler, which would otherwise
    // collapse the details panel the thumbnail lives in.
    handleLetterThumbClick(e) {
        e.stopPropagation();
        const { letterName, letterDate, letterSrc } = e.currentTarget.dataset;
        this._openLetterPopup(letterSrc, letterName, letterDate);
    }

    _openLetterPopup(src, name, dateLabel) {
        let popup = this.shadowRoot.querySelector('.letter-popup-overlay');
        if (!popup) {
            popup = document.createElement('div');
            popup.className = 'letter-popup-overlay';
            this.shadowRoot.appendChild(popup);
            popup.addEventListener('click', (e) => {
                if (e.target === popup || e.target.closest('.letter-popup-close')) {
                    this._closeLetterPopup();
                }
            });
        }
        popup.innerHTML = `
            <div class="letter-popup-content">
                <button class="letter-popup-close" title="Sluiten">
                    <ha-icon icon="mdi:close"></ha-icon>
                </button>
                <img src="${src}" alt="${name || ''}" />
                <div class="letter-popup-caption">
                    <strong>${name || ''}</strong>${dateLabel ? ` • ${dateLabel}` : ''}
                </div>
            </div>
        `;
        popup.classList.add('open');
    }

    _closeLetterPopup() {
        const popup = this.shadowRoot.querySelector('.letter-popup-overlay');
        if (popup) popup.classList.remove('open');
    }

    updateContent() {
        if (!this._isRendered) return;
        const data = this.getData();
        if (!data) return;

        const displayedShipments = this.getFilteredShipments(data);
        const activeCount = data.onderweg.length;
        const recentCount = data.bezorgd.length;
        const lettersToday = this.hasAnyLettersConfigured() ? this._countLettersToday(data) : null;

        const statsEl = this.shadowRoot.querySelector('.header-stats');
        const statsBarEl = this.shadowRoot.querySelector('.stats-text');
        const statsText = `${activeCount} onderweg • ${recentCount} recent${lettersToday !== null ? ` • ${lettersToday} brieven` : ''}`;
        if (statsEl) statsEl.textContent = statsText;
        if (statsBarEl) statsBarEl.textContent = statsText;

        this.shadowRoot.querySelectorAll('.tab').forEach(tab => {
            tab.classList.toggle('active', tab.dataset.tab === this._activeTab);
        });

        this.updateAnimation(displayedShipments);
        this.renderList(displayedShipments);
    }

    updateAnimation(displayedShipments) {
        const animationEl = this.shadowRoot.querySelector('.header-animation');
        if (!animationEl) return;

        // Post tab gets its own behaviour: always show an image (the selected
        // letter, or the most recent one if nothing is selected yet), instead
        // of the truck/road animation used for parcels.
        if (this._activeTab === 'post') {
            this._updateLetterImage(animationEl, displayedShipments);
            return;
        }

        const selectedParcelData = this._selectedParcel
            ? displayedShipments.find(s => s.key === this._selectedParcel)
            : null;

        // Clear any background image set by the no-selection branch below —
        // the parcel-selected states render their own content/background via
        // animation-active and must not inherit a leftover inline style.
        animationEl.style.backgroundImage = '';

        if (this.config.show_animation && selectedParcelData?.delivered) {
            const isLetter = !!selectedParcelData.is_letter;
            animationEl.classList.add('animation-active');
            animationEl.innerHTML = `
                <div class="delivery-complete">
                    <div class="delivery-complete-icon">
                        <ha-icon icon="${isLetter ? 'mdi:email-check' : 'mdi:package-check'}"></ha-icon>
                    </div>
                    <div class="delivery-complete-text">
                        <strong>${selectedParcelData.name}</strong>
                        <span>${isLetter ? 'Brievenbuspost ontvangen' : 'Pakket bezorgd'} • ${selectedParcelData.carrier_name || ''}</span>
                    </div>
                </div>
            `;
            return;
        }

        if (this.config.show_animation && selectedParcelData) {
            const vanPos = selectedParcelData.delivered ? '75%' : '25%';
            const statusText = selectedParcelData.status_message || (selectedParcelData.delivered ? 'Bezorgd' : 'Onderweg');
            const vanGif = selectedParcelData.carrier_van;

            animationEl.classList.add('animation-active');
            animationEl.innerHTML = `
                <div class="visual-road">
                    <div class="house-bg">🏠</div>
                    <div class="road-line"></div>
                    ${vanGif
                        ? `<img class="carrier-van-gif" src="${vanGif}" alt="${selectedParcelData.carrier_name || ''}" style="left:${vanPos};" />`
                        : `<div class="carrier-chip" style="background:${selectedParcelData.carrier_color || DEFAULT_CARRIER_COLOR}; left:${vanPos};">
                            <ha-icon icon="${selectedParcelData.carrier_icon || DEFAULT_CARRIER_ICON}"></ha-icon>
                        </div>`
                    }
                </div>
                <div class="animation-info">
                    <strong>${selectedParcelData.name}</strong> • ${statusText} • ${selectedParcelData.carrier_name || ''}
                </div>
            `;
        } else {
            animationEl.classList.remove('animation-active');
            if (!this.config.show_placeholder) {
                animationEl.style.backgroundImage = '';
                animationEl.innerHTML = '';
                return;
            }
            const bg = this._getNoSelectionBackground();
            animationEl.style.backgroundImage = bg.image ? `url('${bg.image}')` : '';
            if (bg.showText) {
                animationEl.innerHTML = `
                    <div class="animation-placeholder">
                        <div class="placeholder-text">Selecteer een pakket voor details</div>
                    </div>
                `;
            } else {
                animationEl.innerHTML = '';
            }
        }
    }

    // Shows the scan image for the selected letter, or the most recent letter
    // when nothing is selected. displayedShipments is already sorted newest-first
    // by getFilteredShipments(), so [0] is the most recent.
    _updateLetterImage(animationEl, displayedShipments) {
        if (displayedShipments.length === 0) {
            animationEl.classList.remove('animation-active');
            animationEl.innerHTML = `
                <div class="animation-placeholder">
                    <div class="placeholder-text">Geen post</div>
                </div>
            `;
            return;
        }

        const letter = this._selectedParcel
            ? (displayedShipments.find(s => s.key === this._selectedParcel) || displayedShipments[0])
            : displayedShipments[0];

        animationEl.classList.add('animation-active');

        // Once an image entity prefix could be derived for this carrier (see
        // _deriveLetterImagePrefix), the local image.* entity is the only
        // source ever displayed — the external image_url is known to be
        // unreliable (requires a PostNL browser session) so we don't fall
        // back to it, even on a mismatch. If no prefix could be derived
        // (unexpected sensor naming), image_url remains the only option.
        if (letter.has_image_prefix) {
            if (!letter.image_entity_picture) {
                animationEl.innerHTML = `
                    <div class="letter-image-wrap">
                        <div class="letter-image-placeholder">
                            <ha-icon icon="mdi:email-outline"></ha-icon>
                        </div>
                        <div class="animation-info">
                            <strong>${letter.name}</strong> • Geen matchende afbeelding-entiteit gevonden • ${letter.carrier_name || ''}
                        </div>
                    </div>
                `;
                return;
            }

            animationEl.innerHTML = `
                <div class="letter-image-wrap">
                    <img class="letter-image" src="${letter.image_entity_picture}" alt="${letter.name}"
                         onerror="this.parentElement.querySelector('.letter-image-error-fallback').style.display='flex'; this.style.display='none';" />
                    <div class="letter-image-error-fallback" style="display:none;">
                        <ha-icon icon="mdi:image-broken-variant"></ha-icon>
                        <span>Afbeelding kon niet geladen worden</span>
                    </div>
                    <div class="animation-info">
                        <strong>${letter.name}</strong> ${letter.unread ? '• Ongelezen' : ''} • ${letter.carrier_name || ''}
                    </div>
                </div>
            `;
            return;
        }

        // No prefix configured at all — fall back to the external image_url,
        // same behaviour as before this feature existed.
        if (!letter.image_url || letter.is_placeholder_image) {
            animationEl.innerHTML = `
                <div class="letter-image-wrap">
                    <div class="letter-image-placeholder">
                        <ha-icon icon="mdi:email-outline"></ha-icon>
                    </div>
                    <div class="animation-info">
                        <strong>${letter.name}</strong> • Geen scan beschikbaar • ${letter.carrier_name || ''}
                    </div>
                </div>
            `;
            return;
        }

        animationEl.innerHTML = `
            <div class="letter-image-wrap">
                <img class="letter-image" src="${letter.image_url}" alt="${letter.name}"
                     onerror="this.parentElement.querySelector('.letter-image-error-fallback').style.display='flex'; this.style.display='none';" />
                <div class="letter-image-error-fallback" style="display:none;">
                    <ha-icon icon="mdi:image-broken-variant"></ha-icon>
                    <span>Scan kon niet geladen worden (mogelijk login bij PostNL vereist)</span>
                </div>
                <div class="animation-info">
                    <strong>${letter.name}</strong> ${letter.unread ? '• Ongelezen' : ''} • ${letter.carrier_name || ''}
                </div>
            </div>
        `;
    }

    _renderParcelItem(item) {
        const isDelivered = item.delivered;
        const isLetter = !!item.is_letter;
        const statusMsg = item.status_message || (isLetter ? 'Brievenbuspost' : (isDelivered ? 'Bezorgd' : 'Onderweg'));
        const dateLabel = this.formatDate(item.delivery_date || item.planned_date || item.planned_to);
        const statusIcon = isLetter ? 'mdi:email' : (isDelivered ? 'mdi:check-circle' : 'mdi:truck-delivery');
        // The CSS that expands the details panel and rotates the chevron is
        // driven entirely by a "selected" class on this wrapper div — it was
        // never actually applied here, which is why expanding a parcel had
        // no visible effect despite handleParcelClick() correctly tracking
        // this._selectedParcel and triggering a re-render.
        const isSelected = this._selectedParcel === item.key;

        // Same image-source priority as the animation panel: once a local
        // image.* entity prefix could be derived, that's the only source
        // ever shown (no falling back to the unreliable external URL).
        let letterThumb = '';
        if (isLetter) {
            if (item.has_image_prefix) {
                letterThumb = item.image_entity_picture || '';
            } else if (!item.is_placeholder_image) {
                letterThumb = item.image_url || '';
            }
        }

        return `
        <div class="parcel ${isSelected ? 'selected' : ''}" data-key="${item.key}">
            <div class="parcel-header" data-key="${item.key}">
                <div class="ph-left">
                    <span class="ph-name">${item.name || 'Onbekend'}</span>
                    <span class="ph-status">
                        <ha-icon class="ph-status-icon" icon="${statusIcon}" style="width:16px;height:16px;"></ha-icon>
                        ${statusMsg}
                    </span>
                </div>
                <div class="ph-right">
                    <div class="ph-date">${dateLabel || ''}</div>
                    <ha-icon class="chevron" icon="mdi:chevron-down"></ha-icon>
                </div>
            </div>
            <div class="details-panel">
                ${letterThumb ? `
                    <img class="letter-thumb" src="${letterThumb}" alt="${item.name || ''}"
                         data-letter-name="${item.name || ''}" data-letter-date="${dateLabel || ''}" data-letter-src="${letterThumb}"
                         onerror="this.style.display='none';" />
                ` : ''}
                ${isLetter && !letterThumb ? `<div class="detail-row letter-no-image"><ha-icon icon="mdi:email-outline"></ha-icon> Geen afbeelding beschikbaar</div>` : ''}
                ${!isLetter && item.key ? `<div class="detail-row"><strong>Track & Trace:</strong> ${item.key}</div>` : ''}
                ${item.raw_status ? `<div class="detail-row"><strong>Status:</strong> ${item.raw_status}</div>` : ''}
                ${item.pickup_point ? `<div class="detail-row"><strong>Afhaalpunt:</strong> ${item.pickup_point}</div>` : ''}
                ${item.shipment_type ? `<div class="detail-row"><strong>Type:</strong> ${item.shipment_type === 'LetterboxParcel' ? 'Brievenbuspakje' : 'Pakket'}</div>` : ''}
                ${item.url ? `<a href="${item.url}" target="_blank" class="btn-track">OPEN TRACK & TRACE ↗</a>` : ''}
            </div>
        </div>`;
    }

    _renderGroupedList(displayedShipments) {
        if (displayedShipments.length === 0) {
            return `
            <div class="empty-state">
                <ha-icon icon="mdi:package-variant-closed" style="width: 48px; height: 48px; margin-bottom: 10px;"></ha-icon>
                <div>Geen pakketten in deze categorie</div>
            </div>`;
        }

        const groups = this._groupByCarrier(displayedShipments);
        return groups.map(group => `
            <div class="carrier-section">
                <div class="carrier-section-header" style="--carrier-color: ${group.color || DEFAULT_CARRIER_COLOR};">
                    <ha-icon icon="${group.icon || DEFAULT_CARRIER_ICON}"></ha-icon>
                    <span>${group.name}</span>
                    <span class="carrier-section-count">${group.items.length}</span>
                </div>
                ${group.items.map(item => this._renderParcelItem(item)).join('')}
            </div>
        `).join('');
    }

    renderList(displayedShipments) {
        const listEl = this.shadowRoot.querySelector('.list');
        if (!listEl) return;
        listEl.innerHTML = this._renderGroupedList(displayedShipments);
        listEl.querySelectorAll('.parcel-header').forEach(el => {
            el.addEventListener('click', this.handleParcelClick.bind(this));
        });
        listEl.querySelectorAll('.letter-thumb').forEach(el => {
            el.addEventListener('click', this.handleLetterThumbClick.bind(this));
        });
    }

    render() {
        const data = this.getData();

        if (!data) {
            this.shadowRoot.innerHTML = `<ha-card style="padding:16px; color:red;">
                Geen carriers geconfigureerd, of geen van de geconfigureerde sensoren gevonden.<br><br>
                Voeg minstens 1 carrier toe met een entity_incoming of entity_delivered.
            </ha-card>`;
            return;
        }

        const displayedShipments = this.getFilteredShipments(data);
        const activeCount = data.onderweg.length;
        const recentCount = data.bezorgd.length;
        const lettersToday = this.hasAnyLettersConfigured() ? this._countLettersToday(data) : null;
        const statsText = `${activeCount} onderweg • ${recentCount} recent${lettersToday !== null ? ` • ${lettersToday} brieven` : ''}`;
        const headerColor = this.config.header_color || 'var(--card-background-color)';
        const headerTextColor = this.config.header_text_color || 'var(--primary-text-color)';
        const placeholderImage = this.config.placeholder_image || '';
        const showLettersTab = this.config.show_letters && this.hasAnyLettersConfigured();

        const cssBlock = `
        <style>
            :host {
                --accent: #ed8c00;
                --header-bg: ${headerColor};
                --header-text: ${headerTextColor};
                --placeholder-image: ${placeholderImage ? `url('${placeholderImage}')` : 'none'};
                --bg-color: var(--card-background-color, white);
            }
            ha-card { background: var(--bg-color); color: var(--primary-text-color); overflow: hidden; border-radius: 12px; }

            .header { background: var(--header-bg); padding: 16px; color: var(--header-text); display: flex; align-items: center; gap: 12px; }
            .header-info { display: flex; flex-direction: column; flex: 1; }
            .header-title { font-weight: bold; font-size: 1.1em; }
            .header-stats { font-size: 0.8em; opacity: 0.9; }
            .stats-bar { background: var(--secondary-background-color, #f5f5f5); padding: 8px 16px; border-bottom: 1px solid var(--divider-color, #eee); text-align: center; }
            .stats-text { font-size: 0.85em; color: var(--secondary-text-color); font-weight: 500; }

            .tabs { display: flex; background: var(--secondary-background-color, #f5f5f5); border-bottom: 1px solid var(--divider-color, #eee); }
            .tab { flex: 1; text-align: center; padding: 12px; cursor: pointer; font-size: 0.9em; font-weight: 500; color: var(--secondary-text-color); position: relative; transition: all 0.2s; user-select: none; }
            .tab:hover { background: rgba(237, 140, 0, 0.1); }
            .tab.active { color: var(--accent); font-weight: bold; }
            .tab.active::after { content: ''; position: absolute; bottom: 0; left: 0; right: 0; height: 3px; background: var(--accent); }

            .header-animation { background-image: var(--placeholder-image); background-size: cover; background-position: center; background-repeat: no-repeat; padding: 16px; border-bottom: 1px solid var(--divider-color); height: 150px; box-sizing: border-box; }
            .header-animation.animation-active { background-image: none !important; background-color: var(--card-background-color); }
            .visual-road { position: relative; height: 80px; display: flex; align-items: center; }
            .house-bg { position: absolute; right: 0; font-size: 32px; }
            .road-line { position: absolute; left: 0; right: 40px; height: 2px; background: var(--divider-color); top: 50%; }
            .carrier-chip { position: absolute; width: 36px; height: 36px; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; top: 50%; transform: translateY(-50%); transition: left 0.4s ease; }
            .carrier-van-gif { position: absolute; height: 48px; top: 50%; transform: translateY(-50%); transition: left 0.4s ease; }
            .animation-info { margin-top: 8px; font-size: 0.9em; color: var(--secondary-text-color); }
            .animation-placeholder { display: flex; align-items: center; justify-content: center; height: 100%; }
            .placeholder-text { color: var(--secondary-text-color); font-size: 0.85em; }
            .delivery-complete { display: flex; align-items: center; gap: 12px; height: 100%; }
            .delivery-complete-icon { color: var(--accent); }
            .delivery-complete-text { display: flex; flex-direction: column; }

            .letter-image-wrap { display: flex; flex-direction: column; align-items: center; gap: 8px; height: 100%; justify-content: center; }
            .letter-image { max-height: 100px; max-width: 90%; object-fit: contain; border-radius: 4px; box-shadow: 0 2px 8px rgba(0,0,0,0.15); background: white; }
            .letter-image-placeholder { display: flex; align-items: center; justify-content: center; width: 70px; height: 70px; border-radius: 8px; background: var(--secondary-background-color); color: var(--secondary-text-color); }
            .letter-image-placeholder ha-icon { width: 32px; height: 32px; }
            .letter-image-error-fallback { display: flex; flex-direction: column; align-items: center; gap: 4px; color: var(--secondary-text-color); font-size: 0.8em; text-align: center; padding: 0 16px; }

            .list { max-height: 420px; overflow-y: auto; }
            .empty-state { padding: 32px 16px; text-align: center; color: var(--secondary-text-color); }

            .carrier-section-header { display: flex; align-items: center; gap: 8px; padding: 10px 16px; background: var(--secondary-background-color); font-size: 0.8em; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; color: var(--carrier-color, var(--accent)); border-top: 1px solid var(--divider-color); }
            .carrier-section-header ha-icon { color: var(--carrier-color, var(--accent)); }
            .carrier-section-count { margin-left: auto; background: var(--carrier-color, var(--accent)); color: white; border-radius: 10px; padding: 1px 8px; font-size: 0.85em; }

            .parcel-header { padding: 16px; cursor: pointer; display: flex; justify-content: space-between; align-items: center; transition: background 0.2s; user-select: none; }
            .parcel-header:hover { background: var(--secondary-background-color); }
            .ph-left { display: flex; flex-direction: column; flex: 1; }
            .ph-name { font-weight: 600; font-size: 1em; margin-bottom: 4px; }
            .ph-status { font-size: 0.85em; color: var(--secondary-text-color); display: flex; align-items: center; gap: 10px; }
            .ph-status-icon { color: var(--accent); flex-shrink: 0; display: flex; align-items: center; }
            .ph-right { display: flex; flex-direction: column; align-items: flex-end; gap: 4px; }
            .ph-date { font-size: 0.85em; color: var(--secondary-text-color); }
            .chevron { transition: transform 0.3s; margin-left: 8px; }
            .selected .chevron { transform: rotate(180deg); color: var(--accent); }

            .details-panel { padding: 12px 16px; background: var(--secondary-background-color); border-top: 1px solid var(--divider-color); font-size: 0.9em; color: var(--secondary-text-color); display: none; max-height: 0; overflow: hidden; transition: max-height 0.3s ease-out; }
            .selected .details-panel { display: block; max-height: 200px; }
            .detail-row { margin-bottom: 6px; }
            .detail-row strong { color: var(--primary-text-color); }
            .btn-track { background: var(--accent); color: white; text-decoration: none; padding: 8px 16px; border-radius: 6px; font-size: 0.9em; font-weight: 600; display: inline-block; margin-top: 8px; transition: all 0.2s; }
            .btn-track:hover { box-shadow: 0 2px 8px rgba(237, 140, 0, 0.3); }

            .list::-webkit-scrollbar { width: 6px; }
            .list::-webkit-scrollbar-track { background: transparent; }
            .list::-webkit-scrollbar-thumb { background: var(--divider-color); border-radius: 3px; }

            .letter-thumb { display: block; max-width: 120px; max-height: 120px; object-fit: contain; border-radius: 6px; background: white; box-shadow: 0 1px 4px rgba(0,0,0,0.15); margin-bottom: 10px; cursor: pointer; transition: transform 0.15s ease; }
            .letter-thumb:hover { transform: scale(1.04); }
            .letter-no-image { display: flex; align-items: center; gap: 6px; color: var(--secondary-text-color); font-size: 0.85em; }

            .letter-popup-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.7); display: none; align-items: center; justify-content: center; z-index: 9999; padding: 24px; box-sizing: border-box; }
            .letter-popup-overlay.open { display: flex; }
            .letter-popup-content { position: relative; background: var(--card-background-color, white); border-radius: 8px; padding: 16px; max-width: 90vw; max-height: 90vh; display: flex; flex-direction: column; align-items: center; gap: 10px; }
            .letter-popup-content img { max-width: 100%; max-height: 70vh; object-fit: contain; border-radius: 4px; }
            .letter-popup-caption { color: var(--primary-text-color); font-size: 0.95em; text-align: center; }
            .letter-popup-close { position: absolute; top: 8px; right: 8px; background: var(--secondary-background-color); border: none; border-radius: 50%; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; cursor: pointer; color: var(--primary-text-color); }
            .letter-popup-close:hover { background: var(--divider-color); }
        </style>
        `;

        const blocks = {
            header: this.config.show_header ? `
                <div class="header">
                    <div class="header-info">
                        <span class="header-title">${this.config.title || 'Pakketten'}</span>
                        <span class="header-stats">${statsText}</span>
                    </div>
                </div>
                ` : `
                <div class="stats-bar">
                    <span class="stats-text">${statsText}</span>
                </div>
            `,
            animation: this.config.show_placeholder !== false ? `<div class="header-animation"></div>` : '',
            tabs: `
                <div class="tabs">
                    <div class="tab ${this._activeTab === 'onderweg' ? 'active' : ''}" data-tab="onderweg">Onderweg</div>
                    ${this.config.show_delivered ? `<div class="tab ${this._activeTab === 'bezorgd' ? 'active' : ''}" data-tab="bezorgd">Bezorgd</div>` : ''}
                    ${this.config.show_sent ? `<div class="tab ${this._activeTab === 'verzonden' ? 'active' : ''}" data-tab="verzonden">Verzonden</div>` : ''}
                    ${showLettersTab ? `<div class="tab ${this._activeTab === 'post' ? 'active' : ''}" data-tab="post">Post</div>` : ''}
                </div>
            `,
            list: `<div class="list">${this._renderGroupedList(displayedShipments)}</div>`
        };

        const layoutOrder = this.config.layout_order || ['header', 'animation', 'tabs', 'list'];
        const contentHtml = layoutOrder.map(blockName => blocks[blockName] || '').join('');

        this.shadowRoot.innerHTML = cssBlock + `<ha-card>${contentHtml}</ha-card>`;
        this._isRendered = true;

        this.shadowRoot.querySelectorAll('.tab').forEach(el => {
            el.addEventListener('click', this.handleTabClick.bind(this));
        });
        this.shadowRoot.querySelectorAll('.parcel-header').forEach(el => {
            el.addEventListener('click', this.handleParcelClick.bind(this));
        });
        this.shadowRoot.querySelectorAll('.letter-thumb').forEach(el => {
            el.addEventListener('click', this.handleLetterThumbClick.bind(this));
        });

        // The animation block above was rendered empty — fill it immediately
        // instead of waiting for the first tab click or parcel selection.
        this.updateAnimation(displayedShipments);
    }
}

// ====================================================================
// EDITOR
// ====================================================================

class HkiParcelsCardEditor extends LitElement {
    static get properties() {
        return {
            hass: { type: Object },
            _config: { attribute: false }
        };
    }

    constructor() {
        super();
        this._config = { carriers: [], layout_order: ['header', 'animation', 'tabs', 'list'] };
    }

    setConfig(config) {
        this._config = {
            title: 'Pakketten',
            days_back: 90,
            show_delivered: true,
            show_sent: true,
            show_letters: true,
            show_animation: true,
            show_header: true,
            show_placeholder: true,
            header_color: '',
            header_text_color: '',
            placeholder_image: DEFAULT_PLACEHOLDER_IMAGE,
            carriers: [],
            layout_order: ['header', 'animation', 'tabs', 'list'],
            ...config
        };
        if (!Array.isArray(this._config.carriers)) this._config.carriers = [];
        if (!this._config.layout_order) this._config.layout_order = ['header', 'animation', 'tabs', 'list'];
    }

    _val(ev) {
        return window.HKI.getSelectValue(ev);
    }

    _emit() {
        this.dispatchEvent(new CustomEvent("config-changed", {
            detail: { config: this._config },
            bubbles: true,
            composed: true
        }));
    }

    _changed(ev, explicitField = null) {
        ev.stopPropagation();
        const field = explicitField || ev.target?.dataset?.field;
        if (!field || !this._config) return;

        let value = this._val(ev);

        const numeric = new Set(['days_back']);
        if (numeric.has(field)) value = parseInt(value, 10);

        const bools = new Set(['show_delivered', 'show_sent', 'show_letters', 'show_animation', 'show_header', 'show_placeholder']);
        if (bools.has(field)) value = !!(ev.target?.checked ?? value);

        this._config = { ...this._config, [field]: value };
        this._emit();
    }

    _carrierChanged(index, field, ev) {
        ev.stopPropagation();
        const value = this._val(ev);
        const carriers = Array.isArray(this._config.carriers) ? [...this._config.carriers] : [];
        carriers[index] = { ...carriers[index], [field]: value };
        this._config = { ...this._config, carriers };
        this._emit();
    }

    // When the carrier type dropdown changes, fill in icon/color/schema from
    // the matching preset, and rebuild the four entity_ids from the
    // "user" field if one is already set. Manual entity overrides in the
    // "Geavanceerd" section are intentionally replaced here — user/type are
    // meant to be the source of truth once a user value is entered.
    _carrierTypeChanged(index, ev) {
        ev.stopPropagation();
        const type = this._val(ev);
        const preset = CARRIER_PRESETS[type] || CARRIER_PRESETS.custom;
        const carriers = Array.isArray(this._config.carriers) ? [...this._config.carriers] : [];
        const current = carriers[index] || {};
        const templated = buildTemplatedEntities(current.user, type);

        carriers[index] = {
            ...current,
            type,
            name: preset.label,
            icon: preset.icon,
            color: preset.color,
            schema: preset.schema,
            entity_incoming: templated.entity_incoming ?? current.entity_incoming ?? '',
            entity_delivered: templated.entity_delivered ?? current.entity_delivered ?? '',
            entity_outgoing: templated.entity_outgoing ?? current.entity_outgoing ?? '',
            // Carriers without letters support never carry an entity_letters
            // value, so the "Post" tab logic (hasAnyLettersConfigured) can't
            // accidentally pick up a stale value from before a type switch.
            entity_letters: preset.supports_letters ? (templated.entity_letters ?? current.entity_letters ?? '') : ''
        };
        this._config = { ...this._config, carriers };
        this._emit();
    }

    // The "user" field is the account slug from the sensor naming pattern
    // (sensor.<user>_<carrier>_incoming_parcels, etc). Every keystroke
    // rebuilds all four entity_ids from the current type's pattern — no
    // separate "apply" step needed, and it stays in sync if the type is
    // changed afterwards too (handled in _carrierTypeChanged above).
    _carrierUserChanged(index, ev) {
        ev.stopPropagation();
        const user = this._val(ev);
        const carriers = Array.isArray(this._config.carriers) ? [...this._config.carriers] : [];
        const current = carriers[index] || {};
        const templated = buildTemplatedEntities(user, current.type);

        carriers[index] = {
            ...current,
            user,
            entity_incoming: templated.entity_incoming ?? current.entity_incoming ?? '',
            entity_delivered: templated.entity_delivered ?? current.entity_delivered ?? '',
            entity_outgoing: templated.entity_outgoing ?? current.entity_outgoing ?? '',
            entity_letters: (CARRIER_PRESETS[current.type] || CARRIER_PRESETS.custom).supports_letters
                ? (templated.entity_letters ?? current.entity_letters ?? '')
                : ''
        };
        this._config = { ...this._config, carriers };
        this._emit();
    }

    _addCarrier() {
        const existing = Array.isArray(this._config.carriers) ? this._config.carriers : [];
        const preset = CARRIER_PRESETS.postnl;
        const carriers = [...existing, {
            type: 'postnl',
            name: preset.label,
            icon: preset.icon,
            color: preset.color,
            schema: preset.schema,
            logo_path: '',
            van_path: '',
            banner_path: '',
            entity_incoming: '',
            entity_delivered: '',
            entity_outgoing: '',
            entity_letters: '',
            _expanded: true
        }];
        this._config = { ...this._config, carriers };
        this._emit();
    }

    _removeCarrier(index) {
        const existing = Array.isArray(this._config.carriers) ? this._config.carriers : [];
        const carriers = existing.filter((_, i) => i !== index);
        this._config = { ...this._config, carriers };
        this._emit();
    }

    // Collapsing/expanding a carrier section is purely a UI convenience and
    // doesn't need to round-trip through config-changed/setConfig, so it's
    // stored directly on the config object as _expanded but emitted like any
    // other change for simplicity (it's prefixed with _ to signal it's not a
    // meaningful card setting, just editor UI state).
    _toggleCarrierExpanded(index) {
        const existing = Array.isArray(this._config.carriers) ? this._config.carriers : [];
        const carriers = [...existing];
        carriers[index] = { ...carriers[index], _expanded: !carriers[index]?._expanded };
        this._config = { ...this._config, carriers };
        this._emit();
    }

    _moveBlock(index, direction) {
        const newOrder = [...this._config.layout_order];
        if (direction === 'up' && index > 0) {
            [newOrder[index], newOrder[index - 1]] = [newOrder[index - 1], newOrder[index]];
        } else if (direction === 'down' && index < newOrder.length - 1) {
            [newOrder[index], newOrder[index + 1]] = [newOrder[index + 1], newOrder[index]];
        }
        this._config = { ...this._config, layout_order: newOrder };
        this._emit();
    }

    static get styles() {
        return css`
            .card-config { padding: 16px; }
            .section { margin-top: 24px; margin-bottom: 12px; font-weight: 600; font-size: 14px; color: var(--primary-text-color); text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 2px solid var(--divider-color); padding-bottom: 8px; }
            .helper-text { font-size: 12px; color: var(--secondary-text-color); margin: 4px 0 16px 0; font-style: italic; }
            ha-selector, ha-textfield { width: 100%; margin-bottom: 16px; }
            .plain-field { margin-bottom: 16px; }
            .plain-field label { display: block; font-size: 12px; color: var(--secondary-text-color); margin-bottom: 4px; }
            .plain-field input { width: 100%; box-sizing: border-box; padding: 10px 12px; font-size: 14px; border: 1px solid var(--divider-color); border-radius: 4px; background: var(--card-background-color, white); color: var(--primary-text-color); font-family: inherit; }
            .plain-field input:focus { outline: none; border-color: var(--primary-color, #03a9f4); }
            .switch-row { display: flex; align-items: center; gap: 16px; margin-bottom: 8px; width: 100%; }
            .switch-row ha-switch { flex-shrink: 0; margin-bottom: 0; }
            .switch-row span { font-size: 14px; color: var(--primary-text-color); flex: 1; line-height: 1.4; }
            .sort-item { display: flex; align-items: center; justify-content: space-between; background: var(--secondary-background-color); border: 1px solid var(--divider-color); padding: 8px 12px; margin-bottom: 8px; border-radius: 4px; }
            .sort-label { font-weight: 500; text-transform: capitalize; }
            .carrier-card { border: 1px solid var(--divider-color); border-radius: 8px; padding: 12px; margin-bottom: 16px; background: var(--secondary-background-color); }
            .carrier-card-header { display: flex; justify-content: space-between; align-items: center; font-weight: 600; cursor: pointer; user-select: none; }
            .carrier-card-header-title { display: flex; align-items: center; gap: 8px; }
            .carrier-card-header-title .chevron { transition: transform 0.2s ease; flex-shrink: 0; }
            .carrier-card-header-title .chevron.expanded { transform: rotate(90deg); }
            .carrier-card-body { margin-top: 12px; }
            .advanced-details { margin-top: 8px; }
            .advanced-details summary { cursor: pointer; font-size: 13px; color: var(--secondary-text-color); padding: 8px 0; user-select: none; }
            .templated-preview { background: var(--card-background-color, white); border: 1px solid var(--divider-color); border-radius: 4px; padding: 8px 12px; margin-bottom: 16px; font-family: monospace; font-size: 11px; color: var(--secondary-text-color); line-height: 1.6; }
            .inline-fields-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 16px; }
            ha-icon-button.danger { color: var(--error-color, red); }
            mwc-button.add-carrier { margin-top: 4px; }
            .warning-box-details { background-color: var(--secondary-background-color); border: 1px solid var(--divider-color); border-left: 4px solid #ed8c00; padding: 12px; margin-bottom: 24px; font-size: 13px; line-height: 1.4; border-radius: 4px; color: var(--primary-text-color); }
            .warning-title { font-weight: bold; font-size: 14px; cursor: pointer; user-select: none; }
            .warning-box-details a { color: var(--primary-color, #03a9f4); text-decoration: underline; }
        `;
    }

    _renderEntityPicker(label, value, helper, onChange) {
        return html`
            <ha-selector
                .hass=${this.hass}
                .selector=${{ entity: {} }}
                .value=${value || ""}
                .label=${label}
                .helper=${helper}
                @value-changed=${onChange}
            ></ha-selector>
        `;
    }

    _renderCarrier(carrier, index) {
        const expanded = carrier._expanded !== false;
        const preset = CARRIER_PRESETS[carrier.type] || CARRIER_PRESETS.custom;
        const supportsLetters = preset.supports_letters;

        return html`
            <div class="carrier-card">
                <div class="carrier-card-header" @click=${() => this._toggleCarrierExpanded(index)}>
                    <div class="carrier-card-header-title">
                        <ha-icon class="chevron ${expanded ? 'expanded' : ''}" icon="mdi:chevron-right"></ha-icon>
                        <ha-icon icon="${carrier.icon || preset.icon}" style="color:${carrier.color || preset.color};"></ha-icon>
                        <span>${carrier.name || preset.label || `Carrier ${index + 1}`}</span>
                    </div>
                    <ha-icon-button
                        class="danger"
                        .path=${"M19,13H5V11H19V13Z"}
                        @click=${(ev) => { ev.stopPropagation(); this._removeCarrier(index); }}
                        title="Verwijder carrier"
                    ></ha-icon-button>
                </div>

                ${expanded ? html`
                <div class="carrier-card-body">
                    <ha-selector
                        .hass=${this.hass}
                        .selector=${{ select: { options: [
                            { value: 'postnl', label: 'PostNL' },
                            { value: 'dhl', label: 'DHL' },
                            { value: 'dpd', label: 'DPD' },
                            { value: 'custom', label: 'Anders / Custom' }
                        ], mode: 'dropdown' } }}
                        .value=${carrier.type || 'postnl'}
                        .label=${"Carrier"}
                        @value-changed=${(ev) => this._carrierTypeChanged(index, ev)}
                    ></ha-selector>

                    ${carrier.type === 'custom' ? html`
                        <div class="plain-field">
                            <label for="hki-carrier-name-${index}">Naam</label>
                            <input
                                id="hki-carrier-name-${index}"
                                type="text"
                                .value=${carrier.name || ''}
                                @input=${(ev) => this._carrierChanged(index, 'name', ev)}
                            />
                        </div>
                    ` : html`
                        <div class="plain-field">
                            <label for="hki-carrier-user-${index}">Account / gebruikersdeel van de sensornaam</label>
                            <input
                                id="hki-carrier-user-${index}"
                                type="text"
                                placeholder="bv. mijn_account"
                                .value=${carrier.user || ''}
                                @input=${(ev) => this._carrierUserChanged(index, ev)}
                            />
                        </div>
                        <div class="helper-text">
                            Het deel van je sensor-naam vóór "_${preset.sensor_slug}_incoming_parcels" etc.
                            De 4 sensoren hieronder worden hiermee automatisch opgebouwd.
                        </div>
                        ${carrier.entity_incoming ? html`
                            <div class="templated-preview">
                                <div>${carrier.entity_incoming}</div>
                                <div>${carrier.entity_delivered}</div>
                                <div>${carrier.entity_outgoing}</div>
                                ${supportsLetters && carrier.entity_letters ? html`<div>${carrier.entity_letters}</div>` : ''}
                            </div>
                        ` : ''}
                    `}

                    <details class="advanced-details">
                        <summary>Geavanceerd: sensoren handmatig overschrijven</summary>
                        <div class="helper-text" style="margin-top:12px;">
                            Normaal gesproken hoef je dit niet aan te passen — vul hierboven het account-deel in
                            en de sensoren worden automatisch ingevuld. Gebruik dit alleen als je sensoren een
                            afwijkende naam hebben.
                        </div>
                        ${this._renderEntityPicker(
                            "Onderweg Entity (incoming)",
                            carrier.entity_incoming,
                            "bv. sensor.dhl_incoming_parcels",
                            (ev) => this._carrierChanged(index, 'entity_incoming', ev)
                        )}
                        ${this._renderEntityPicker(
                            "Bezorgd Entity (delivered)",
                            carrier.entity_delivered,
                            "bv. sensor.dhl_delivered_parcels",
                            (ev) => this._carrierChanged(index, 'entity_delivered', ev)
                        )}
                        ${this._renderEntityPicker(
                            "Verzonden Entity (outgoing)",
                            carrier.entity_outgoing,
                            "bv. sensor.dhl_outgoing_parcels",
                            (ev) => this._carrierChanged(index, 'entity_outgoing', ev)
                        )}
                        ${supportsLetters ? this._renderEntityPicker(
                            "Post / Brieven Entity (letters)",
                            carrier.entity_letters,
                            "Brief-afbeeldingen (image.* entiteiten) worden automatisch gekoppeld op datum, geen verdere instelling nodig.",
                            (ev) => this._carrierChanged(index, 'entity_letters', ev)
                        ) : html`
                            <div class="helper-text">Post/Brieven wordt alleen ondersteund voor PostNL.</div>
                        `}
                    </details>

                    <details class="advanced-details">
                        <summary>Geavanceerd: uiterlijk overschrijven</summary>
                        <div class="inline-fields-2" style="margin-top:12px;">
                            <ha-textfield
                                label="Icoon (mdi:...)"
                                .value=${carrier.icon || preset.icon}
                                @input=${(ev) => this._carrierChanged(index, 'icon', ev)}
                            ></ha-textfield>
                            <ha-textfield
                                label="Kleur"
                                type="color"
                                .value=${carrier.color || preset.color}
                                @input=${(ev) => this._carrierChanged(index, 'color', ev)}
                            ></ha-textfield>
                        </div>
                        <div class="inline-fields-2">
                            <ha-textfield
                                label="Logo URL (optioneel)"
                                .value=${carrier.logo_path || ''}
                                placeholder=${(CARRIER_ASSETS[carrier.type] || CARRIER_ASSETS.custom).logo || 'https://...'}
                                @input=${(ev) => this._carrierChanged(index, 'logo_path', ev)}
                            ></ha-textfield>
                            <ha-textfield
                                label="Voertuig GIF URL (optioneel)"
                                .value=${carrier.van_path || ''}
                                placeholder=${(CARRIER_ASSETS[carrier.type] || CARRIER_ASSETS.custom).van || 'https://...'}
                                @input=${(ev) => this._carrierChanged(index, 'van_path', ev)}
                            ></ha-textfield>
                        </div>
                        <ha-textfield
                            label="Banner URL (optioneel, achtergrond bij 1 carrier)"
                            .value=${carrier.banner_path || ''}
                            placeholder=${(CARRIER_ASSETS[carrier.type] || CARRIER_ASSETS.custom).banner || 'https://...'}
                            @input=${(ev) => this._carrierChanged(index, 'banner_path', ev)}
                        ></ha-textfield>
                        <div class="helper-text">
                            Logo, voertuig-animatie en banner hebben al een ingebouwde standaardafbeelding per carrier
                            (zichtbaar als placeholder-tekst hierboven). Vul hier alleen iets in als je die wilt
                            overschrijven. Zonder enige afbeelding gebruikt de kaart het icoon en de kleur hierboven.
                        </div>
                    </details>
                </div>
                ` : ''}
            </div>
        `;
    }

    render() {
        if (!this._config) return html``;
        // Defensive guard: Lit can call render() before setConfig() has run
        // (observed in practice via getConfigElement() → constructor →
        // initial render), so this._config may not have a carriers array yet
        // even though setConfig() always sets one. Without this check,
        // this._config.carriers.map() below throws and the whole editor
        // silently fails to render anything past this point.
        const carriers = Array.isArray(this._config.carriers) ? this._config.carriers : [];

        const layoutLabels = {
            'header': 'Header (Titel)',
            'animation': 'Animatie / Afbeelding',
            'tabs': 'Navigatie Tabs',
            'list': 'Pakketten Lijst'
        };
        const currentLayout = this._config.layout_order || ['header', 'animation', 'tabs', 'list'];

        return html`
            <div class="card-config">
                <details class="warning-box-details" open>
                    <summary class="warning-title">📦 Multi-carrier pakketten kaart</summary>
                    <div style="margin-top:8px;">Voeg hieronder één of meer carriers toe (PostNL, DHL, DPD, ...). Elke carrier kan tot 4 sensoren hebben.</div>
                    <div style="margin-top:8px;">Gebruik schema <strong>"canonical"</strong> voor integraties die het gedeelde normalize_parcel()-formaat gebruiken (zoals ha-dhl-nl), en <strong>"legacy"</strong> voor de huidige PostNL-sensoren.</div>
                </details>

                <div class="section">Basis Instellingen</div>
                <div class="plain-field">
                    <label for="hki-title-input">Kaartnaam</label>
                    <input
                        id="hki-title-input"
                        type="text"
                        .value=${this._config.title || 'Pakketten'}
                        data-field="title"
                        @input=${this._changed}
                    />
                </div>
                <div class="plain-field">
                    <label for="hki-days-input">Aantal dagen geschiedenis (bezorgd)</label>
                    <input
                        id="hki-days-input"
                        type="number"
                        .value=${String(this._config.days_back || 90)}
                        min="1" max="365"
                        data-field="days_back"
                        @input=${this._changed}
                    />
                </div>

                <div class="section">Carriers</div>
                ${carriers.map((carrier, index) => this._renderCarrier(carrier, index))}
                <mwc-button class="add-carrier" outlined @click=${() => this._addCarrier()}>
                    + Carrier toevoegen
                </mwc-button>

                <div class="section">Layout Volgorde</div>
                <div class="helper-text">Gebruik de pijltjes om de blokken te herschikken</div>
                ${currentLayout.map((item, index) => html`
                    <div class="sort-item">
                        <span class="sort-label">${layoutLabels[item] || item}</span>
                        <div>
                            <ha-icon-button
                                .path=${"M7.41,15.41L12,10.83L16.59,15.41L18,14L12,8L6,14L7.41,15.41Z"}
                                @click=${() => this._moveBlock(index, 'up')}
                                ?disabled=${index === 0}
                            ></ha-icon-button>
                            <ha-icon-button
                                .path=${"M7.41,8.59L12,13.17L16.59,8.59L18,10L12,16L6,10L7.41,8.59Z"}
                                @click=${() => this._moveBlock(index, 'down')}
                                ?disabled=${index === currentLayout.length - 1}
                            ></ha-icon-button>
                        </div>
                    </div>
                `)}

                <div class="section">Weergave Opties</div>
                <div class="switch-row">
                    <ha-switch .checked=${this._config.show_header !== false} data-field="show_header" @change=${this._changed}></ha-switch>
                    <span>Toon header</span>
                </div>
                <div class="switch-row">
                    <ha-switch .checked=${this._config.show_delivered !== false} data-field="show_delivered" @change=${this._changed}></ha-switch>
                    <span>Toon "Bezorgd" tab</span>
                </div>
                <div class="switch-row">
                    <ha-switch .checked=${this._config.show_sent !== false} data-field="show_sent" @change=${this._changed}></ha-switch>
                    <span>Toon "Verzonden" tab</span>
                </div>
                <div class="switch-row">
                    <ha-switch .checked=${this._config.show_letters !== false} data-field="show_letters" @change=${this._changed}></ha-switch>
                    <span>Toon "Post" tab (als minstens 1 carrier brieven ondersteunt)</span>
                </div>
                <div class="switch-row">
                    <ha-switch .checked=${this._config.show_animation !== false} data-field="show_animation" @change=${this._changed}></ha-switch>
                    <span>Toon animatie/detailweergave</span>
                </div>
                <div class="switch-row">
                    <ha-switch .checked=${this._config.show_placeholder !== false} data-field="show_placeholder" @change=${this._changed}></ha-switch>
                    <span>Toon placeholder</span>
                </div>

                <div class="section">Uiterlijk</div>
                <div class="inline-fields-2">
                    <ha-textfield
                        label="Header Kleur"
                        type="color"
                        .value=${this._config.header_color || '#f0f0f0'}
                        data-field="header_color"
                        @input=${this._changed}
                    ></ha-textfield>
                    <ha-textfield
                        label="Header Tekst Kleur"
                        type="color"
                        .value=${this._config.header_text_color || '#000000'}
                        data-field="header_text_color"
                        @input=${this._changed}
                    ></ha-textfield>
                </div>
                <ha-textfield
                    label="Placeholder Afbeelding (URL, optioneel)"
                    .value=${this._config.placeholder_image || ''}
                    placeholder="http://..."
                    data-field="placeholder_image"
                    @input=${this._changed}
                ></ha-textfield>
            </div>
        `;
    }
}

if (!customElements.get('hki-parcels-card')) {
    customElements.define('hki-parcels-card', HkiParcelsCard);
}
if (!customElements.get('hki-parcels-card-editor')) {
    customElements.define('hki-parcels-card-editor', HkiParcelsCardEditor);
}

window.customCards = window.customCards || [];
window.customCards.push({
    type: "hki-parcels-card",
    name: "HKI Parcels Card",
    description: "Multi-carrier package tracker (PostNL, DHL, DPD, ...)",
    preview: true
});

})();
