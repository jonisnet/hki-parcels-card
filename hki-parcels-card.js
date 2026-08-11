// ============================================================
// HKI Parcels Card (standalone fork)
// ============================================================
//
// A generic, multi-carrier parcel-tracking card for Home Assistant
// (PostNL, DHL, DPD, ...), with automatic per-carrier sensor templating
// and a dedicated "Letters" tab for PostNL letterbox mail.
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
const { LitElement, html, css } = window.HKI.getLit();
const CARD_VERSION = 'v1.7.3';
console.info(`%c HKI-PARCELS-CARD %c ${CARD_VERSION} `, 'color: white; background: #ed8c00; font-weight: bold;', 'color: #ed8c00; background: white; font-weight: bold;');

const DEFAULT_CARRIER_ICON = 'mdi:package-variant-closed';
const DEFAULT_CARRIER_COLOR = '#ed8c00';
const DEFAULT_PLACEHOLDER_IMAGE = 'https://github.com/jonisnet/hki-parcels-card/blob/main/images/shared/dutch-parcels-2.png?raw=true';

function hasPhuIcons() {
    return !!(window.customIconsets && window.customIconsets['phu']);
}

function getDefaultIcon(carrierType) {
    // Keep in sync with whatever elax46/custom-brand-icons actually ships under icon-svg/ —
    // a phu: reference to a name that isn't in the installed iconset renders blank, which is
    // worse than the mdi: fallback, so only map a carrier here once its icon is confirmed live
    // upstream (last full audit 2026-08-11, checked directly against the repo's git tree —
    // sunyou.svg turned up there unprompted, contributed by someone else upstream).
    // postnord/planzer/dynalogic/delhivery are intentionally NOT mapped — all four are
    // wordmark-only brands with no distinct pictorial mark anywhere in their real branding
    // (re-verified against each carrier's actual current favicon/app-icon/press assets, not
    // just assumed), and we don't submit invented letterform icons upstream. Note Dynalogic's
    // "DYNALOG!C" wordmark stylizes the I as "!", but that mark never appears standalone
    // (favicon crops to a plain "D" instead) — a real stylistic detail, not an extractable icon.
    // sameday/helthjem aren't mapped yet either — real icons exist for both (built from each
    // carrier's own source mark) but are held back locally, not submitted/merged. nova_post
    // also has a real icon (its red diamond-arrows "H" mark, already used in this card's own
    // branding) not yet submitted upstream. budbee has a real icon too (its own round "b"
    // avatar) but was declined for this project.
    const phuMap = {
        postnl: 'phu:postnl', postnl_v4: 'phu:postnl', postnl_legacy: 'phu:postnl',
        dhl: 'phu:dhl', dpd: 'phu:dpd',
        gls: 'phu:gls-group', dragonfly: 'phu:dragonfly', trunkrs: 'phu:trunkrs',
        cainiao: 'phu:cainiao', vinted_go: 'phu:vinted',
        hermes: 'phu:hermes', packeta: 'phu:packeta', correos: 'phu:correos',
        swiss_post: 'phu:swisspost', austrian_post: 'phu:austrianpost',
        sunyou: 'phu:sunyou',
    };
    if (hasPhuIcons() && phuMap[carrierType]) return phuMap[carrierType];
    return 'mdi:package-variant-closed';
}

// ============================================================
// Translations
// ============================================================

// GENERATED:TRANSLATIONS:START — run `python scripts/build_translations.py` after editing translations/*.json
const TRANSLATIONS = {
    en: {
        tab_in_transit: 'In Transit',
        tab_delivered: 'Delivered',
        tab_sent: 'Sent',
        tab_letters: 'Letters',
        status_registered: 'Registered',
        status_in_transit: 'In Transit',
        status_out_for_delivery: 'Out for Delivery',
        status_ready_for_pickup: 'Ready for Pickup',
        status_at_pickup_point: 'At Pickup Point',
        status_delivered: 'Delivered',
        status_returning: 'Returning to Sender',
        status_problem: 'Problem',
        status_unknown: 'Unknown',
        step_label_registered: 'Registered',
        step_label_sorting: 'Sorting centre',
        step_label_transit: 'Out for delivery',
        step_label_delivered: 'Delivered',
        step_info_registered: 'Registered at',
        step_info_sorting: 'At sorting centre at',
        step_info_transit_and: 'and',
        step_info_delivered: 'Delivered on',
        step_info_expected_delivery: 'Expected delivery',
        today: 'Today',
        tomorrow: 'Tomorrow',
        day_after_tomorrow: 'The day after tomorrow',
        expected_on: 'Expected on',
        between_time: 'between',
        parcel_from: 'Parcel from',
        unknown: 'Unknown',
        mail_from: 'Mail from',
        letterbox_mail: 'Letterbox Mail',
        unread: 'Unread',
        letterbox_received: 'Letterbox mail received',
        parcel_delivered_msg: 'Parcel delivered',
        select_parcel: 'Select a parcel for details',
        no_image: 'No image available',
        label_tracking: 'Tracking',
        label_status: 'Status',
        label_delivery: 'Delivery',
        label_pickup_point: 'Pickup point',
        label_custom_name: 'Custom name',
        add_custom_name: '+ Add name',
        custom_name_placeholder: 'e.g. Birthday gift',
        custom_name_edit: 'Edit name',
        custom_name_save: 'Save',
        custom_name_cancel: 'Cancel',
        home_delivery: 'Home delivery',
        pickup_point: 'Pickup point',
        label_type: 'Type',
        type_letter: 'Letter',
        type_parcel: 'Parcel',
        open_tracking: 'OPEN TRACKING ↗',
        no_parcels: 'No parcels in this category',
        post_section_upcoming: 'Still to be delivered',
        post_section_delivered: 'Delivered',
        stats_in_transit: 'in transit',
        stats_recent: 'recent',
        stats_letters: 'letters',
        error_no_carriers: 'No carriers configured, or none of the configured sensors were found.',
        error_no_carriers_hint: 'Add at least 1 carrier with an entity_incoming or entity_delivered.',
        editor_title: '📦 Multi-carrier parcel card',
        editor_intro1: 'Add one or more carriers below (PostNL, DHL, DPD, ...). Each carrier can have up to 4 sensors.',
        editor_intro2: 'Pick the right PostNL type: PostNL (current ≥4.x integration), PostNL (<v4.x, being phased out), or PostNL (ArjenBos, being phased out).',
        section_basic: 'Basic Settings',
        label_card_title: 'Card title',
        label_days_back: 'Days to show delivery history',
        section_carriers: 'Carriers',
        btn_add_carrier: '+ Add carrier',
        section_layout: 'Layout Order',
        layout_help: 'Use the arrows to reorder the blocks',
        layout_header: 'Header (Title)',
        layout_animation: 'Animation / Image',
        layout_tabs: 'Navigation Tabs',
        layout_list: 'Parcel List',
        section_display: 'Display Options',
        show_header: 'Show header',
        show_delivered_tab: 'Show "Delivered" tab',
        show_sent_tab: 'Show "Sent" tab',
        show_letters_tab: 'Show "Letters" tab (requires at least 1 carrier with letter support)',
        show_animation: 'Show animation / detail view',
        show_placeholder: 'Show placeholder image',
        show_tracking_link: 'Show tracking link button (disable for kiosk / touch-only)',
        show_raw_status: 'Show the carrier\'s own status text instead of the translated label',
        custom_name_scope_label: 'Custom parcel names',
        custom_name_scope_off: 'Off',
        custom_name_scope_device: 'This browser/device only',
        custom_name_scope_me: 'For me only',
        custom_name_scope_everyone: 'For everyone',
        custom_name_scope_help: '"This browser/device only" never leaves this browser. "For me only" is saved to your Home Assistant account and follows you across your own devices. "For everyone" is saved instance-wide for every user to see — adding or editing a name under this option requires an administrator account; everyone can still see the names.',
        sort_order_label: 'Parcel order',
        sort_order_auto: 'Automatic (soonest first, most recent delivery first)',
        sort_order_newest_first: 'Newest/furthest first everywhere',
        sort_order_oldest_first: 'Oldest/soonest first everywhere',
        sort_order_help: '"Automatic" (recommended) shows the soonest-arriving parcel first in In Transit and Sent, and the most recently delivered parcel first in Delivered. The other two options pick one direction and keep it everywhere.',
        group_by_carrier: 'Group parcels by carrier (disable for one flat list sorted purely by date, interleaving carriers)',
        section_appearance: 'Appearance',
        label_header_color: 'Header color',
        label_header_text: 'Header text color',
        label_placeholder_img: 'Placeholder image',
        color_default: 'Default',
        color_custom: 'Custom',
        btn_remove_carrier: 'Remove carrier',
        label_carrier_name: 'Name',
        legacy_warning: 'Recreates the original hki-postnl-card: one entity with both in-transit and delivered parcels, plus a separate entity for sent parcels. No letter support, no sensor templating. This mode will not receive further updates as long as arjenbos/ha-postnl is not actively maintained.',
        label_account: 'Account / user part of the sensor name',
        account_help_suffix: '_incoming_parcels" etc. The 4 sensors are built automatically.',
        gls_account_help: 'GLS has no account — enter the postal code of your GLS hub (e.g. 1234AB, as set when adding the integration).',
        dragonfly_account_help: 'Dragonfly has no account or postal code — leave this field empty; the sensors are named sensor.dragonfly_*.',
        trunkrs_account_help: 'Trunkrs has no account — enter the postal code of your Trunkrs hub (e.g. 1234AB, as set when adding the integration).',
        cainiao_account_help: 'Cainiao has no account or postal code — leave this field empty; the sensors are named sensor.cainiao_*.',
        hermes_account_help: 'Hermes has no account or postal code — leave this field empty; the sensors are named sensor.hermes_*.',
        packeta_account_help: 'Packeta has no account or postal code — leave this field empty; the sensors are named sensor.packeta_*.',
        correos_account_help: 'Correos has no account or postal code — leave this field empty; the sensors are named sensor.correos_*.',
        postnord_account_help: 'PostNord has no account or postal code — leave this field empty; the sensors are named sensor.postnord_*.',
        sameday_account_help: 'Sameday has no account or postal code — leave this field empty; the sensors are named sensor.sameday_*.',
        swiss_post_account_help: 'Swiss Post has no account or postal code — leave this field empty; the sensors are named sensor.swiss_post_*.',
        planzer_account_help: 'Planzer has no account or postal code — leave this field empty; the sensors are named sensor.planzer_*.',
        austrian_post_account_help: 'Austrian Post has no account or postal code — leave this field empty; the sensors are named sensor.oesterreichische_post_*.',
        helthjem_account_help: 'Helthjem has no account or postal code — leave this field empty; the sensors are named sensor.helthjem_*.',
        dynalogic_account_help: 'Dynalogic has no account or postal code — leave this field empty; the sensors are named sensor.dynalogic_*.',
        budbee_account_help: 'Budbee has no account or postal code — leave this field empty; the sensors are named sensor.budbee_*.',
        nova_post_account_help: 'Nova Post has no account or postal code — leave this field empty; the sensors are named sensor.nova_post_*.',
        delhivery_account_help: 'Delhivery has no account or postal code — leave this field empty; the sensors are named sensor.delhivery_*.',
        sunyou_account_help: 'SunYou has no account or postal code — leave this field empty; the sensors are named sensor.sunyou_*.',
        show_add_parcel: 'Show "Add parcel" on the card',
        add_parcel_toggle: '+ Add parcel',
        add_parcel_carrier: 'Carrier',
        add_parcel_number: 'Tracking number',
        add_parcel_submit: 'Add',
        add_parcel_busy: 'Adding...',
        add_parcel_success: 'Parcel added',
        add_parcel_error: 'Failed to add — check the number.',
        adv_sensors: 'Advanced: override sensors manually',
        adv_sensors_help: 'You normally don\'t need to change this. Use this only if your sensors have a non-standard name.',
        entity_incoming: 'In Transit entity (incoming)',
        entity_delivered: 'Delivered entity',
        entity_outgoing: 'Sent entity (outgoing)',
        entity_outgoing_delivered: 'Sent delivered entity (outgoing delivered)',
        entity_letters: 'Letters entity',
        letters_entity_help: 'Letter scan images (image.* entities) are matched automatically by date.',
        no_letters_support: 'Letters are only supported for PostNL.',
        no_outgoing_support: 'Sent parcels are not supported for this carrier.',
        adv_appearance: 'Advanced: override appearance',
        label_icon: 'Icon (mdi:...)',
        label_color: 'Color',
        label_logo: 'Logo URL (optional)',
        label_van: 'Vehicle GIF URL (optional)',
        label_banner: 'Banner URL (optional, background when 1 carrier)',
        appearance_help: 'Logo, vehicle animation and banner already have a built-in default per carrier. Only fill in a value here if you want to override it.',
        postnl_entity_label: 'PostNL Incoming Entity',
        postnl_dist_label: 'PostNL Outgoing Entity (optional)',
        detected_one: 'Auto-detected',
        detected_multiple: 'Multiple accounts found — choose one',
        detected_none: 'No sensors found — enter manually',
        integration_not_found: 'Integration not found. Install the integration first:',
        no_prefix: '(no account prefix)',
        detected_badge: 'found',
        label_icon_pick: 'Icon',
        label_color_pick: 'Color',
        url_logo: 'Logo URL',
        url_van: 'Vehicle GIF URL',
        url_banner: 'Banner URL',
        url_placeholder: 'Leave empty to use the built-in default',
        url_preview_fail: 'Image not found',
        browse_media: 'Browse',
    },
    nl: {
        tab_in_transit: 'Onderweg',
        tab_delivered: 'Bezorgd',
        tab_sent: 'Verzonden',
        tab_letters: 'Post',
        status_registered: 'Aangemeld',
        status_in_transit: 'Onderweg',
        status_out_for_delivery: 'Vandaag bezorgd',
        status_ready_for_pickup: 'Te afhalen',
        status_at_pickup_point: 'Bij afhaalpunt',
        status_delivered: 'Bezorgd',
        status_returning: 'Retour naar verzender',
        status_problem: 'Probleem',
        status_unknown: 'Onbekend',
        step_label_registered: 'Aangemeld',
        step_label_sorting: 'Sorteercentrum',
        step_label_transit: 'Onderweg',
        step_label_delivered: 'Bezorgd',
        step_info_registered: 'Aangemeld om',
        step_info_sorting: 'Bij sorteercentrum om',
        step_info_transit_and: 'en',
        step_info_delivered: 'Bezorgd op',
        step_info_expected_delivery: 'Verwachte bezorging',
        today: 'Vandaag',
        tomorrow: 'Morgen',
        day_after_tomorrow: 'Overmorgen',
        expected_on: 'Verwacht op',
        between_time: 'tussen',
        parcel_from: 'Pakket van',
        unknown: 'Onbekend',
        mail_from: 'Post van',
        letterbox_mail: 'Brievenbuspost',
        unread: 'Ongelezen',
        letterbox_received: 'Brievenbuspost ontvangen',
        parcel_delivered_msg: 'Pakket bezorgd',
        select_parcel: 'Selecteer een pakket voor details',
        no_image: 'Geen afbeelding beschikbaar',
        label_tracking: 'Track & Trace',
        label_status: 'Status',
        label_delivery: 'Bezorgwijze',
        label_pickup_point: 'Afhaalpunt',
        label_custom_name: 'Eigen naam',
        add_custom_name: '+ Naam toevoegen',
        custom_name_placeholder: 'bijv. Verjaardagscadeau',
        custom_name_edit: 'Naam bewerken',
        custom_name_save: 'Opslaan',
        custom_name_cancel: 'Annuleren',
        home_delivery: 'Thuisbezorging',
        pickup_point: 'Afhaalpunt',
        label_type: 'Type',
        type_letter: 'Brief',
        type_parcel: 'Pakket',
        open_tracking: 'TRACK & TRACE OPENEN ↗',
        no_parcels: 'Geen pakketten in deze categorie',
        post_section_upcoming: 'Nog te bezorgen',
        post_section_delivered: 'Bezorgd',
        stats_in_transit: 'onderweg',
        stats_recent: 'recent',
        stats_letters: 'brieven',
        error_no_carriers: 'Geen carriers geconfigureerd, of geen van de geconfigureerde sensoren gevonden.',
        error_no_carriers_hint: 'Voeg minstens 1 carrier toe met een entity_incoming of entity_delivered.',
        editor_title: '📦 Multi-carrier pakketten kaart',
        editor_intro1: 'Voeg hieronder één of meer carriers toe (PostNL, DHL, DPD, ...). Elke carrier kan tot 4 sensoren hebben.',
        editor_intro2: 'Kies het juiste PostNL-type: PostNL (huidige ≥4.x integratie), PostNL (<v4.x, wordt uitgefaseerd) of PostNL (ArjenBos, wordt uitgefaseerd).',
        section_basic: 'Basis Instellingen',
        label_card_title: 'Kaartnaam',
        label_days_back: 'Aantal dagen geschiedenis (bezorgd)',
        section_carriers: 'Carriers',
        btn_add_carrier: '+ Carrier toevoegen',
        section_layout: 'Layout Volgorde',
        layout_help: 'Gebruik de pijltjes om de blokken te herschikken',
        layout_header: 'Header (Titel)',
        layout_animation: 'Animatie / Afbeelding',
        layout_tabs: 'Navigatie Tabs',
        layout_list: 'Pakketten Lijst',
        section_display: 'Weergave Opties',
        show_header: 'Toon header',
        show_delivered_tab: 'Toon "Bezorgd" tab',
        show_sent_tab: 'Toon "Verzonden" tab',
        show_letters_tab: 'Toon "Post" tab (als minstens 1 carrier brieven ondersteunt)',
        show_animation: 'Toon animatie/detailweergave',
        show_placeholder: 'Toon placeholder',
        show_tracking_link: 'Toon "Track & Trace" knop',
        show_raw_status: 'Toon carrier\'s eigen statustekst i.p.v. de vertaalde melding',
        custom_name_scope_label: 'Eigen pakketnamen',
        custom_name_scope_off: 'Uit',
        custom_name_scope_device: 'Alleen deze browser/dit apparaat',
        custom_name_scope_me: 'Alleen voor mij',
        custom_name_scope_everyone: 'Voor iedereen',
        custom_name_scope_help: '"Alleen deze browser/dit apparaat" verlaat deze browser nooit. "Alleen voor mij" wordt opgeslagen bij je Home Assistant-account en volgt je op al je eigen apparaten. "Voor iedereen" wordt instance-breed opgeslagen, zichtbaar voor elke gebruiker — een naam toevoegen of wijzigen bij deze optie vereist een beheerdersaccount; iedereen kan de namen wel gewoon zien.',
        sort_order_label: 'Volgorde pakketten',
        sort_order_auto: 'Automatisch (eerstvolgend bovenaan, meest recent bezorgd bovenaan)',
        sort_order_newest_first: 'Overal nieuwste/verst weg bovenaan',
        sort_order_oldest_first: 'Overal oudste/eerstvolgend bovenaan',
        sort_order_help: '"Automatisch" (aanbevolen) toont het eerstvolgende pakket bovenaan bij Onderweg en Verzonden, en het meest recent bezorgde pakket bovenaan bij Bezorgd. De andere twee opties kiezen één vaste richting overal.',
        group_by_carrier: 'Pakketten groeperen per carrier (uitzetten voor één platte lijst puur op datum gesorteerd, carriers door elkaar)',
        section_appearance: 'Uiterlijk',
        label_header_color: 'Header Kleur',
        label_header_text: 'Header Tekst Kleur',
        label_placeholder_img: 'Placeholder Afbeelding',
        color_default: 'Standaard',
        color_custom: 'Aangepast',
        btn_remove_carrier: 'Verwijder carrier',
        label_carrier_name: 'Naam',
        legacy_warning: 'Recreëert de originele hki-postnl-card: één entity met onderweg én bezorgde pakketten, plus een losse entity voor verzonden. Geen brieven, geen sensor-templating. Deze modus krijgt geen verdere updates zolang arjenbos/ha-postnl niet wordt bijgehouden.',
        label_account: 'Account / gebruikersdeel van de sensornaam',
        account_help_suffix: '_incoming_parcels" etc. De 4 sensoren worden automatisch opgebouwd.',
        gls_account_help: 'GLS heeft geen account — vul de postcode van je GLS-hub in (bv. 1234AB, zoals ingesteld bij het toevoegen van de integratie).',
        dragonfly_account_help: 'Dragonfly heeft geen account of postcode — laat dit veld leeg; de sensoren heten sensor.dragonfly_*.',
        trunkrs_account_help: 'Trunkrs heeft geen account — vul de postcode van je Trunkrs-hub in (bv. 1234AB, zoals ingesteld bij het toevoegen van de integratie).',
        cainiao_account_help: 'Cainiao heeft geen account of postcode — laat dit veld leeg; de sensoren heten sensor.cainiao_*.',
        hermes_account_help: 'Hermes heeft geen account of postcode — laat dit veld leeg; de sensoren heten sensor.hermes_*.',
        packeta_account_help: 'Packeta heeft geen account of postcode — laat dit veld leeg; de sensoren heten sensor.packeta_*.',
        correos_account_help: 'Correos heeft geen account of postcode — laat dit veld leeg; de sensoren heten sensor.correos_*.',
        postnord_account_help: 'PostNord heeft geen account of postcode — laat dit veld leeg; de sensoren heten sensor.postnord_*.',
        sameday_account_help: 'Sameday heeft geen account of postcode — laat dit veld leeg; de sensoren heten sensor.sameday_*.',
        swiss_post_account_help: 'Swiss Post heeft geen account of postcode — laat dit veld leeg; de sensoren heten sensor.swiss_post_*.',
        planzer_account_help: 'Planzer heeft geen account of postcode — laat dit veld leeg; de sensoren heten sensor.planzer_*.',
        austrian_post_account_help: 'Austrian Post heeft geen account of postcode — laat dit veld leeg; de sensoren heten sensor.oesterreichische_post_*.',
        helthjem_account_help: 'Helthjem heeft geen account of postcode — laat dit veld leeg; de sensoren heten sensor.helthjem_*.',
        dynalogic_account_help: 'Dynalogic heeft geen account of postcode — laat dit veld leeg; de sensoren heten sensor.dynalogic_*.',
        budbee_account_help: 'Budbee heeft geen account of postcode — laat dit veld leeg; de sensoren heten sensor.budbee_*.',
        nova_post_account_help: 'Nova Post heeft geen account of postcode — laat dit veld leeg; de sensoren heten sensor.nova_post_*.',
        delhivery_account_help: 'Delhivery heeft geen account of postcode — laat dit veld leeg; de sensoren heten sensor.delhivery_*.',
        sunyou_account_help: 'SunYou heeft geen account of postcode — laat dit veld leeg; de sensoren heten sensor.sunyou_*.',
        show_add_parcel: 'Toon "Pakket toevoegen" op de kaart',
        add_parcel_toggle: '+ Pakket toevoegen',
        add_parcel_carrier: 'Dienst',
        add_parcel_number: 'Track & Trace nummer',
        add_parcel_submit: 'Toevoegen',
        add_parcel_busy: 'Bezig...',
        add_parcel_success: 'Pakket toegevoegd',
        add_parcel_error: 'Toevoegen mislukt — controleer het nummer.',
        adv_sensors: 'Geavanceerd: sensoren handmatig overschrijven',
        adv_sensors_help: 'Normaal hoef je dit niet aan te passen. Gebruik dit alleen als je sensoren een afwijkende naam hebben.',
        entity_incoming: 'Onderweg Entity (incoming)',
        entity_delivered: 'Bezorgd Entity (delivered)',
        entity_outgoing: 'Verzonden Entity (outgoing)',
        entity_outgoing_delivered: 'Verzonden Bezorgd Entity (outgoing delivered)',
        entity_letters: 'Post / Brieven Entity (letters)',
        letters_entity_help: 'Brief-afbeeldingen (image.* entiteiten) worden automatisch gekoppeld op datum.',
        no_letters_support: 'Post/Brieven wordt alleen ondersteund voor PostNL.',
        no_outgoing_support: 'Verzonden pakketten worden niet ondersteund voor deze carrier.',
        adv_appearance: 'Geavanceerd: uiterlijk overschrijven',
        label_icon: 'Icoon (mdi:...)',
        label_color: 'Kleur',
        label_logo: 'Logo URL (optioneel)',
        label_van: 'Voertuig GIF URL (optioneel)',
        label_banner: 'Banner URL (optioneel, achtergrond bij 1 carrier)',
        appearance_help: 'Logo, voertuig-animatie en banner hebben al een ingebouwde standaard per carrier. Vul hier alleen iets in als je die wilt overschrijven.',
        postnl_entity_label: 'PostNL Ontvangst Entity',
        postnl_dist_label: 'PostNL Verzending Entity (optioneel)',
        detected_one: 'Automatisch gevonden',
        detected_multiple: 'Meerdere accounts gevonden — kies er één',
        detected_none: 'Geen sensors gevonden — vul handmatig in',
        integration_not_found: 'Integratie niet gevonden. Installeer de integratie eerst:',
        no_prefix: '(geen gebruikersnaam-prefix)',
        detected_badge: 'gevonden',
        label_icon_pick: 'Icoon',
        label_color_pick: 'Kleur',
        url_logo: 'Logo URL',
        url_van: 'Voertuig GIF URL',
        url_banner: 'Banner URL',
        url_placeholder: 'Laat leeg voor de standaard afbeelding',
        url_preview_fail: 'Afbeelding niet gevonden',
        browse_media: 'Bladeren',
    },
    // bg: machine-drafted, not yet reviewed by a native speaker (see translations/bg.json)
    bg: {
        tab_in_transit: 'По пътя',
        tab_delivered: 'Доставено',
        tab_sent: 'Изпратено',
        tab_letters: 'Писма',
        status_registered: 'Регистрирана',
        status_in_transit: 'По пътя',
        status_out_for_delivery: 'В процес на доставка',
        status_ready_for_pickup: 'Готова за получаване',
        status_at_pickup_point: 'В офис за получаване',
        status_delivered: 'Доставена',
        status_returning: 'Връща се на подателя',
        status_problem: 'Проблем',
        status_unknown: 'Неизвестно',
        step_label_registered: 'Регистрирана',
        step_label_sorting: 'Сортировъчен център',
        step_label_transit: 'В процес на доставка',
        step_label_delivered: 'Доставена',
        step_info_registered: 'Регистрирана в',
        step_info_sorting: 'В сортировъчен център в',
        step_info_transit_and: 'и',
        step_info_delivered: 'Доставена на',
        step_info_expected_delivery: 'Очаквана доставка',
        today: 'Днес',
        tomorrow: 'Утре',
        day_after_tomorrow: 'Вдругиден',
        expected_on: 'Очаквана на',
        between_time: 'между',
        parcel_from: 'Пратка от',
        unknown: 'Неизвестно',
        mail_from: 'Поща от',
        letterbox_mail: 'Пощенска кутия',
        unread: 'Непрочетено',
        letterbox_received: 'Получена поща в пощенската кутия',
        parcel_delivered_msg: 'Пратката е доставена',
        select_parcel: 'Изберете пратка за подробности',
        no_image: 'Няма налично изображение',
        label_tracking: 'Проследяване',
        label_status: 'Статус',
        label_delivery: 'Доставка',
        label_pickup_point: 'Офис за получаване',
        label_custom_name: 'Собствено име',
        add_custom_name: '+ Добави име',
        custom_name_placeholder: 'напр. Подарък за рожден ден',
        custom_name_edit: 'Редактирай името',
        custom_name_save: 'Запази',
        custom_name_cancel: 'Отказ',
        home_delivery: 'Доставка до дома',
        pickup_point: 'Офис за получаване',
        label_type: 'Тип',
        type_letter: 'Писмо',
        type_parcel: 'Пратка',
        open_tracking: 'ОТВОРИ ПРОСЛЕДЯВАНЕТО ↗',
        no_parcels: 'Няма пратки в тази категория',
        post_section_upcoming: 'Все още за доставяне',
        post_section_delivered: 'Доставени',
        stats_in_transit: 'по пътя',
        stats_recent: 'скорошни',
        stats_letters: 'писма',
        error_no_carriers: 'Няма конфигурирани превозвачи или нито един от конфигурираните сензори не е намерен.',
        error_no_carriers_hint: 'Добавете поне 1 превозвач с entity_incoming или entity_delivered.',
        editor_title: '📦 Карта за пратки с множество превозвачи',
        editor_intro1: 'Добавете един или повече превозвачи по-долу (PostNL, DHL, DPD, ...). Всеки превозвач може да има до 4 сензора.',
        editor_intro2: 'Изберете правилния тип PostNL: PostNL (текуща интеграция ≥4.x), PostNL (<v4.x, извежда се от употреба) или PostNL (ArjenBos, извежда се от употреба).',
        section_basic: 'Основни настройки',
        label_card_title: 'Заглавие на картата',
        label_days_back: 'Дни за показване на историята на доставките',
        section_carriers: 'Превозвачи',
        btn_add_carrier: '+ Добави превозвач',
        section_layout: 'Ред на подредбата',
        layout_help: 'Използвайте стрелките, за да пренаредите блоковете',
        layout_header: 'Заглавна част (Заглавие)',
        layout_animation: 'Анимация / Изображение',
        layout_tabs: 'Навигационни раздели',
        layout_list: 'Списък с пратки',
        section_display: 'Опции за показване',
        show_header: 'Показвай заглавната част',
        show_delivered_tab: 'Показвай раздел "Доставено"',
        show_sent_tab: 'Показвай раздел "Изпратено"',
        show_letters_tab: 'Показвай раздел "Писма" (изисква поне 1 превозвач с поддръжка на писма)',
        show_animation: 'Показвай анимация / подробен изглед',
        show_placeholder: 'Показвай запазващо място изображение',
        show_tracking_link: 'Показвай бутон за проследяване (изключете за киоск / само за докосване)',
        show_raw_status: 'Показвай собствения текст за статус на превозвача вместо преведения етикет',
        custom_name_scope_label: 'Собствени имена на пратки',
        custom_name_scope_off: 'Изключено',
        custom_name_scope_device: 'Само този браузър/устройство',
        custom_name_scope_me: 'Само за мен',
        custom_name_scope_everyone: 'За всички',
        custom_name_scope_help: '„Само този браузър/устройство“ никога не напуска този браузър. „Само за мен“ се запазва в акаунта ви в Home Assistant и ви следва на всички ваши устройства. „За всички“ се запазва за цялата инсталация, видимо за всеки потребител — добавянето или редактирането на име с тази опция изисква администраторски акаунт; имената могат да се виждат от всеки.',
        sort_order_label: 'Ред на пратките',
        sort_order_auto: 'Автоматично (най-скорошната първа, най-скорошната доставка първа)',
        sort_order_newest_first: 'Навсякъде най-новата/най-отдалечената първа',
        sort_order_oldest_first: 'Навсякъде най-старата/най-скорошната първа',
        sort_order_help: '„Автоматично“ (препоръчително) показва пратката, която пристига най-скоро, първа в По пътя и Изпратено, а в Доставено — последно доставената пратка първа. Другите две опции фиксират една посока навсякъде.',
        group_by_carrier: 'Групирай пратките по превозвач (изключете за един общ списък, подреден само по дата, с размесени превозвачи)',
        section_appearance: 'Изглед',
        label_header_color: 'Цвят на заглавната част',
        label_header_text: 'Цвят на текста в заглавната част',
        label_placeholder_img: 'Запазващо място изображение',
        color_default: 'По подразбиране',
        color_custom: 'Персонализиран',
        btn_remove_carrier: 'Премахни превозвача',
        label_carrier_name: 'Име',
        legacy_warning: 'Пресъздава оригиналната карта hki-postnl-card: един обект с пратки по пътя и доставени, плюс отделен обект за изпратени пратки. Без поддръжка на писма, без шаблониране на сензори. Този режим няма да получава повече актуализации, докато arjenbos/ha-postnl не се поддържа активно.',
        label_account: 'Акаунт / потребителска част от името на сензора',
        account_help_suffix: '_incoming_parcels" и т.н. 4-те сензора се създават автоматично.',
        gls_account_help: 'GLS няма акаунт — въведете пощенския код на вашия GLS хъб (напр. 1234AB, както е зададен при добавяне на интеграцията).',
        dragonfly_account_help: 'Dragonfly няма акаунт или пощенски код — оставете това поле празно; сензорите се наричат sensor.dragonfly_*.',
        trunkrs_account_help: 'Trunkrs няма акаунт — въведете пощенския код на вашия хъб на Trunkrs (напр. 1234AB, както е зададен при добавяне на интеграцията).',
        cainiao_account_help: 'Cainiao няма акаунт или пощенски код — оставете това поле празно; сензорите се наричат sensor.cainiao_*.',
        hermes_account_help: 'Hermes няма акаунт или пощенски код — оставете това поле празно; сензорите се наричат sensor.hermes_*.',
        packeta_account_help: 'Packeta (Zásilkovna) няма акаунт или пощенски код — оставете това поле празно; сензорите се наричат sensor.packeta_*.',
        correos_account_help: 'Correos няма акаунт или пощенски код — оставете това поле празно; сензорите се наричат sensor.correos_*.',
        postnord_account_help: 'PostNord няма акаунт или пощенски код — оставете това поле празно; сензорите се наричат sensor.postnord_*.',
        sameday_account_help: 'Sameday няма акаунт или пощенски код — оставете това поле празно; сензорите се наричат sensor.sameday_*.',
        swiss_post_account_help: 'Swiss Post няма акаунт или пощенски код — оставете това поле празно; сензорите се наричат sensor.swiss_post_*.',
        planzer_account_help: 'Planzer няма акаунт или пощенски код — оставете това поле празно; сензорите се наричат sensor.planzer_*.',
        austrian_post_account_help: 'Austrian Post няма акаунт или пощенски код — оставете това поле празно; сензорите се наричат sensor.oesterreichische_post_*.',
        helthjem_account_help: 'Helthjem няма акаунт или пощенски код — оставете това поле празно; сензорите се наричат sensor.helthjem_*.',
        dynalogic_account_help: 'Dynalogic няма акаунт или пощенски код — оставете това поле празно; сензорите се наричат sensor.dynalogic_*.',
        budbee_account_help: 'Budbee няма акаунт или пощенски код — оставете това поле празно; сензорите се наричат sensor.budbee_*.',
        nova_post_account_help: 'Nova Post няма акаунт или пощенски код — оставете това поле празно; сензорите се наричат sensor.nova_post_*.',
        delhivery_account_help: 'Delhivery няма акаунт или пощенски код — оставете това поле празно; сензорите се наричат sensor.delhivery_*.',
        sunyou_account_help: 'SunYou няма акаунт или пощенски код — оставете това поле празно; сензорите се наричат sensor.sunyou_*.',
        show_add_parcel: 'Показвай "Добави пратка" на картата',
        add_parcel_toggle: '+ Добави пратка',
        add_parcel_carrier: 'Превозвач',
        add_parcel_number: 'Номер за проследяване',
        add_parcel_submit: 'Добави',
        add_parcel_busy: 'Добавяне...',
        add_parcel_success: 'Пратката е добавена',
        add_parcel_error: 'Добавянето неуспешно — проверете номера.',
        adv_sensors: 'Разширено: ръчно замяна на сензорите',
        adv_sensors_help: 'Обикновено не е нужно да променяте това. Използвайте само ако сензорите ви имат нестандартно име.',
        entity_incoming: 'Обект По пътя (входящи)',
        entity_delivered: 'Обект Доставено',
        entity_outgoing: 'Обект Изпратено (изходящи)',
        entity_outgoing_delivered: 'Обект Доставени изпратени (изходящи доставени)',
        entity_letters: 'Обект Писма',
        letters_entity_help: 'Сканираните изображения на писмата (обекти image.*) се съпоставят автоматично по дата.',
        no_letters_support: 'Писмата се поддържат само за PostNL.',
        no_outgoing_support: 'Изпратените пратки не се поддържат за този превозвач.',
        adv_appearance: 'Разширено: замяна на изгледа',
        label_icon: 'Икона (mdi:...)',
        label_color: 'Цвят',
        label_logo: 'URL на лого (по избор)',
        label_van: 'URL на GIF на превозно средство (по избор)',
        label_banner: 'URL на банер (по избор, фон при 1 превозвач)',
        appearance_help: 'Логото, анимацията на превозното средство и банерът вече имат вградена стойност по подразбиране за всеки превозвач. Попълнете стойност тук само ако искате да я замените.',
        postnl_entity_label: 'Входящ обект на PostNL',
        postnl_dist_label: 'Изходящ обект на PostNL (по избор)',
        detected_one: 'Открито автоматично',
        detected_multiple: 'Намерени са няколко акаунта — изберете един',
        detected_none: 'Не са намерени сензори — въведете ръчно',
        integration_not_found: 'Интеграцията не е намерена. Първо инсталирайте интеграцията:',
        no_prefix: '(без представка на акаунта)',
        detected_badge: 'намерени',
        label_icon_pick: 'Икона',
        label_color_pick: 'Цвят',
        url_logo: 'URL на лого',
        url_van: 'URL на GIF на превозно средство',
        url_banner: 'URL на банер',
        url_placeholder: 'Оставете празно, за да използвате стойността по подразбиране',
        url_preview_fail: 'Изображението не е намерено',
        browse_media: 'Разгледай',
    },
    // cs: machine-drafted, not yet reviewed by a native speaker (see translations/cs.json)
    cs: {
        tab_in_transit: 'Na cestě',
        tab_delivered: 'Doručeno',
        tab_sent: 'Odesláno',
        tab_letters: 'Dopisy',
        status_registered: 'Zaregistrováno',
        status_in_transit: 'Na cestě',
        status_out_for_delivery: 'V doručování',
        status_ready_for_pickup: 'Připraveno k vyzvednutí',
        status_at_pickup_point: 'Na výdejním místě',
        status_delivered: 'Doručeno',
        status_returning: 'Vrací se odesílateli',
        status_problem: 'Problém',
        status_unknown: 'Neznámé',
        step_label_registered: 'Zaregistrováno',
        step_label_sorting: 'Třídicí centrum',
        step_label_transit: 'V doručování',
        step_label_delivered: 'Doručeno',
        step_info_registered: 'Zaregistrováno v',
        step_info_sorting: 'V třídicím centru v',
        step_info_transit_and: 'a',
        step_info_delivered: 'Doručeno dne',
        step_info_expected_delivery: 'Očekávané doručení',
        today: 'Dnes',
        tomorrow: 'Zítra',
        day_after_tomorrow: 'Pozítří',
        expected_on: 'Očekáváno dne',
        between_time: 'mezi',
        parcel_from: 'Zásilka od',
        unknown: 'Neznámé',
        mail_from: 'Pošta od',
        letterbox_mail: 'Poštovní schránka',
        unread: 'Nepřečteno',
        letterbox_received: 'Přijata pošta do schránky',
        parcel_delivered_msg: 'Zásilka doručena',
        select_parcel: 'Vyberte zásilku pro podrobnosti',
        no_image: 'Obrázek není k dispozici',
        label_tracking: 'Sledování',
        label_status: 'Stav',
        label_delivery: 'Doručení',
        label_pickup_point: 'Výdejní místo',
        label_custom_name: 'Vlastní název',
        add_custom_name: '+ Přidat název',
        custom_name_placeholder: 'např. Dárek k narozeninám',
        custom_name_edit: 'Upravit název',
        custom_name_save: 'Uložit',
        custom_name_cancel: 'Zrušit',
        home_delivery: 'Doručení domů',
        pickup_point: 'Výdejní místo',
        label_type: 'Typ',
        type_letter: 'Dopis',
        type_parcel: 'Zásilka',
        open_tracking: 'OTEVŘÍT SLEDOVÁNÍ ↗',
        no_parcels: 'V této kategorii nejsou žádné zásilky',
        post_section_upcoming: 'Ještě k doručení',
        post_section_delivered: 'Doručeno',
        stats_in_transit: 'na cestě',
        stats_recent: 'nedávné',
        stats_letters: 'dopisy',
        error_no_carriers: 'Nejsou nakonfigurováni žádní dopravci, nebo nebyl nalezen žádný z nakonfigurovaných senzorů.',
        error_no_carriers_hint: 'Přidejte alespoň 1 dopravce s entity_incoming nebo entity_delivered.',
        editor_title: '📦 Karta zásilek od více dopravců',
        editor_intro1: 'Níže přidejte jednoho nebo více dopravců (PostNL, DHL, DPD, ...). Každý dopravce může mít až 4 senzory.',
        editor_intro2: 'Vyberte správný typ PostNL: PostNL (aktuální integrace ≥4.x), PostNL (<v4.x, postupně rušeno), nebo PostNL (ArjenBos, postupně rušeno).',
        section_basic: 'Základní nastavení',
        label_card_title: 'Název karty',
        label_days_back: 'Počet dní historie doručení',
        section_carriers: 'Dopravci',
        btn_add_carrier: '+ Přidat dopravce',
        section_layout: 'Pořadí rozvržení',
        layout_help: 'Pomocí šipek změňte pořadí bloků',
        layout_header: 'Záhlaví (Název)',
        layout_animation: 'Animace / Obrázek',
        layout_tabs: 'Navigační karty',
        layout_list: 'Seznam zásilek',
        section_display: 'Možnosti zobrazení',
        show_header: 'Zobrazit záhlaví',
        show_delivered_tab: 'Zobrazit kartu "Doručeno"',
        show_sent_tab: 'Zobrazit kartu "Odesláno"',
        show_letters_tab: 'Zobrazit kartu "Dopisy" (vyžaduje alespoň 1 dopravce s podporou dopisů)',
        show_animation: 'Zobrazit animaci / detailní zobrazení',
        show_placeholder: 'Zobrazit náhradní obrázek',
        show_tracking_link: 'Zobrazit tlačítko sledování (vypněte pro kiosek / pouze dotyk)',
        show_raw_status: 'Zobrazit vlastní stavový text dopravce místo přeloženého popisku',
        custom_name_scope_label: 'Vlastní názvy zásilek',
        custom_name_scope_off: 'Vypnuto',
        custom_name_scope_device: 'Pouze tento prohlížeč/zařízení',
        custom_name_scope_me: 'Pouze pro mě',
        custom_name_scope_everyone: 'Pro všechny',
        custom_name_scope_help: '"Pouze tento prohlížeč/zařízení" nikdy neopustí tento prohlížeč. "Pouze pro mě" se ukládá do vašeho účtu Home Assistant a sleduje vás na všech vašich zařízeních. "Pro všechny" se ukládá v rámci celé instance a je viditelné pro každého uživatele — přidání nebo úprava názvu u této možnosti vyžaduje účet správce; názvy může vidět kdokoli.',
        sort_order_label: 'Pořadí zásilek',
        sort_order_auto: 'Automaticky (nejbližší jako první, nejnovější doručení jako první)',
        sort_order_newest_first: 'Všude nejnovější/nejvzdálenější jako první',
        sort_order_oldest_first: 'Všude nejstarší/nejbližší jako první',
        sort_order_help: '"Automaticky" (doporučeno) zobrazí nejdříve zásilku, která dorazí nejdříve, v kartách Na cestě a Odesláno, a naposledy doručenou zásilku jako první v kartě Doručeno. Další dvě možnosti zvolí jeden pevný směr všude.',
        group_by_carrier: 'Seskupit zásilky podle dopravce (vypněte pro jeden plochý seznam řazený čistě podle data, kde se dopravci prolínají)',
        section_appearance: 'Vzhled',
        label_header_color: 'Barva záhlaví',
        label_header_text: 'Barva textu záhlaví',
        label_placeholder_img: 'Náhradní obrázek',
        color_default: 'Výchozí',
        color_custom: 'Vlastní',
        btn_remove_carrier: 'Odebrat dopravce',
        label_carrier_name: 'Název',
        legacy_warning: 'Znovu vytvoří původní kartu hki-postnl-card: jedna entita s zásilkami na cestě i doručenými, plus samostatná entita pro odeslané zásilky. Bez podpory dopisů, bez šablonování senzorů. Tento režim nebude dále aktualizován, dokud nebude arjenbos/ha-postnl aktivně udržován.',
        label_account: 'Účet / uživatelská část názvu senzoru',
        account_help_suffix: '_incoming_parcels" atd. 4 senzory se vytvoří automaticky.',
        gls_account_help: 'GLS nemá účet — zadejte PSČ vašeho GLS uzlu (např. 1234AB, jak bylo nastaveno při přidávání integrace).',
        dragonfly_account_help: 'Dragonfly nemá účet ani PSČ — ponechte toto pole prázdné; senzory se jmenují sensor.dragonfly_*.',
        trunkrs_account_help: 'Trunkrs nemá účet — zadejte PSČ vašeho uzlu Trunkrs (např. 1234AB, jak bylo nastaveno při přidávání integrace).',
        cainiao_account_help: 'Cainiao nemá účet ani PSČ — ponechte toto pole prázdné; senzory se jmenují sensor.cainiao_*.',
        hermes_account_help: 'Hermes nemá účet ani PSČ — ponechte toto pole prázdné; senzory se jmenují sensor.hermes_*.',
        packeta_account_help: 'Zásilkovna (Packeta) nemá účet ani PSČ — ponechte toto pole prázdné; senzory se jmenují sensor.packeta_*.',
        correos_account_help: 'Correos nemá účet ani PSČ — ponechte toto pole prázdné; senzory se jmenují sensor.correos_*.',
        postnord_account_help: 'PostNord nemá účet ani PSČ — ponechte toto pole prázdné; senzory se jmenují sensor.postnord_*.',
        sameday_account_help: 'Sameday nemá účet ani PSČ — ponechte toto pole prázdné; senzory se jmenují sensor.sameday_*.',
        swiss_post_account_help: 'Swiss Post nemá účet ani PSČ — ponechte toto pole prázdné; senzory se jmenují sensor.swiss_post_*.',
        planzer_account_help: 'Planzer nemá účet ani PSČ — ponechte toto pole prázdné; senzory se jmenují sensor.planzer_*.',
        austrian_post_account_help: 'Rakouská pošta nemá účet ani PSČ — ponechte toto pole prázdné; senzory se jmenují sensor.oesterreichische_post_*.',
        helthjem_account_help: 'Helthjem nemá účet ani PSČ — ponechte toto pole prázdné; senzory se jmenují sensor.helthjem_*.',
        dynalogic_account_help: 'Dynalogic nemá účet ani PSČ — ponechte toto pole prázdné; senzory se jmenují sensor.dynalogic_*.',
        budbee_account_help: 'Budbee nemá účet ani PSČ — ponechte toto pole prázdné; senzory se jmenují sensor.budbee_*.',
        nova_post_account_help: 'Nova Post nemá účet ani PSČ — ponechte toto pole prázdné; senzory se jmenují sensor.nova_post_*.',
        delhivery_account_help: 'Delhivery nemá účet ani PSČ — ponechte toto pole prázdné; senzory se jmenují sensor.delhivery_*.',
        sunyou_account_help: 'SunYou nemá účet ani PSČ — ponechte toto pole prázdné; senzory se jmenují sensor.sunyou_*.',
        show_add_parcel: 'Zobrazit "Přidat zásilku" na kartě',
        add_parcel_toggle: '+ Přidat zásilku',
        add_parcel_carrier: 'Dopravce',
        add_parcel_number: 'Sledovací číslo',
        add_parcel_submit: 'Přidat',
        add_parcel_busy: 'Přidávání...',
        add_parcel_success: 'Zásilka přidána',
        add_parcel_error: 'Přidání se nezdařilo — zkontrolujte číslo.',
        adv_sensors: 'Pokročilé: ruční přepsání senzorů',
        adv_sensors_help: 'Toto obvykle nemusíte měnit. Použijte pouze pokud vaše senzory mají nestandardní název.',
        entity_incoming: 'Entita Na cestě (příchozí)',
        entity_delivered: 'Entita Doručeno',
        entity_outgoing: 'Entita Odesláno (odchozí)',
        entity_outgoing_delivered: 'Entita Doručené odeslané (odchozí doručené)',
        entity_letters: 'Entita Dopisy',
        letters_entity_help: 'Obrázky skenů dopisů (entity image.*) jsou automaticky párovány podle data.',
        no_letters_support: 'Dopisy jsou podporovány pouze pro PostNL.',
        no_outgoing_support: 'Odeslané zásilky nejsou u tohoto dopravce podporovány.',
        adv_appearance: 'Pokročilé: přepsání vzhledu',
        label_icon: 'Ikona (mdi:...)',
        label_color: 'Barva',
        label_logo: 'URL loga (volitelné)',
        label_van: 'URL GIF vozidla (volitelné)',
        label_banner: 'URL banneru (volitelné, pozadí při 1 dopravci)',
        appearance_help: 'Logo, animace vozidla a banner již mají výchozí hodnotu podle dopravce. Vyplňte zde hodnotu pouze pokud ji chcete přepsat.',
        postnl_entity_label: 'Vstupní entita PostNL',
        postnl_dist_label: 'Výstupní entita PostNL (volitelné)',
        detected_one: 'Automaticky rozpoznáno',
        detected_multiple: 'Nalezeno více účtů — vyberte jeden',
        detected_none: 'Nenalezeny žádné senzory — zadejte ručně',
        integration_not_found: 'Integrace nenalezena. Nejprve nainstalujte integraci:',
        no_prefix: '(bez předpony účtu)',
        detected_badge: 'nalezeno',
        label_icon_pick: 'Ikona',
        label_color_pick: 'Barva',
        url_logo: 'URL loga',
        url_van: 'URL GIF vozidla',
        url_banner: 'URL banneru',
        url_placeholder: 'Ponechte prázdné pro použití výchozí hodnoty',
        url_preview_fail: 'Obrázek nenalezen',
        browse_media: 'Procházet',
    },
    // da: machine-drafted, not yet reviewed by a native speaker (see translations/da.json)
    da: {
        tab_in_transit: 'Undervejs',
        tab_delivered: 'Leveret',
        tab_sent: 'Sendt',
        tab_letters: 'Breve',
        status_registered: 'Registreret',
        status_in_transit: 'Undervejs',
        status_out_for_delivery: 'Ude til levering',
        status_ready_for_pickup: 'Klar til afhentning',
        status_at_pickup_point: 'Ved afhentningssted',
        status_delivered: 'Leveret',
        status_returning: 'Returneres til afsenderen',
        status_problem: 'Problem',
        status_unknown: 'Ukendt',
        step_label_registered: 'Registreret',
        step_label_sorting: 'Sorteringscenter',
        step_label_transit: 'Ude til levering',
        step_label_delivered: 'Leveret',
        step_info_registered: 'Registreret kl.',
        step_info_sorting: 'På sorteringscenter kl.',
        step_info_transit_and: 'og',
        step_info_delivered: 'Leveret den',
        step_info_expected_delivery: 'Forventet levering',
        today: 'I dag',
        tomorrow: 'I morgen',
        day_after_tomorrow: 'I overmorgen',
        expected_on: 'Forventes den',
        between_time: 'mellem',
        parcel_from: 'Pakke fra',
        unknown: 'Ukendt',
        mail_from: 'Post fra',
        letterbox_mail: 'Postkasse-post',
        unread: 'Ulæst',
        letterbox_received: 'Post modtaget i postkassen',
        parcel_delivered_msg: 'Pakke leveret',
        select_parcel: 'Vælg en pakke for detaljer',
        no_image: 'Intet billede tilgængeligt',
        label_tracking: 'Sporing',
        label_status: 'Status',
        label_delivery: 'Levering',
        label_pickup_point: 'Afhentningssted',
        label_custom_name: 'Eget navn',
        add_custom_name: '+ Tilføj navn',
        custom_name_placeholder: 'f.eks. Fødselsdagsgave',
        custom_name_edit: 'Rediger navn',
        custom_name_save: 'Gem',
        custom_name_cancel: 'Annuller',
        home_delivery: 'Levering til hjemmet',
        pickup_point: 'Afhentningssted',
        label_type: 'Type',
        type_letter: 'Brev',
        type_parcel: 'Pakke',
        open_tracking: 'ÅBN SPORING ↗',
        no_parcels: 'Ingen pakker i denne kategori',
        post_section_upcoming: 'Mangler stadig at blive leveret',
        post_section_delivered: 'Leveret',
        stats_in_transit: 'undervejs',
        stats_recent: 'nylige',
        stats_letters: 'breve',
        error_no_carriers: 'Ingen transportører er konfigureret, eller ingen af de konfigurerede sensorer blev fundet.',
        error_no_carriers_hint: 'Tilføj mindst 1 transportør med entity_incoming eller entity_delivered.',
        editor_title: '📦 Pakkekort for flere transportører',
        editor_intro1: 'Tilføj en eller flere transportører nedenfor (PostNL, DHL, DPD, ...). Hver transportør kan have op til 4 sensorer.',
        editor_intro2: 'Vælg den korrekte PostNL-type: PostNL (nuværende ≥4.x-integration), PostNL (<v4.x, udfases) eller PostNL (ArjenBos, udfases).',
        section_basic: 'Grundlæggende indstillinger',
        label_card_title: 'Kortets titel',
        label_days_back: 'Antal dage der vises leveringshistorik for',
        section_carriers: 'Transportører',
        btn_add_carrier: '+ Tilføj transportør',
        section_layout: 'Layoutrækkefølge',
        layout_help: 'Brug pilene til at omarrangere blokkene',
        layout_header: 'Overskrift (Titel)',
        layout_animation: 'Animation / Billede',
        layout_tabs: 'Navigationsfaner',
        layout_list: 'Pakkeliste',
        section_display: 'Visningsindstillinger',
        show_header: 'Vis overskrift',
        show_delivered_tab: 'Vis fanen "Leveret"',
        show_sent_tab: 'Vis fanen "Sendt"',
        show_letters_tab: 'Vis fanen "Breve" (kræver mindst 1 transportør med brevunderstøttelse)',
        show_animation: 'Vis animation / detaljevisning',
        show_placeholder: 'Vis pladsholderbillede',
        show_tracking_link: 'Vis sporingsknap (deaktiver til kiosk / kun touch)',
        show_raw_status: 'Vis transportørens egen statustekst i stedet for den oversatte etiket',
        custom_name_scope_label: 'Egne pakkenavne',
        custom_name_scope_off: 'Fra',
        custom_name_scope_device: 'Kun denne browser/enhed',
        custom_name_scope_me: 'Kun til mig',
        custom_name_scope_everyone: 'Til alle',
        custom_name_scope_help: '"Kun denne browser/enhed" forlader aldrig denne browser. "Kun til mig" gemmes på din Home Assistant-konto og følger dig på alle dine egne enheder. "Til alle" gemmes for hele instansen, synligt for alle brugere — at tilføje eller redigere et navn med denne indstilling kræver en administratorkonto; navnene kan ses af enhver.',
        sort_order_label: 'Pakkerækkefølge',
        sort_order_auto: 'Automatisk (nærmeste først, seneste levering først)',
        sort_order_newest_first: 'Nyeste/længst væk først overalt',
        sort_order_oldest_first: 'Ældste/nærmeste først overalt',
        sort_order_help: '"Automatisk" (anbefales) viser pakken, der ankommer først, øverst i Undervejs og Sendt, og den senest leverede pakke øverst i Leveret. De to andre muligheder fastlåser én retning overalt.',
        group_by_carrier: 'Gruppér pakker efter transportør (deaktiver for én flad liste sorteret udelukkende efter dato, med blandede transportører)',
        section_appearance: 'Udseende',
        label_header_color: 'Overskriftsfarve',
        label_header_text: 'Overskriftstekstfarve',
        label_placeholder_img: 'Pladsholderbillede',
        color_default: 'Standard',
        color_custom: 'Brugerdefineret',
        btn_remove_carrier: 'Fjern transportør',
        label_carrier_name: 'Navn',
        legacy_warning: 'Genskaber det oprindelige hki-postnl-card: én entitet med pakker undervejs og leverede, plus en separat entitet til sendte pakker. Ingen brevunderstøttelse, ingen sensortemplering. Denne tilstand vil ikke modtage flere opdateringer, så længe arjenbos/ha-postnl ikke vedligeholdes aktivt.',
        label_account: 'Konto / brugerdel af sensornavnet',
        account_help_suffix: '_incoming_parcels" osv. De 4 sensorer oprettes automatisk.',
        gls_account_help: 'GLS har ingen konto — indtast postnummeret for dit GLS-hub (f.eks. 1234AB, som angivet da integrationen blev tilføjet).',
        dragonfly_account_help: 'Dragonfly har ingen konto eller postnummer — lad dette felt være tomt; sensorerne hedder sensor.dragonfly_*.',
        trunkrs_account_help: 'Trunkrs har ingen konto — indtast postnummeret for dit Trunkrs-hub (f.eks. 1234AB, som angivet da integrationen blev tilføjet).',
        cainiao_account_help: 'Cainiao har ingen konto eller postnummer — lad dette felt være tomt; sensorerne hedder sensor.cainiao_*.',
        hermes_account_help: 'Hermes har ingen konto eller postnummer — lad dette felt være tomt; sensorerne hedder sensor.hermes_*.',
        packeta_account_help: 'Packeta (Zásilkovna) har ingen konto eller postnummer — lad dette felt være tomt; sensorerne hedder sensor.packeta_*.',
        correos_account_help: 'Correos har ingen konto eller postnummer — lad dette felt være tomt; sensorerne hedder sensor.correos_*.',
        postnord_account_help: 'PostNord har ingen konto eller postnummer — lad dette felt være tomt; sensorerne hedder sensor.postnord_*.',
        sameday_account_help: 'Sameday har ingen konto eller postnummer — lad dette felt være tomt; sensorerne hedder sensor.sameday_*.',
        swiss_post_account_help: 'Swiss Post har ingen konto eller postnummer — lad dette felt være tomt; sensorerne hedder sensor.swiss_post_*.',
        planzer_account_help: 'Planzer har ingen konto eller postnummer — lad dette felt være tomt; sensorerne hedder sensor.planzer_*.',
        austrian_post_account_help: 'Det østrigske postvæsen har ingen konto eller postnummer — lad dette felt være tomt; sensorerne hedder sensor.oesterreichische_post_*.',
        helthjem_account_help: 'Helthjem har ingen konto eller postnummer — lad dette felt være tomt; sensorerne hedder sensor.helthjem_*.',
        dynalogic_account_help: 'Dynalogic har ingen konto eller postnummer — lad dette felt være tomt; sensorerne hedder sensor.dynalogic_*.',
        budbee_account_help: 'Budbee har ingen konto eller postnummer — lad dette felt være tomt; sensorerne hedder sensor.budbee_*.',
        nova_post_account_help: 'Nova Post har ingen konto eller postnummer — lad dette felt være tomt; sensorerne hedder sensor.nova_post_*.',
        delhivery_account_help: 'Delhivery har ingen konto eller postnummer — lad dette felt være tomt; sensorerne hedder sensor.delhivery_*.',
        sunyou_account_help: 'SunYou har ingen konto eller postnummer — lad dette felt være tomt; sensorerne hedder sensor.sunyou_*.',
        show_add_parcel: 'Vis "Tilføj pakke" på kortet',
        add_parcel_toggle: '+ Tilføj pakke',
        add_parcel_carrier: 'Transportør',
        add_parcel_number: 'Sporingsnummer',
        add_parcel_submit: 'Tilføj',
        add_parcel_busy: 'Tilføjer...',
        add_parcel_success: 'Pakke tilføjet',
        add_parcel_error: 'Kunne ikke tilføje — kontrollér nummeret.',
        adv_sensors: 'Avanceret: tilsidesæt sensorer manuelt',
        adv_sensors_help: 'Du behøver normalt ikke ændre dette. Brug kun dette, hvis dine sensorer har et ikke-standardnavn.',
        entity_incoming: 'Entitet Undervejs (indgående)',
        entity_delivered: 'Entitet Leveret',
        entity_outgoing: 'Entitet Sendt (udgående)',
        entity_outgoing_delivered: 'Entitet Leveret sendt (udgående leveret)',
        entity_letters: 'Entitet Breve',
        letters_entity_help: 'Scannede brevbilleder (image.*-entiteter) matches automatisk efter dato.',
        no_letters_support: 'Breve understøttes kun for PostNL.',
        no_outgoing_support: 'Sendte pakker understøttes ikke for denne transportør.',
        adv_appearance: 'Avanceret: tilsidesæt udseende',
        label_icon: 'Ikon (mdi:...)',
        label_color: 'Farve',
        label_logo: 'Logo-URL (valgfrit)',
        label_van: 'Køretøjs-GIF-URL (valgfrit)',
        label_banner: 'Banner-URL (valgfrit, baggrund ved 1 transportør)',
        appearance_help: 'Logo, køretøjsanimation og banner har allerede en indbygget standardværdi pr. transportør. Udfyld kun en værdi her, hvis du vil tilsidesætte den.',
        postnl_entity_label: 'PostNL indgående entitet',
        postnl_dist_label: 'PostNL udgående entitet (valgfrit)',
        detected_one: 'Automatisk fundet',
        detected_multiple: 'Flere konti fundet — vælg en',
        detected_none: 'Ingen sensorer fundet — indtast manuelt',
        integration_not_found: 'Integrationen blev ikke fundet. Installer integrationen først:',
        no_prefix: '(intet kontopræfiks)',
        detected_badge: 'fundet',
        label_icon_pick: 'Ikon',
        label_color_pick: 'Farve',
        url_logo: 'Logo-URL',
        url_van: 'Køretøjs-GIF-URL',
        url_banner: 'Banner-URL',
        url_placeholder: 'Lad stå tomt for at bruge standardværdien',
        url_preview_fail: 'Billede ikke fundet',
        browse_media: 'Gennemse',
    },
    // de: machine-drafted, not yet reviewed by a native speaker (see translations/de.json)
    de: {
        tab_in_transit: 'Unterwegs',
        tab_delivered: 'Zugestellt',
        tab_sent: 'Versendet',
        tab_letters: 'Post',
        status_registered: 'Angemeldet',
        status_in_transit: 'Unterwegs',
        status_out_for_delivery: 'Heute in Zustellung',
        status_ready_for_pickup: 'Abholbereit',
        status_at_pickup_point: 'An der Abholstation',
        status_delivered: 'Zugestellt',
        status_returning: 'Rücksendung an Absender',
        status_problem: 'Problem',
        status_unknown: 'Unbekannt',
        step_label_registered: 'Angemeldet',
        step_label_sorting: 'Sortierzentrum',
        step_label_transit: 'In Zustellung',
        step_label_delivered: 'Zugestellt',
        step_info_registered: 'Angemeldet um',
        step_info_sorting: 'Im Sortierzentrum um',
        step_info_transit_and: 'und',
        step_info_delivered: 'Zugestellt am',
        step_info_expected_delivery: 'Voraussichtliche Zustellung',
        today: 'Heute',
        tomorrow: 'Morgen',
        day_after_tomorrow: 'Übermorgen',
        expected_on: 'Erwartet am',
        between_time: 'zwischen',
        parcel_from: 'Paket von',
        unknown: 'Unbekannt',
        mail_from: 'Post von',
        letterbox_mail: 'Briefpost',
        unread: 'Ungelesen',
        letterbox_received: 'Briefpost erhalten',
        parcel_delivered_msg: 'Paket zugestellt',
        select_parcel: 'Wähle ein Paket für Details',
        no_image: 'Kein Bild verfügbar',
        label_tracking: 'Sendungsverfolgung',
        label_status: 'Status',
        label_delivery: 'Zustellart',
        label_pickup_point: 'Abholstation',
        label_custom_name: 'Eigener Name',
        add_custom_name: '+ Name hinzufügen',
        custom_name_placeholder: 'z. B. Geburtstagsgeschenk',
        custom_name_edit: 'Name bearbeiten',
        custom_name_save: 'Speichern',
        custom_name_cancel: 'Abbrechen',
        home_delivery: 'Zustellung nach Hause',
        pickup_point: 'Abholstation',
        label_type: 'Typ',
        type_letter: 'Brief',
        type_parcel: 'Paket',
        open_tracking: 'SENDUNGSVERFOLGUNG ÖFFNEN ↗',
        no_parcels: 'Keine Pakete in dieser Kategorie',
        post_section_upcoming: 'Noch zuzustellen',
        post_section_delivered: 'Zugestellt',
        stats_in_transit: 'unterwegs',
        stats_recent: 'kürzlich',
        stats_letters: 'Briefe',
        error_no_carriers: 'Keine Zustelldienste konfiguriert, oder keiner der konfigurierten Sensoren wurde gefunden.',
        error_no_carriers_hint: 'Füge mindestens 1 Zustelldienst mit einer entity_incoming oder entity_delivered hinzu.',
        editor_title: '📦 Multi-Zustelldienst-Paketkarte',
        editor_intro1: 'Füge unten einen oder mehrere Zustelldienste hinzu (PostNL, DHL, DPD, ...). Jeder Zustelldienst kann bis zu 4 Sensoren haben.',
        editor_intro2: 'Wähle den richtigen PostNL-Typ: PostNL (aktuelle ≥4.x-Integration), PostNL (<v4.x, wird ausgemustert) oder PostNL (ArjenBos, wird ausgemustert).',
        section_basic: 'Grundeinstellungen',
        label_card_title: 'Kartentitel',
        label_days_back: 'Anzahl Tage Zustellverlauf',
        section_carriers: 'Zustelldienste',
        btn_add_carrier: '+ Zustelldienst hinzufügen',
        section_layout: 'Layout-Reihenfolge',
        layout_help: 'Verwende die Pfeile, um die Blöcke neu anzuordnen',
        layout_header: 'Kopfzeile (Titel)',
        layout_animation: 'Animation / Bild',
        layout_tabs: 'Navigations-Tabs',
        layout_list: 'Paketliste',
        section_display: 'Anzeigeoptionen',
        show_header: 'Kopfzeile anzeigen',
        show_delivered_tab: 'Tab "Zugestellt" anzeigen',
        show_sent_tab: 'Tab "Versendet" anzeigen',
        show_letters_tab: 'Tab "Post" anzeigen (erfordert mindestens 1 Zustelldienst mit Briefunterstützung)',
        show_animation: 'Animation / Detailansicht anzeigen',
        show_placeholder: 'Platzhalterbild anzeigen',
        show_tracking_link: 'Sendungsverfolgungs-Schaltfläche anzeigen (deaktivieren für Kiosk/reine Touch-Nutzung)',
        show_raw_status: 'Den eigenen Statustext des Zustelldienstes statt der übersetzten Meldung anzeigen',
        custom_name_scope_label: 'Eigene Paketnamen',
        custom_name_scope_off: 'Aus',
        custom_name_scope_device: 'Nur dieser Browser/dieses Gerät',
        custom_name_scope_me: 'Nur für mich',
        custom_name_scope_everyone: 'Für alle',
        custom_name_scope_help: '„Nur dieser Browser/dieses Gerät“ verlässt diesen Browser nie. „Nur für mich“ wird in deinem Home-Assistant-Konto gespeichert und folgt dir auf all deinen eigenen Geräten. „Für alle“ wird instanzweit gespeichert und ist für jeden Benutzer sichtbar — einen Namen bei dieser Option hinzuzufügen oder zu ändern erfordert ein Administratorkonto; sehen können ihn trotzdem alle.',
        sort_order_label: 'Paketreihenfolge',
        sort_order_auto: 'Automatisch (nächstes zuerst, zuletzt zugestellt zuerst)',
        sort_order_newest_first: 'Überall neuestes/am weitesten entferntes zuerst',
        sort_order_oldest_first: 'Überall ältestes/nächstes zuerst',
        sort_order_help: '„Automatisch“ (empfohlen) zeigt bei Unterwegs und Versendet das nächste Paket zuerst und bei Zugestellt das zuletzt zugestellte zuerst. Die anderen beiden Optionen legen überall eine feste Richtung fest.',
        group_by_carrier: 'Pakete nach Zustelldienst gruppieren (deaktivieren für eine flache, rein nach Datum sortierte Liste mit gemischten Zustelldiensten)',
        section_appearance: 'Erscheinungsbild',
        label_header_color: 'Kopfzeilenfarbe',
        label_header_text: 'Kopfzeilen-Textfarbe',
        label_placeholder_img: 'Platzhalterbild',
        color_default: 'Standard',
        color_custom: 'Benutzerdefiniert',
        btn_remove_carrier: 'Zustelldienst entfernen',
        label_carrier_name: 'Name',
        legacy_warning: 'Erstellt die ursprüngliche hki-postnl-card nach: eine Entität mit unterwegs- und zugestellten Paketen, plus eine separate Entität für versendete Pakete. Keine Briefunterstützung, kein Sensor-Templating. Dieser Modus erhält keine weiteren Updates, solange arjenbos/ha-postnl nicht aktiv gepflegt wird.',
        label_account: 'Konto / Benutzerteil des Sensornamens',
        account_help_suffix: '_incoming_parcels" usw. Die 4 Sensoren werden automatisch erstellt.',
        gls_account_help: 'GLS hat kein Konto — gib die Postleitzahl deines GLS-Hubs ein (z. B. 1234AB, wie beim Hinzufügen der Integration eingestellt).',
        dragonfly_account_help: 'Dragonfly hat kein Konto oder Postleitzahl — lasse dieses Feld leer; die Sensoren heißen sensor.dragonfly_*.',
        trunkrs_account_help: 'Trunkrs hat kein Konto — gib die Postleitzahl deines Trunkrs-Hubs ein (z. B. 1234AB, wie beim Hinzufügen der Integration eingestellt).',
        cainiao_account_help: 'Cainiao hat kein Konto oder Postleitzahl — lasse dieses Feld leer; die Sensoren heißen sensor.cainiao_*.',
        hermes_account_help: 'Hermes hat kein Konto oder Postleitzahl — lasse dieses Feld leer; die Sensoren heißen sensor.hermes_*.',
        packeta_account_help: 'Packeta hat kein Konto oder Postleitzahl — lasse dieses Feld leer; die Sensoren heißen sensor.packeta_*.',
        correos_account_help: 'Correos hat kein Konto oder Postleitzahl — lasse dieses Feld leer; die Sensoren heißen sensor.correos_*.',
        postnord_account_help: 'PostNord hat kein Konto oder Postleitzahl — lasse dieses Feld leer; die Sensoren heißen sensor.postnord_*.',
        sameday_account_help: 'Sameday hat kein Konto oder Postleitzahl — lasse dieses Feld leer; die Sensoren heißen sensor.sameday_*.',
        swiss_post_account_help: 'Die Schweizerische Post hat kein Konto oder Postleitzahl — lasse dieses Feld leer; die Sensoren heißen sensor.swiss_post_*.',
        planzer_account_help: 'Planzer hat kein Konto oder Postleitzahl — lasse dieses Feld leer; die Sensoren heißen sensor.planzer_*.',
        austrian_post_account_help: 'Die Österreichische Post hat kein Konto oder Postleitzahl — lasse dieses Feld leer; die Sensoren heißen sensor.oesterreichische_post_*.',
        helthjem_account_help: 'Helthjem hat kein Konto oder Postleitzahl — lasse dieses Feld leer; die Sensoren heißen sensor.helthjem_*.',
        dynalogic_account_help: 'Dynalogic hat kein Konto oder Postleitzahl — lasse dieses Feld leer; die Sensoren heißen sensor.dynalogic_*.',
        budbee_account_help: 'Budbee hat kein Konto oder Postleitzahl — lasse dieses Feld leer; die Sensoren heißen sensor.budbee_*.',
        nova_post_account_help: 'Nova Post hat kein Konto oder Postleitzahl — lasse dieses Feld leer; die Sensoren heißen sensor.nova_post_*.',
        delhivery_account_help: 'Delhivery hat kein Konto oder Postleitzahl — lasse dieses Feld leer; die Sensoren heißen sensor.delhivery_*.',
        sunyou_account_help: 'SunYou hat kein Konto oder Postleitzahl — lasse dieses Feld leer; die Sensoren heißen sensor.sunyou_*.',
        show_add_parcel: '"Paket hinzufügen" auf der Karte anzeigen',
        add_parcel_toggle: '+ Paket hinzufügen',
        add_parcel_carrier: 'Zustelldienst',
        add_parcel_number: 'Sendungsnummer',
        add_parcel_submit: 'Hinzufügen',
        add_parcel_busy: 'Wird hinzugefügt...',
        add_parcel_success: 'Paket hinzugefügt',
        add_parcel_error: 'Hinzufügen fehlgeschlagen — Nummer prüfen.',
        adv_sensors: 'Erweitert: Sensoren manuell überschreiben',
        adv_sensors_help: 'Normalerweise musst du dies nicht ändern. Verwende dies nur, wenn deine Sensoren einen abweichenden Namen haben.',
        entity_incoming: 'Entität Unterwegs (incoming)',
        entity_delivered: 'Entität Zugestellt',
        entity_outgoing: 'Entität Versendet (outgoing)',
        entity_outgoing_delivered: 'Entität Versendet Zugestellt (outgoing delivered)',
        entity_letters: 'Entität Post/Briefe',
        letters_entity_help: 'Brief-Scanbilder (image.*-Entitäten) werden automatisch nach Datum zugeordnet.',
        no_letters_support: 'Post/Briefe wird nur für PostNL unterstützt.',
        no_outgoing_support: 'Versendete Pakete werden für diesen Zustelldienst nicht unterstützt.',
        adv_appearance: 'Erweitert: Erscheinungsbild überschreiben',
        label_icon: 'Symbol (mdi:...)',
        label_color: 'Farbe',
        label_logo: 'Logo-URL (optional)',
        label_van: 'Fahrzeug-GIF-URL (optional)',
        label_banner: 'Banner-URL (optional, Hintergrund bei 1 Zustelldienst)',
        appearance_help: 'Logo, Fahrzeuganimation und Banner haben bereits einen eingebauten Standard pro Zustelldienst. Trage hier nur etwas ein, wenn du das überschreiben möchtest.',
        postnl_entity_label: 'PostNL Eingangs-Entität',
        postnl_dist_label: 'PostNL Ausgangs-Entität (optional)',
        detected_one: 'Automatisch gefunden',
        detected_multiple: 'Mehrere Konten gefunden — eines auswählen',
        detected_none: 'Keine Sensoren gefunden — manuell eingeben',
        integration_not_found: 'Integration nicht gefunden. Installiere zuerst die Integration:',
        no_prefix: '(kein Konto-Präfix)',
        detected_badge: 'gefunden',
        label_icon_pick: 'Symbol',
        label_color_pick: 'Farbe',
        url_logo: 'Logo-URL',
        url_van: 'Fahrzeug-GIF-URL',
        url_banner: 'Banner-URL',
        url_placeholder: 'Leer lassen für den Standard',
        url_preview_fail: 'Bild nicht gefunden',
        browse_media: 'Durchsuchen',
    },
    // es: machine-drafted, not yet reviewed by a native speaker (see translations/es.json)
    es: {
        tab_in_transit: 'En tránsito',
        tab_delivered: 'Entregado',
        tab_sent: 'Enviado',
        tab_letters: 'Correo',
        status_registered: 'Registrado',
        status_in_transit: 'En tránsito',
        status_out_for_delivery: 'Reparto hoy',
        status_ready_for_pickup: 'Listo para recoger',
        status_at_pickup_point: 'En el punto de recogida',
        status_delivered: 'Entregado',
        status_returning: 'Devolución al remitente',
        status_problem: 'Problema',
        status_unknown: 'Desconocido',
        step_label_registered: 'Registrado',
        step_label_sorting: 'Centro de clasificación',
        step_label_transit: 'En reparto',
        step_label_delivered: 'Entregado',
        step_info_registered: 'Registrado a las',
        step_info_sorting: 'En el centro de clasificación a las',
        step_info_transit_and: 'y',
        step_info_delivered: 'Entregado el',
        step_info_expected_delivery: 'Entrega prevista',
        today: 'Hoy',
        tomorrow: 'Mañana',
        day_after_tomorrow: 'Pasado mañana',
        expected_on: 'Previsto para',
        between_time: 'entre',
        parcel_from: 'Paquete de',
        unknown: 'Desconocido',
        mail_from: 'Correo de',
        letterbox_mail: 'Correo postal',
        unread: 'No leído',
        letterbox_received: 'Correo recibido',
        parcel_delivered_msg: 'Paquete entregado',
        select_parcel: 'Selecciona un paquete para ver los detalles',
        no_image: 'No hay imagen disponible',
        label_tracking: 'Seguimiento',
        label_status: 'Estado',
        label_delivery: 'Modo de entrega',
        label_pickup_point: 'Punto de recogida',
        label_custom_name: 'Nombre personalizado',
        add_custom_name: '+ Añadir nombre',
        custom_name_placeholder: 'p. ej. Regalo de cumpleaños',
        custom_name_edit: 'Editar nombre',
        custom_name_save: 'Guardar',
        custom_name_cancel: 'Cancelar',
        home_delivery: 'Entrega a domicilio',
        pickup_point: 'Punto de recogida',
        label_type: 'Tipo',
        type_letter: 'Carta',
        type_parcel: 'Paquete',
        open_tracking: 'ABRIR SEGUIMIENTO ↗',
        no_parcels: 'No hay paquetes en esta categoría',
        post_section_upcoming: 'Pendiente de entrega',
        post_section_delivered: 'Entregado',
        stats_in_transit: 'en tránsito',
        stats_recent: 'reciente',
        stats_letters: 'cartas',
        error_no_carriers: 'No hay transportistas configurados, o no se encontró ninguno de los sensores configurados.',
        error_no_carriers_hint: 'Añade al menos 1 transportista con una entity_incoming o entity_delivered.',
        editor_title: '📦 Tarjeta de paquetes multitransportista',
        editor_intro1: 'Añade a continuación uno o más transportistas (PostNL, DHL, DPD, ...). Cada transportista puede tener hasta 4 sensores.',
        editor_intro2: 'Elige el tipo de PostNL correcto: PostNL (integración actual ≥4.x), PostNL (<v4.x, en proceso de retirada) o PostNL (ArjenBos, en proceso de retirada).',
        section_basic: 'Ajustes básicos',
        label_card_title: 'Título de la tarjeta',
        label_days_back: 'Días de historial de entregas a mostrar',
        section_carriers: 'Transportistas',
        btn_add_carrier: '+ Añadir transportista',
        section_layout: 'Orden del diseño',
        layout_help: 'Usa las flechas para reordenar los bloques',
        layout_header: 'Cabecera (título)',
        layout_animation: 'Animación / imagen',
        layout_tabs: 'Pestañas de navegación',
        layout_list: 'Lista de paquetes',
        section_display: 'Opciones de visualización',
        show_header: 'Mostrar cabecera',
        show_delivered_tab: 'Mostrar pestaña "Entregado"',
        show_sent_tab: 'Mostrar pestaña "Enviado"',
        show_letters_tab: 'Mostrar pestaña "Correo" (requiere al menos 1 transportista con soporte de correo)',
        show_animation: 'Mostrar animación / vista de detalle',
        show_placeholder: 'Mostrar imagen de marcador de posición',
        show_tracking_link: 'Mostrar botón de seguimiento (desactivar para kiosco / uso táctil exclusivo)',
        show_raw_status: 'Mostrar el texto de estado propio del transportista en lugar de la etiqueta traducida',
        custom_name_scope_label: 'Nombres personalizados de paquetes',
        custom_name_scope_off: 'Desactivado',
        custom_name_scope_device: 'Solo este navegador/dispositivo',
        custom_name_scope_me: 'Solo para mí',
        custom_name_scope_everyone: 'Para todos',
        custom_name_scope_help: '"Solo este navegador/dispositivo" nunca sale de este navegador. "Solo para mí" se guarda en tu cuenta de Home Assistant y te sigue en todos tus propios dispositivos. "Para todos" se guarda a nivel de instancia, visible para todos los usuarios — añadir o editar un nombre con esta opción requiere una cuenta de administrador; todos pueden verlos igualmente.',
        sort_order_label: 'Orden de los paquetes',
        sort_order_auto: 'Automático (el más próximo primero, el entregado más reciente primero)',
        sort_order_newest_first: 'Más reciente/lejano primero en todas partes',
        sort_order_oldest_first: 'Más antiguo/próximo primero en todas partes',
        sort_order_help: '"Automático" (recomendado) muestra primero el paquete que llega antes en En tránsito y Enviado, y el entregado más recientemente primero en Entregado. Las otras dos opciones fijan una dirección en todas partes.',
        group_by_carrier: 'Agrupar paquetes por transportista (desactivar para una lista plana ordenada solo por fecha, mezclando transportistas)',
        section_appearance: 'Apariencia',
        label_header_color: 'Color de la cabecera',
        label_header_text: 'Color del texto de la cabecera',
        label_placeholder_img: 'Imagen de marcador de posición',
        color_default: 'Predeterminado',
        color_custom: 'Personalizado',
        btn_remove_carrier: 'Eliminar transportista',
        label_carrier_name: 'Nombre',
        legacy_warning: 'Recrea la hki-postnl-card original: una entidad con paquetes en tránsito y entregados, más una entidad separada para paquetes enviados. Sin soporte de correo, sin plantillas de sensores. Este modo no recibirá más actualizaciones mientras arjenbos/ha-postnl no se mantenga activamente.',
        label_account: 'Cuenta / parte de usuario del nombre del sensor',
        account_help_suffix: '_incoming_parcels" etc. Los 4 sensores se generan automáticamente.',
        gls_account_help: 'GLS no tiene cuenta — introduce el código postal de tu hub GLS (p. ej. 1234AB, tal como se configuró al añadir la integración).',
        dragonfly_account_help: 'Dragonfly no tiene cuenta ni código postal — deja este campo vacío; los sensores se llaman sensor.dragonfly_*.',
        trunkrs_account_help: 'Trunkrs no tiene cuenta — introduce el código postal de tu hub Trunkrs (p. ej. 1234AB, tal como se configuró al añadir la integración).',
        cainiao_account_help: 'Cainiao no tiene cuenta ni código postal — deja este campo vacío; los sensores se llaman sensor.cainiao_*.',
        hermes_account_help: 'Hermes no tiene cuenta ni código postal — deja este campo vacío; los sensores se llaman sensor.hermes_*.',
        packeta_account_help: 'Packeta no tiene cuenta ni código postal — deja este campo vacío; los sensores se llaman sensor.packeta_*.',
        correos_account_help: 'Correos no tiene cuenta ni código postal — deja este campo vacío; los sensores se llaman sensor.correos_*.',
        postnord_account_help: 'PostNord no tiene cuenta ni código postal — deja este campo vacío; los sensores se llaman sensor.postnord_*.',
        sameday_account_help: 'Sameday no tiene cuenta ni código postal — deja este campo vacío; los sensores se llaman sensor.sameday_*.',
        swiss_post_account_help: 'Correos Suizo no tiene cuenta ni código postal — deja este campo vacío; los sensores se llaman sensor.swiss_post_*.',
        planzer_account_help: 'Planzer no tiene cuenta ni código postal — deja este campo vacío; los sensores se llaman sensor.planzer_*.',
        austrian_post_account_help: 'Correos de Austria no tiene cuenta ni código postal — deja este campo vacío; los sensores se llaman sensor.oesterreichische_post_*.',
        helthjem_account_help: 'Helthjem no tiene cuenta ni código postal — deja este campo vacío; los sensores se llaman sensor.helthjem_*.',
        dynalogic_account_help: 'Dynalogic no tiene cuenta ni código postal — deja este campo vacío; los sensores se llaman sensor.dynalogic_*.',
        budbee_account_help: 'Budbee no tiene cuenta ni código postal — deja este campo vacío; los sensores se llaman sensor.budbee_*.',
        nova_post_account_help: 'Nova Post no tiene cuenta ni código postal — deja este campo vacío; los sensores se llaman sensor.nova_post_*.',
        delhivery_account_help: 'Delhivery no tiene cuenta ni código postal — deja este campo vacío; los sensores se llaman sensor.delhivery_*.',
        sunyou_account_help: 'SunYou no tiene cuenta ni código postal — deja este campo vacío; los sensores se llaman sensor.sunyou_*.',
        show_add_parcel: 'Mostrar "Añadir paquete" en la tarjeta',
        add_parcel_toggle: '+ Añadir paquete',
        add_parcel_carrier: 'Transportista',
        add_parcel_number: 'Número de seguimiento',
        add_parcel_submit: 'Añadir',
        add_parcel_busy: 'Añadiendo...',
        add_parcel_success: 'Paquete añadido',
        add_parcel_error: 'Error al añadir — comprueba el número.',
        adv_sensors: 'Avanzado: sobrescribir sensores manualmente',
        adv_sensors_help: 'Normalmente no necesitas cambiar esto. Úsalo solo si tus sensores tienen un nombre no estándar.',
        entity_incoming: 'Entidad en tránsito (incoming)',
        entity_delivered: 'Entidad entregado',
        entity_outgoing: 'Entidad enviado (outgoing)',
        entity_outgoing_delivered: 'Entidad enviado entregado (outgoing delivered)',
        entity_letters: 'Entidad de correo',
        letters_entity_help: 'Las imágenes escaneadas de cartas (entidades image.*) se asocian automáticamente por fecha.',
        no_letters_support: 'El correo solo se admite para PostNL.',
        no_outgoing_support: 'Los paquetes enviados no son compatibles con este transportista.',
        adv_appearance: 'Avanzado: sobrescribir apariencia',
        label_icon: 'Icono (mdi:...)',
        label_color: 'Color',
        label_logo: 'URL del logotipo (opcional)',
        label_van: 'URL del GIF del vehículo (opcional)',
        label_banner: 'URL del banner (opcional, fondo cuando hay 1 transportista)',
        appearance_help: 'El logotipo, la animación del vehículo y el banner ya tienen un valor predeterminado por transportista. Rellena esto solo si quieres sobrescribirlo.',
        postnl_entity_label: 'Entidad de recepción de PostNL',
        postnl_dist_label: 'Entidad de envío de PostNL (opcional)',
        detected_one: 'Detectado automáticamente',
        detected_multiple: 'Se encontraron varias cuentas — elige una',
        detected_none: 'No se encontraron sensores — introduce manualmente',
        integration_not_found: 'Integración no encontrada. Instala primero la integración:',
        no_prefix: '(sin prefijo de cuenta)',
        detected_badge: 'encontrado',
        label_icon_pick: 'Icono',
        label_color_pick: 'Color',
        url_logo: 'URL del logotipo',
        url_van: 'URL del GIF del vehículo',
        url_banner: 'URL del banner',
        url_placeholder: 'Deja vacío para usar el valor predeterminado',
        url_preview_fail: 'Imagen no encontrada',
        browse_media: 'Explorar',
    },
    // fi: machine-drafted, not yet reviewed by a native speaker (see translations/fi.json)
    fi: {
        tab_in_transit: 'Matkalla',
        tab_delivered: 'Toimitettu',
        tab_sent: 'Lähetetty',
        tab_letters: 'Kirjeet',
        status_registered: 'Rekisteröity',
        status_in_transit: 'Matkalla',
        status_out_for_delivery: 'Jakelussa',
        status_ready_for_pickup: 'Valmis noudettavaksi',
        status_at_pickup_point: 'Noutopisteessä',
        status_delivered: 'Toimitettu',
        status_returning: 'Palautuu lähettäjälle',
        status_problem: 'Ongelma',
        status_unknown: 'Tuntematon',
        step_label_registered: 'Rekisteröity',
        step_label_sorting: 'Lajittelukeskus',
        step_label_transit: 'Jakelussa',
        step_label_delivered: 'Toimitettu',
        step_info_registered: 'Rekisteröity klo',
        step_info_sorting: 'Lajittelukeskuksessa klo',
        step_info_transit_and: 'ja',
        step_info_delivered: 'Toimitettu',
        step_info_expected_delivery: 'Arvioitu toimitus',
        today: 'Tänään',
        tomorrow: 'Huomenna',
        day_after_tomorrow: 'Ylihuomenna',
        expected_on: 'Arvioitu',
        between_time: 'välillä',
        parcel_from: 'Paketti lähettäjältä',
        unknown: 'Tuntematon',
        mail_from: 'Posti lähettäjältä',
        letterbox_mail: 'Postilaatikkopostia',
        unread: 'Lukematon',
        letterbox_received: 'Postia vastaanotettu postilaatikkoon',
        parcel_delivered_msg: 'Paketti toimitettu',
        select_parcel: 'Valitse paketti nähdäksesi tiedot',
        no_image: 'Kuvaa ei saatavilla',
        label_tracking: 'Seuranta',
        label_status: 'Tila',
        label_delivery: 'Toimitus',
        label_pickup_point: 'Noutopiste',
        label_custom_name: 'Oma nimi',
        add_custom_name: '+ Lisää nimi',
        custom_name_placeholder: 'esim. Syntymäpäivälahja',
        custom_name_edit: 'Muokkaa nimeä',
        custom_name_save: 'Tallenna',
        custom_name_cancel: 'Peruuta',
        home_delivery: 'Kotiinkuljetus',
        pickup_point: 'Noutopiste',
        label_type: 'Tyyppi',
        type_letter: 'Kirje',
        type_parcel: 'Paketti',
        open_tracking: 'AVAA SEURANTA ↗',
        no_parcels: 'Ei paketteja tässä kategoriassa',
        post_section_upcoming: 'Vielä toimitettavana',
        post_section_delivered: 'Toimitettu',
        stats_in_transit: 'matkalla',
        stats_recent: 'viimeisimmät',
        stats_letters: 'kirjeet',
        error_no_carriers: 'Yhtäkään kuljetusyhtiötä ei ole määritetty, tai mitään määritetyistä antureista ei löytynyt.',
        error_no_carriers_hint: 'Lisää vähintään 1 kuljetusyhtiö, jolla on entity_incoming tai entity_delivered.',
        editor_title: '📦 Usean kuljetusyhtiön pakettikortti',
        editor_intro1: 'Lisää yksi tai useampi kuljetusyhtiö alle (PostNL, DHL, DPD, ...). Jokaisella kuljetusyhtiöllä voi olla enintään 4 anturia.',
        editor_intro2: 'Valitse oikea PostNL-tyyppi: PostNL (nykyinen ≥4.x-integraatio), PostNL (<v4.x, poistumassa käytöstä) tai PostNL (ArjenBos, poistumassa käytöstä).',
        section_basic: 'Perusasetukset',
        label_card_title: 'Kortin otsikko',
        label_days_back: 'Toimitushistorian näyttöpäivien määrä',
        section_carriers: 'Kuljetusyhtiöt',
        btn_add_carrier: '+ Lisää kuljetusyhtiö',
        section_layout: 'Asettelujärjestys',
        layout_help: 'Käytä nuolia lohkojen järjestyksen muuttamiseen',
        layout_header: 'Otsikko (Nimi)',
        layout_animation: 'Animaatio / Kuva',
        layout_tabs: 'Navigointivälilehdet',
        layout_list: 'Pakettiluettelo',
        section_display: 'Näyttöasetukset',
        show_header: 'Näytä otsikko',
        show_delivered_tab: 'Näytä "Toimitettu"-välilehti',
        show_sent_tab: 'Näytä "Lähetetty"-välilehti',
        show_letters_tab: 'Näytä "Kirjeet"-välilehti (vaatii vähintään 1 kuljetusyhtiön, joka tukee kirjeitä)',
        show_animation: 'Näytä animaatio / tarkastelunäkymä',
        show_placeholder: 'Näytä paikkamerkkikuva',
        show_tracking_link: 'Näytä seurantapainike (poista käytöstä kioski- / kosketuskäyttöä varten)',
        show_raw_status: 'Näytä kuljetusyhtiön oma tilateksti käännetyn tekstin sijaan',
        custom_name_scope_label: 'Omat pakettinimet',
        custom_name_scope_off: 'Pois päältä',
        custom_name_scope_device: 'Vain tämä selain/laite',
        custom_name_scope_me: 'Vain minulle',
        custom_name_scope_everyone: 'Kaikille',
        custom_name_scope_help: '"Vain tämä selain/laite" ei koskaan poistu tästä selaimesta. "Vain minulle" tallennetaan Home Assistant -tiliisi ja seuraa sinua kaikilla omilla laitteillasi. "Kaikille" tallennetaan koko instanssin laajuisesti, näkyvissä kaikille käyttäjille — nimen lisääminen tai muokkaaminen tällä vaihtoehdolla vaatii ylläpitäjätilin; nimet näkyvät kaikille.',
        sort_order_label: 'Pakettien järjestys',
        sort_order_auto: 'Automaattinen (lähin ensin, tuorein toimitus ensin)',
        sort_order_newest_first: 'Uusin/kauimmainen ensin kaikkialla',
        sort_order_oldest_first: 'Vanhin/lähin ensin kaikkialla',
        sort_order_help: '"Automaattinen" (suositellaan) näyttää ensin pian saapuvan paketin kohdissa Matkalla ja Lähetetty, ja viimeksi toimitetun paketin ensin kohdassa Toimitettu. Kaksi muuta vaihtoehtoa lukitsevat yhden suunnan kaikkialle.',
        group_by_carrier: 'Ryhmittele paketit kuljetusyhtiön mukaan (poista käytöstä yhtä, pelkän päivämäärän mukaan järjestettyä listaa varten, jossa kuljetusyhtiöt lomittuvat)',
        section_appearance: 'Ulkoasu',
        label_header_color: 'Otsikon väri',
        label_header_text: 'Otsikon tekstin väri',
        label_placeholder_img: 'Paikkamerkkikuva',
        color_default: 'Oletus',
        color_custom: 'Mukautettu',
        btn_remove_carrier: 'Poista kuljetusyhtiö',
        label_carrier_name: 'Nimi',
        legacy_warning: 'Luo alkuperäisen hki-postnl-card-kortin uudelleen: yksi entiteetti sekä matkalla oleville että toimitetuille paketeille, sekä erillinen entiteetti lähetetyille paketeille. Ei kirjetukea, ei anturimallinnusta. Tämä tila ei saa enää päivityksiä niin kauan kuin arjenbos/ha-postnl ei ole aktiivisesti ylläpidetty.',
        label_account: 'Tili / anturin nimen käyttäjäosa',
        account_help_suffix: '_incoming_parcels" jne. 4 anturia luodaan automaattisesti.',
        gls_account_help: 'GLS:llä ei ole tiliä — anna GLS-keskuksesi postinumero (esim. 1234AB, kuten integraatiota lisättäessä asetettiin).',
        dragonfly_account_help: 'Dragonflylla ei ole tiliä tai postinumeroa — jätä tämä kenttä tyhjäksi; anturit nimetään sensor.dragonfly_*.',
        trunkrs_account_help: 'Trunkrsilla ei ole tiliä — anna Trunkrs-keskuksesi postinumero (esim. 1234AB, kuten integraatiota lisättäessä asetettiin).',
        cainiao_account_help: 'Cainiaolla ei ole tiliä tai postinumeroa — jätä tämä kenttä tyhjäksi; anturit nimetään sensor.cainiao_*.',
        hermes_account_help: 'Hermeksellä ei ole tiliä tai postinumeroa — jätä tämä kenttä tyhjäksi; anturit nimetään sensor.hermes_*.',
        packeta_account_help: 'Packetalla (Zásilkovna) ei ole tiliä tai postinumeroa — jätä tämä kenttä tyhjäksi; anturit nimetään sensor.packeta_*.',
        correos_account_help: 'Correosilla ei ole tiliä tai postinumeroa — jätä tämä kenttä tyhjäksi; anturit nimetään sensor.correos_*.',
        postnord_account_help: 'PostNordilla ei ole tiliä tai postinumeroa — jätä tämä kenttä tyhjäksi; anturit nimetään sensor.postnord_*.',
        sameday_account_help: 'Samedaylla ei ole tiliä tai postinumeroa — jätä tämä kenttä tyhjäksi; anturit nimetään sensor.sameday_*.',
        swiss_post_account_help: 'Swiss Postilla ei ole tiliä tai postinumeroa — jätä tämä kenttä tyhjäksi; anturit nimetään sensor.swiss_post_*.',
        planzer_account_help: 'Planzerilla ei ole tiliä tai postinumeroa — jätä tämä kenttä tyhjäksi; anturit nimetään sensor.planzer_*.',
        austrian_post_account_help: 'Itävallan postilla ei ole tiliä tai postinumeroa — jätä tämä kenttä tyhjäksi; anturit nimetään sensor.oesterreichische_post_*.',
        helthjem_account_help: 'Helthjemillä ei ole tiliä tai postinumeroa — jätä tämä kenttä tyhjäksi; anturit nimetään sensor.helthjem_*.',
        dynalogic_account_help: 'Dynalogicilla ei ole tiliä tai postinumeroa — jätä tämä kenttä tyhjäksi; anturit nimetään sensor.dynalogic_*.',
        budbee_account_help: 'Budbeella ei ole tiliä tai postinumeroa — jätä tämä kenttä tyhjäksi; anturit nimetään sensor.budbee_*.',
        nova_post_account_help: 'Nova Postilla ei ole tiliä tai postinumeroa — jätä tämä kenttä tyhjäksi; anturit nimetään sensor.nova_post_*.',
        delhivery_account_help: 'Delhiverylla ei ole tiliä tai postinumeroa — jätä tämä kenttä tyhjäksi; anturit nimetään sensor.delhivery_*.',
        sunyou_account_help: 'SunYoulla ei ole tiliä tai postinumeroa — jätä tämä kenttä tyhjäksi; anturit nimetään sensor.sunyou_*.',
        show_add_parcel: 'Näytä "Lisää paketti" kortissa',
        add_parcel_toggle: '+ Lisää paketti',
        add_parcel_carrier: 'Kuljetusyhtiö',
        add_parcel_number: 'Seurantanumero',
        add_parcel_submit: 'Lisää',
        add_parcel_busy: 'Lisätään...',
        add_parcel_success: 'Paketti lisätty',
        add_parcel_error: 'Lisääminen epäonnistui — tarkista numero.',
        adv_sensors: 'Lisäasetukset: anturien manuaalinen ohittaminen',
        adv_sensors_help: 'Sinun ei yleensä tarvitse muuttaa tätä. Käytä vain, jos antureillasi on epästandardi nimi.',
        entity_incoming: 'Matkalla-entiteetti (saapuva)',
        entity_delivered: 'Toimitettu-entiteetti',
        entity_outgoing: 'Lähetetty-entiteetti (lähtevä)',
        entity_outgoing_delivered: 'Toimitettu lähetetty -entiteetti (lähtevä toimitettu)',
        entity_letters: 'Kirjeet-entiteetti',
        letters_entity_help: 'Kirjeiden skannauskuvat (image.*-entiteetit) yhdistetään automaattisesti päivämäärän mukaan.',
        no_letters_support: 'Kirjeet tuetaan vain PostNL:llä.',
        no_outgoing_support: 'Lähetettyjä paketteja ei tueta tällä kuljetusyhtiöllä.',
        adv_appearance: 'Lisäasetukset: ulkoasun ohittaminen',
        label_icon: 'Kuvake (mdi:...)',
        label_color: 'Väri',
        label_logo: 'Logon URL (valinnainen)',
        label_van: 'Ajoneuvon GIF-URL (valinnainen)',
        label_banner: 'Bannerin URL (valinnainen, tausta yhden kuljetusyhtiön ollessa käytössä)',
        appearance_help: 'Logolla, ajoneuvoanimaatiolla ja bannerilla on jo sisäänrakennettu oletusarvo kuljetusyhtiöittäin. Täytä arvo tähän vain, jos haluat ohittaa sen.',
        postnl_entity_label: 'PostNL saapuva entiteetti',
        postnl_dist_label: 'PostNL lähtevä entiteetti (valinnainen)',
        detected_one: 'Tunnistettu automaattisesti',
        detected_multiple: 'Useita tilejä löytyi — valitse yksi',
        detected_none: 'Antureita ei löytynyt — syötä manuaalisesti',
        integration_not_found: 'Integraatiota ei löytynyt. Asenna integraatio ensin:',
        no_prefix: '(ei tiliprefiksiä)',
        detected_badge: 'löytyi',
        label_icon_pick: 'Kuvake',
        label_color_pick: 'Väri',
        url_logo: 'Logon URL',
        url_van: 'Ajoneuvon GIF-URL',
        url_banner: 'Bannerin URL',
        url_placeholder: 'Jätä tyhjäksi käyttääksesi oletusarvoa',
        url_preview_fail: 'Kuvaa ei löytynyt',
        browse_media: 'Selaa',
    },
    // fr: machine-drafted, not yet reviewed by a native speaker (see translations/fr.json)
    fr: {
        tab_in_transit: 'En transit',
        tab_delivered: 'Livré',
        tab_sent: 'Envoyé',
        tab_letters: 'Courrier',
        status_registered: 'Enregistré',
        status_in_transit: 'En transit',
        status_out_for_delivery: 'Livraison aujourd\'hui',
        status_ready_for_pickup: 'Prêt pour retrait',
        status_at_pickup_point: 'Au point de retrait',
        status_delivered: 'Livré',
        status_returning: 'Retour à l\'expéditeur',
        status_problem: 'Problème',
        status_unknown: 'Inconnu',
        step_label_registered: 'Enregistré',
        step_label_sorting: 'Centre de tri',
        step_label_transit: 'En livraison',
        step_label_delivered: 'Livré',
        step_info_registered: 'Enregistré à',
        step_info_sorting: 'Au centre de tri à',
        step_info_transit_and: 'et',
        step_info_delivered: 'Livré le',
        step_info_expected_delivery: 'Livraison prévue',
        today: 'Aujourd\'hui',
        tomorrow: 'Demain',
        day_after_tomorrow: 'Après-demain',
        expected_on: 'Prévu le',
        between_time: 'entre',
        parcel_from: 'Colis de',
        unknown: 'Inconnu',
        mail_from: 'Courrier de',
        letterbox_mail: 'Courrier',
        unread: 'Non lu',
        letterbox_received: 'Courrier reçu',
        parcel_delivered_msg: 'Colis livré',
        select_parcel: 'Sélectionnez un colis pour les détails',
        no_image: 'Aucune image disponible',
        label_tracking: 'Suivi',
        label_status: 'Statut',
        label_delivery: 'Mode de livraison',
        label_pickup_point: 'Point de retrait',
        label_custom_name: 'Nom personnalisé',
        add_custom_name: '+ Ajouter un nom',
        custom_name_placeholder: 'p. ex. Cadeau d\'anniversaire',
        custom_name_edit: 'Modifier le nom',
        custom_name_save: 'Enregistrer',
        custom_name_cancel: 'Annuler',
        home_delivery: 'Livraison à domicile',
        pickup_point: 'Point de retrait',
        label_type: 'Type',
        type_letter: 'Lettre',
        type_parcel: 'Colis',
        open_tracking: 'OUVRIR LE SUIVI ↗',
        no_parcels: 'Aucun colis dans cette catégorie',
        post_section_upcoming: 'Encore à livrer',
        post_section_delivered: 'Livré',
        stats_in_transit: 'en transit',
        stats_recent: 'récent',
        stats_letters: 'lettres',
        error_no_carriers: 'Aucun transporteur configuré, ou aucun des capteurs configurés n\'a été trouvé.',
        error_no_carriers_hint: 'Ajoutez au moins 1 transporteur avec une entity_incoming ou entity_delivered.',
        editor_title: '📦 Carte de colis multi-transporteurs',
        editor_intro1: 'Ajoutez ci-dessous un ou plusieurs transporteurs (PostNL, DHL, DPD, ...). Chaque transporteur peut avoir jusqu\'à 4 capteurs.',
        editor_intro2: 'Choisissez le bon type PostNL : PostNL (intégration actuelle ≥4.x), PostNL (<v4.x, en cours d\'abandon) ou PostNL (ArjenBos, en cours d\'abandon).',
        section_basic: 'Paramètres de base',
        label_card_title: 'Titre de la carte',
        label_days_back: 'Nombre de jours d\'historique de livraison',
        section_carriers: 'Transporteurs',
        btn_add_carrier: '+ Ajouter un transporteur',
        section_layout: 'Ordre de la mise en page',
        layout_help: 'Utilisez les flèches pour réorganiser les blocs',
        layout_header: 'En-tête (titre)',
        layout_animation: 'Animation / image',
        layout_tabs: 'Onglets de navigation',
        layout_list: 'Liste des colis',
        section_display: 'Options d\'affichage',
        show_header: 'Afficher l\'en-tête',
        show_delivered_tab: 'Afficher l\'onglet "Livré"',
        show_sent_tab: 'Afficher l\'onglet "Envoyé"',
        show_letters_tab: 'Afficher l\'onglet "Courrier" (nécessite au moins 1 transporteur prenant en charge le courrier)',
        show_animation: 'Afficher l\'animation / la vue détaillée',
        show_placeholder: 'Afficher l\'image de remplacement',
        show_tracking_link: 'Afficher le bouton de suivi (désactiver pour un usage kiosque / tactile uniquement)',
        show_raw_status: 'Afficher le texte de statut propre au transporteur au lieu du libellé traduit',
        custom_name_scope_label: 'Noms personnalisés des colis',
        custom_name_scope_off: 'Désactivé',
        custom_name_scope_device: 'Ce navigateur/appareil uniquement',
        custom_name_scope_me: 'Pour moi seulement',
        custom_name_scope_everyone: 'Pour tout le monde',
        custom_name_scope_help: '« Ce navigateur/appareil uniquement » ne quitte jamais ce navigateur. « Pour moi seulement » est enregistré sur votre compte Home Assistant et vous suit sur tous vos propres appareils. « Pour tout le monde » est enregistré à l\'échelle de l\'instance, visible par tous les utilisateurs — ajouter ou modifier un nom avec cette option nécessite un compte administrateur ; tout le monde peut néanmoins les voir.',
        sort_order_label: 'Ordre des colis',
        sort_order_auto: 'Automatique (le plus proche d\'abord, le plus récemment livré d\'abord)',
        sort_order_newest_first: 'Le plus récent/éloigné en premier partout',
        sort_order_oldest_first: 'Le plus ancien/proche en premier partout',
        sort_order_help: '« Automatique » (recommandé) affiche d\'abord le colis qui arrive le plus tôt dans En transit et Envoyé, et le colis livré le plus récemment dans Livré. Les deux autres options fixent une direction partout.',
        group_by_carrier: 'Grouper les colis par transporteur (désactiver pour une liste unique triée uniquement par date, transporteurs mélangés)',
        section_appearance: 'Apparence',
        label_header_color: 'Couleur de l\'en-tête',
        label_header_text: 'Couleur du texte de l\'en-tête',
        label_placeholder_img: 'Image de remplacement',
        color_default: 'Par défaut',
        color_custom: 'Personnalisé',
        btn_remove_carrier: 'Supprimer le transporteur',
        label_carrier_name: 'Nom',
        legacy_warning: 'Recrée la hki-postnl-card d\'origine : une entité avec les colis en transit et livrés, plus une entité séparée pour les colis envoyés. Pas de courrier, pas de modélisation de capteurs. Ce mode ne recevra plus de mises à jour tant que arjenbos/ha-postnl n\'est pas activement maintenu.',
        label_account: 'Compte / partie utilisateur du nom du capteur',
        account_help_suffix: '_incoming_parcels" etc. Les 4 capteurs sont créés automatiquement.',
        gls_account_help: 'GLS n\'a pas de compte — indiquez le code postal de votre hub GLS (ex. 1234AB, tel que défini lors de l\'ajout de l\'intégration).',
        dragonfly_account_help: 'Dragonfly n\'a pas de compte ni de code postal — laissez ce champ vide ; les capteurs sont nommés sensor.dragonfly_*.',
        trunkrs_account_help: 'Trunkrs n\'a pas de compte — indiquez le code postal de votre hub Trunkrs (ex. 1234AB, tel que défini lors de l\'ajout de l\'intégration).',
        cainiao_account_help: 'Cainiao n\'a pas de compte ni de code postal — laissez ce champ vide ; les capteurs sont nommés sensor.cainiao_*.',
        hermes_account_help: 'Hermes n\'a pas de compte ni de code postal — laissez ce champ vide ; les capteurs sont nommés sensor.hermes_*.',
        packeta_account_help: 'Packeta n\'a pas de compte ni de code postal — laissez ce champ vide ; les capteurs sont nommés sensor.packeta_*.',
        correos_account_help: 'Correos n\'a pas de compte ni de code postal — laissez ce champ vide ; les capteurs sont nommés sensor.correos_*.',
        postnord_account_help: 'PostNord n\'a pas de compte ni de code postal — laissez ce champ vide ; les capteurs sont nommés sensor.postnord_*.',
        sameday_account_help: 'Sameday n\'a pas de compte ni de code postal — laissez ce champ vide ; les capteurs sont nommés sensor.sameday_*.',
        swiss_post_account_help: 'La Poste Suisse n\'a pas de compte ni de code postal — laissez ce champ vide ; les capteurs sont nommés sensor.swiss_post_*.',
        planzer_account_help: 'Planzer n\'a pas de compte ni de code postal — laissez ce champ vide ; les capteurs sont nommés sensor.planzer_*.',
        austrian_post_account_help: 'La Poste autrichienne n\'a pas de compte ni de code postal — laissez ce champ vide ; les capteurs sont nommés sensor.oesterreichische_post_*.',
        helthjem_account_help: 'Helthjem n\'a pas de compte ni de code postal — laissez ce champ vide ; les capteurs sont nommés sensor.helthjem_*.',
        dynalogic_account_help: 'Dynalogic n\'a pas de compte ni de code postal — laissez ce champ vide ; les capteurs sont nommés sensor.dynalogic_*.',
        budbee_account_help: 'Budbee n\'a pas de compte ni de code postal — laissez ce champ vide ; les capteurs sont nommés sensor.budbee_*.',
        nova_post_account_help: 'Nova Post n\'a pas de compte ni de code postal — laissez ce champ vide ; les capteurs sont nommés sensor.nova_post_*.',
        delhivery_account_help: 'Delhivery n\'a pas de compte ni de code postal — laissez ce champ vide ; les capteurs sont nommés sensor.delhivery_*.',
        sunyou_account_help: 'SunYou n\'a pas de compte ni de code postal — laissez ce champ vide ; les capteurs sont nommés sensor.sunyou_*.',
        show_add_parcel: 'Afficher "Ajouter un colis" sur la carte',
        add_parcel_toggle: '+ Ajouter un colis',
        add_parcel_carrier: 'Transporteur',
        add_parcel_number: 'Numéro de suivi',
        add_parcel_submit: 'Ajouter',
        add_parcel_busy: 'Ajout en cours...',
        add_parcel_success: 'Colis ajouté',
        add_parcel_error: 'Échec de l\'ajout — vérifiez le numéro.',
        adv_sensors: 'Avancé : remplacer les capteurs manuellement',
        adv_sensors_help: 'Vous n\'avez normalement pas besoin de modifier ceci. Utilisez ceci uniquement si vos capteurs ont un nom non standard.',
        entity_incoming: 'Entité en transit (incoming)',
        entity_delivered: 'Entité livré',
        entity_outgoing: 'Entité envoyé (outgoing)',
        entity_outgoing_delivered: 'Entité envoyé livré (outgoing delivered)',
        entity_letters: 'Entité courrier',
        letters_entity_help: 'Les images numérisées des lettres (entités image.*) sont associées automatiquement par date.',
        no_letters_support: 'Le courrier n\'est pris en charge que pour PostNL.',
        no_outgoing_support: 'Les colis envoyés ne sont pas pris en charge pour ce transporteur.',
        adv_appearance: 'Avancé : remplacer l\'apparence',
        label_icon: 'Icône (mdi:...)',
        label_color: 'Couleur',
        label_logo: 'URL du logo (optionnel)',
        label_van: 'URL du GIF du véhicule (optionnel)',
        label_banner: 'URL de la bannière (optionnel, arrière-plan pour 1 transporteur)',
        appearance_help: 'Le logo, l\'animation du véhicule et la bannière ont déjà une valeur par défaut intégrée par transporteur. Ne remplissez ceci que si vous souhaitez la remplacer.',
        postnl_entity_label: 'Entité de réception PostNL',
        postnl_dist_label: 'Entité d\'envoi PostNL (optionnel)',
        detected_one: 'Détecté automatiquement',
        detected_multiple: 'Plusieurs comptes trouvés — choisissez-en un',
        detected_none: 'Aucun capteur trouvé — saisissez manuellement',
        integration_not_found: 'Intégration introuvable. Installez d\'abord l\'intégration :',
        no_prefix: '(aucun préfixe de compte)',
        detected_badge: 'trouvé',
        label_icon_pick: 'Icône',
        label_color_pick: 'Couleur',
        url_logo: 'URL du logo',
        url_van: 'URL du GIF du véhicule',
        url_banner: 'URL de la bannière',
        url_placeholder: 'Laissez vide pour utiliser la valeur par défaut',
        url_preview_fail: 'Image introuvable',
        browse_media: 'Parcourir',
    },
    // hi: machine-drafted, not yet reviewed by a native speaker (see translations/hi.json)
    hi: {
        tab_in_transit: 'मार्ग में',
        tab_delivered: 'डिलीवर हो गया',
        tab_sent: 'भेजा गया',
        tab_letters: 'पत्र',
        status_registered: 'पंजीकृत',
        status_in_transit: 'मार्ग में',
        status_out_for_delivery: 'डिलीवरी के लिए निकला',
        status_ready_for_pickup: 'पिकअप के लिए तैयार',
        status_at_pickup_point: 'पिकअप पॉइंट पर',
        status_delivered: 'डिलीवर हो गया',
        status_returning: 'प्रेषक को वापस जा रहा है',
        status_problem: 'समस्या',
        status_unknown: 'अज्ञात',
        step_label_registered: 'पंजीकृत',
        step_label_sorting: 'छँटाई केंद्र',
        step_label_transit: 'डिलीवरी के लिए निकला',
        step_label_delivered: 'डिलीवर हो गया',
        step_info_registered: 'पंजीकृत किया गया',
        step_info_sorting: 'छँटाई केंद्र पर',
        step_info_transit_and: 'और',
        step_info_delivered: 'डिलीवर किया गया',
        step_info_expected_delivery: 'अपेक्षित डिलीवरी',
        today: 'आज',
        tomorrow: 'कल',
        day_after_tomorrow: 'परसों',
        expected_on: 'अपेक्षित',
        between_time: 'के बीच',
        parcel_from: 'पार्सल प्रेषक',
        unknown: 'अज्ञात',
        mail_from: 'मेल प्रेषक',
        letterbox_mail: 'लेटरबॉक्स मेल',
        unread: 'अपठित',
        letterbox_received: 'लेटरबॉक्स में मेल प्राप्त हुई',
        parcel_delivered_msg: 'पार्सल डिलीवर हो गया',
        select_parcel: 'विवरण के लिए एक पार्सल चुनें',
        no_image: 'कोई छवि उपलब्ध नहीं',
        label_tracking: 'ट्रैकिंग',
        label_status: 'स्थिति',
        label_delivery: 'डिलीवरी',
        label_pickup_point: 'पिकअप पॉइंट',
        label_custom_name: 'कस्टम नाम',
        add_custom_name: '+ नाम जोड़ें',
        custom_name_placeholder: 'जैसे जन्मदिन का उपहार',
        custom_name_edit: 'नाम संपादित करें',
        custom_name_save: 'सहेजें',
        custom_name_cancel: 'रद्द करें',
        home_delivery: 'होम डिलीवरी',
        pickup_point: 'पिकअप पॉइंट',
        label_type: 'प्रकार',
        type_letter: 'पत्र',
        type_parcel: 'पार्सल',
        open_tracking: 'ट्रैकिंग खोलें ↗',
        no_parcels: 'इस श्रेणी में कोई पार्सल नहीं है',
        post_section_upcoming: 'अभी डिलीवर होना बाकी है',
        post_section_delivered: 'डिलीवर हो गया',
        stats_in_transit: 'मार्ग में',
        stats_recent: 'हाल के',
        stats_letters: 'पत्र',
        error_no_carriers: 'कोई कैरियर कॉन्फ़िगर नहीं किया गया है, या कॉन्फ़िगर किया गया कोई भी सेंसर नहीं मिला।',
        error_no_carriers_hint: 'entity_incoming या entity_delivered वाला कम से कम 1 कैरियर जोड़ें।',
        editor_title: '📦 मल्टी-कैरियर पार्सल कार्ड',
        editor_intro1: 'नीचे एक या अधिक कैरियर जोड़ें (PostNL, DHL, DPD, ...)। प्रत्येक कैरियर में अधिकतम 4 सेंसर हो सकते हैं।',
        editor_intro2: 'सही PostNL प्रकार चुनें: PostNL (मौजूदा ≥4.x इंटीग्रेशन), PostNL (<v4.x, चरणबद्ध रूप से हटाया जा रहा है), या PostNL (ArjenBos, चरणबद्ध रूप से हटाया जा रहा है)।',
        section_basic: 'मूल सेटिंग्स',
        label_card_title: 'कार्ड शीर्षक',
        label_days_back: 'डिलीवरी इतिहास दिखाने के दिन',
        section_carriers: 'कैरियर',
        btn_add_carrier: '+ कैरियर जोड़ें',
        section_layout: 'लेआउट क्रम',
        layout_help: 'ब्लॉक्स को पुनः क्रमबद्ध करने के लिए तीरों का उपयोग करें',
        layout_header: 'हेडर (शीर्षक)',
        layout_animation: 'एनिमेशन / छवि',
        layout_tabs: 'नेविगेशन टैब',
        layout_list: 'पार्सल सूची',
        section_display: 'प्रदर्शन विकल्प',
        show_header: 'हेडर दिखाएँ',
        show_delivered_tab: '"डिलीवर हो गया" टैब दिखाएँ',
        show_sent_tab: '"भेजा गया" टैब दिखाएँ',
        show_letters_tab: '"पत्र" टैब दिखाएँ (पत्र समर्थन वाला कम से कम 1 कैरियर आवश्यक है)',
        show_animation: 'एनिमेशन / विवरण दृश्य दिखाएँ',
        show_placeholder: 'प्लेसहोल्डर छवि दिखाएँ',
        show_tracking_link: 'ट्रैकिंग लिंक बटन दिखाएँ (कियोस्क / केवल टच के लिए बंद करें)',
        show_raw_status: 'अनुवादित लेबल के बजाय कैरियर का अपना स्थिति टेक्स्ट दिखाएँ',
        custom_name_scope_label: 'कस्टम पार्सल नाम',
        custom_name_scope_off: 'बंद',
        custom_name_scope_device: 'केवल यह ब्राउज़र/डिवाइस',
        custom_name_scope_me: 'केवल मेरे लिए',
        custom_name_scope_everyone: 'सभी के लिए',
        custom_name_scope_help: '"केवल यह ब्राउज़र/डिवाइस" कभी भी इस ब्राउज़र से बाहर नहीं जाता। "केवल मेरे लिए" आपके Home Assistant खाते में सहेजा जाता है और आपके सभी डिवाइसों पर उपलब्ध रहता है। "सभी के लिए" पूरे इंस्टेंस में सहेजा जाता है, हर उपयोगकर्ता के लिए दिखाई देता है — इस विकल्प के साथ नाम जोड़ने या संपादित करने के लिए व्यवस्थापक खाता आवश्यक है; नाम कोई भी देख सकता है।',
        sort_order_label: 'पार्सल क्रम',
        sort_order_auto: 'स्वचालित (सबसे जल्दी वाला पहले, सबसे हाल की डिलीवरी पहले)',
        sort_order_newest_first: 'हर जगह सबसे नया/सबसे दूर वाला पहले',
        sort_order_oldest_first: 'हर जगह सबसे पुराना/सबसे जल्दी वाला पहले',
        sort_order_help: '"स्वचालित" (अनुशंसित) मार्ग में और भेजा गया में सबसे जल्दी पहुँचने वाला पार्सल पहले दिखाता है, और डिलीवर हो गया में सबसे हाल में डिलीवर हुआ पार्सल पहले दिखाता है। अन्य दो विकल्प हर जगह एक निश्चित दिशा बनाए रखते हैं।',
        group_by_carrier: 'पार्सल को कैरियर के अनुसार समूहित करें (कैरियरों को मिलाकर केवल तारीख के अनुसार क्रमबद्ध एक सपाट सूची के लिए बंद करें)',
        section_appearance: 'रूप',
        label_header_color: 'हेडर रंग',
        label_header_text: 'हेडर टेक्स्ट रंग',
        label_placeholder_img: 'प्लेसहोल्डर छवि',
        color_default: 'डिफ़ॉल्ट',
        color_custom: 'कस्टम',
        btn_remove_carrier: 'कैरियर हटाएँ',
        label_carrier_name: 'नाम',
        legacy_warning: 'मूल hki-postnl-card को फिर से बनाता है: मार्ग में और डिलीवर किए गए पार्सल वाली एक इकाई, साथ ही भेजे गए पार्सल के लिए एक अलग इकाई। कोई पत्र समर्थन नहीं, कोई सेंसर टेम्पलेटिंग नहीं। जब तक arjenbos/ha-postnl सक्रिय रूप से बनाए नहीं रखा जाता, यह मोड आगे कोई अपडेट प्राप्त नहीं करेगा।',
        label_account: 'सेंसर नाम का खाता / उपयोगकर्ता भाग',
        account_help_suffix: '_incoming_parcels" आदि। 4 सेंसर स्वचालित रूप से बनाए जाते हैं।',
        gls_account_help: 'GLS का कोई खाता नहीं है — अपने GLS हब का पिन कोड दर्ज करें (जैसे 1234AB, जैसा कि इंटीग्रेशन जोड़ते समय सेट किया गया था)।',
        dragonfly_account_help: 'Dragonfly का कोई खाता या पिन कोड नहीं है — इस फ़ील्ड को खाली छोड़ें; सेंसर का नाम sensor.dragonfly_* होता है।',
        trunkrs_account_help: 'Trunkrs का कोई खाता नहीं है — अपने Trunkrs हब का पिन कोड दर्ज करें (जैसे 1234AB, जैसा कि इंटीग्रेशन जोड़ते समय सेट किया गया था)।',
        cainiao_account_help: 'Cainiao का कोई खाता या पिन कोड नहीं है — इस फ़ील्ड को खाली छोड़ें; सेंसर का नाम sensor.cainiao_* होता है।',
        hermes_account_help: 'Hermes का कोई खाता या पिन कोड नहीं है — इस फ़ील्ड को खाली छोड़ें; सेंसर का नाम sensor.hermes_* होता है।',
        packeta_account_help: 'Packeta (Zásilkovna) का कोई खाता या पिन कोड नहीं है — इस फ़ील्ड को खाली छोड़ें; सेंसर का नाम sensor.packeta_* होता है।',
        correos_account_help: 'Correos का कोई खाता या पिन कोड नहीं है — इस फ़ील्ड को खाली छोड़ें; सेंसर का नाम sensor.correos_* होता है।',
        postnord_account_help: 'PostNord का कोई खाता या पिन कोड नहीं है — इस फ़ील्ड को खाली छोड़ें; सेंसर का नाम sensor.postnord_* होता है।',
        sameday_account_help: 'Sameday का कोई खाता या पिन कोड नहीं है — इस फ़ील्ड को खाली छोड़ें; सेंसर का नाम sensor.sameday_* होता है।',
        swiss_post_account_help: 'Swiss Post का कोई खाता या पिन कोड नहीं है — इस फ़ील्ड को खाली छोड़ें; सेंसर का नाम sensor.swiss_post_* होता है।',
        planzer_account_help: 'Planzer का कोई खाता या पिन कोड नहीं है — इस फ़ील्ड को खाली छोड़ें; सेंसर का नाम sensor.planzer_* होता है।',
        austrian_post_account_help: 'Austrian Post का कोई खाता या पिन कोड नहीं है — इस फ़ील्ड को खाली छोड़ें; सेंसर का नाम sensor.oesterreichische_post_* होता है।',
        helthjem_account_help: 'Helthjem का कोई खाता या पिन कोड नहीं है — इस फ़ील्ड को खाली छोड़ें; सेंसर का नाम sensor.helthjem_* होता है।',
        dynalogic_account_help: 'Dynalogic का कोई खाता या पिन कोड नहीं है — इस फ़ील्ड को खाली छोड़ें; सेंसर का नाम sensor.dynalogic_* होता है।',
        budbee_account_help: 'Budbee का कोई खाता या पिन कोड नहीं है — इस फ़ील्ड को खाली छोड़ें; सेंसर का नाम sensor.budbee_* होता है।',
        nova_post_account_help: 'Nova Post का कोई खाता या पिन कोड नहीं है — इस फ़ील्ड को खाली छोड़ें; सेंसर का नाम sensor.nova_post_* होता है।',
        delhivery_account_help: 'Delhivery का कोई खाता या पिन कोड नहीं है — इस फ़ील्ड को खाली छोड़ें; सेंसर का नाम sensor.delhivery_* होता है।',
        sunyou_account_help: 'SunYou का कोई खाता या पिन कोड नहीं है — इस फ़ील्ड को खाली छोड़ें; सेंसर का नाम sensor.sunyou_* होता है।',
        show_add_parcel: 'कार्ड पर "पार्सल जोड़ें" दिखाएँ',
        add_parcel_toggle: '+ पार्सल जोड़ें',
        add_parcel_carrier: 'कैरियर',
        add_parcel_number: 'ट्रैकिंग नंबर',
        add_parcel_submit: 'जोड़ें',
        add_parcel_busy: 'जोड़ा जा रहा है...',
        add_parcel_success: 'पार्सल जोड़ा गया',
        add_parcel_error: 'जोड़ने में विफल — नंबर जांचें।',
        adv_sensors: 'उन्नत: सेंसर को मैन्युअल रूप से ओवरराइड करें',
        adv_sensors_help: 'आमतौर पर आपको इसे बदलने की आवश्यकता नहीं है। इसका उपयोग केवल तभी करें जब आपके सेंसर का नाम गैर-मानक हो।',
        entity_incoming: 'मार्ग में इकाई (आने वाला)',
        entity_delivered: 'डिलीवर हो गया इकाई',
        entity_outgoing: 'भेजा गया इकाई (जाने वाला)',
        entity_outgoing_delivered: 'डिलीवर किया गया भेजा गया इकाई (जाने वाला डिलीवर)',
        entity_letters: 'पत्र इकाई',
        letters_entity_help: 'पत्र स्कैन छवियाँ (image.* इकाइयाँ) स्वचालित रूप से तारीख के अनुसार मिलान की जाती हैं।',
        no_letters_support: 'पत्र केवल PostNL के लिए समर्थित हैं।',
        no_outgoing_support: 'इस कैरियर के लिए भेजे गए पार्सल समर्थित नहीं हैं।',
        adv_appearance: 'उन्नत: रूप को ओवरराइड करें',
        label_icon: 'आइकन (mdi:...)',
        label_color: 'रंग',
        label_logo: 'लोगो URL (वैकल्पिक)',
        label_van: 'वाहन GIF URL (वैकल्पिक)',
        label_banner: 'बैनर URL (वैकल्पिक, 1 कैरियर होने पर पृष्ठभूमि)',
        appearance_help: 'लोगो, वाहन एनिमेशन और बैनर के लिए प्रत्येक कैरियर की पहले से एक बिल्ट-इन डिफ़ॉल्ट है। इसे ओवरराइड करने के लिए ही यहाँ मान भरें।',
        postnl_entity_label: 'PostNL आने वाली इकाई',
        postnl_dist_label: 'PostNL जाने वाली इकाई (वैकल्पिक)',
        detected_one: 'स्वचालित रूप से पहचाना गया',
        detected_multiple: 'कई खाते मिले — एक चुनें',
        detected_none: 'कोई सेंसर नहीं मिला — मैन्युअल रूप से दर्ज करें',
        integration_not_found: 'इंटीग्रेशन नहीं मिला। पहले इंटीग्रेशन इंस्टॉल करें:',
        no_prefix: '(कोई खाता उपसर्ग नहीं)',
        detected_badge: 'मिला',
        label_icon_pick: 'आइकन',
        label_color_pick: 'रंग',
        url_logo: 'लोगो URL',
        url_van: 'वाहन GIF URL',
        url_banner: 'बैनर URL',
        url_placeholder: 'डिफ़ॉल्ट का उपयोग करने के लिए खाली छोड़ें',
        url_preview_fail: 'छवि नहीं मिली',
        browse_media: 'ब्राउज़ करें',
    },
    // hu: machine-drafted, not yet reviewed by a native speaker (see translations/hu.json)
    hu: {
        tab_in_transit: 'Úton',
        tab_delivered: 'Kézbesítve',
        tab_sent: 'Küldött',
        tab_letters: 'Levelek',
        status_registered: 'Regisztrálva',
        status_in_transit: 'Úton',
        status_out_for_delivery: 'Kézbesítés alatt',
        status_ready_for_pickup: 'Átvételre kész',
        status_at_pickup_point: 'Csomagponton',
        status_delivered: 'Kézbesítve',
        status_returning: 'Visszaküldés a feladónak',
        status_problem: 'Probléma',
        status_unknown: 'Ismeretlen',
        step_label_registered: 'Regisztrálva',
        step_label_sorting: 'Elosztóközpont',
        step_label_transit: 'Kézbesítés alatt',
        step_label_delivered: 'Kézbesítve',
        step_info_registered: 'Regisztrálva:',
        step_info_sorting: 'Elosztóközpontban:',
        step_info_transit_and: 'és',
        step_info_delivered: 'Kézbesítve:',
        step_info_expected_delivery: 'Várható kézbesítés',
        today: 'Ma',
        tomorrow: 'Holnap',
        day_after_tomorrow: 'Holnapután',
        expected_on: 'Várható:',
        between_time: 'között',
        parcel_from: 'Csomag küldő:',
        unknown: 'Ismeretlen',
        mail_from: 'Levél feladó:',
        letterbox_mail: 'Postaláda',
        unread: 'Olvasatlan',
        letterbox_received: 'Levél érkezett a postaládába',
        parcel_delivered_msg: 'Csomag kézbesítve',
        select_parcel: 'Válasszon csomagot a részletekért',
        no_image: 'Nincs elérhető kép',
        label_tracking: 'Nyomkövetés',
        label_status: 'Állapot',
        label_delivery: 'Kézbesítés',
        label_pickup_point: 'Csomagpont',
        label_custom_name: 'Egyéni név',
        add_custom_name: '+ Név hozzáadása',
        custom_name_placeholder: 'pl. Születésnapi ajándék',
        custom_name_edit: 'Név szerkesztése',
        custom_name_save: 'Mentés',
        custom_name_cancel: 'Mégse',
        home_delivery: 'Házhoz szállítás',
        pickup_point: 'Csomagpont',
        label_type: 'Típus',
        type_letter: 'Levél',
        type_parcel: 'Csomag',
        open_tracking: 'NYOMKÖVETÉS MEGNYITÁSA ↗',
        no_parcels: 'Nincs csomag ebben a kategóriában',
        post_section_upcoming: 'Még kézbesítendő',
        post_section_delivered: 'Kézbesítve',
        stats_in_transit: 'úton',
        stats_recent: 'friss',
        stats_letters: 'levél',
        error_no_carriers: 'Nincs beállítva szolgáltató, vagy egyik beállított érzékelő sem található.',
        error_no_carriers_hint: 'Adjon hozzá legalább 1 szolgáltatót entity_incoming vagy entity_delivered beállítással.',
        editor_title: '📦 Több szolgáltatós csomagkártya',
        editor_intro1: 'Adjon hozzá alább egy vagy több szolgáltatót (PostNL, DHL, DPD, ...). Minden szolgáltatóhoz akár 4 érzékelő tartozhat.',
        editor_intro2: 'Válassza ki a megfelelő PostNL típust: PostNL (jelenlegi ≥4.x integráció), PostNL (<v4.x, kivezetés alatt), vagy PostNL (ArjenBos, kivezetés alatt).',
        section_basic: 'Alapbeállítások',
        label_card_title: 'Kártya címe',
        label_days_back: 'Kézbesítési előzmény napjai',
        section_carriers: 'Szolgáltatók',
        btn_add_carrier: '+ Szolgáltató hozzáadása',
        section_layout: 'Elrendezés sorrendje',
        layout_help: 'A nyilakkal rendezze át a blokkokat',
        layout_header: 'Fejléc (Cím)',
        layout_animation: 'Animáció / Kép',
        layout_tabs: 'Navigációs fülek',
        layout_list: 'Csomaglista',
        section_display: 'Megjelenítési beállítások',
        show_header: 'Fejléc megjelenítése',
        show_delivered_tab: '"Kézbesítve" fül megjelenítése',
        show_sent_tab: '"Küldött" fül megjelenítése',
        show_letters_tab: '"Levelek" fül megjelenítése (legalább 1 levélkezelést támogató szolgáltató szükséges)',
        show_animation: 'Animáció / részletnézet megjelenítése',
        show_placeholder: 'Helyőrző kép megjelenítése',
        show_tracking_link: 'Nyomkövetési gomb megjelenítése (kapcsolja ki kioszk / csak érintős használathoz)',
        show_raw_status: 'A szolgáltató saját állapotszövegének megjelenítése a lefordított címke helyett',
        custom_name_scope_label: 'Egyéni csomagnevek',
        custom_name_scope_off: 'Kikapcsolva',
        custom_name_scope_device: 'Csak ezen a böngészőn/eszközön',
        custom_name_scope_me: 'Csak nekem',
        custom_name_scope_everyone: 'Mindenkinek',
        custom_name_scope_help: 'A „Csak ezen a böngészőn/eszközön” soha nem hagyja el ezt a böngészőt. A „Csak nekem” a Home Assistant fiókjában mentődik, és minden saját eszközén elérhető. A „Mindenkinek” az egész rendszerre mentődik, minden felhasználó számára látható — ennél az opciónál névhozzáadáshoz vagy -szerkesztéshez rendszergazdai fiók szükséges; a neveket bárki láthatja.',
        sort_order_label: 'Csomagok sorrendje',
        sort_order_auto: 'Automatikus (legközelebbi elöl, legutóbbi kézbesítés elöl)',
        sort_order_newest_first: 'Mindenhol a legújabb/legtávolabbi elöl',
        sort_order_oldest_first: 'Mindenhol a legrégebbi/legközelebbi elöl',
        sort_order_help: 'Az „Automatikus” (ajánlott) beállítás az Úton és Küldött nézetekben a leghamarabb érkező csomagot mutatja elöl, a Kézbesítve nézetben pedig a legutóbb kézbesítettet. A másik két beállítás egy rögzített irányt tart mindenhol.',
        group_by_carrier: 'Csomagok csoportosítása szolgáltató szerint (kapcsolja ki egy sima, kizárólag dátum szerint rendezett listához, ahol a szolgáltatók keverednek)',
        section_appearance: 'Megjelenés',
        label_header_color: 'Fejléc színe',
        label_header_text: 'Fejléc szövegszíne',
        label_placeholder_img: 'Helyőrző kép',
        color_default: 'Alapértelmezett',
        color_custom: 'Egyéni',
        btn_remove_carrier: 'Szolgáltató eltávolítása',
        label_carrier_name: 'Név',
        legacy_warning: 'Az eredeti hki-postnl-card kártyát hozza létre újra: egy entitás az úton lévő és kézbesített csomagokkal, plusz egy külön entitás a küldött csomagokhoz. Nincs levélkezelés, nincs érzékelő-sablonozás. Ez a mód nem kap további frissítést, amíg az arjenbos/ha-postnl nincs aktívan karbantartva.',
        label_account: 'Fiók / felhasználói rész az érzékelő nevében',
        account_help_suffix: '_incoming_parcels" stb. A 4 érzékelő automatikusan létrejön.',
        gls_account_help: 'A GLS-nek nincs fiókja — adja meg a GLS csomagpont irányítószámát (pl. 1234AB, ahogy az integráció hozzáadásakor beállította).',
        dragonfly_account_help: 'A Dragonfly-nak nincs fiókja vagy irányítószáma — hagyja üresen ezt a mezőt; az érzékelők neve sensor.dragonfly_*.',
        trunkrs_account_help: 'A Trunkrs-nak nincs fiókja — adja meg a Trunkrs csomagpont irányítószámát (pl. 1234AB, ahogy az integráció hozzáadásakor beállította).',
        cainiao_account_help: 'A Cainiao-nak nincs fiókja vagy irányítószáma — hagyja üresen ezt a mezőt; az érzékelők neve sensor.cainiao_*.',
        hermes_account_help: 'A Hermes-nek nincs fiókja vagy irányítószáma — hagyja üresen ezt a mezőt; az érzékelők neve sensor.hermes_*.',
        packeta_account_help: 'A Packeta-nak (Zásilkovna) nincs fiókja vagy irányítószáma — hagyja üresen ezt a mezőt; az érzékelők neve sensor.packeta_*.',
        correos_account_help: 'A Correos-nak nincs fiókja vagy irányítószáma — hagyja üresen ezt a mezőt; az érzékelők neve sensor.correos_*.',
        postnord_account_help: 'A PostNord-nak nincs fiókja vagy irányítószáma — hagyja üresen ezt a mezőt; az érzékelők neve sensor.postnord_*.',
        sameday_account_help: 'A Sameday-nek nincs fiókja vagy irányítószáma — hagyja üresen ezt a mezőt; az érzékelők neve sensor.sameday_*.',
        swiss_post_account_help: 'A Swiss Post-nak nincs fiókja vagy irányítószáma — hagyja üresen ezt a mezőt; az érzékelők neve sensor.swiss_post_*.',
        planzer_account_help: 'A Planzer-nek nincs fiókja vagy irányítószáma — hagyja üresen ezt a mezőt; az érzékelők neve sensor.planzer_*.',
        austrian_post_account_help: 'Az Osztrák Postának nincs fiókja vagy irányítószáma — hagyja üresen ezt a mezőt; az érzékelők neve sensor.oesterreichische_post_*.',
        helthjem_account_help: 'A Helthjem-nek nincs fiókja vagy irányítószáma — hagyja üresen ezt a mezőt; az érzékelők neve sensor.helthjem_*.',
        dynalogic_account_help: 'A Dynalogic-nak nincs fiókja vagy irányítószáma — hagyja üresen ezt a mezőt; az érzékelők neve sensor.dynalogic_*.',
        budbee_account_help: 'A Budbee-nek nincs fiókja vagy irányítószáma — hagyja üresen ezt a mezőt; az érzékelők neve sensor.budbee_*.',
        nova_post_account_help: 'A Nova Post-nak nincs fiókja vagy irányítószáma — hagyja üresen ezt a mezőt; az érzékelők neve sensor.nova_post_*.',
        delhivery_account_help: 'A Delhivery-nek nincs fiókja vagy irányítószáma — hagyja üresen ezt a mezőt; az érzékelők neve sensor.delhivery_*.',
        sunyou_account_help: 'A SunYou-nak nincs fiókja vagy irányítószáma — hagyja üresen ezt a mezőt; az érzékelők neve sensor.sunyou_*.',
        show_add_parcel: '"Csomag hozzáadása" megjelenítése a kártyán',
        add_parcel_toggle: '+ Csomag hozzáadása',
        add_parcel_carrier: 'Szolgáltató',
        add_parcel_number: 'Nyomkövetési szám',
        add_parcel_submit: 'Hozzáadás',
        add_parcel_busy: 'Hozzáadás...',
        add_parcel_success: 'Csomag hozzáadva',
        add_parcel_error: 'Sikertelen hozzáadás — ellenőrizze a számot.',
        adv_sensors: 'Speciális: érzékelők kézi felülbírálása',
        adv_sensors_help: 'Ezt általában nem kell módosítania. Csak akkor használja, ha az érzékelői nem szabványos nevet kaptak.',
        entity_incoming: 'Úton lévő entitás (bejövő)',
        entity_delivered: 'Kézbesítve entitás',
        entity_outgoing: 'Küldött entitás (kimenő)',
        entity_outgoing_delivered: 'Kézbesített küldött entitás (kimenő kézbesített)',
        entity_letters: 'Levelek entitás',
        letters_entity_help: 'A levélszkennelt képek (image.* entitások) automatikusan párosítva vannak dátum szerint.',
        no_letters_support: 'A levelek csak PostNL esetén támogatottak.',
        no_outgoing_support: 'A küldött csomagok ennél a szolgáltatónál nem támogatottak.',
        adv_appearance: 'Speciális: megjelenés felülbírálása',
        label_icon: 'Ikon (mdi:...)',
        label_color: 'Szín',
        label_logo: 'Logó URL (opcionális)',
        label_van: 'Jármű GIF URL (opcionális)',
        label_banner: 'Banner URL (opcionális, háttér 1 szolgáltató esetén)',
        appearance_help: 'A logónak, a jármű animációjának és a bannernek szolgáltatónként már van beépített alapértelmezése. Csak akkor adjon meg itt értéket, ha felül szeretné bírálni.',
        postnl_entity_label: 'PostNL bejövő entitás',
        postnl_dist_label: 'PostNL kimenő entitás (opcionális)',
        detected_one: 'Automatikusan felismerve',
        detected_multiple: 'Több fiók található — válasszon egyet',
        detected_none: 'Nem található érzékelő — adja meg kézzel',
        integration_not_found: 'Az integráció nem található. Először telepítse az integrációt:',
        no_prefix: '(nincs fiók-előtag)',
        detected_badge: 'találat',
        label_icon_pick: 'Ikon',
        label_color_pick: 'Szín',
        url_logo: 'Logó URL',
        url_van: 'Jármű GIF URL',
        url_banner: 'Banner URL',
        url_placeholder: 'Hagyja üresen az alapértelmezett használatához',
        url_preview_fail: 'Kép nem található',
        browse_media: 'Tallózás',
    },
    // it: machine-drafted, not yet reviewed by a native speaker (see translations/it.json)
    it: {
        tab_in_transit: 'In transito',
        tab_delivered: 'Consegnato',
        tab_sent: 'Inviato',
        tab_letters: 'Posta',
        status_registered: 'Registrato',
        status_in_transit: 'In transito',
        status_out_for_delivery: 'In consegna oggi',
        status_ready_for_pickup: 'Pronto per il ritiro',
        status_at_pickup_point: 'Presso il punto di ritiro',
        status_delivered: 'Consegnato',
        status_returning: 'Reso al mittente',
        status_problem: 'Problema',
        status_unknown: 'Sconosciuto',
        step_label_registered: 'Registrato',
        step_label_sorting: 'Centro di smistamento',
        step_label_transit: 'In consegna',
        step_label_delivered: 'Consegnato',
        step_info_registered: 'Registrato alle',
        step_info_sorting: 'Al centro di smistamento alle',
        step_info_transit_and: 'e',
        step_info_delivered: 'Consegnato il',
        step_info_expected_delivery: 'Consegna prevista',
        today: 'Oggi',
        tomorrow: 'Domani',
        day_after_tomorrow: 'Dopodomani',
        expected_on: 'Previsto per',
        between_time: 'tra',
        parcel_from: 'Pacco da',
        unknown: 'Sconosciuto',
        mail_from: 'Posta da',
        letterbox_mail: 'Posta',
        unread: 'Non letto',
        letterbox_received: 'Posta ricevuta',
        parcel_delivered_msg: 'Pacco consegnato',
        select_parcel: 'Seleziona un pacco per i dettagli',
        no_image: 'Nessuna immagine disponibile',
        label_tracking: 'Tracciamento',
        label_status: 'Stato',
        label_delivery: 'Modalità di consegna',
        label_pickup_point: 'Punto di ritiro',
        label_custom_name: 'Nome personalizzato',
        add_custom_name: '+ Aggiungi nome',
        custom_name_placeholder: 'es. Regalo di compleanno',
        custom_name_edit: 'Modifica nome',
        custom_name_save: 'Salva',
        custom_name_cancel: 'Annulla',
        home_delivery: 'Consegna a domicilio',
        pickup_point: 'Punto di ritiro',
        label_type: 'Tipo',
        type_letter: 'Lettera',
        type_parcel: 'Pacco',
        open_tracking: 'APRI TRACCIAMENTO ↗',
        no_parcels: 'Nessun pacco in questa categoria',
        post_section_upcoming: 'Ancora da consegnare',
        post_section_delivered: 'Consegnato',
        stats_in_transit: 'in transito',
        stats_recent: 'recente',
        stats_letters: 'lettere',
        error_no_carriers: 'Nessun corriere configurato, oppure nessuno dei sensori configurati è stato trovato.',
        error_no_carriers_hint: 'Aggiungi almeno 1 corriere con una entity_incoming o entity_delivered.',
        editor_title: '📦 Scheda pacchi multi-corriere',
        editor_intro1: 'Aggiungi qui sotto uno o più corrieri (PostNL, DHL, DPD, ...). Ogni corriere può avere fino a 4 sensori.',
        editor_intro2: 'Scegli il tipo PostNL corretto: PostNL (integrazione attuale ≥4.x), PostNL (<v4.x, in dismissione) o PostNL (ArjenBos, in dismissione).',
        section_basic: 'Impostazioni di base',
        label_card_title: 'Titolo della scheda',
        label_days_back: 'Giorni di cronologia consegne da mostrare',
        section_carriers: 'Corrieri',
        btn_add_carrier: '+ Aggiungi corriere',
        section_layout: 'Ordine del layout',
        layout_help: 'Usa le frecce per riordinare i blocchi',
        layout_header: 'Intestazione (titolo)',
        layout_animation: 'Animazione / immagine',
        layout_tabs: 'Schede di navigazione',
        layout_list: 'Elenco pacchi',
        section_display: 'Opzioni di visualizzazione',
        show_header: 'Mostra intestazione',
        show_delivered_tab: 'Mostra scheda "Consegnato"',
        show_sent_tab: 'Mostra scheda "Inviato"',
        show_letters_tab: 'Mostra scheda "Posta" (richiede almeno 1 corriere con supporto posta)',
        show_animation: 'Mostra animazione / vista dettagliata',
        show_placeholder: 'Mostra immagine segnaposto',
        show_tracking_link: 'Mostra pulsante di tracciamento (disattiva per kiosk / solo touch)',
        show_raw_status: 'Mostra il testo di stato del corriere invece dell\'etichetta tradotta',
        custom_name_scope_label: 'Nomi personalizzati dei pacchi',
        custom_name_scope_off: 'Disattivato',
        custom_name_scope_device: 'Solo questo browser/dispositivo',
        custom_name_scope_me: 'Solo per me',
        custom_name_scope_everyone: 'Per tutti',
        custom_name_scope_help: '"Solo questo browser/dispositivo" non esce mai da questo browser. "Solo per me" viene salvato nel tuo account Home Assistant e ti segue su tutti i tuoi dispositivi. "Per tutti" viene salvato a livello di istanza, visibile a tutti gli utenti — aggiungere o modificare un nome con questa opzione richiede un account amministratore; tutti possono comunque vederli.',
        sort_order_label: 'Ordine dei pacchi',
        sort_order_auto: 'Automatico (il prossimo per primo, il consegnato più di recente per primo)',
        sort_order_newest_first: 'Ovunque il più recente/lontano per primo',
        sort_order_oldest_first: 'Ovunque il più vecchio/prossimo per primo',
        sort_order_help: '"Automatico" (consigliato) mostra per primo il pacco in arrivo più presto in In transito e Inviato, e il pacco consegnato più di recente in Consegnato. Le altre due opzioni fissano una direzione ovunque.',
        group_by_carrier: 'Raggruppa i pacchi per corriere (disattiva per un elenco unico ordinato solo per data, con corrieri mescolati)',
        section_appearance: 'Aspetto',
        label_header_color: 'Colore intestazione',
        label_header_text: 'Colore testo intestazione',
        label_placeholder_img: 'Immagine segnaposto',
        color_default: 'Predefinito',
        color_custom: 'Personalizzato',
        btn_remove_carrier: 'Rimuovi corriere',
        label_carrier_name: 'Nome',
        legacy_warning: 'Ricrea l\'originale hki-postnl-card: un\'entità con pacchi in transito e consegnati, più un\'entità separata per i pacchi inviati. Nessun supporto posta, nessun templating dei sensori. Questa modalità non riceverà ulteriori aggiornamenti finché arjenbos/ha-postnl non sarà mantenuto attivamente.',
        label_account: 'Account / parte utente del nome del sensore',
        account_help_suffix: '_incoming_parcels" ecc. I 4 sensori vengono creati automaticamente.',
        gls_account_help: 'GLS non ha un account — inserisci il CAP del tuo hub GLS (es. 1234AB, come impostato durante l\'aggiunta dell\'integrazione).',
        dragonfly_account_help: 'Dragonfly non ha account o CAP — lascia questo campo vuoto; i sensori si chiamano sensor.dragonfly_*.',
        trunkrs_account_help: 'Trunkrs non ha un account — inserisci il CAP del tuo hub Trunkrs (es. 1234AB, come impostato durante l\'aggiunta dell\'integrazione).',
        cainiao_account_help: 'Cainiao non ha account o CAP — lascia questo campo vuoto; i sensori si chiamano sensor.cainiao_*.',
        hermes_account_help: 'Hermes non ha account o CAP — lascia questo campo vuoto; i sensori si chiamano sensor.hermes_*.',
        packeta_account_help: 'Packeta non ha account o CAP — lascia questo campo vuoto; i sensori si chiamano sensor.packeta_*.',
        correos_account_help: 'Correos non ha account o CAP — lascia questo campo vuoto; i sensori si chiamano sensor.correos_*.',
        postnord_account_help: 'PostNord non ha account o CAP — lascia questo campo vuoto; i sensori si chiamano sensor.postnord_*.',
        sameday_account_help: 'Sameday non ha account o CAP — lascia questo campo vuoto; i sensori si chiamano sensor.sameday_*.',
        swiss_post_account_help: 'La Posta Svizzera non ha account o CAP — lascia questo campo vuoto; i sensori si chiamano sensor.swiss_post_*.',
        planzer_account_help: 'Planzer non ha account o CAP — lascia questo campo vuoto; i sensori si chiamano sensor.planzer_*.',
        austrian_post_account_help: 'La Posta Austriaca non ha account o CAP — lascia questo campo vuoto; i sensori si chiamano sensor.oesterreichische_post_*.',
        helthjem_account_help: 'Helthjem non ha account o CAP — lascia questo campo vuoto; i sensori si chiamano sensor.helthjem_*.',
        dynalogic_account_help: 'Dynalogic non ha account o CAP — lascia questo campo vuoto; i sensori si chiamano sensor.dynalogic_*.',
        budbee_account_help: 'Budbee non ha account o CAP — lascia questo campo vuoto; i sensori si chiamano sensor.budbee_*.',
        nova_post_account_help: 'Nova Post non ha account o CAP — lascia questo campo vuoto; i sensori si chiamano sensor.nova_post_*.',
        delhivery_account_help: 'Delhivery non ha account o CAP — lascia questo campo vuoto; i sensori si chiamano sensor.delhivery_*.',
        sunyou_account_help: 'SunYou non ha account o CAP — lascia questo campo vuoto; i sensori si chiamano sensor.sunyou_*.',
        show_add_parcel: 'Mostra "Aggiungi pacco" sulla scheda',
        add_parcel_toggle: '+ Aggiungi pacco',
        add_parcel_carrier: 'Corriere',
        add_parcel_number: 'Numero di tracciamento',
        add_parcel_submit: 'Aggiungi',
        add_parcel_busy: 'Aggiunta in corso...',
        add_parcel_success: 'Pacco aggiunto',
        add_parcel_error: 'Aggiunta non riuscita — controlla il numero.',
        adv_sensors: 'Avanzate: sovrascrivi i sensori manualmente',
        adv_sensors_help: 'Normalmente non è necessario modificare questo. Usalo solo se i tuoi sensori hanno un nome non standard.',
        entity_incoming: 'Entità in transito (incoming)',
        entity_delivered: 'Entità consegnato',
        entity_outgoing: 'Entità inviato (outgoing)',
        entity_outgoing_delivered: 'Entità inviato consegnato (outgoing delivered)',
        entity_letters: 'Entità posta',
        letters_entity_help: 'Le immagini scansionate delle lettere (entità image.*) vengono abbinate automaticamente per data.',
        no_letters_support: 'La posta è supportata solo per PostNL.',
        no_outgoing_support: 'I pacchi inviati non sono supportati per questo corriere.',
        adv_appearance: 'Avanzate: sovrascrivi l\'aspetto',
        label_icon: 'Icona (mdi:...)',
        label_color: 'Colore',
        label_logo: 'URL del logo (opzionale)',
        label_van: 'URL GIF del veicolo (opzionale)',
        label_banner: 'URL del banner (opzionale, sfondo con 1 corriere)',
        appearance_help: 'Logo, animazione del veicolo e banner hanno già un valore predefinito per corriere. Compila questo campo solo se vuoi sovrascriverlo.',
        postnl_entity_label: 'Entità di ricezione PostNL',
        postnl_dist_label: 'Entità di spedizione PostNL (opzionale)',
        detected_one: 'Rilevato automaticamente',
        detected_multiple: 'Trovati più account — scegline uno',
        detected_none: 'Nessun sensore trovato — inserisci manualmente',
        integration_not_found: 'Integrazione non trovata. Installa prima l\'integrazione:',
        no_prefix: '(nessun prefisso account)',
        detected_badge: 'trovato',
        label_icon_pick: 'Icona',
        label_color_pick: 'Colore',
        url_logo: 'URL del logo',
        url_van: 'URL GIF del veicolo',
        url_banner: 'URL del banner',
        url_placeholder: 'Lascia vuoto per usare il valore predefinito',
        url_preview_fail: 'Immagine non trovata',
        browse_media: 'Sfoglia',
    },
    // nb: machine-drafted, not yet reviewed by a native speaker (see translations/nb.json)
    nb: {
        tab_in_transit: 'Underveis',
        tab_delivered: 'Levert',
        tab_sent: 'Sendt',
        tab_letters: 'Brev',
        status_registered: 'Registrert',
        status_in_transit: 'Underveis',
        status_out_for_delivery: 'Ute for levering',
        status_ready_for_pickup: 'Klar for henting',
        status_at_pickup_point: 'På hentested',
        status_delivered: 'Levert',
        status_returning: 'Returneres til avsender',
        status_problem: 'Problem',
        status_unknown: 'Ukjent',
        step_label_registered: 'Registrert',
        step_label_sorting: 'Sorteringssentral',
        step_label_transit: 'Ute for levering',
        step_label_delivered: 'Levert',
        step_info_registered: 'Registrert kl.',
        step_info_sorting: 'På sorteringssentral kl.',
        step_info_transit_and: 'og',
        step_info_delivered: 'Levert den',
        step_info_expected_delivery: 'Forventet levering',
        today: 'I dag',
        tomorrow: 'I morgen',
        day_after_tomorrow: 'I overmorgen',
        expected_on: 'Forventes den',
        between_time: 'mellom',
        parcel_from: 'Pakke fra',
        unknown: 'Ukjent',
        mail_from: 'Post fra',
        letterbox_mail: 'Postkassepost',
        unread: 'Ulest',
        letterbox_received: 'Post mottatt i postkassen',
        parcel_delivered_msg: 'Pakke levert',
        select_parcel: 'Velg en pakke for detaljer',
        no_image: 'Ingen bilde tilgjengelig',
        label_tracking: 'Sporing',
        label_status: 'Status',
        label_delivery: 'Levering',
        label_pickup_point: 'Hentested',
        label_custom_name: 'Eget navn',
        add_custom_name: '+ Legg til navn',
        custom_name_placeholder: 'f.eks. Bursdagsgave',
        custom_name_edit: 'Rediger navn',
        custom_name_save: 'Lagre',
        custom_name_cancel: 'Avbryt',
        home_delivery: 'Levering hjem',
        pickup_point: 'Hentested',
        label_type: 'Type',
        type_letter: 'Brev',
        type_parcel: 'Pakke',
        open_tracking: 'ÅPNE SPORING ↗',
        no_parcels: 'Ingen pakker i denne kategorien',
        post_section_upcoming: 'Gjenstår å levere',
        post_section_delivered: 'Levert',
        stats_in_transit: 'underveis',
        stats_recent: 'nylige',
        stats_letters: 'brev',
        error_no_carriers: 'Ingen transportører er konfigurert, eller ingen av de konfigurerte sensorene ble funnet.',
        error_no_carriers_hint: 'Legg til minst 1 transportør med entity_incoming eller entity_delivered.',
        editor_title: '📦 Pakkekort for flere transportører',
        editor_intro1: 'Legg til én eller flere transportører nedenfor (PostNL, DHL, DPD, ...). Hver transportør kan ha opptil 4 sensorer.',
        editor_intro2: 'Velg riktig PostNL-type: PostNL (nåværende ≥4.x-integrasjon), PostNL (<v4.x, fases ut) eller PostNL (ArjenBos, fases ut).',
        section_basic: 'Grunnleggende innstillinger',
        label_card_title: 'Korttittel',
        label_days_back: 'Antall dager leveringshistorikk skal vises',
        section_carriers: 'Transportører',
        btn_add_carrier: '+ Legg til transportør',
        section_layout: 'Layoutrekkefølge',
        layout_help: 'Bruk pilene for å endre rekkefølgen på blokkene',
        layout_header: 'Topptekst (Tittel)',
        layout_animation: 'Animasjon / Bilde',
        layout_tabs: 'Navigasjonsfaner',
        layout_list: 'Pakkeliste',
        section_display: 'Visningsalternativer',
        show_header: 'Vis topptekst',
        show_delivered_tab: 'Vis fanen "Levert"',
        show_sent_tab: 'Vis fanen "Sendt"',
        show_letters_tab: 'Vis fanen "Brev" (krever minst 1 transportør med brevstøtte)',
        show_animation: 'Vis animasjon / detaljvisning',
        show_placeholder: 'Vis plassholderbilde',
        show_tracking_link: 'Vis sporingsknapp (deaktiver for kiosk / kun berøring)',
        show_raw_status: 'Vis transportørens egen statustekst i stedet for den oversatte etiketten',
        custom_name_scope_label: 'Egne pakkenavn',
        custom_name_scope_off: 'Av',
        custom_name_scope_device: 'Kun denne nettleseren/enheten',
        custom_name_scope_me: 'Kun for meg',
        custom_name_scope_everyone: 'For alle',
        custom_name_scope_help: '"Kun denne nettleseren/enheten" forlater aldri denne nettleseren. "Kun for meg" lagres på Home Assistant-kontoen din og følger deg på alle dine egne enheter. "For alle" lagres for hele instansen, synlig for alle brukere — å legge til eller redigere et navn med dette valget krever en administratorkonto; navnene kan ses av alle.',
        sort_order_label: 'Pakkerekkefølge',
        sort_order_auto: 'Automatisk (nærmeste først, siste levering først)',
        sort_order_newest_first: 'Nyeste/lengst unna først overalt',
        sort_order_oldest_first: 'Eldste/nærmeste først overalt',
        sort_order_help: '"Automatisk" (anbefales) viser pakken som ankommer snarest først i Underveis og Sendt, og den sist leverte pakken først i Levert. De to andre valgene låser én retning overalt.',
        group_by_carrier: 'Grupper pakker etter transportør (deaktiver for én flat liste sortert kun etter dato, med transportører om hverandre)',
        section_appearance: 'Utseende',
        label_header_color: 'Toppfarge',
        label_header_text: 'Topptekstfarge',
        label_placeholder_img: 'Plassholderbilde',
        color_default: 'Standard',
        color_custom: 'Egendefinert',
        btn_remove_carrier: 'Fjern transportør',
        label_carrier_name: 'Navn',
        legacy_warning: 'Gjenskaper det opprinnelige hki-postnl-card: én entitet med både pakker underveis og leverte, pluss en egen entitet for sendte pakker. Ingen brevstøtte, ingen sensormaler. Denne modusen vil ikke få flere oppdateringer så lenge arjenbos/ha-postnl ikke vedlikeholdes aktivt.',
        label_account: 'Konto / brukerdel av sensornavnet',
        account_help_suffix: '_incoming_parcels" osv. De 4 sensorene opprettes automatisk.',
        gls_account_help: 'GLS har ingen konto — angi postnummeret til din GLS-hub (f.eks. 1234AB, som angitt da integrasjonen ble lagt til).',
        dragonfly_account_help: 'Dragonfly har ingen konto eller postnummer — la dette feltet stå tomt; sensorene heter sensor.dragonfly_*.',
        trunkrs_account_help: 'Trunkrs har ingen konto — angi postnummeret til din Trunkrs-hub (f.eks. 1234AB, som angitt da integrasjonen ble lagt til).',
        cainiao_account_help: 'Cainiao har ingen konto eller postnummer — la dette feltet stå tomt; sensorene heter sensor.cainiao_*.',
        hermes_account_help: 'Hermes har ingen konto eller postnummer — la dette feltet stå tomt; sensorene heter sensor.hermes_*.',
        packeta_account_help: 'Packeta (Zásilkovna) har ingen konto eller postnummer — la dette feltet stå tomt; sensorene heter sensor.packeta_*.',
        correos_account_help: 'Correos har ingen konto eller postnummer — la dette feltet stå tomt; sensorene heter sensor.correos_*.',
        postnord_account_help: 'PostNord har ingen konto eller postnummer — la dette feltet stå tomt; sensorene heter sensor.postnord_*.',
        sameday_account_help: 'Sameday har ingen konto eller postnummer — la dette feltet stå tomt; sensorene heter sensor.sameday_*.',
        swiss_post_account_help: 'Swiss Post har ingen konto eller postnummer — la dette feltet stå tomt; sensorene heter sensor.swiss_post_*.',
        planzer_account_help: 'Planzer har ingen konto eller postnummer — la dette feltet stå tomt; sensorene heter sensor.planzer_*.',
        austrian_post_account_help: 'Østerrikes postvesen har ingen konto eller postnummer — la dette feltet stå tomt; sensorene heter sensor.oesterreichische_post_*.',
        helthjem_account_help: 'Helthjem har ingen konto eller postnummer — la dette feltet stå tomt; sensorene heter sensor.helthjem_*.',
        dynalogic_account_help: 'Dynalogic har ingen konto eller postnummer — la dette feltet stå tomt; sensorene heter sensor.dynalogic_*.',
        budbee_account_help: 'Budbee har ingen konto eller postnummer — la dette feltet stå tomt; sensorene heter sensor.budbee_*.',
        nova_post_account_help: 'Nova Post har ingen konto eller postnummer — la dette feltet stå tomt; sensorene heter sensor.nova_post_*.',
        delhivery_account_help: 'Delhivery har ingen konto eller postnummer — la dette feltet stå tomt; sensorene heter sensor.delhivery_*.',
        sunyou_account_help: 'SunYou har ingen konto eller postnummer — la dette feltet stå tomt; sensorene heter sensor.sunyou_*.',
        show_add_parcel: 'Vis "Legg til pakke" på kortet',
        add_parcel_toggle: '+ Legg til pakke',
        add_parcel_carrier: 'Transportør',
        add_parcel_number: 'Sporingsnummer',
        add_parcel_submit: 'Legg til',
        add_parcel_busy: 'Legger til...',
        add_parcel_success: 'Pakke lagt til',
        add_parcel_error: 'Kunne ikke legge til — sjekk nummeret.',
        adv_sensors: 'Avansert: overstyr sensorer manuelt',
        adv_sensors_help: 'Du trenger vanligvis ikke å endre dette. Bruk bare dette hvis sensorene dine har et ikke-standard navn.',
        entity_incoming: 'Entitet Underveis (innkommende)',
        entity_delivered: 'Entitet Levert',
        entity_outgoing: 'Entitet Sendt (utgående)',
        entity_outgoing_delivered: 'Entitet Levert sendt (utgående levert)',
        entity_letters: 'Entitet Brev',
        letters_entity_help: 'Skannede brevbilder (image.*-entiteter) matches automatisk etter dato.',
        no_letters_support: 'Brev støttes kun for PostNL.',
        no_outgoing_support: 'Sendte pakker støttes ikke for denne transportøren.',
        adv_appearance: 'Avansert: overstyr utseende',
        label_icon: 'Ikon (mdi:...)',
        label_color: 'Farge',
        label_logo: 'Logo-URL (valgfritt)',
        label_van: 'Kjøretøy-GIF-URL (valgfritt)',
        label_banner: 'Banner-URL (valgfritt, bakgrunn ved 1 transportør)',
        appearance_help: 'Logo, kjøretøyanimasjon og banner har allerede en innebygd standardverdi per transportør. Fyll bare inn en verdi her hvis du vil overstyre den.',
        postnl_entity_label: 'PostNL innkommende entitet',
        postnl_dist_label: 'PostNL utgående entitet (valgfritt)',
        detected_one: 'Automatisk oppdaget',
        detected_multiple: 'Flere kontoer funnet — velg én',
        detected_none: 'Ingen sensorer funnet — angi manuelt',
        integration_not_found: 'Integrasjonen ble ikke funnet. Installer integrasjonen først:',
        no_prefix: '(ingen kontoprefiks)',
        detected_badge: 'funnet',
        label_icon_pick: 'Ikon',
        label_color_pick: 'Farge',
        url_logo: 'Logo-URL',
        url_van: 'Kjøretøy-GIF-URL',
        url_banner: 'Banner-URL',
        url_placeholder: 'La stå tomt for å bruke standardverdien',
        url_preview_fail: 'Bilde ikke funnet',
        browse_media: 'Bla gjennom',
    },
    // pl: machine-drafted, not yet reviewed by a native speaker (see translations/pl.json)
    pl: {
        tab_in_transit: 'W drodze',
        tab_delivered: 'Dostarczone',
        tab_sent: 'Wysłane',
        tab_letters: 'Poczta',
        status_registered: 'Zarejestrowana',
        status_in_transit: 'W drodze',
        status_out_for_delivery: 'Dziś w doręczeniu',
        status_ready_for_pickup: 'Gotowa do odbioru',
        status_at_pickup_point: 'W punkcie odbioru',
        status_delivered: 'Dostarczona',
        status_returning: 'Zwrot do nadawcy',
        status_problem: 'Problem',
        status_unknown: 'Nieznany',
        step_label_registered: 'Zarejestrowana',
        step_label_sorting: 'Sortownia',
        step_label_transit: 'W doręczeniu',
        step_label_delivered: 'Dostarczona',
        step_info_registered: 'Zarejestrowano o',
        step_info_sorting: 'W sortowni o',
        step_info_transit_and: 'i',
        step_info_delivered: 'Dostarczono',
        step_info_expected_delivery: 'Oczekiwane doręczenie',
        today: 'Dzisiaj',
        tomorrow: 'Jutro',
        day_after_tomorrow: 'Pojutrze',
        expected_on: 'Oczekiwane',
        between_time: 'między',
        parcel_from: 'Paczka od',
        unknown: 'Nieznany',
        mail_from: 'Poczta od',
        letterbox_mail: 'Przesyłka listowa',
        unread: 'Nieprzeczytane',
        letterbox_received: 'Otrzymano przesyłkę listową',
        parcel_delivered_msg: 'Paczka dostarczona',
        select_parcel: 'Wybierz paczkę, aby zobaczyć szczegóły',
        no_image: 'Brak dostępnego obrazu',
        label_tracking: 'Śledzenie',
        label_status: 'Status',
        label_delivery: 'Sposób dostawy',
        label_pickup_point: 'Punkt odbioru',
        label_custom_name: 'Własna nazwa',
        add_custom_name: '+ Dodaj nazwę',
        custom_name_placeholder: 'np. Prezent urodzinowy',
        custom_name_edit: 'Edytuj nazwę',
        custom_name_save: 'Zapisz',
        custom_name_cancel: 'Anuluj',
        home_delivery: 'Dostawa do domu',
        pickup_point: 'Punkt odbioru',
        label_type: 'Typ',
        type_letter: 'List',
        type_parcel: 'Paczka',
        open_tracking: 'OTWÓRZ ŚLEDZENIE ↗',
        no_parcels: 'Brak paczek w tej kategorii',
        post_section_upcoming: 'Jeszcze do dostarczenia',
        post_section_delivered: 'Dostarczone',
        stats_in_transit: 'w drodze',
        stats_recent: 'ostatnio',
        stats_letters: 'listy',
        error_no_carriers: 'Nie skonfigurowano żadnych przewoźników lub nie znaleziono żadnego ze skonfigurowanych czujników.',
        error_no_carriers_hint: 'Dodaj co najmniej 1 przewoźnika z entity_incoming lub entity_delivered.',
        editor_title: '📦 Karta paczek wielu przewoźników',
        editor_intro1: 'Dodaj poniżej jednego lub więcej przewoźników (PostNL, DHL, DPD, ...). Każdy przewoźnik może mieć do 4 czujników.',
        editor_intro2: 'Wybierz właściwy typ PostNL: PostNL (aktualna integracja ≥4.x), PostNL (<v4.x, wycofywana) lub PostNL (ArjenBos, wycofywana).',
        section_basic: 'Ustawienia podstawowe',
        label_card_title: 'Tytuł karty',
        label_days_back: 'Liczba dni historii dostaw do pokazania',
        section_carriers: 'Przewoźnicy',
        btn_add_carrier: '+ Dodaj przewoźnika',
        section_layout: 'Kolejność układu',
        layout_help: 'Użyj strzałek, aby zmienić kolejność bloków',
        layout_header: 'Nagłówek (tytuł)',
        layout_animation: 'Animacja / obraz',
        layout_tabs: 'Karty nawigacji',
        layout_list: 'Lista paczek',
        section_display: 'Opcje wyświetlania',
        show_header: 'Pokaż nagłówek',
        show_delivered_tab: 'Pokaż zakładkę "Dostarczone"',
        show_sent_tab: 'Pokaż zakładkę "Wysłane"',
        show_letters_tab: 'Pokaż zakładkę "Poczta" (wymaga co najmniej 1 przewoźnika obsługującego listy)',
        show_animation: 'Pokaż animację / widok szczegółowy',
        show_placeholder: 'Pokaż obraz zastępczy',
        show_tracking_link: 'Pokaż przycisk śledzenia (wyłącz dla kiosku / obsługi wyłącznie dotykowej)',
        show_raw_status: 'Pokaż własny tekst statusu przewoźnika zamiast przetłumaczonej etykiety',
        custom_name_scope_label: 'Własne nazwy paczek',
        custom_name_scope_off: 'Wyłączone',
        custom_name_scope_device: 'Tylko ta przeglądarka/urządzenie',
        custom_name_scope_me: 'Tylko dla mnie',
        custom_name_scope_everyone: 'Dla wszystkich',
        custom_name_scope_help: '"Tylko ta przeglądarka/urządzenie" nigdy nie opuszcza tej przeglądarki. "Tylko dla mnie" jest zapisywane na Twoim koncie Home Assistant i towarzyszy Ci na wszystkich Twoich urządzeniach. "Dla wszystkich" jest zapisywane na poziomie instancji, widoczne dla każdego użytkownika — dodanie lub edycja nazwy przy tej opcji wymaga konta administratora; mimo to wszyscy mogą je zobaczyć.',
        sort_order_label: 'Kolejność paczek',
        sort_order_auto: 'Automatycznie (najbliższa najpierw, ostatnio dostarczona najpierw)',
        sort_order_newest_first: 'Wszędzie najnowsza/najdalsza najpierw',
        sort_order_oldest_first: 'Wszędzie najstarsza/najbliższa najpierw',
        sort_order_help: '"Automatycznie" (zalecane) pokazuje najpierw paczkę, która dotrze najszybciej w zakładkach W drodze i Wysłane, a w Dostarczone najpierw ostatnio dostarczoną. Pozostałe dwie opcje ustalają jeden stały kierunek wszędzie.',
        group_by_carrier: 'Grupuj paczki według przewoźnika (wyłącz, aby uzyskać jedną listę posortowaną tylko według daty, z wymieszanymi przewoźnikami)',
        section_appearance: 'Wygląd',
        label_header_color: 'Kolor nagłówka',
        label_header_text: 'Kolor tekstu nagłówka',
        label_placeholder_img: 'Obraz zastępczy',
        color_default: 'Domyślny',
        color_custom: 'Niestandardowy',
        btn_remove_carrier: 'Usuń przewoźnika',
        label_carrier_name: 'Nazwa',
        legacy_warning: 'Odtwarza oryginalną hki-postnl-card: jedna encja z paczkami w drodze i dostarczonymi, plus osobna encja dla paczek wysłanych. Brak obsługi listów, brak szablonowania czujników. Ten tryb nie otrzyma dalszych aktualizacji, dopóki arjenbos/ha-postnl nie będzie aktywnie utrzymywane.',
        label_account: 'Konto / część nazwy czujnika dotycząca użytkownika',
        account_help_suffix: '_incoming_parcels" itd. 4 czujniki są tworzone automatycznie.',
        gls_account_help: 'GLS nie ma konta — wpisz kod pocztowy swojego huba GLS (np. 1234AB, zgodnie z ustawieniem przy dodawaniu integracji).',
        dragonfly_account_help: 'Dragonfly nie ma konta ani kodu pocztowego — pozostaw to pole puste; czujniki nazywają się sensor.dragonfly_*.',
        trunkrs_account_help: 'Trunkrs nie ma konta — wpisz kod pocztowy swojego huba Trunkrs (np. 1234AB, zgodnie z ustawieniem przy dodawaniu integracji).',
        cainiao_account_help: 'Cainiao nie ma konta ani kodu pocztowego — pozostaw to pole puste; czujniki nazywają się sensor.cainiao_*.',
        hermes_account_help: 'Hermes nie ma konta ani kodu pocztowego — pozostaw to pole puste; czujniki nazywają się sensor.hermes_*.',
        packeta_account_help: 'Packeta nie ma konta ani kodu pocztowego — pozostaw to pole puste; czujniki nazywają się sensor.packeta_*.',
        correos_account_help: 'Correos nie ma konta ani kodu pocztowego — pozostaw to pole puste; czujniki nazywają się sensor.correos_*.',
        postnord_account_help: 'PostNord nie ma konta ani kodu pocztowego — pozostaw to pole puste; czujniki nazywają się sensor.postnord_*.',
        sameday_account_help: 'Sameday nie ma konta ani kodu pocztowego — pozostaw to pole puste; czujniki nazywają się sensor.sameday_*.',
        swiss_post_account_help: 'Poczta Szwajcarska nie ma konta ani kodu pocztowego — pozostaw to pole puste; czujniki nazywają się sensor.swiss_post_*.',
        planzer_account_help: 'Planzer nie ma konta ani kodu pocztowego — pozostaw to pole puste; czujniki nazywają się sensor.planzer_*.',
        austrian_post_account_help: 'Poczta Austriacka nie ma konta ani kodu pocztowego — pozostaw to pole puste; czujniki nazywają się sensor.oesterreichische_post_*.',
        helthjem_account_help: 'Helthjem nie ma konta ani kodu pocztowego — pozostaw to pole puste; czujniki nazywają się sensor.helthjem_*.',
        dynalogic_account_help: 'Dynalogic nie ma konta ani kodu pocztowego — pozostaw to pole puste; czujniki nazywają się sensor.dynalogic_*.',
        budbee_account_help: 'Budbee nie ma konta ani kodu pocztowego — pozostaw to pole puste; czujniki nazywają się sensor.budbee_*.',
        nova_post_account_help: 'Nova Post nie ma konta ani kodu pocztowego — pozostaw to pole puste; czujniki nazywają się sensor.nova_post_*.',
        delhivery_account_help: 'Delhivery nie ma konta ani kodu pocztowego — pozostaw to pole puste; czujniki nazywają się sensor.delhivery_*.',
        sunyou_account_help: 'SunYou nie ma konta ani kodu pocztowego — pozostaw to pole puste; czujniki nazywają się sensor.sunyou_*.',
        show_add_parcel: 'Pokaż "Dodaj paczkę" na karcie',
        add_parcel_toggle: '+ Dodaj paczkę',
        add_parcel_carrier: 'Przewoźnik',
        add_parcel_number: 'Numer śledzenia',
        add_parcel_submit: 'Dodaj',
        add_parcel_busy: 'Dodawanie...',
        add_parcel_success: 'Paczka dodana',
        add_parcel_error: 'Nie udało się dodać — sprawdź numer.',
        adv_sensors: 'Zaawansowane: ręczne nadpisanie czujników',
        adv_sensors_help: 'Zwykle nie musisz tego zmieniać. Użyj tego tylko wtedy, gdy Twoje czujniki mają niestandardową nazwę.',
        entity_incoming: 'Encja w drodze (incoming)',
        entity_delivered: 'Encja dostarczone',
        entity_outgoing: 'Encja wysłane (outgoing)',
        entity_outgoing_delivered: 'Encja wysłane dostarczone (outgoing delivered)',
        entity_letters: 'Encja poczty / listów',
        letters_entity_help: 'Zeskanowane obrazy listów (encje image.*) są dopasowywane automatycznie według daty.',
        no_letters_support: 'Poczta jest obsługiwana tylko dla PostNL.',
        no_outgoing_support: 'Wysłane paczki nie są obsługiwane dla tego przewoźnika.',
        adv_appearance: 'Zaawansowane: nadpisanie wyglądu',
        label_icon: 'Ikona (mdi:...)',
        label_color: 'Kolor',
        label_logo: 'URL logo (opcjonalnie)',
        label_van: 'URL GIF pojazdu (opcjonalnie)',
        label_banner: 'URL banera (opcjonalnie, tło przy 1 przewoźniku)',
        appearance_help: 'Logo, animacja pojazdu i baner mają już wbudowaną wartość domyślną dla każdego przewoźnika. Wypełnij to pole tylko wtedy, gdy chcesz je nadpisać.',
        postnl_entity_label: 'Encja odbioru PostNL',
        postnl_dist_label: 'Encja wysyłki PostNL (opcjonalnie)',
        detected_one: 'Wykryto automatycznie',
        detected_multiple: 'Znaleziono wiele kont — wybierz jedno',
        detected_none: 'Nie znaleziono czujników — wpisz ręcznie',
        integration_not_found: 'Nie znaleziono integracji. Najpierw zainstaluj integrację:',
        no_prefix: '(brak prefiksu konta)',
        detected_badge: 'znaleziono',
        label_icon_pick: 'Ikona',
        label_color_pick: 'Kolor',
        url_logo: 'URL logo',
        url_van: 'URL GIF pojazdu',
        url_banner: 'URL banera',
        url_placeholder: 'Pozostaw puste, aby użyć wartości domyślnej',
        url_preview_fail: 'Nie znaleziono obrazu',
        browse_media: 'Przeglądaj',
    },
    // pt: machine-drafted, not yet reviewed by a native speaker (see translations/pt.json)
    pt: {
        tab_in_transit: 'Em trânsito',
        tab_delivered: 'Entregue',
        tab_sent: 'Enviado',
        tab_letters: 'Correio',
        status_registered: 'Registado',
        status_in_transit: 'Em trânsito',
        status_out_for_delivery: 'Entrega hoje',
        status_ready_for_pickup: 'Pronto para levantamento',
        status_at_pickup_point: 'No ponto de recolha',
        status_delivered: 'Entregue',
        status_returning: 'Devolução ao remetente',
        status_problem: 'Problema',
        status_unknown: 'Desconhecido',
        step_label_registered: 'Registado',
        step_label_sorting: 'Centro de triagem',
        step_label_transit: 'Em distribuição',
        step_label_delivered: 'Entregue',
        step_info_registered: 'Registado às',
        step_info_sorting: 'No centro de triagem às',
        step_info_transit_and: 'e',
        step_info_delivered: 'Entregue em',
        step_info_expected_delivery: 'Entrega prevista',
        today: 'Hoje',
        tomorrow: 'Amanhã',
        day_after_tomorrow: 'Depois de amanhã',
        expected_on: 'Previsto para',
        between_time: 'entre',
        parcel_from: 'Encomenda de',
        unknown: 'Desconhecido',
        mail_from: 'Correio de',
        letterbox_mail: 'Correio postal',
        unread: 'Não lida',
        letterbox_received: 'Correio recebido',
        parcel_delivered_msg: 'Encomenda entregue',
        select_parcel: 'Selecione uma encomenda para ver detalhes',
        no_image: 'Nenhuma imagem disponível',
        label_tracking: 'Rastreamento',
        label_status: 'Estado',
        label_delivery: 'Modo de entrega',
        label_pickup_point: 'Ponto de recolha',
        label_custom_name: 'Nome personalizado',
        add_custom_name: '+ Adicionar nome',
        custom_name_placeholder: 'por ex. Presente de aniversário',
        custom_name_edit: 'Editar nome',
        custom_name_save: 'Guardar',
        custom_name_cancel: 'Cancelar',
        home_delivery: 'Entrega ao domicílio',
        pickup_point: 'Ponto de recolha',
        label_type: 'Tipo',
        type_letter: 'Carta',
        type_parcel: 'Encomenda',
        open_tracking: 'ABRIR RASTREAMENTO ↗',
        no_parcels: 'Sem encomendas nesta categoria',
        post_section_upcoming: 'Ainda por entregar',
        post_section_delivered: 'Entregue',
        stats_in_transit: 'em trânsito',
        stats_recent: 'recente',
        stats_letters: 'cartas',
        error_no_carriers: 'Nenhuma transportadora configurada, ou nenhum dos sensores configurados foi encontrado.',
        error_no_carriers_hint: 'Adicione pelo menos 1 transportadora com uma entity_incoming ou entity_delivered.',
        editor_title: '📦 Cartão de encomendas multi-transportadora',
        editor_intro1: 'Adicione abaixo uma ou mais transportadoras (PostNL, DHL, DPD, ...). Cada transportadora pode ter até 4 sensores.',
        editor_intro2: 'Escolha o tipo de PostNL correto: PostNL (integração atual ≥4.x), PostNL (<v4.x, em descontinuação) ou PostNL (ArjenBos, em descontinuação).',
        section_basic: 'Definições básicas',
        label_card_title: 'Título do cartão',
        label_days_back: 'Número de dias de histórico de entregas a mostrar',
        section_carriers: 'Transportadoras',
        btn_add_carrier: '+ Adicionar transportadora',
        section_layout: 'Ordem do layout',
        layout_help: 'Use as setas para reordenar os blocos',
        layout_header: 'Cabeçalho (título)',
        layout_animation: 'Animação / imagem',
        layout_tabs: 'Separadores de navegação',
        layout_list: 'Lista de encomendas',
        section_display: 'Opções de visualização',
        show_header: 'Mostrar cabeçalho',
        show_delivered_tab: 'Mostrar separador "Entregue"',
        show_sent_tab: 'Mostrar separador "Enviado"',
        show_letters_tab: 'Mostrar separador "Correio" (requer pelo menos 1 transportadora com suporte de correio)',
        show_animation: 'Mostrar animação / vista detalhada',
        show_placeholder: 'Mostrar imagem de marcador de posição',
        show_tracking_link: 'Mostrar botão de rastreamento (desativar para quiosque / uso apenas tátil)',
        show_raw_status: 'Mostrar o texto de estado próprio da transportadora em vez da etiqueta traduzida',
        custom_name_scope_label: 'Nomes personalizados de encomendas',
        custom_name_scope_off: 'Desativado',
        custom_name_scope_device: 'Só este navegador/dispositivo',
        custom_name_scope_me: 'Só para mim',
        custom_name_scope_everyone: 'Para todos',
        custom_name_scope_help: '"Só este navegador/dispositivo" nunca sai deste navegador. "Só para mim" é guardado na tua conta Home Assistant e acompanha-te em todos os teus dispositivos. "Para todos" é guardado ao nível da instância, visível para todos os utilizadores — adicionar ou editar um nome com esta opção requer uma conta de administrador; todos podem à mesma vê-los.',
        sort_order_label: 'Ordem das encomendas',
        sort_order_auto: 'Automático (a mais próxima primeiro, a entregue mais recentemente primeiro)',
        sort_order_newest_first: 'Mais recente/distante primeiro em todo o lado',
        sort_order_oldest_first: 'Mais antiga/próxima primeiro em todo o lado',
        sort_order_help: '"Automático" (recomendado) mostra primeiro a encomenda que chega mais cedo em Em trânsito e Enviado, e a entregue mais recentemente primeiro em Entregue. As outras duas opções fixam uma direção em todo o lado.',
        group_by_carrier: 'Agrupar encomendas por transportadora (desativar para uma lista única ordenada apenas por data, com transportadoras misturadas)',
        section_appearance: 'Aparência',
        label_header_color: 'Cor do cabeçalho',
        label_header_text: 'Cor do texto do cabeçalho',
        label_placeholder_img: 'Imagem de marcador de posição',
        color_default: 'Predefinido',
        color_custom: 'Personalizado',
        btn_remove_carrier: 'Remover transportadora',
        label_carrier_name: 'Nome',
        legacy_warning: 'Recria o hki-postnl-card original: uma entidade com encomendas em trânsito e entregues, mais uma entidade separada para encomendas enviadas. Sem suporte de correio, sem templating de sensores. Este modo não receberá mais atualizações enquanto arjenbos/ha-postnl não for ativamente mantido.',
        label_account: 'Conta / parte de utilizador do nome do sensor',
        account_help_suffix: '_incoming_parcels" etc. Os 4 sensores são criados automaticamente.',
        gls_account_help: 'A GLS não tem conta — introduza o código postal do seu hub GLS (ex. 1234AB, tal como definido ao adicionar a integração).',
        dragonfly_account_help: 'A Dragonfly não tem conta nem código postal — deixe este campo vazio; os sensores chamam-se sensor.dragonfly_*.',
        trunkrs_account_help: 'A Trunkrs não tem conta — introduza o código postal do seu hub Trunkrs (ex. 1234AB, tal como definido ao adicionar a integração).',
        cainiao_account_help: 'A Cainiao não tem conta nem código postal — deixe este campo vazio; os sensores chamam-se sensor.cainiao_*.',
        hermes_account_help: 'A Hermes não tem conta nem código postal — deixe este campo vazio; os sensores chamam-se sensor.hermes_*.',
        packeta_account_help: 'A Packeta não tem conta nem código postal — deixe este campo vazio; os sensores chamam-se sensor.packeta_*.',
        correos_account_help: 'A Correos não tem conta nem código postal — deixe este campo vazio; os sensores chamam-se sensor.correos_*.',
        postnord_account_help: 'A PostNord não tem conta nem código postal — deixe este campo vazio; os sensores chamam-se sensor.postnord_*.',
        sameday_account_help: 'A Sameday não tem conta nem código postal — deixe este campo vazio; os sensores chamam-se sensor.sameday_*.',
        swiss_post_account_help: 'Os Correios Suíços não têm conta nem código postal — deixe este campo vazio; os sensores chamam-se sensor.swiss_post_*.',
        planzer_account_help: 'A Planzer não tem conta nem código postal — deixe este campo vazio; os sensores chamam-se sensor.planzer_*.',
        austrian_post_account_help: 'Os Correios Austríacos não têm conta nem código postal — deixe este campo vazio; os sensores chamam-se sensor.oesterreichische_post_*.',
        helthjem_account_help: 'A Helthjem não tem conta nem código postal — deixe este campo vazio; os sensores chamam-se sensor.helthjem_*.',
        dynalogic_account_help: 'A Dynalogic não tem conta nem código postal — deixe este campo vazio; os sensores chamam-se sensor.dynalogic_*.',
        budbee_account_help: 'A Budbee não tem conta nem código postal — deixe este campo vazio; os sensores chamam-se sensor.budbee_*.',
        nova_post_account_help: 'A Nova Post não tem conta nem código postal — deixe este campo vazio; os sensores chamam-se sensor.nova_post_*.',
        delhivery_account_help: 'A Delhivery não tem conta nem código postal — deixe este campo vazio; os sensores chamam-se sensor.delhivery_*.',
        sunyou_account_help: 'A SunYou não tem conta nem código postal — deixe este campo vazio; os sensores chamam-se sensor.sunyou_*.',
        show_add_parcel: 'Mostrar "Adicionar encomenda" no cartão',
        add_parcel_toggle: '+ Adicionar encomenda',
        add_parcel_carrier: 'Transportadora',
        add_parcel_number: 'Número de rastreamento',
        add_parcel_submit: 'Adicionar',
        add_parcel_busy: 'A adicionar...',
        add_parcel_success: 'Encomenda adicionada',
        add_parcel_error: 'Falha ao adicionar — verifique o número.',
        adv_sensors: 'Avançado: substituir sensores manualmente',
        adv_sensors_help: 'Normalmente não precisa de alterar isto. Use apenas se os seus sensores tiverem um nome não padrão.',
        entity_incoming: 'Entidade em trânsito (incoming)',
        entity_delivered: 'Entidade entregue',
        entity_outgoing: 'Entidade enviado (outgoing)',
        entity_outgoing_delivered: 'Entidade enviado entregue (outgoing delivered)',
        entity_letters: 'Entidade de correio',
        letters_entity_help: 'As imagens digitalizadas das cartas (entidades image.*) são associadas automaticamente por data.',
        no_letters_support: 'O correio só é suportado para a PostNL.',
        no_outgoing_support: 'Encomendas enviadas não são suportadas para esta transportadora.',
        adv_appearance: 'Avançado: substituir aparência',
        label_icon: 'Ícone (mdi:...)',
        label_color: 'Cor',
        label_logo: 'URL do logótipo (opcional)',
        label_van: 'URL do GIF do veículo (opcional)',
        label_banner: 'URL do banner (opcional, fundo com 1 transportadora)',
        appearance_help: 'O logótipo, a animação do veículo e o banner já têm um valor predefinido por transportadora. Preencha isto apenas se quiser substituí-lo.',
        postnl_entity_label: 'Entidade de receção PostNL',
        postnl_dist_label: 'Entidade de envio PostNL (opcional)',
        detected_one: 'Detetado automaticamente',
        detected_multiple: 'Foram encontradas várias contas — escolha uma',
        detected_none: 'Nenhum sensor encontrado — introduza manualmente',
        integration_not_found: 'Integração não encontrada. Instale primeiro a integração:',
        no_prefix: '(sem prefixo de conta)',
        detected_badge: 'encontrado',
        label_icon_pick: 'Ícone',
        label_color_pick: 'Cor',
        url_logo: 'URL do logótipo',
        url_van: 'URL do GIF do veículo',
        url_banner: 'URL do banner',
        url_placeholder: 'Deixe vazio para usar a predefinição',
        url_preview_fail: 'Imagem não encontrada',
        browse_media: 'Procurar',
    },
    // ro: machine-drafted, not yet reviewed by a native speaker (see translations/ro.json)
    ro: {
        tab_in_transit: 'În tranzit',
        tab_delivered: 'Livrat',
        tab_sent: 'Trimis',
        tab_letters: 'Scrisori',
        status_registered: 'Înregistrat',
        status_in_transit: 'În tranzit',
        status_out_for_delivery: 'În curs de livrare',
        status_ready_for_pickup: 'Gata de ridicare',
        status_at_pickup_point: 'La punctul de ridicare',
        status_delivered: 'Livrat',
        status_returning: 'Se returnează la expeditor',
        status_problem: 'Problemă',
        status_unknown: 'Necunoscut',
        step_label_registered: 'Înregistrat',
        step_label_sorting: 'Centru de sortare',
        step_label_transit: 'În curs de livrare',
        step_label_delivered: 'Livrat',
        step_info_registered: 'Înregistrat la',
        step_info_sorting: 'La centrul de sortare la',
        step_info_transit_and: 'și',
        step_info_delivered: 'Livrat pe',
        step_info_expected_delivery: 'Livrare estimată',
        today: 'Astăzi',
        tomorrow: 'Mâine',
        day_after_tomorrow: 'Poimâine',
        expected_on: 'Estimat pe',
        between_time: 'între',
        parcel_from: 'Colet de la',
        unknown: 'Necunoscut',
        mail_from: 'Corespondență de la',
        letterbox_mail: 'Cutie poștală',
        unread: 'Necitit',
        letterbox_received: 'Corespondență primită în cutia poștală',
        parcel_delivered_msg: 'Colet livrat',
        select_parcel: 'Selectați un colet pentru detalii',
        no_image: 'Nicio imagine disponibilă',
        label_tracking: 'Urmărire',
        label_status: 'Stare',
        label_delivery: 'Livrare',
        label_pickup_point: 'Punct de ridicare',
        label_custom_name: 'Nume personalizat',
        add_custom_name: '+ Adaugă nume',
        custom_name_placeholder: 'de ex. Cadou de ziua de naștere',
        custom_name_edit: 'Editează numele',
        custom_name_save: 'Salvează',
        custom_name_cancel: 'Anulează',
        home_delivery: 'Livrare la domiciliu',
        pickup_point: 'Punct de ridicare',
        label_type: 'Tip',
        type_letter: 'Scrisoare',
        type_parcel: 'Colet',
        open_tracking: 'DESCHIDE URMĂRIREA ↗',
        no_parcels: 'Niciun colet în această categorie',
        post_section_upcoming: 'Încă de livrat',
        post_section_delivered: 'Livrat',
        stats_in_transit: 'în tranzit',
        stats_recent: 'recente',
        stats_letters: 'scrisori',
        error_no_carriers: 'Nu este configurat niciun curier sau niciun senzor configurat nu a fost găsit.',
        error_no_carriers_hint: 'Adăugați cel puțin 1 curier cu entity_incoming sau entity_delivered.',
        editor_title: '📦 Card colete multi-curier',
        editor_intro1: 'Adăugați unul sau mai mulți curieri mai jos (PostNL, DHL, DPD, ...). Fiecare curier poate avea până la 4 senzori.',
        editor_intro2: 'Alegeți tipul corect de PostNL: PostNL (integrarea actuală ≥4.x), PostNL (<v4.x, în curs de eliminare) sau PostNL (ArjenBos, în curs de eliminare).',
        section_basic: 'Setări de bază',
        label_card_title: 'Titlul cardului',
        label_days_back: 'Zile de afișat din istoricul livrărilor',
        section_carriers: 'Curieri',
        btn_add_carrier: '+ Adaugă curier',
        section_layout: 'Ordinea aspectului',
        layout_help: 'Utilizați săgețile pentru a reordona blocurile',
        layout_header: 'Antet (Titlu)',
        layout_animation: 'Animație / Imagine',
        layout_tabs: 'File de navigare',
        layout_list: 'Listă de colete',
        section_display: 'Opțiuni de afișare',
        show_header: 'Afișează antetul',
        show_delivered_tab: 'Afișează fila "Livrat"',
        show_sent_tab: 'Afișează fila "Trimis"',
        show_letters_tab: 'Afișează fila "Scrisori" (necesită cel puțin 1 curier cu suport pentru scrisori)',
        show_animation: 'Afișează animația / vizualizarea detaliată',
        show_placeholder: 'Afișează imaginea de rezervă',
        show_tracking_link: 'Afișează butonul de urmărire (dezactivați pentru chioșc / doar tactil)',
        show_raw_status: 'Afișează textul de stare propriu al curierului în loc de eticheta tradusă',
        custom_name_scope_label: 'Nume personalizate pentru colete',
        custom_name_scope_off: 'Dezactivat',
        custom_name_scope_device: 'Doar acest browser/dispozitiv',
        custom_name_scope_me: 'Doar pentru mine',
        custom_name_scope_everyone: 'Pentru toată lumea',
        custom_name_scope_help: '"Doar acest browser/dispozitiv" nu părăsește niciodată acest browser. "Doar pentru mine" este salvat în contul tău Home Assistant și te urmărește pe toate dispozitivele tale. "Pentru toată lumea" este salvat la nivel de instanță, vizibil pentru toți utilizatorii — adăugarea sau editarea unui nume cu această opțiune necesită un cont de administrator; numele pot fi văzute de oricine.',
        sort_order_label: 'Ordinea coletelor',
        sort_order_auto: 'Automat (cel mai apropiat primul, cea mai recentă livrare prima)',
        sort_order_newest_first: 'Cel mai nou/îndepărtat primul peste tot',
        sort_order_oldest_first: 'Cel mai vechi/apropiat primul peste tot',
        sort_order_help: '"Automat" (recomandat) afișează primul coletul care ajunge cel mai curând în În tranzit și Trimis, iar în Livrat coletul livrat cel mai recent primul. Celelalte două opțiuni fixează o singură direcție peste tot.',
        group_by_carrier: 'Grupează coletele pe curier (dezactivați pentru o listă unică sortată strict după dată, cu curierii amestecați)',
        section_appearance: 'Aspect',
        label_header_color: 'Culoarea antetului',
        label_header_text: 'Culoarea textului din antet',
        label_placeholder_img: 'Imagine de rezervă',
        color_default: 'Implicit',
        color_custom: 'Personalizat',
        btn_remove_carrier: 'Elimină curierul',
        label_carrier_name: 'Nume',
        legacy_warning: 'Recreează cardul original hki-postnl-card: o singură entitate cu colete în tranzit și livrate, plus o entitate separată pentru coletele trimise. Fără suport pentru scrisori, fără șabloane de senzori. Acest mod nu va mai primi actualizări atâta timp cât arjenbos/ha-postnl nu este întreținut activ.',
        label_account: 'Cont / partea de utilizator din numele senzorului',
        account_help_suffix: '_incoming_parcels" etc. Cei 4 senzori sunt creați automat.',
        gls_account_help: 'GLS nu are cont — introduceți codul poștal al hub-ului dvs. GLS (de ex. 1234AB, așa cum a fost setat la adăugarea integrării).',
        dragonfly_account_help: 'Dragonfly nu are cont sau cod poștal — lăsați acest câmp gol; senzorii se numesc sensor.dragonfly_*.',
        trunkrs_account_help: 'Trunkrs nu are cont — introduceți codul poștal al hub-ului dvs. Trunkrs (de ex. 1234AB, așa cum a fost setat la adăugarea integrării).',
        cainiao_account_help: 'Cainiao nu are cont sau cod poștal — lăsați acest câmp gol; senzorii se numesc sensor.cainiao_*.',
        hermes_account_help: 'Hermes nu are cont sau cod poștal — lăsați acest câmp gol; senzorii se numesc sensor.hermes_*.',
        packeta_account_help: 'Packeta (Zásilkovna) nu are cont sau cod poștal — lăsați acest câmp gol; senzorii se numesc sensor.packeta_*.',
        correos_account_help: 'Correos nu are cont sau cod poștal — lăsați acest câmp gol; senzorii se numesc sensor.correos_*.',
        postnord_account_help: 'PostNord nu are cont sau cod poștal — lăsați acest câmp gol; senzorii se numesc sensor.postnord_*.',
        sameday_account_help: 'Sameday nu are cont sau cod poștal — lăsați acest câmp gol; senzorii se numesc sensor.sameday_*.',
        swiss_post_account_help: 'Swiss Post nu are cont sau cod poștal — lăsați acest câmp gol; senzorii se numesc sensor.swiss_post_*.',
        planzer_account_help: 'Planzer nu are cont sau cod poștal — lăsați acest câmp gol; senzorii se numesc sensor.planzer_*.',
        austrian_post_account_help: 'Poșta Austriacă nu are cont sau cod poștal — lăsați acest câmp gol; senzorii se numesc sensor.oesterreichische_post_*.',
        helthjem_account_help: 'Helthjem nu are cont sau cod poștal — lăsați acest câmp gol; senzorii se numesc sensor.helthjem_*.',
        dynalogic_account_help: 'Dynalogic nu are cont sau cod poștal — lăsați acest câmp gol; senzorii se numesc sensor.dynalogic_*.',
        budbee_account_help: 'Budbee nu are cont sau cod poștal — lăsați acest câmp gol; senzorii se numesc sensor.budbee_*.',
        nova_post_account_help: 'Nova Post nu are cont sau cod poștal — lăsați acest câmp gol; senzorii se numesc sensor.nova_post_*.',
        delhivery_account_help: 'Delhivery nu are cont sau cod poștal — lăsați acest câmp gol; senzorii se numesc sensor.delhivery_*.',
        sunyou_account_help: 'SunYou nu are cont sau cod poștal — lăsați acest câmp gol; senzorii se numesc sensor.sunyou_*.',
        show_add_parcel: 'Afișează "Adaugă colet" pe card',
        add_parcel_toggle: '+ Adaugă colet',
        add_parcel_carrier: 'Curier',
        add_parcel_number: 'Număr de urmărire',
        add_parcel_submit: 'Adaugă',
        add_parcel_busy: 'Se adaugă...',
        add_parcel_success: 'Colet adăugat',
        add_parcel_error: 'Adăugarea a eșuat — verificați numărul.',
        adv_sensors: 'Avansat: suprascriere manuală a senzorilor',
        adv_sensors_help: 'În mod normal nu trebuie să modificați acest lucru. Utilizați doar dacă senzorii dvs. au un nume nestandard.',
        entity_incoming: 'Entitate În tranzit (primite)',
        entity_delivered: 'Entitate Livrat',
        entity_outgoing: 'Entitate Trimis (expediate)',
        entity_outgoing_delivered: 'Entitate Trimis livrat (expediate livrate)',
        entity_letters: 'Entitate Scrisori',
        letters_entity_help: 'Imaginile scanate ale scrisorilor (entități image.*) sunt asociate automat după dată.',
        no_letters_support: 'Scrisorile sunt acceptate doar pentru PostNL.',
        no_outgoing_support: 'Coletele trimise nu sunt acceptate pentru acest curier.',
        adv_appearance: 'Avansat: suprascriere aspect',
        label_icon: 'Pictogramă (mdi:...)',
        label_color: 'Culoare',
        label_logo: 'URL logo (opțional)',
        label_van: 'URL GIF vehicul (opțional)',
        label_banner: 'URL banner (opțional, fundal la 1 curier)',
        appearance_help: 'Logo-ul, animația vehiculului și bannerul au deja o valoare implicită pentru fiecare curier. Completați o valoare aici doar dacă doriți să o suprascrieți.',
        postnl_entity_label: 'Entitate PostNL de intrare',
        postnl_dist_label: 'Entitate PostNL de ieșire (opțional)',
        detected_one: 'Detectat automat',
        detected_multiple: 'Au fost găsite mai multe conturi — alegeți unul',
        detected_none: 'Niciun senzor găsit — introduceți manual',
        integration_not_found: 'Integrarea nu a fost găsită. Instalați mai întâi integrarea:',
        no_prefix: '(fără prefix de cont)',
        detected_badge: 'găsit',
        label_icon_pick: 'Pictogramă',
        label_color_pick: 'Culoare',
        url_logo: 'URL logo',
        url_van: 'URL GIF vehicul',
        url_banner: 'URL banner',
        url_placeholder: 'Lăsați gol pentru a utiliza valoarea implicită',
        url_preview_fail: 'Imaginea nu a fost găsită',
        browse_media: 'Răsfoiește',
    },
    // sk: machine-drafted, not yet reviewed by a native speaker (see translations/sk.json)
    sk: {
        tab_in_transit: 'Na ceste',
        tab_delivered: 'Doručené',
        tab_sent: 'Odoslané',
        tab_letters: 'Listy',
        status_registered: 'Zaregistrované',
        status_in_transit: 'Na ceste',
        status_out_for_delivery: 'V doručovaní',
        status_ready_for_pickup: 'Pripravené na vyzdvihnutie',
        status_at_pickup_point: 'Na výdajnom mieste',
        status_delivered: 'Doručené',
        status_returning: 'Vracia sa odosielateľovi',
        status_problem: 'Problém',
        status_unknown: 'Neznáme',
        step_label_registered: 'Zaregistrované',
        step_label_sorting: 'Triediace centrum',
        step_label_transit: 'V doručovaní',
        step_label_delivered: 'Doručené',
        step_info_registered: 'Zaregistrované o',
        step_info_sorting: 'V triediacom centre o',
        step_info_transit_and: 'a',
        step_info_delivered: 'Doručené dňa',
        step_info_expected_delivery: 'Očakávané doručenie',
        today: 'Dnes',
        tomorrow: 'Zajtra',
        day_after_tomorrow: 'Pozajtra',
        expected_on: 'Očakávané dňa',
        between_time: 'medzi',
        parcel_from: 'Zásielka od',
        unknown: 'Neznáme',
        mail_from: 'Pošta od',
        letterbox_mail: 'Poštová schránka',
        unread: 'Neprečítané',
        letterbox_received: 'Prijatá pošta do schránky',
        parcel_delivered_msg: 'Zásielka doručená',
        select_parcel: 'Vyberte zásielku pre podrobnosti',
        no_image: 'Obrázok nie je k dispozícii',
        label_tracking: 'Sledovanie',
        label_status: 'Stav',
        label_delivery: 'Doručenie',
        label_pickup_point: 'Výdajné miesto',
        label_custom_name: 'Vlastný názov',
        add_custom_name: '+ Pridať názov',
        custom_name_placeholder: 'napr. Darček k narodeninám',
        custom_name_edit: 'Upraviť názov',
        custom_name_save: 'Uložiť',
        custom_name_cancel: 'Zrušiť',
        home_delivery: 'Doručenie domov',
        pickup_point: 'Výdajné miesto',
        label_type: 'Typ',
        type_letter: 'List',
        type_parcel: 'Zásielka',
        open_tracking: 'OTVORIŤ SLEDOVANIE ↗',
        no_parcels: 'V tejto kategórii nie sú žiadne zásielky',
        post_section_upcoming: 'Ešte k doručeniu',
        post_section_delivered: 'Doručené',
        stats_in_transit: 'na ceste',
        stats_recent: 'nedávne',
        stats_letters: 'listy',
        error_no_carriers: 'Nie sú nakonfigurovaní žiadni dopravcovia, alebo nebol nájdený žiadny z nakonfigurovaných senzorov.',
        error_no_carriers_hint: 'Pridajte aspoň 1 dopravcu s entity_incoming alebo entity_delivered.',
        editor_title: '📦 Karta zásielok od viacerých dopravcov',
        editor_intro1: 'Nižšie pridajte jedného alebo viacerých dopravcov (PostNL, DHL, DPD, ...). Každý dopravca môže mať až 4 senzory.',
        editor_intro2: 'Vyberte správny typ PostNL: PostNL (aktuálna integrácia ≥4.x), PostNL (<v4.x, postupne rušené), alebo PostNL (ArjenBos, postupne rušené).',
        section_basic: 'Základné nastavenia',
        label_card_title: 'Názov karty',
        label_days_back: 'Počet dní histórie doručenia',
        section_carriers: 'Dopravcovia',
        btn_add_carrier: '+ Pridať dopravcu',
        section_layout: 'Poradie rozloženia',
        layout_help: 'Pomocou šípok zmeňte poradie blokov',
        layout_header: 'Hlavička (Názov)',
        layout_animation: 'Animácia / Obrázok',
        layout_tabs: 'Navigačné karty',
        layout_list: 'Zoznam zásielok',
        section_display: 'Možnosti zobrazenia',
        show_header: 'Zobraziť hlavičku',
        show_delivered_tab: 'Zobraziť kartu "Doručené"',
        show_sent_tab: 'Zobraziť kartu "Odoslané"',
        show_letters_tab: 'Zobraziť kartu "Listy" (vyžaduje aspoň 1 dopravcu s podporou listov)',
        show_animation: 'Zobraziť animáciu / detailné zobrazenie',
        show_placeholder: 'Zobraziť náhradný obrázok',
        show_tracking_link: 'Zobraziť tlačidlo sledovania (vypnite pre kiosk / len dotyk)',
        show_raw_status: 'Zobraziť vlastný stavový text dopravcu namiesto preloženého popisu',
        custom_name_scope_label: 'Vlastné názvy zásielok',
        custom_name_scope_off: 'Vypnuté',
        custom_name_scope_device: 'Len tento prehliadač/zariadenie',
        custom_name_scope_me: 'Len pre mňa',
        custom_name_scope_everyone: 'Pre všetkých',
        custom_name_scope_help: '"Len tento prehliadač/zariadenie" nikdy neopustí tento prehliadač. "Len pre mňa" sa ukladá do vášho účtu Home Assistant a sleduje vás na všetkých vašich zariadeniach. "Pre všetkých" sa ukladá v rámci celej inštancie a je viditeľné pre každého používateľa — pridanie alebo úprava názvu pri tejto možnosti vyžaduje účet správcu; názvy môže vidieť ktokoľvek.',
        sort_order_label: 'Poradie zásielok',
        sort_order_auto: 'Automaticky (najbližšia ako prvá, najnovšie doručenie ako prvé)',
        sort_order_newest_first: 'Všade najnovšia/najvzdialenejšia ako prvá',
        sort_order_oldest_first: 'Všade najstaršia/najbližšia ako prvá',
        sort_order_help: '"Automaticky" (odporúčané) zobrazí najskôr zásielku, ktorá dorazí najskôr, v kartách Na ceste a Odoslané, a naposledy doručenú zásielku ako prvú v karte Doručené. Ďalšie dve možnosti zvolia jeden pevný smer všade.',
        group_by_carrier: 'Zoskupiť zásielky podľa dopravcu (vypnite pre jeden plochý zoznam zoradený čisto podľa dátumu, kde sa dopravcovia prelínajú)',
        section_appearance: 'Vzhľad',
        label_header_color: 'Farba hlavičky',
        label_header_text: 'Farba textu hlavičky',
        label_placeholder_img: 'Náhradný obrázok',
        color_default: 'Predvolené',
        color_custom: 'Vlastné',
        btn_remove_carrier: 'Odstrániť dopravcu',
        label_carrier_name: 'Názov',
        legacy_warning: 'Znovu vytvorí pôvodnú kartu hki-postnl-card: jedna entita so zásielkami na ceste aj doručenými, plus samostatná entita pre odoslané zásielky. Bez podpory listov, bez šablónovania senzorov. Tento režim nebude ďalej aktualizovaný, kým nebude arjenbos/ha-postnl aktívne udržiavaný.',
        label_account: 'Účet / používateľská časť názvu senzora',
        account_help_suffix: '_incoming_parcels" atď. 4 senzory sa vytvoria automaticky.',
        gls_account_help: 'GLS nemá účet — zadajte PSČ vášho GLS uzla (napr. 1234AB, ako bolo nastavené pri pridávaní integrácie).',
        dragonfly_account_help: 'Dragonfly nemá účet ani PSČ — ponechajte toto pole prázdne; senzory sa volajú sensor.dragonfly_*.',
        trunkrs_account_help: 'Trunkrs nemá účet — zadajte PSČ vášho uzla Trunkrs (napr. 1234AB, ako bolo nastavené pri pridávaní integrácie).',
        cainiao_account_help: 'Cainiao nemá účet ani PSČ — ponechajte toto pole prázdne; senzory sa volajú sensor.cainiao_*.',
        hermes_account_help: 'Hermes nemá účet ani PSČ — ponechajte toto pole prázdne; senzory sa volajú sensor.hermes_*.',
        packeta_account_help: 'Packeta (Zásielkovňa) nemá účet ani PSČ — ponechajte toto pole prázdne; senzory sa volajú sensor.packeta_*.',
        correos_account_help: 'Correos nemá účet ani PSČ — ponechajte toto pole prázdne; senzory sa volajú sensor.correos_*.',
        postnord_account_help: 'PostNord nemá účet ani PSČ — ponechajte toto pole prázdne; senzory sa volajú sensor.postnord_*.',
        sameday_account_help: 'Sameday nemá účet ani PSČ — ponechajte toto pole prázdne; senzory sa volajú sensor.sameday_*.',
        swiss_post_account_help: 'Swiss Post nemá účet ani PSČ — ponechajte toto pole prázdne; senzory sa volajú sensor.swiss_post_*.',
        planzer_account_help: 'Planzer nemá účet ani PSČ — ponechajte toto pole prázdne; senzory sa volajú sensor.planzer_*.',
        austrian_post_account_help: 'Rakúska pošta nemá účet ani PSČ — ponechajte toto pole prázdne; senzory sa volajú sensor.oesterreichische_post_*.',
        helthjem_account_help: 'Helthjem nemá účet ani PSČ — ponechajte toto pole prázdne; senzory sa volajú sensor.helthjem_*.',
        dynalogic_account_help: 'Dynalogic nemá účet ani PSČ — ponechajte toto pole prázdne; senzory sa volajú sensor.dynalogic_*.',
        budbee_account_help: 'Budbee nemá účet ani PSČ — ponechajte toto pole prázdne; senzory sa volajú sensor.budbee_*.',
        nova_post_account_help: 'Nova Post nemá účet ani PSČ — ponechajte toto pole prázdne; senzory sa volajú sensor.nova_post_*.',
        delhivery_account_help: 'Delhivery nemá účet ani PSČ — ponechajte toto pole prázdne; senzory sa volajú sensor.delhivery_*.',
        sunyou_account_help: 'SunYou nemá účet ani PSČ — ponechajte toto pole prázdne; senzory sa volajú sensor.sunyou_*.',
        show_add_parcel: 'Zobraziť "Pridať zásielku" na karte',
        add_parcel_toggle: '+ Pridať zásielku',
        add_parcel_carrier: 'Dopravca',
        add_parcel_number: 'Sledovacie číslo',
        add_parcel_submit: 'Pridať',
        add_parcel_busy: 'Pridávanie...',
        add_parcel_success: 'Zásielka pridaná',
        add_parcel_error: 'Pridanie zlyhalo — skontrolujte číslo.',
        adv_sensors: 'Pokročilé: ručné prepísanie senzorov',
        adv_sensors_help: 'Toto zvyčajne nemusíte meniť. Použite len ak vaše senzory majú neštandardný názov.',
        entity_incoming: 'Entita Na ceste (prichádzajúce)',
        entity_delivered: 'Entita Doručené',
        entity_outgoing: 'Entita Odoslané (odchádzajúce)',
        entity_outgoing_delivered: 'Entita Doručené odoslané (odchádzajúce doručené)',
        entity_letters: 'Entita Listy',
        letters_entity_help: 'Obrázky skenov listov (entity image.*) sú automaticky párované podľa dátumu.',
        no_letters_support: 'Listy sú podporované iba pre PostNL.',
        no_outgoing_support: 'Odoslané zásielky nie sú pre tohto dopravcu podporované.',
        adv_appearance: 'Pokročilé: prepísanie vzhľadu',
        label_icon: 'Ikona (mdi:...)',
        label_color: 'Farba',
        label_logo: 'URL loga (voliteľné)',
        label_van: 'URL GIF vozidla (voliteľné)',
        label_banner: 'URL banneru (voliteľné, pozadie pri 1 dopravcovi)',
        appearance_help: 'Logo, animácia vozidla a banner už majú predvolenú hodnotu podľa dopravcu. Vyplňte tu hodnotu len ak ju chcete prepísať.',
        postnl_entity_label: 'Vstupná entita PostNL',
        postnl_dist_label: 'Výstupná entita PostNL (voliteľné)',
        detected_one: 'Automaticky rozpoznané',
        detected_multiple: 'Nájdených viacero účtov — vyberte jeden',
        detected_none: 'Nenašli sa žiadne senzory — zadajte ručne',
        integration_not_found: 'Integrácia nenájdená. Najprv nainštalujte integráciu:',
        no_prefix: '(bez predpony účtu)',
        detected_badge: 'nájdené',
        label_icon_pick: 'Ikona',
        label_color_pick: 'Farba',
        url_logo: 'URL loga',
        url_van: 'URL GIF vozidla',
        url_banner: 'URL banneru',
        url_placeholder: 'Ponechajte prázdne pre použitie predvolenej hodnoty',
        url_preview_fail: 'Obrázok nenájdený',
        browse_media: 'Prehľadávať',
    },
    // sv: machine-drafted, not yet reviewed by a native speaker (see translations/sv.json)
    sv: {
        tab_in_transit: 'På väg',
        tab_delivered: 'Levererat',
        tab_sent: 'Skickat',
        tab_letters: 'Brev',
        status_registered: 'Registrerat',
        status_in_transit: 'På väg',
        status_out_for_delivery: 'Ute för leverans',
        status_ready_for_pickup: 'Klart för upphämtning',
        status_at_pickup_point: 'Vid utlämningsställe',
        status_delivered: 'Levererat',
        status_returning: 'Returneras till avsändaren',
        status_problem: 'Problem',
        status_unknown: 'Okänt',
        step_label_registered: 'Registrerat',
        step_label_sorting: 'Sorteringscenter',
        step_label_transit: 'Ute för leverans',
        step_label_delivered: 'Levererat',
        step_info_registered: 'Registrerat kl.',
        step_info_sorting: 'Vid sorteringscenter kl.',
        step_info_transit_and: 'och',
        step_info_delivered: 'Levererat den',
        step_info_expected_delivery: 'Förväntad leverans',
        today: 'Idag',
        tomorrow: 'Imorgon',
        day_after_tomorrow: 'I övermorgon',
        expected_on: 'Förväntas den',
        between_time: 'mellan',
        parcel_from: 'Paket från',
        unknown: 'Okänt',
        mail_from: 'Post från',
        letterbox_mail: 'Brevlådepost',
        unread: 'Oläst',
        letterbox_received: 'Post mottagen i brevlådan',
        parcel_delivered_msg: 'Paket levererat',
        select_parcel: 'Välj ett paket för detaljer',
        no_image: 'Ingen bild tillgänglig',
        label_tracking: 'Spårning',
        label_status: 'Status',
        label_delivery: 'Leverans',
        label_pickup_point: 'Utlämningsställe',
        label_custom_name: 'Eget namn',
        add_custom_name: '+ Lägg till namn',
        custom_name_placeholder: 't.ex. Födelsedagspresent',
        custom_name_edit: 'Redigera namn',
        custom_name_save: 'Spara',
        custom_name_cancel: 'Avbryt',
        home_delivery: 'Hemleverans',
        pickup_point: 'Utlämningsställe',
        label_type: 'Typ',
        type_letter: 'Brev',
        type_parcel: 'Paket',
        open_tracking: 'ÖPPNA SPÅRNING ↗',
        no_parcels: 'Inga paket i denna kategori',
        post_section_upcoming: 'Återstår att levereras',
        post_section_delivered: 'Levererat',
        stats_in_transit: 'på väg',
        stats_recent: 'nyligen',
        stats_letters: 'brev',
        error_no_carriers: 'Inga transportörer har konfigurerats, eller så hittades ingen av de konfigurerade sensorerna.',
        error_no_carriers_hint: 'Lägg till minst 1 transportör med entity_incoming eller entity_delivered.',
        editor_title: '📦 Paketkort för flera transportörer',
        editor_intro1: 'Lägg till en eller flera transportörer nedan (PostNL, DHL, DPD, ...). Varje transportör kan ha upp till 4 sensorer.',
        editor_intro2: 'Välj rätt PostNL-typ: PostNL (nuvarande ≥4.x-integration), PostNL (<v4.x, fasas ut) eller PostNL (ArjenBos, fasas ut).',
        section_basic: 'Grundinställningar',
        label_card_title: 'Kortets titel',
        label_days_back: 'Antal dagar att visa leveranshistorik',
        section_carriers: 'Transportörer',
        btn_add_carrier: '+ Lägg till transportör',
        section_layout: 'Layoutordning',
        layout_help: 'Använd pilarna för att ändra ordning på blocken',
        layout_header: 'Rubrik (titel)',
        layout_animation: 'Animation / bild',
        layout_tabs: 'Navigeringsflikar',
        layout_list: 'Paketlista',
        section_display: 'Visningsalternativ',
        show_header: 'Visa rubrik',
        show_delivered_tab: 'Visa fliken "Levererat"',
        show_sent_tab: 'Visa fliken "Skickat"',
        show_letters_tab: 'Visa fliken "Brev" (kräver minst 1 transportör med brevstöd)',
        show_animation: 'Visa animation / detaljvy',
        show_placeholder: 'Visa platshållarbild',
        show_tracking_link: 'Visa spårningsknapp (inaktivera för kiosk / endast touch)',
        show_raw_status: 'Visa transportörens egen statustext istället för den översatta etiketten',
        custom_name_scope_label: 'Egna paketnamn',
        custom_name_scope_off: 'Av',
        custom_name_scope_device: 'Endast denna webbläsare/enhet',
        custom_name_scope_me: 'Endast för mig',
        custom_name_scope_everyone: 'För alla',
        custom_name_scope_help: '"Endast denna webbläsare/enhet" lämnar aldrig denna webbläsare. "Endast för mig" sparas i ditt Home Assistant-konto och följer dig på alla dina enheter. "För alla" sparas för hela instansen, synligt för alla användare — att lägga till eller redigera ett namn med detta alternativ kräver ett administratörskonto; namnen kan ses av vem som helst.',
        sort_order_label: 'Paketordning',
        sort_order_auto: 'Automatiskt (närmast först, senaste leverans först)',
        sort_order_newest_first: 'Nyaste/längst bort först överallt',
        sort_order_oldest_first: 'Äldsta/närmast först överallt',
        sort_order_help: '"Automatiskt" (rekommenderas) visar paketet som anländer snarast först i På väg och Skickat, och det senast levererade paketet först i Levererat. De andra två alternativen låser en riktning överallt.',
        group_by_carrier: 'Gruppera paket efter transportör (inaktivera för en platt lista sorterad enbart efter datum, med blandade transportörer)',
        section_appearance: 'Utseende',
        label_header_color: 'Rubrikfärg',
        label_header_text: 'Rubriktextfärg',
        label_placeholder_img: 'Platshållarbild',
        color_default: 'Standard',
        color_custom: 'Anpassad',
        btn_remove_carrier: 'Ta bort transportör',
        label_carrier_name: 'Namn',
        legacy_warning: 'Återskapar det ursprungliga hki-postnl-card: en entitet med både paket på väg och levererade, plus en separat entitet för skickade paket. Inget brevstöd, ingen sensormallning. Detta läge kommer inte få fler uppdateringar så länge arjenbos/ha-postnl inte underhålls aktivt.',
        label_account: 'Konto / användardel av sensornamnet',
        account_help_suffix: '_incoming_parcels" osv. De 4 sensorerna skapas automatiskt.',
        gls_account_help: 'GLS har inget konto — ange postnumret för din GLS-hub (t.ex. 1234AB, som angavs när integrationen lades till).',
        dragonfly_account_help: 'Dragonfly har inget konto eller postnummer — lämna detta fält tomt; sensorerna heter sensor.dragonfly_*.',
        trunkrs_account_help: 'Trunkrs har inget konto — ange postnumret för din Trunkrs-hub (t.ex. 1234AB, som angavs när integrationen lades till).',
        cainiao_account_help: 'Cainiao har inget konto eller postnummer — lämna detta fält tomt; sensorerna heter sensor.cainiao_*.',
        hermes_account_help: 'Hermes har inget konto eller postnummer — lämna detta fält tomt; sensorerna heter sensor.hermes_*.',
        packeta_account_help: 'Packeta (Zásilkovna) har inget konto eller postnummer — lämna detta fält tomt; sensorerna heter sensor.packeta_*.',
        correos_account_help: 'Correos har inget konto eller postnummer — lämna detta fält tomt; sensorerna heter sensor.correos_*.',
        postnord_account_help: 'PostNord har inget konto eller postnummer — lämna detta fält tomt; sensorerna heter sensor.postnord_*.',
        sameday_account_help: 'Sameday har inget konto eller postnummer — lämna detta fält tomt; sensorerna heter sensor.sameday_*.',
        swiss_post_account_help: 'Swiss Post har inget konto eller postnummer — lämna detta fält tomt; sensorerna heter sensor.swiss_post_*.',
        planzer_account_help: 'Planzer har inget konto eller postnummer — lämna detta fält tomt; sensorerna heter sensor.planzer_*.',
        austrian_post_account_help: 'Österrikiska posten har inget konto eller postnummer — lämna detta fält tomt; sensorerna heter sensor.oesterreichische_post_*.',
        helthjem_account_help: 'Helthjem har inget konto eller postnummer — lämna detta fält tomt; sensorerna heter sensor.helthjem_*.',
        dynalogic_account_help: 'Dynalogic har inget konto eller postnummer — lämna detta fält tomt; sensorerna heter sensor.dynalogic_*.',
        budbee_account_help: 'Budbee har inget konto eller postnummer — lämna detta fält tomt; sensorerna heter sensor.budbee_*.',
        nova_post_account_help: 'Nova Post har inget konto eller postnummer — lämna detta fält tomt; sensorerna heter sensor.nova_post_*.',
        delhivery_account_help: 'Delhivery har inget konto eller postnummer — lämna detta fält tomt; sensorerna heter sensor.delhivery_*.',
        sunyou_account_help: 'SunYou har inget konto eller postnummer — lämna detta fält tomt; sensorerna heter sensor.sunyou_*.',
        show_add_parcel: 'Visa "Lägg till paket" på kortet',
        add_parcel_toggle: '+ Lägg till paket',
        add_parcel_carrier: 'Transportör',
        add_parcel_number: 'Spårningsnummer',
        add_parcel_submit: 'Lägg till',
        add_parcel_busy: 'Lägger till...',
        add_parcel_success: 'Paket tillagt',
        add_parcel_error: 'Det gick inte att lägga till — kontrollera numret.',
        adv_sensors: 'Avancerat: åsidosätt sensorer manuellt',
        adv_sensors_help: 'Du behöver normalt inte ändra detta. Använd endast om dina sensorer har ett icke-standardnamn.',
        entity_incoming: 'Entitet På väg (inkommande)',
        entity_delivered: 'Entitet Levererat',
        entity_outgoing: 'Entitet Skickat (utgående)',
        entity_outgoing_delivered: 'Entitet Levererat skickat (utgående levererat)',
        entity_letters: 'Entitet Brev',
        letters_entity_help: 'Skannade brevbilder (image.*-entiteter) matchas automatiskt efter datum.',
        no_letters_support: 'Brev stöds endast för PostNL.',
        no_outgoing_support: 'Skickade paket stöds inte för denna transportör.',
        adv_appearance: 'Avancerat: åsidosätt utseende',
        label_icon: 'Ikon (mdi:...)',
        label_color: 'Färg',
        label_logo: 'Logotyp-URL (valfritt)',
        label_van: 'Fordons-GIF-URL (valfritt)',
        label_banner: 'Banner-URL (valfritt, bakgrund vid 1 transportör)',
        appearance_help: 'Logotyp, fordonsanimation och banner har redan ett inbyggt standardvärde per transportör. Fyll bara i ett värde här om du vill åsidosätta det.',
        postnl_entity_label: 'PostNL inkommande entitet',
        postnl_dist_label: 'PostNL utgående entitet (valfritt)',
        detected_one: 'Automatiskt identifierad',
        detected_multiple: 'Flera konton hittades — välj ett',
        detected_none: 'Inga sensorer hittades — ange manuellt',
        integration_not_found: 'Integrationen hittades inte. Installera integrationen först:',
        no_prefix: '(inget kontoprefix)',
        detected_badge: 'hittad',
        label_icon_pick: 'Ikon',
        label_color_pick: 'Färg',
        url_logo: 'Logotyp-URL',
        url_van: 'Fordons-GIF-URL',
        url_banner: 'Banner-URL',
        url_placeholder: 'Lämna tomt för att använda standardvärdet',
        url_preview_fail: 'Bilden hittades inte',
        browse_media: 'Bläddra',
    },
    // uk: machine-drafted, not yet reviewed by a native speaker (see translations/uk.json)
    uk: {
        tab_in_transit: 'В дорозі',
        tab_delivered: 'Доставлено',
        tab_sent: 'Надіслано',
        tab_letters: 'Листи',
        status_registered: 'Зареєстровано',
        status_in_transit: 'В дорозі',
        status_out_for_delivery: 'На доставці',
        status_ready_for_pickup: 'Готово до отримання',
        status_at_pickup_point: 'У пункті видачі',
        status_delivered: 'Доставлено',
        status_returning: 'Повертається відправнику',
        status_problem: 'Проблема',
        status_unknown: 'Невідомо',
        step_label_registered: 'Зареєстровано',
        step_label_sorting: 'Сортувальний центр',
        step_label_transit: 'На доставці',
        step_label_delivered: 'Доставлено',
        step_info_registered: 'Зареєстровано о',
        step_info_sorting: 'У сортувальному центрі о',
        step_info_transit_and: 'та',
        step_info_delivered: 'Доставлено',
        step_info_expected_delivery: 'Очікувана доставка',
        today: 'Сьогодні',
        tomorrow: 'Завтра',
        day_after_tomorrow: 'Післязавтра',
        expected_on: 'Очікується',
        between_time: 'між',
        parcel_from: 'Посилка від',
        unknown: 'Невідомо',
        mail_from: 'Пошта від',
        letterbox_mail: 'Поштова скринька',
        unread: 'Непрочитано',
        letterbox_received: 'Отримано пошту в поштову скриньку',
        parcel_delivered_msg: 'Посилку доставлено',
        select_parcel: 'Виберіть посилку для деталей',
        no_image: 'Зображення недоступне',
        label_tracking: 'Відстеження',
        label_status: 'Статус',
        label_delivery: 'Доставка',
        label_pickup_point: 'Пункт видачі',
        label_custom_name: 'Власна назва',
        add_custom_name: '+ Додати назву',
        custom_name_placeholder: 'напр. Подарунок на день народження',
        custom_name_edit: 'Редагувати назву',
        custom_name_save: 'Зберегти',
        custom_name_cancel: 'Скасувати',
        home_delivery: 'Доставка додому',
        pickup_point: 'Пункт видачі',
        label_type: 'Тип',
        type_letter: 'Лист',
        type_parcel: 'Посилка',
        open_tracking: 'ВІДКРИТИ ВІДСТЕЖЕННЯ ↗',
        no_parcels: 'Немає посилок у цій категорії',
        post_section_upcoming: 'Ще не доставлено',
        post_section_delivered: 'Доставлено',
        stats_in_transit: 'в дорозі',
        stats_recent: 'нещодавні',
        stats_letters: 'листи',
        error_no_carriers: 'Не налаштовано жодного перевізника, або жоден із налаштованих сенсорів не знайдено.',
        error_no_carriers_hint: 'Додайте принаймні 1 перевізника з entity_incoming або entity_delivered.',
        editor_title: '📦 Картка посилок від кількох перевізників',
        editor_intro1: 'Додайте одного або кількох перевізників нижче (PostNL, DHL, DPD, ...). Кожен перевізник може мати до 4 сенсорів.',
        editor_intro2: 'Виберіть правильний тип PostNL: PostNL (поточна інтеграція ≥4.x), PostNL (<v4.x, поступово припиняється) або PostNL (ArjenBos, поступово припиняється).',
        section_basic: 'Основні налаштування',
        label_card_title: 'Заголовок картки',
        label_days_back: 'Кількість днів історії доставки',
        section_carriers: 'Перевізники',
        btn_add_carrier: '+ Додати перевізника',
        section_layout: 'Порядок розташування',
        layout_help: 'Використовуйте стрілки, щоб змінити порядок блоків',
        layout_header: 'Заголовок (Назва)',
        layout_animation: 'Анімація / Зображення',
        layout_tabs: 'Вкладки навігації',
        layout_list: 'Список посилок',
        section_display: 'Параметри відображення',
        show_header: 'Показати заголовок',
        show_delivered_tab: 'Показати вкладку "Доставлено"',
        show_sent_tab: 'Показати вкладку "Надіслано"',
        show_letters_tab: 'Показати вкладку "Листи" (потрібен принаймні 1 перевізник із підтримкою листів)',
        show_animation: 'Показати анімацію / детальний перегляд',
        show_placeholder: 'Показати зображення-заповнювач',
        show_tracking_link: 'Показати кнопку відстеження (вимкніть для кіоску / лише сенсорного використання)',
        show_raw_status: 'Показувати власний текст статусу перевізника замість перекладеної мітки',
        custom_name_scope_label: 'Власні назви посилок',
        custom_name_scope_off: 'Вимкнено',
        custom_name_scope_device: 'Лише цей браузер/пристрій',
        custom_name_scope_me: 'Лише для мене',
        custom_name_scope_everyone: 'Для всіх',
        custom_name_scope_help: '«Лише цей браузер/пристрій» ніколи не залишає цей браузер. «Лише для мене» зберігається у вашому обліковому записі Home Assistant і супроводжує вас на всіх ваших пристроях. «Для всіх» зберігається для всього екземпляра, видимо для кожного користувача — додавання або редагування назви за цією опцією вимагає облікового запису адміністратора; назви може бачити будь-хто.',
        sort_order_label: 'Порядок посилок',
        sort_order_auto: 'Автоматично (найближча спочатку, найновіша доставка спочатку)',
        sort_order_newest_first: 'Скрізь найновіша/найвіддаленіша спочатку',
        sort_order_oldest_first: 'Скрізь найстаріша/найближча спочатку',
        sort_order_help: '«Автоматично» (рекомендовано) показує посилку, яка прибуде найшвидше, першою у вкладках В дорозі та Надіслано, а найнещодавніше доставлену посилку першою у вкладці Доставлено. Інші два варіанти фіксують один напрямок скрізь.',
        group_by_carrier: 'Групувати посилки за перевізником (вимкніть для одного плоского списку, відсортованого лише за датою, з перемішаними перевізниками)',
        section_appearance: 'Зовнішній вигляд',
        label_header_color: 'Колір заголовка',
        label_header_text: 'Колір тексту заголовка',
        label_placeholder_img: 'Зображення-заповнювач',
        color_default: 'За замовчуванням',
        color_custom: 'Власний',
        btn_remove_carrier: 'Видалити перевізника',
        label_carrier_name: 'Назва',
        legacy_warning: 'Відтворює оригінальну картку hki-postnl-card: одна сутність із посилками в дорозі та доставленими, плюс окрема сутність для надісланих посилок. Без підтримки листів, без шаблонування сенсорів. Цей режим не отримуватиме подальших оновлень, поки arjenbos/ha-postnl активно не підтримується.',
        label_account: 'Обліковий запис / частина назви сенсора для користувача',
        account_help_suffix: '_incoming_parcels" тощо. 4 сенсори створюються автоматично.',
        gls_account_help: 'GLS не має облікового запису — введіть поштовий індекс вашого хабу GLS (напр. 1234AB, як було встановлено під час додавання інтеграції).',
        dragonfly_account_help: 'Dragonfly не має облікового запису чи поштового індексу — залиште це поле порожнім; сенсори називаються sensor.dragonfly_*.',
        trunkrs_account_help: 'Trunkrs не має облікового запису — введіть поштовий індекс вашого хабу Trunkrs (напр. 1234AB, як було встановлено під час додавання інтеграції).',
        cainiao_account_help: 'Cainiao не має облікового запису чи поштового індексу — залиште це поле порожнім; сенсори називаються sensor.cainiao_*.',
        hermes_account_help: 'Hermes не має облікового запису чи поштового індексу — залиште це поле порожнім; сенсори називаються sensor.hermes_*.',
        packeta_account_help: 'Packeta (Zásilkovna) не має облікового запису чи поштового індексу — залиште це поле порожнім; сенсори називаються sensor.packeta_*.',
        correos_account_help: 'Correos не має облікового запису чи поштового індексу — залиште це поле порожнім; сенсори називаються sensor.correos_*.',
        postnord_account_help: 'PostNord не має облікового запису чи поштового індексу — залиште це поле порожнім; сенсори називаються sensor.postnord_*.',
        sameday_account_help: 'Sameday не має облікового запису чи поштового індексу — залиште це поле порожнім; сенсори називаються sensor.sameday_*.',
        swiss_post_account_help: 'Swiss Post не має облікового запису чи поштового індексу — залиште це поле порожнім; сенсори називаються sensor.swiss_post_*.',
        planzer_account_help: 'Planzer не має облікового запису чи поштового індексу — залиште це поле порожнім; сенсори називаються sensor.planzer_*.',
        austrian_post_account_help: 'Австрійська пошта не має облікового запису чи поштового індексу — залиште це поле порожнім; сенсори називаються sensor.oesterreichische_post_*.',
        helthjem_account_help: 'Helthjem не має облікового запису чи поштового індексу — залиште це поле порожнім; сенсори називаються sensor.helthjem_*.',
        dynalogic_account_help: 'Dynalogic не має облікового запису чи поштового індексу — залиште це поле порожнім; сенсори називаються sensor.dynalogic_*.',
        budbee_account_help: 'Budbee не має облікового запису чи поштового індексу — залиште це поле порожнім; сенсори називаються sensor.budbee_*.',
        nova_post_account_help: 'Nova Post не має облікового запису чи поштового індексу — залиште це поле порожнім; сенсори називаються sensor.nova_post_*.',
        delhivery_account_help: 'Delhivery не має облікового запису чи поштового індексу — залиште це поле порожнім; сенсори називаються sensor.delhivery_*.',
        sunyou_account_help: 'SunYou не має облікового запису чи поштового індексу — залиште це поле порожнім; сенсори називаються sensor.sunyou_*.',
        show_add_parcel: 'Показати "Додати посилку" на картці',
        add_parcel_toggle: '+ Додати посилку',
        add_parcel_carrier: 'Перевізник',
        add_parcel_number: 'Номер відстеження',
        add_parcel_submit: 'Додати',
        add_parcel_busy: 'Додавання...',
        add_parcel_success: 'Посилку додано',
        add_parcel_error: 'Не вдалося додати — перевірте номер.',
        adv_sensors: 'Розширено: ручне перевизначення сенсорів',
        adv_sensors_help: 'Зазвичай вам не потрібно це змінювати. Використовуйте лише якщо ваші сенсори мають нестандартну назву.',
        entity_incoming: 'Сутність В дорозі (вхідні)',
        entity_delivered: 'Сутність Доставлено',
        entity_outgoing: 'Сутність Надіслано (вихідні)',
        entity_outgoing_delivered: 'Сутність Доставлені надіслані (вихідні доставлені)',
        entity_letters: 'Сутність Листи',
        letters_entity_help: 'Зображення сканів листів (сутності image.*) автоматично зіставляються за датою.',
        no_letters_support: 'Листи підтримуються лише для PostNL.',
        no_outgoing_support: 'Надіслані посилки не підтримуються для цього перевізника.',
        adv_appearance: 'Розширено: перевизначення вигляду',
        label_icon: 'Значок (mdi:...)',
        label_color: 'Колір',
        label_logo: 'URL логотипу (необов\'язково)',
        label_van: 'URL GIF транспорту (необов\'язково)',
        label_banner: 'URL банера (необов\'язково, фон при 1 перевізнику)',
        appearance_help: 'Логотип, анімація транспорту та банер уже мають вбудоване значення за замовчуванням для кожного перевізника. Заповніть значення тут, лише якщо хочете його перевизначити.',
        postnl_entity_label: 'Вхідна сутність PostNL',
        postnl_dist_label: 'Вихідна сутність PostNL (необов\'язково)',
        detected_one: 'Виявлено автоматично',
        detected_multiple: 'Знайдено кілька облікових записів — виберіть один',
        detected_none: 'Сенсорів не знайдено — введіть вручну',
        integration_not_found: 'Інтеграцію не знайдено. Спочатку встановіть інтеграцію:',
        no_prefix: '(без префікса облікового запису)',
        detected_badge: 'знайдено',
        label_icon_pick: 'Значок',
        label_color_pick: 'Колір',
        url_logo: 'URL логотипу',
        url_van: 'URL GIF транспорту',
        url_banner: 'URL банера',
        url_placeholder: 'Залиште порожнім, щоб використати значення за замовчуванням',
        url_preview_fail: 'Зображення не знайдено',
        browse_media: 'Огляд',
    },
};
// GENERATED:TRANSLATIONS:END

function getT(lang) {
    const base = (lang || 'en').split('-')[0].toLowerCase();
    return TRANSLATIONS[base] || TRANSLATIONS.en;
}

// ============================================================
// Carrier configuration
// ============================================================

const REPO_BASE = 'https://github.com/jonisnet/hki-parcels-card/blob/main/images';

// Per-carrier asset folders (images/<carrier>/...). Keeps the images directory navigable as
// more carriers are added, instead of one flat folder of prefixed filenames.
const IMG = {
    postnl:    `${REPO_BASE}/postnl`,
    dhl:       `${REPO_BASE}/dhl`,
    dpd:       `${REPO_BASE}/dpd`,
    gls:       `${REPO_BASE}/gls`,
    dragonfly: `${REPO_BASE}/dragonfly`,
    trunkrs:   `${REPO_BASE}/trunkrs`,
    cainiao:   `${REPO_BASE}/cainiao`,
    hermes:    `${REPO_BASE}/hermes`,
    packeta:   `${REPO_BASE}/packeta`,
    correos:   `${REPO_BASE}/correos`,
    vinted_go: `${REPO_BASE}/vinted_go`,
    postnord:      `${REPO_BASE}/postnord`,
    sameday:       `${REPO_BASE}/sameday`,
    swiss_post:    `${REPO_BASE}/swiss_post`,
    planzer:       `${REPO_BASE}/planzer`,
    austrian_post: `${REPO_BASE}/austrian_post`,
    helthjem:  `${REPO_BASE}/helthjem`,
    dynalogic: `${REPO_BASE}/dynalogic`,
    budbee:    `${REPO_BASE}/budbee`,
    nova_post: `${REPO_BASE}/nova_post`,
    delhivery: `${REPO_BASE}/delhivery`,
    sunyou:    `${REPO_BASE}/sunyou`,
};

// Points at the ha-parcel-integrations org, not the individual maintainers' personal repos
// (peternijssen/ha-postnl, peternijssen/ha-dhl-nl, peternijssen/ha-dpd, peternijssen/ha-gls,
// HummelsTech/ha-dragonfly). All of those integrations were moved into the org so they can be
// maintained together and now ship newer releases there than on the old personal forks (e.g.
// peternijssen/ha-gls has had no release at all since the move) — pointing here keeps the
// "integration not found" link in the editor from sending people to a stale/abandoned repo.
const CARRIER_REPO_URLS = {
    postnl_v4: 'https://github.com/ha-parcel-integrations/ha-postnl',
    dhl:       'https://github.com/ha-parcel-integrations/ha-dhl-nl',
    dpd:       'https://github.com/ha-parcel-integrations/ha-dpd',
    gls:       'https://github.com/ha-parcel-integrations/ha-gls',
    dragonfly: 'https://github.com/ha-parcel-integrations/ha-dragonfly',
    trunkrs:   'https://github.com/ha-parcel-integrations/ha-trunkrs',
    cainiao:   'https://github.com/ha-parcel-integrations/ha-cainiao',
    hermes:    'https://github.com/ha-parcel-integrations/ha-hermes',
    packeta:   'https://github.com/ha-parcel-integrations/ha-packeta',
    correos:   'https://github.com/ha-parcel-integrations/ha-correos',
    vinted_go: 'https://github.com/ha-parcel-integrations/ha-vinted-go',
    postnord:      'https://github.com/ha-parcel-integrations/ha-postnord',
    sameday:       'https://github.com/ha-parcel-integrations/ha-sameday',
    swiss_post:    'https://github.com/ha-parcel-integrations/ha-swiss-post',
    planzer:       'https://github.com/ha-parcel-integrations/ha-planzer',
    austrian_post: 'https://github.com/ha-parcel-integrations/ha-oesterreichische-post',
    helthjem:  'https://github.com/ha-parcel-integrations/ha-helthjem',
    dynalogic: 'https://github.com/ha-parcel-integrations/ha-dynalogic',
    budbee:    'https://github.com/ha-parcel-integrations/ha-budbee',
    nova_post: 'https://github.com/ha-parcel-integrations/ha-nova-post',
    delhivery: 'https://github.com/ha-parcel-integrations/ha-delhivery',
    sunyou:    'https://github.com/ha-parcel-integrations/ha-sunyou',
};

const CARRIER_ASSETS = {
    postnl_v4: {
        logo:   `${IMG.postnl}/postnl-logo.png?raw=true`,
        van:    `${IMG.postnl}/postnl-van.gif?raw=true`,
        banner: `${IMG.postnl}/postnl-banner.jpg?raw=true`,
        steps: {
            registered:      `${IMG.postnl}/postnl_step_registered.png?raw=true`,
            registered_mini: `${IMG.postnl}/postnl_step_registered_mini.png?raw=true`,
            sorting:         `${IMG.postnl}/postnl_step_sorting.png?raw=true`,
            transit:         `${IMG.postnl}/postnl_step_transit.png?raw=true`,
            delivered:       `${IMG.postnl}/postnl_step_delivered.png?raw=true`,
            delivered_mini:  `${IMG.postnl}/postnl_step_delivered_mini.png?raw=true`
        }
    },
    postnl: {
        logo:   `${IMG.postnl}/postnl-logo.png?raw=true`,
        van:    `${IMG.postnl}/postnl-van.gif?raw=true`,
        banner: `${IMG.postnl}/postnl-banner.jpg?raw=true`
    },
    dhl: {
        logo:   `${IMG.dhl}/DHL_logo.png?raw=true`,
        van:    `${IMG.dhl}/DHL_van.gif?raw=true`,
        banner: `${IMG.dhl}/DHL_banner.png?raw=true`,
        steps: {
            registered:      `${IMG.dhl}/DHL_step_registered.png?raw=true`,
            registered_mini: `${IMG.dhl}/DHL_step_registered_mini.png?raw=true`,
            sorting:         `${IMG.dhl}/DHL_step_sorting.png?raw=true`,
            transit:         `${IMG.dhl}/DHL_step_transit.png?raw=true`,
            delivered:       `${IMG.dhl}/DHL_step_delivered.png?raw=true`,
            delivered_mini:  `${IMG.dhl}/DHL_step_delivered_mini.png?raw=true`
        }
    },
    dpd: {
        logo:   `${IMG.dpd}/DPD_logo.png?raw=true`,
        van:    `${IMG.dpd}/DPD_van.gif?raw=true`,
        banner: `${IMG.dpd}/DPD_banner.png?raw=true`,
        steps: {
            registered:      `${IMG.dpd}/DPD_step_registered.png?raw=true`,
            registered_mini: `${IMG.dpd}/DPD_step_registered_mini.png?raw=true`,
            sorting:         `${IMG.dpd}/DPD_step_sorting.png?raw=true`,
            transit:         `${IMG.dpd}/DPD_step_transit.png?raw=true`,
            delivered:       `${IMG.dpd}/DPD_step_delivered.png?raw=true`,
            delivered_mini:  `${IMG.dpd}/DPD_step_delivered_mini.png?raw=true`
        }
    },
    gls: {
        logo:   `${IMG.gls}/GLS_logo.png?raw=true`,
        van:    `${IMG.gls}/GLS_van.gif?raw=true`,
        banner: `${IMG.gls}/GLS_banner.png?raw=true`,
        steps: {
            registered:      `${IMG.gls}/GLS_step_registered.png?raw=true`,
            registered_mini: `${IMG.gls}/GLS_step_registered_mini.png?raw=true`,
            sorting:         `${IMG.gls}/GLS_step_sorting.png?raw=true`,
            transit:         `${IMG.gls}/GLS_step_transit.png?raw=true`,
            delivered:       `${IMG.gls}/GLS_step_delivered.png?raw=true`,
            delivered_mini:  `${IMG.gls}/GLS_step_delivered_mini.png?raw=true`
        }
    },
    // Dragonfly art (SVG) lives in images/dragonfly/ on the main repo, added alongside the
    // dragonfly carrier type itself — see CARRIER_PRESETS.dragonfly.
    dragonfly: {
        logo:   `${IMG.dragonfly}/dragonfly-logo.svg?raw=true`,
        van:    `${IMG.dragonfly}/dragonfly-van.gif?raw=true`,
        banner: `${IMG.dragonfly}/dragonfly-banner.png?raw=true`,
        steps: {
            registered:      `${IMG.dragonfly}/dragonfly_step_registered.png?raw=true`,
            registered_mini: `${IMG.dragonfly}/dragonfly_step_registered_mini.png?raw=true`,
            sorting:         `${IMG.dragonfly}/dragonfly_step_sorting.png?raw=true`,
            transit:         `${IMG.dragonfly}/dragonfly_step_transit.png?raw=true`,
            delivered:       `${IMG.dragonfly}/dragonfly_step_delivered.png?raw=true`,
            delivered_mini:  `${IMG.dragonfly}/dragonfly_step_delivered_mini.png?raw=true`
        }
    },
    // Trunkrs/Cainiao art: step icons and the animated van are generated by recolouring the
    // shared GLS master illustration (same technique every other carrier's art already uses —
    // one master drawing, hue-shifted per brand) to each carrier's confirmed accent colour.
    // The logo is the real official logo artwork (trimmed/scaled, transparent background).
    // The banner is a plain-background placeholder built from that same real logo — there's no
    // official banner-style artwork to draw from, so this is the one piece that's still "ours".
    trunkrs: {
        logo:   `${IMG.trunkrs}/TRUNKRS_logo.png?raw=true`,
        van:    `${IMG.trunkrs}/TRUNKRS_van.gif?raw=true`,
        banner: `${IMG.trunkrs}/TRUNKRS_banner.png?raw=true`,
        steps: {
            registered:      `${IMG.trunkrs}/TRUNKRS_step_registered.png?raw=true`,
            registered_mini: `${IMG.trunkrs}/TRUNKRS_step_registered_mini.png?raw=true`,
            sorting:         `${IMG.trunkrs}/TRUNKRS_step_sorting.png?raw=true`,
            transit:         `${IMG.trunkrs}/TRUNKRS_step_transit.png?raw=true`,
            delivered:       `${IMG.trunkrs}/TRUNKRS_step_delivered.png?raw=true`,
            delivered_mini:  `${IMG.trunkrs}/TRUNKRS_step_delivered_mini.png?raw=true`
        }
    },
    cainiao: {
        logo:   `${IMG.cainiao}/CAINIAO_logo.png?raw=true`,
        van:    `${IMG.cainiao}/CAINIAO_van.gif?raw=true`,
        banner: `${IMG.cainiao}/CAINIAO_banner.png?raw=true`,
        steps: {
            registered:      `${IMG.cainiao}/CAINIAO_step_registered.png?raw=true`,
            registered_mini: `${IMG.cainiao}/CAINIAO_step_registered_mini.png?raw=true`,
            sorting:         `${IMG.cainiao}/CAINIAO_step_sorting.png?raw=true`,
            transit:         `${IMG.cainiao}/CAINIAO_step_transit.png?raw=true`,
            delivered:       `${IMG.cainiao}/CAINIAO_step_delivered.png?raw=true`,
            delivered_mini:  `${IMG.cainiao}/CAINIAO_step_delivered_mini.png?raw=true`
        }
    },
    // Hermes art: step icons and the animated van are the shared GLS master illustration
    // hue-shifted to the confirmed brand blue (#008CC3, pixel-sampled from the official logo),
    // with that same real logo (or just its arrow mark, on the smaller badges) composited on.
    // The logo is the real official Hermes wordmark (vector, extracted from myhermes.de).
    hermes: {
        logo:   `${IMG.hermes}/hermes-logo.svg?raw=true`,
        van:    `${IMG.hermes}/hermes-van.gif?raw=true`,
        banner: `${IMG.hermes}/hermes-banner.png?raw=true`,
        steps: {
            registered:      `${IMG.hermes}/hermes_step_registered.png?raw=true`,
            registered_mini: `${IMG.hermes}/hermes_step_registered_mini.png?raw=true`,
            sorting:         `${IMG.hermes}/hermes_step_sorting.png?raw=true`,
            transit:         `${IMG.hermes}/hermes_step_transit.png?raw=true`,
            delivered:       `${IMG.hermes}/hermes_step_delivered.png?raw=true`,
            delivered_mini:  `${IMG.hermes}/hermes_step_delivered_mini.png?raw=true`
        }
    },
    // Packeta art: step icons and the animated van are the shared GLS master illustration
    // hue-shifted to the confirmed brand red (#BA1B02, read off the badge background behind the
    // logo's reversed-white lockup via getComputedStyle on tracking.packeta.com). Packeta has no
    // standalone dark logo — only the white-on-red badge lockup — so the logo/mark art here
    // faithfully reproduces that same red rounded badge rather than inventing a non-canonical
    // dark variant.
    packeta: {
        logo:   `${IMG.packeta}/packeta-logo.svg?raw=true`,
        van:    `${IMG.packeta}/packeta-van.gif?raw=true`,
        banner: `${IMG.packeta}/packeta-banner.png?raw=true`,
        steps: {
            registered:      `${IMG.packeta}/packeta_step_registered.png?raw=true`,
            registered_mini: `${IMG.packeta}/packeta_step_registered_mini.png?raw=true`,
            sorting:         `${IMG.packeta}/packeta_step_sorting.png?raw=true`,
            transit:         `${IMG.packeta}/packeta_step_transit.png?raw=true`,
            delivered:       `${IMG.packeta}/packeta_step_delivered.png?raw=true`,
            delivered_mini:  `${IMG.packeta}/packeta_step_delivered_mini.png?raw=true`
        }
    },
    // Correos art: step icons and the animated van are the shared GLS master illustration
    // hue-shifted to the confirmed brand blue (#00457D, the fill colour in Correos' own official
    // logo SVG). The logo is that same official mark (the crown-and-horn symbol; the 2019 rebrand
    // dropped the "correos" wordmark entirely, so the icon alone is the current real logo).
    correos: {
        logo:   `${IMG.correos}/correos-logo.svg?raw=true`,
        van:    `${IMG.correos}/correos-van.gif?raw=true`,
        banner: `${IMG.correos}/correos-banner.png?raw=true`,
        steps: {
            registered:      `${IMG.correos}/correos_step_registered.png?raw=true`,
            registered_mini: `${IMG.correos}/correos_step_registered_mini.png?raw=true`,
            sorting:         `${IMG.correos}/correos_step_sorting.png?raw=true`,
            transit:         `${IMG.correos}/correos_step_transit.png?raw=true`,
            delivered:       `${IMG.correos}/correos_step_delivered.png?raw=true`,
            delivered_mini:  `${IMG.correos}/correos_step_delivered_mini.png?raw=true`
        }
    },
    // Vinted Go art: step icons and the animated van are the shared GLS master illustration
    // hue-shifted to the confirmed brand teal (#007782, the --primary-default CSS custom property
    // read directly from vintedgo.com's own compiled stylesheet). The logo is Vinted Go's own real
    // "Vinted Go" script wordmark (rasterised from vintedgo.com's /assets/logo.svg, recoloured from
    // white to the confirmed teal).
    vinted_go: {
        logo:   `${IMG.vinted_go}/vinted_go-logo.svg?raw=true`,
        van:    `${IMG.vinted_go}/vinted_go-van.gif?raw=true`,
        banner: `${IMG.vinted_go}/vinted_go-banner.png?raw=true`,
        steps: {
            registered:      `${IMG.vinted_go}/vinted_go_step_registered.png?raw=true`,
            registered_mini: `${IMG.vinted_go}/vinted_go_step_registered_mini.png?raw=true`,
            sorting:         `${IMG.vinted_go}/vinted_go_step_sorting.png?raw=true`,
            transit:         `${IMG.vinted_go}/vinted_go_step_transit.png?raw=true`,
            delivered:       `${IMG.vinted_go}/vinted_go_step_delivered.png?raw=true`,
            delivered_mini:  `${IMG.vinted_go}/vinted_go_step_delivered_mini.png?raw=true`
        }
    },
    // PostNord art: step icons and the animated van are the shared GLS master illustration
    // hue-shifted to the confirmed brand teal (#0098b8, pixel-sampled from PostNord's own logo).
    // The logo is PostNord's own wordmark — no separate pictorial mark exists for this brand.
    postnord: {
        logo:   `${IMG.postnord}/postnord-logo.svg?raw=true`,
        van:    `${IMG.postnord}/postnord-van.gif?raw=true`,
        banner: `${IMG.postnord}/postnord-banner.png?raw=true`,
        steps: {
            registered:      `${IMG.postnord}/postnord_step_registered.png?raw=true`,
            registered_mini: `${IMG.postnord}/postnord_step_registered_mini.png?raw=true`,
            sorting:         `${IMG.postnord}/postnord_step_sorting.png?raw=true`,
            transit:         `${IMG.postnord}/postnord_step_transit.png?raw=true`,
            delivered:       `${IMG.postnord}/postnord_step_delivered.png?raw=true`,
            delivered_mini:  `${IMG.postnord}/postnord_step_delivered_mini.png?raw=true`
        }
    },
    // Sameday art: step icons and the animated van are the shared GLS master illustration
    // hue-shifted to the confirmed brand red (#e82020, pixel-sampled from Sameday's own logo).
    // The logo is Sameday's own shield mark + wordmark.
    sameday: {
        logo:   `${IMG.sameday}/sameday-logo.png?raw=true`,
        van:    `${IMG.sameday}/sameday-van.gif?raw=true`,
        banner: `${IMG.sameday}/sameday-banner.png?raw=true`,
        steps: {
            registered:      `${IMG.sameday}/sameday_step_registered.png?raw=true`,
            registered_mini: `${IMG.sameday}/sameday_step_registered_mini.png?raw=true`,
            sorting:         `${IMG.sameday}/sameday_step_sorting.png?raw=true`,
            transit:         `${IMG.sameday}/sameday_step_transit.png?raw=true`,
            delivered:       `${IMG.sameday}/sameday_step_delivered.png?raw=true`,
            delivered_mini:  `${IMG.sameday}/sameday_step_delivered_mini.png?raw=true`
        }
    },
    // Swiss Post art: step icons and the animated van are the shared GLS master illustration
    // hue-shifted to the confirmed brand yellow (#f8c800, pixel-sampled from Swiss Post's own
    // logo). The logo is Swiss Post's own cross-and-P mark.
    swiss_post: {
        logo:   `${IMG.swiss_post}/swiss_post-logo.svg?raw=true`,
        van:    `${IMG.swiss_post}/swiss_post-van.gif?raw=true`,
        banner: `${IMG.swiss_post}/swiss_post-banner.png?raw=true`,
        steps: {
            registered:      `${IMG.swiss_post}/swiss_post_step_registered.png?raw=true`,
            registered_mini: `${IMG.swiss_post}/swiss_post_step_registered_mini.png?raw=true`,
            sorting:         `${IMG.swiss_post}/swiss_post_step_sorting.png?raw=true`,
            transit:         `${IMG.swiss_post}/swiss_post_step_transit.png?raw=true`,
            delivered:       `${IMG.swiss_post}/swiss_post_step_delivered.png?raw=true`,
            delivered_mini:  `${IMG.swiss_post}/swiss_post_step_delivered_mini.png?raw=true`
        }
    },
    // Planzer art: step icons and the animated van are the shared GLS master illustration
    // hue-shifted to the confirmed brand red (#a00818, pixel-sampled from Planzer's own logo).
    // The logo is Planzer's own wordmark — no separate pictorial mark exists for this brand.
    planzer: {
        logo:   `${IMG.planzer}/planzer-logo.svg?raw=true`,
        van:    `${IMG.planzer}/planzer-van.gif?raw=true`,
        banner: `${IMG.planzer}/planzer-banner.png?raw=true`,
        steps: {
            registered:      `${IMG.planzer}/planzer_step_registered.png?raw=true`,
            registered_mini: `${IMG.planzer}/planzer_step_registered_mini.png?raw=true`,
            sorting:         `${IMG.planzer}/planzer_step_sorting.png?raw=true`,
            transit:         `${IMG.planzer}/planzer_step_transit.png?raw=true`,
            delivered:       `${IMG.planzer}/planzer_step_delivered.png?raw=true`,
            delivered_mini:  `${IMG.planzer}/planzer_step_delivered_mini.png?raw=true`
        }
    },
    // Austrian Post art: step icons and the animated van are the shared GLS master illustration
    // hue-shifted to the confirmed brand gold (#f8d800, pixel-sampled from Austrian Post's own
    // logo). The logo is Austrian Post's own horn mark + "Post" wordmark. HA domain for this
    // integration is oesterreichische_post (see CARRIER_PRESETS.austrian_post.sensor_slug) —
    // the asset/type key stays austrian_post for readability, matching the English carrier name.
    austrian_post: {
        logo:   `${IMG.austrian_post}/austrian_post-logo.svg?raw=true`,
        van:    `${IMG.austrian_post}/austrian_post-van.gif?raw=true`,
        banner: `${IMG.austrian_post}/austrian_post-banner.png?raw=true`,
        steps: {
            registered:      `${IMG.austrian_post}/austrian_post_step_registered.png?raw=true`,
            registered_mini: `${IMG.austrian_post}/austrian_post_step_registered_mini.png?raw=true`,
            sorting:         `${IMG.austrian_post}/austrian_post_step_sorting.png?raw=true`,
            transit:         `${IMG.austrian_post}/austrian_post_step_transit.png?raw=true`,
            delivered:       `${IMG.austrian_post}/austrian_post_step_delivered.png?raw=true`,
            delivered_mini:  `${IMG.austrian_post}/austrian_post_step_delivered_mini.png?raw=true`
        }
    },
    // Helthjem art: step icons and the animated van are the shared GLS master illustration
    // hue-shifted to the confirmed brand orange (#ffb202, the fill colour in Helthjem's own
    // official logo SVG). The logo is Helthjem's own isometric parcel-box mark + wordmark.
    helthjem: {
        logo:   `${IMG.helthjem}/helthjem-logo.svg?raw=true`,
        van:    `${IMG.helthjem}/helthjem-van.gif?raw=true`,
        banner: `${IMG.helthjem}/helthjem-banner.png?raw=true`,
        steps: {
            registered:      `${IMG.helthjem}/helthjem_step_registered.png?raw=true`,
            registered_mini: `${IMG.helthjem}/helthjem_step_registered_mini.png?raw=true`,
            sorting:         `${IMG.helthjem}/helthjem_step_sorting.png?raw=true`,
            transit:         `${IMG.helthjem}/helthjem_step_transit.png?raw=true`,
            delivered:       `${IMG.helthjem}/helthjem_step_delivered.png?raw=true`,
            delivered_mini:  `${IMG.helthjem}/helthjem_step_delivered_mini.png?raw=true`
        }
    },
    // Dynalogic art: step icons and the animated van are the shared GLS master illustration
    // hue-shifted to the confirmed brand orange (#f29920, pixel-sampled from Dynalogic's own
    // logo). The logo is Dynalogic's own "DYNALOG!C" wordmark — no separate pictorial mark
    // exists for this brand, same as PostNord/Planzer.
    dynalogic: {
        logo:   `${IMG.dynalogic}/dynalogic-logo.png?raw=true`,
        van:    `${IMG.dynalogic}/dynalogic-van.gif?raw=true`,
        banner: `${IMG.dynalogic}/dynalogic-banner.png?raw=true`,
        steps: {
            registered:      `${IMG.dynalogic}/dynalogic_step_registered.png?raw=true`,
            registered_mini: `${IMG.dynalogic}/dynalogic_step_registered_mini.png?raw=true`,
            sorting:         `${IMG.dynalogic}/dynalogic_step_sorting.png?raw=true`,
            transit:         `${IMG.dynalogic}/dynalogic_step_transit.png?raw=true`,
            delivered:       `${IMG.dynalogic}/dynalogic_step_delivered.png?raw=true`,
            delivered_mini:  `${IMG.dynalogic}/dynalogic_step_delivered_mini.png?raw=true`
        }
    },
    // Budbee art: step icons and the animated van are the shared GLS master illustration
    // hue-shifted to the confirmed brand mint (#41cda5, pixel-sampled from Budbee's own logo).
    // The logo is Budbee's own wordmark-on-tile lockup (same tile-style treatment as Packeta).
    // Budbee also has a real round "b" avatar mark, used for the step/van badges — see
    // CARRIER_PRESETS.budbee for the one thing that differs from every other account-less
    // carrier here: Budbee tracks outgoing parcels too (supports_outgoing: true).
    budbee: {
        logo:   `${IMG.budbee}/budbee-logo.png?raw=true`,
        van:    `${IMG.budbee}/budbee-van.gif?raw=true`,
        banner: `${IMG.budbee}/budbee-banner.png?raw=true`,
        steps: {
            registered:      `${IMG.budbee}/budbee_step_registered.png?raw=true`,
            registered_mini: `${IMG.budbee}/budbee_step_registered_mini.png?raw=true`,
            sorting:         `${IMG.budbee}/budbee_step_sorting.png?raw=true`,
            transit:         `${IMG.budbee}/budbee_step_transit.png?raw=true`,
            delivered:       `${IMG.budbee}/budbee_step_delivered.png?raw=true`,
            delivered_mini:  `${IMG.budbee}/budbee_step_delivered_mini.png?raw=true`
        }
    },
    // Nova Post art: step icons and the animated van are the shared GLS master illustration
    // hue-shifted to the confirmed brand red (#ed1c24, matching the official Wikimedia SVG and
    // the repo's own bundled brand icon). The mark badge reuses Nova Post's real red diamond
    // arrows/"H" icon, cropped from the integration's own brand asset — a genuine icon-only
    // mark exists for this brand, unlike PostNord/Planzer/Dynalogic.
    nova_post: {
        logo:   `${IMG.nova_post}/nova_post-logo.png?raw=true`,
        van:    `${IMG.nova_post}/nova_post-van.gif?raw=true`,
        banner: `${IMG.nova_post}/nova_post-banner.png?raw=true`,
        steps: {
            registered:      `${IMG.nova_post}/nova_post_step_registered.png?raw=true`,
            registered_mini: `${IMG.nova_post}/nova_post_step_registered_mini.png?raw=true`,
            sorting:         `${IMG.nova_post}/nova_post_step_sorting.png?raw=true`,
            transit:         `${IMG.nova_post}/nova_post_step_transit.png?raw=true`,
            delivered:       `${IMG.nova_post}/nova_post_step_delivered.png?raw=true`,
            delivered_mini:  `${IMG.nova_post}/nova_post_step_delivered_mini.png?raw=true`
        }
    },
    // Delhivery art: step icons and the animated van are the shared GLS master illustration
    // hue-shifted to the confirmed brand red (#ed1b36, pixel-sampled from the integration's own
    // bundled brand icon). Delhivery's real logo is a pure wordmark with no separate icon-only
    // mark, so the badge uses a bold "D" letterform, same treatment as Budbee's fallback style.
    // The banner is Delhivery's real black wordmark (with its red accent squares) on white.
    delhivery: {
        logo:   `${IMG.delhivery}/delhivery-logo.png?raw=true`,
        van:    `${IMG.delhivery}/delhivery-van.gif?raw=true`,
        banner: `${IMG.delhivery}/delhivery-banner.png?raw=true`,
        steps: {
            registered:      `${IMG.delhivery}/delhivery_step_registered.png?raw=true`,
            registered_mini: `${IMG.delhivery}/delhivery_step_registered_mini.png?raw=true`,
            sorting:         `${IMG.delhivery}/delhivery_step_sorting.png?raw=true`,
            transit:         `${IMG.delhivery}/delhivery_step_transit.png?raw=true`,
            delivered:       `${IMG.delhivery}/delhivery_step_delivered.png?raw=true`,
            delivered_mini:  `${IMG.delhivery}/delhivery_step_delivered_mini.png?raw=true`
        }
    },
    // SunYou art: step icons and the animated van are the shared GLS master illustration
    // hue-shifted to the confirmed brand green (#29a03a, pixel-sampled from SunYou's own
    // "SUNYOU" wordmark logo — the "YOU" half and the swoosh accent). No separate icon-only
    // mark exists for this brand, so the badge uses the swoosh motif from the real logo.
    // The banner is SunYou's real two-tone (blue/green) wordmark logo centered on white.
    sunyou: {
        logo:   `${IMG.sunyou}/sunyou-logo.png?raw=true`,
        van:    `${IMG.sunyou}/sunyou-van.gif?raw=true`,
        banner: `${IMG.sunyou}/sunyou-banner.png?raw=true`,
        steps: {
            registered:      `${IMG.sunyou}/sunyou_step_registered.png?raw=true`,
            registered_mini: `${IMG.sunyou}/sunyou_step_registered_mini.png?raw=true`,
            sorting:         `${IMG.sunyou}/sunyou_step_sorting.png?raw=true`,
            transit:         `${IMG.sunyou}/sunyou_step_transit.png?raw=true`,
            delivered:       `${IMG.sunyou}/sunyou_step_delivered.png?raw=true`,
            delivered_mini:  `${IMG.sunyou}/sunyou_step_delivered_mini.png?raw=true`
        }
    },
    postnl_legacy: {
        logo:   `${IMG.postnl}/postnl-logo.png?raw=true`,
        van:    `${IMG.postnl}/postnl-van.gif?raw=true`,
        banner: `${IMG.postnl}/postnl-banner.jpg?raw=true`
    },
    custom: { logo: null, van: null, banner: null }
};

// Canonical parcel-status happy path, mapped to a 1-based step index.
// Statuses outside this set (at_pickup_point, returning, problem, unknown) fall
// back to the plain van/chip + status-text treatment rather than the step tracker.
const STATUS_STEP_ORDER = ['registered', 'in_transit', 'out_for_delivery', 'delivered'];

const CARRIER_PRESETS = {
    postnl_v4:    { label: 'PostNL',                    icon: 'mdi:package-variant-closed', color: '#ed8c00', schema: 'canonical',     supports_letters: true,  sensor_slug: 'postnl' },
    postnl:       { label: 'PostNL (<v4.x)',             icon: 'mdi:package-variant-closed', color: '#ed8c00', schema: 'legacy',        supports_letters: true,  sensor_slug: 'postnl' },
    dhl:          { label: 'DHL',                        icon: 'mdi:package-variant-closed', color: '#ffcc00', schema: 'canonical',     supports_letters: false, sensor_slug: 'dhl'    },
    dpd:          { label: 'DPD',                        icon: 'mdi:package-variant-closed', color: '#dc0032', schema: 'canonical',     supports_letters: false, sensor_slug: 'dpd',
                    // outgoing_delivered intentionally has no override here (unlike the
                    // other slots): peternijssen/ha-dpd added its own
                    // outgoing_delivered_parcels sensor after this preset was written, so
                    // it now falls through to the generic guess + CANONICAL_SUFFIXES
                    // fallback like every other carrier without a specific override — do
                    // not hardcode it back to `null` ("unsupported"), that was only ever
                    // true historically.
                    slug_first_suffixes: { incoming: 'binnenkomende_pakketten', delivered: 'bezorgde_pakketten', outgoing: 'uitgaande_pakketten', letters: null } },
    // Account-based like postnl_v4/dhl/dpd above (e-mail + verification-link login, no password,
    // no tracking-code entry) — so there's no track_parcel_service and no "+ Add parcel" control
    // for this carrier. Brand colour #007782 is the --primary-default CSS custom property read
    // directly from vintedgo.com's own compiled stylesheet (rgb(0,119,130); the darker
    // --primary-dark rgb(0,70,84)/#004654 is used for their header background). Unlike every other
    // account-less carrier below, Vinted Go tracks both incoming and outgoing parcels
    // (supports_outgoing: true) and has no next_delivery/ETA sensor at all.
    vinted_go:    { label: 'Vinted Go',                  icon: 'mdi:package-variant-closed', color: '#007782', schema: 'canonical',     supports_letters: false, supports_outgoing: true,  sensor_slug: 'vinted_go' },
    // gls / dragonfly / trunkrs / cainiao / hermes / packeta / correos are all account-less carriers from the same
    // ha-parcel-integrations family: one "hub" (global, or per postal code for gls/trunkrs)
    // holds a dynamically managed list of tracked parcels, added either through the
    // integration's own Options dialog or by calling its `<domain>.track_parcel` service —
    // which is exactly what `track_parcel_service` below wires up to the card's own
    // "+ Add parcel" control (see _getTrackableCarriers()/_submitAddParcel() on the card).
    // `field` is the service's tracking-number parameter name (it differs per integration);
    // `supports_postal_code` means the service also accepts an optional `postal_code` to pick
    // the right hub when more than one is configured — the card passes the carrier's own
    // `user` value (which for these carriers IS the postal code, see gls/trunkrs_account_help).
    gls:          { label: 'GLS',                        icon: 'mdi:package-variant-closed', color: '#061ab1', schema: 'canonical',     supports_letters: false, supports_outgoing: false, sensor_slug: 'gls',
                    track_parcel_service: { domain: 'gls', field: 'tracking_code', supports_postal_code: true } },
    // Brand colour confirmed by pixel-sampling the official Dragonfly wordmark (teal, #00a78f).
    dragonfly:    { label: 'Dragonfly',                  icon: 'mdi:package-variant-closed', color: '#00a78f', schema: 'canonical',     supports_letters: false, supports_outgoing: false, sensor_slug: 'dragonfly',
                    track_parcel_service: { domain: 'dragonfly', field: 'tracking_code', supports_postal_code: false } },
    // Brand colour confirmed by pixel-sampling the official Trunkrs logo: the wordmark itself is
    // a dark navy/indigo (#220c4a), with a bright mint-green (#2ce27e) accent shape. The green is
    // used here as the UI accent (chips, borders, "+ Add parcel" button) since it's the more
    // legible/vivid of the two against the card's light and dark themes — same role the accent
    // colour plays for every other carrier.
    trunkrs:      { label: 'Trunkrs',                    icon: 'mdi:package-variant-closed', color: '#2ce27e', schema: 'canonical',     supports_letters: false, supports_outgoing: false, sensor_slug: 'trunkrs',
                    track_parcel_service: { domain: 'trunkrs', field: 'tracking_code', supports_postal_code: true } },
    // Brand colour confirmed by pixel-sampling the official Cainiao logo (#0066ff) — matches the
    // "Brandeis Blue" value from https://www.schemecolor.com/cainiao-logo-color.php exactly.
    cainiao:      { label: 'Cainiao',                    icon: 'mdi:package-variant-closed', color: '#0066ff', schema: 'canonical',     supports_letters: false, supports_outgoing: false, sensor_slug: 'cainiao',
                    track_parcel_service: { domain: 'cainiao', field: 'tracking_code', supports_postal_code: false } },
    // Brand colour confirmed by pixel-sampling the official Hermes (Germany) logo (#008CC3).
    hermes:       { label: 'Hermes',                     icon: 'mdi:package-variant-closed', color: '#008cc3', schema: 'canonical',     supports_letters: false, supports_outgoing: false, sensor_slug: 'hermes',
                    track_parcel_service: { domain: 'hermes', field: 'tracking_code', supports_postal_code: false } },
    // Brand colour read off the badge background behind Packeta's white logo lockup
    // (getComputedStyle on the styled ancestor, tracking.packeta.com) — #BA1B02.
    packeta:      { label: 'Packeta',                    icon: 'mdi:package-variant-closed', color: '#ba1b02', schema: 'canonical',     supports_letters: false, supports_outgoing: false, sensor_slug: 'packeta',
                    track_parcel_service: { domain: 'packeta', field: 'tracking_code', supports_postal_code: false } },
    // Brand colour confirmed from Correos' own official logo SVG (Wikimedia-hosted, single fill
    // #00457D) — the 2019 rebrand's icon-only mark, no separate wordmark exists any more.
    correos:      { label: 'Correos',                    icon: 'mdi:package-variant-closed', color: '#00457d', schema: 'canonical',     supports_letters: false, supports_outgoing: false, sensor_slug: 'correos',
                    track_parcel_service: { domain: 'correos', field: 'tracking_code', supports_postal_code: false } },
    // Brand colour confirmed by pixel-sampling the official PostNord wordmark (teal, #0098b8).
    postnord:     { label: 'PostNord',                   icon: 'mdi:package-variant-closed', color: '#0098b8', schema: 'canonical',     supports_letters: false, supports_outgoing: false, sensor_slug: 'postnord',
                    track_parcel_service: { domain: 'postnord', field: 'tracking_code', supports_postal_code: false } },
    // Brand colour confirmed by pixel-sampling the official Sameday logo (red, #e82020).
    sameday:      { label: 'Sameday',                    icon: 'mdi:package-variant-closed', color: '#e82020', schema: 'canonical',     supports_letters: false, supports_outgoing: false, sensor_slug: 'sameday',
                    track_parcel_service: { domain: 'sameday', field: 'tracking_code', supports_postal_code: false } },
    // Brand colour confirmed by pixel-sampling the official Swiss Post logo (yellow, #f8c800).
    swiss_post:   { label: 'Swiss Post',                 icon: 'mdi:package-variant-closed', color: '#f8c800', schema: 'canonical',     supports_letters: false, supports_outgoing: false, sensor_slug: 'swiss_post',
                    track_parcel_service: { domain: 'swiss_post', field: 'tracking_code', supports_postal_code: false } },
    // Brand colour confirmed by pixel-sampling the official Planzer wordmark (red, #a00818).
    planzer:      { label: 'Planzer',                    icon: 'mdi:package-variant-closed', color: '#a00818', schema: 'canonical',     supports_letters: false, supports_outgoing: false, sensor_slug: 'planzer',
                    track_parcel_service: { domain: 'planzer', field: 'tracking_code', supports_postal_code: false } },
    // Brand colour confirmed by pixel-sampling the official Austrian Post horn mark (gold,
    // #f8d800). HA domain is oesterreichische_post — sensor_slug/track_parcel_service.domain
    // must match that, even though the carrier type key here is the readable austrian_post.
    austrian_post:{ label: 'Austrian Post',               icon: 'mdi:package-variant-closed', color: '#f8d800', schema: 'canonical',     supports_letters: false, supports_outgoing: false, sensor_slug: 'oesterreichische_post',
                    track_parcel_service: { domain: 'oesterreichische_post', field: 'tracking_code', supports_postal_code: false } },
    // Brand colour confirmed from the fill value in Helthjem's own logo SVG (orange, #ffb202).
    helthjem:     { label: 'Helthjem',                   icon: 'mdi:package-variant-closed', color: '#ffb202', schema: 'canonical',     supports_letters: false, supports_outgoing: false, sensor_slug: 'helthjem',
                    track_parcel_service: { domain: 'helthjem', field: 'tracking_code', supports_postal_code: false } },
    // Brand colour confirmed by pixel-sampling the official Dynalogic wordmark (orange, #f29920 —
    // the leading/dominant colour; the logo's other colour, slate #66839c, was the alternative).
    // postal_code is an optional field on this carrier's track_parcel service (a lookup aid, not
    // an account/hub selector like GLS) — the card has nothing to send there, so left unsupported.
    dynalogic:    { label: 'Dynalogic',                  icon: 'mdi:package-variant-closed', color: '#f29920', schema: 'canonical',     supports_letters: false, supports_outgoing: false, sensor_slug: 'dynalogic',
                    track_parcel_service: { domain: 'dynalogic', field: 'tracking_code', supports_postal_code: false } },
    // Brand colour confirmed by pixel-sampling the official Budbee round avatar mark (mint,
    // #41cda5). Unlike every other carrier in this account-less group, Budbee tracks outgoing
    // parcels too (has real outgoing_parcels/outgoing_delivered_parcels sensors upstream).
    budbee:       { label: 'Budbee',                     icon: 'mdi:package-variant-closed', color: '#41cda5', schema: 'canonical',     supports_letters: false, supports_outgoing: true,  sensor_slug: 'budbee',
                    track_parcel_service: { domain: 'budbee', field: 'tracking_code', supports_postal_code: false } },
    // Brand colour confirmed against the official Wikimedia SVG and the repo's own bundled
    // brand icon (#ed1c24). Nova Post is Ukraine's largest private courier network.
    nova_post:    { label: 'Nova Post',                  icon: 'mdi:package-variant-closed', color: '#ed1c24', schema: 'canonical',     supports_letters: false, supports_outgoing: false, sensor_slug: 'nova_post',
                    track_parcel_service: { domain: 'nova_post', field: 'tracking_code', supports_postal_code: false } },
    // Brand colour pixel-sampled from the repo's own bundled brand icon (#ed1b36) — genuinely
    // close to Nova Post's red, confirmed as a real coincidence of two red-branded carriers
    // researched in the same batch, not a modeling error. Delhivery is an Indian logistics company.
    delhivery:    { label: 'Delhivery',                  icon: 'mdi:package-variant-closed', color: '#ed1b36', schema: 'canonical',     supports_letters: false, supports_outgoing: false, sensor_slug: 'delhivery',
                    track_parcel_service: { domain: 'delhivery', field: 'tracking_code', supports_postal_code: false } },
    // Brand colour pixel-sampled from SunYou's own "SUNYOU" wordmark logo (#29a03a, the "YOU"
    // half and swoosh accent — the logo is two-tone blue/green, green chosen as the more
    // prominent accent colour). SunYou (SYPost) is a China-based cross-border courier.
    sunyou:       { label: 'SunYou',                     icon: 'mdi:package-variant-closed', color: '#29a03a', schema: 'canonical',     supports_letters: false, supports_outgoing: false, sensor_slug: 'sunyou',
                    track_parcel_service: { domain: 'sunyou', field: 'tracking_code', supports_postal_code: false } },
    postnl_legacy:{ label: 'PostNL (ArjenBos)',          icon: 'mdi:package-variant-closed', color: '#ed8c00', schema: 'single_entity', supports_letters: false, sensor_slug: null     },
    custom:       { label: 'Custom',                     icon: 'mdi:package-variant-closed', color: '#ed8c00', schema: 'canonical',     supports_letters: false, sensor_slug: null     }
};

function slugifyUserSlug(text) {
    return String(text || '')
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, '_')
        .replace(/^_+|_+$/g, '');
}

// Universal English/Dutch suffix alternates for each entity slot, tried by
// every carrier on top of any carrier-specific override (e.g. DPD's own
// word choices in slug_first_suffixes — those still take priority as the
// primary guess, this is just an extra safety net). Needed because:
// - a has_entity_name entity's entity_id is derived from whatever language
//   HA was displaying when it was first created, not from the (English)
//   translation_key — so the exact same integration code can produce an
//   English or a Dutch suffix depending on the install.
// - some integrations (seen on DHL and PostNL) keep legacy
//   pre-has_entity_name sensors in one prefix ordering while brand-new
//   ones land in the current <device-name-slug>_<entity-name-slug>
//   ("slug first") ordering, within the very same account — so language
//   AND ordering can each vary independently per sensor, not just per carrier.
const CANONICAL_SUFFIXES = {
    // 'binnenkomende_pakketten' is a legacy Dutch translation string — several
    // ha-parcel-integrations carriers used to translate "incoming_parcels" this way and later
    // renamed the display text to "Inkomende pakketten", but Home Assistant never renames an
    // entity_id to match a changed translation, so any account set up before that rename keeps
    // the old entity_id forever. DPD's own preset already special-cased this (see
    // CARRIER_PRESETS.dpd.slug_first_suffixes), but the same staleness bit DHL too (confirmed
    // via a live user report — jonisnet/hki-parcels-card#8 — entity_id
    // sensor.dhl_<user>_binnenkomende_pakketten, current translations/nl.json says "Inkomende
    // pakketten" for the exact same key), so it belongs here rather than as a
    // one-off per-carrier fix: any carrier could have pre-rename accounts still around.
    incoming:           ['incoming_parcels', 'inkomende_pakketten', 'binnenkomende_pakketten'],
    delivered:          ['delivered_parcels', 'bezorgde_pakketten'],
    outgoing:           ['outgoing_parcels', 'uitgaande_pakketten'],
    outgoing_delivered: ['outgoing_delivered_parcels', 'delivered_outgoing_parcels', 'bezorgde_uitgaande_pakketten', 'uitgaande_bezorgde_pakketten'],
    letters:            ['letters', 'brieven'],
};

// Real Home Assistant integration domain per carrier type, when it differs from
// CARRIER_PRESETS[type].sensor_slug (which exists to build entity_id text guesses,
// not to name the actual integration). Only DHL differs today (domain dhl_nl,
// sensor_slug 'dhl' kept for entity_id-guessing/backward compatibility) — confirmed
// against each integration's own custom_components folder name, not assumed. Used
// by the translation_key registry lookup below, which needs the real platform value.
const PLATFORM_DOMAIN = { dhl: 'dhl_nl' };

// Groups a carrier's sensor entities by device, keyed off Home Assistant's own
// (unlocalized) translation_key rather than guessed entity_id text — this is what
// makes account/entity detection actually language-proof. Background: a
// has_entity_name entity's entity_id suffix is derived from whatever language the
// HA frontend was displaying when the entity was first created, not from its
// (always-English) translation_key — CANONICAL_SUFFIXES below patches specific
// known words (English/Dutch) onto that guess, but that only ever covers
// languages someone thought to add. A German-language GLS account broke the card
// outright (jonisnet/hki-parcels-card#14 — reported via
// ha-parcel-integrations/.github#3) because "eingehende Pakete" wasn't on that
// list; the next new language would have broken it again. translation_key never
// changes with locale, so matching on it sidesteps the whole problem instead of
// extending the word list forever. Requires `hass.entities` (the lightweight
// frontend entity-registry cache, standard on modern Home Assistant) — returns an
// empty map when unavailable, so callers fall back to the text-guessing path.
function registryEntitiesByDevice(hass, domain) {
    const byDevice = new Map();
    if (!hass?.entities) return byDevice;
    for (const [entityId, entry] of Object.entries(hass.entities)) {
        if (!entityId.startsWith('sensor.')) continue;
        if (entry.platform !== domain) continue;
        const key = entry.device_id || entityId;
        if (!byDevice.has(key)) byDevice.set(key, []);
        byDevice.get(key).push({ entityId, translationKey: entry.translation_key });
    }
    return byDevice;
}

// Builds a candidate entity_id and, when `hass` is available, verifies it
// against real state before accepting it. Tries the primary guess
// (`base` + `suffix`) first, then `base` + every alternate in
// `preset.translated_suffixes[slotKey]` (carrier-specific, if any) and
// `CANONICAL_SUFFIXES[slotKey]` (universal), then repeats all of that
// against `altBase` — the *other* prefix/slug ordering. Falls back to the
// primary guess as a placeholder when nothing matches (fresh install,
// sensor not created yet).
function resolveEntityId(hass, base, altBase, slotKey, suffix, preset) {
    const guess = `sensor.${base}_${suffix}`;
    if (!hass?.states) return guess;

    const suffixes = [suffix, ...(preset.translated_suffixes?.[slotKey] || []), ...(CANONICAL_SUFFIXES[slotKey] || [])];
    for (const b of [base, altBase]) {
        for (const suf of suffixes) {
            const candidate = `sensor.${b}_${suf}`;
            if (hass.states[candidate]) return candidate;
        }
    }
    // Nothing matched exactly — before giving up, check for Home Assistant's own
    // disambiguation suffix (_2, _3, ...), appended automatically when this
    // entity_id would otherwise collide with one already in the registry (e.g.
    // a stale sensor left over from a reinstall). See detectCarrierUsers() above
    // for the matching tolerance on the "which account exists" side of this.
    for (const b of [base, altBase]) {
        for (const suf of suffixes) {
            const pattern = new RegExp(`^sensor\\.${b}_${suf}_\\d+$`);
            const candidate = Object.keys(hass.states).find(id => pattern.test(id));
            if (candidate) return candidate;
        }
    }
    return guess;
}

// `deviceId`, when given (from a registry-detected account — see
// detectCarrierUsers/registryEntitiesByDevice above), resolves every slot by
// translation_key within that device instead of guessing entity_id text at all;
// this is what actually fixes the "unknown language" case, since there's no
// suffix word to guess in the first place. Omit it (the default, for manually
// typed/edited `user` values with no known device) to keep the original
// text-guessing behaviour exactly as before.
function buildTemplatedEntities(user, carrierType, slugFirst = false, hass = null, deviceId = null) {
    const preset = CARRIER_PRESETS[carrierType] || CARRIER_PRESETS.custom;
    const slug = preset.sensor_slug;
    if (!slug) {
        return { entity_incoming: null, entity_delivered: null, entity_outgoing: null, entity_outgoing_delivered: null, entity_letters: null };
    }
    if (deviceId && hass?.entities) {
        const domain = PLATFORM_DOMAIN[carrierType] || slug;
        const entities = registryEntitiesByDevice(hass, domain).get(deviceId) || [];
        const byKey = (key) => entities.find(e => e.translationKey === key)?.entityId || null;
        return {
            entity_incoming:           byKey('incoming_parcels'),
            entity_delivered:          byKey('delivered_parcels'),
            entity_outgoing:           preset.supports_outgoing !== false ? byKey('outgoing_parcels') : null,
            entity_outgoing_delivered: preset.supports_outgoing !== false ? byKey('outgoing_delivered_parcels') : null,
            entity_letters:            preset.supports_letters ? byKey('letters') : null
        };
    }
    const u = slugifyUserSlug(user);
    const userFirstBase = u ? `${u}_${slug}` : slug;
    const slugFirstBase = u ? `${slug}_${u}` : slug;
    // slugFirst: sensor.<slug>_<user>_* (e.g. sensor.dpd_keesb_binnenkomende_pakketten)
    // userFirst: sensor.<user>_<slug>_* or sensor.<slug>_* when no prefix
    if (slugFirst && u) {
        const sf = preset.slug_first_suffixes;
        const s = (key, fallback) => sf?.[key] != null
            ? resolveEntityId(hass, slugFirstBase, userFirstBase, key, sf[key], preset)
            : (sf?.[key] === null ? null : resolveEntityId(hass, slugFirstBase, userFirstBase, key, fallback, preset));
        return {
            entity_incoming:          s('incoming',          'incoming_parcels'),
            entity_delivered:         s('delivered',         'delivered_parcels'),
            entity_outgoing:          preset.supports_outgoing !== false ? s('outgoing',          'outgoing_parcels') : null,
            entity_outgoing_delivered:preset.supports_outgoing !== false ? s('outgoing_delivered','outgoing_delivered_parcels') : null,
            entity_letters: preset.supports_letters ? s('letters', 'letters') : null
        };
    }
    return {
        entity_incoming:          resolveEntityId(hass, userFirstBase, slugFirstBase, 'incoming', 'incoming_parcels', preset),
        entity_delivered:         resolveEntityId(hass, userFirstBase, slugFirstBase, 'delivered', 'delivered_parcels', preset),
        entity_outgoing:          preset.supports_outgoing !== false ? resolveEntityId(hass, userFirstBase, slugFirstBase, 'outgoing', 'outgoing_parcels', preset) : null,
        entity_outgoing_delivered:preset.supports_outgoing !== false ? resolveEntityId(hass, userFirstBase, slugFirstBase, 'outgoing_delivered', 'outgoing_delivered_parcels', preset) : null,
        entity_letters: preset.supports_letters ? resolveEntityId(hass, userFirstBase, slugFirstBase, 'letters', 'letters', preset) : null
    };
}

// Returns { user, slugFirst, deviceId }[] for all detected accounts of a carrier
// type. Tries every known "incoming" suffix — the carrier's own override (if any)
// plus the universal English/Dutch alternates in CANONICAL_SUFFIXES — against
// both "sensor.<user>_<slug>_<suffix>" and "sensor.<slug>_<user>_<suffix>",
// since language and prefix ordering can each vary independently per sensor
// (see CANONICAL_SUFFIXES / resolveEntityId above). Module-level (not tied to
// the editor instance) so both the editor's account-detection UI and
// HkiParcelsCard.getStubConfig() (auto-populating carriers on first add) can
// use it.
//
// After that text-based pass, also runs a translation_key-based pass via
// registryEntitiesByDevice() and adds any account it finds that the text pass
// missed — this is what catches a suffix word in a language CANONICAL_SUFFIXES
// doesn't know about (see that function's comment for the full story). Entries
// found this way carry a non-null `deviceId`; pass it on to
// buildTemplatedEntities() to resolve their actual entity_ids by translation_key
// too, since there's no reliable suffix text to guess for them in the first
// place. `user` for these is best-effort (the device's own display name,
// slugified) — cosmetic only, it doesn't feed back into any suffix guess.
function detectCarrierUsers(hass, carrierType) {
    if (!hass) return [];
    const preset = CARRIER_PRESETS[carrierType];
    if (!preset?.sensor_slug) return [];
    const slug = preset.sensor_slug;
    const incomingSuffixes = [
        ...(preset.slug_first_suffixes?.incoming != null ? [preset.slug_first_suffixes.incoming] : []),
        ...CANONICAL_SUFFIXES.incoming,
    ];
    // Trailing (?:_\d+)? tolerates Home Assistant's own disambiguation suffix
    // (_2, _3, ...), which it appends automatically when an entity_id would
    // otherwise collide with one already in the registry — e.g. a stale sensor
    // left over from a reinstall. Without this, that one carrier's entities
    // silently fail every pattern and fall back to "no sensors found", even
    // though the sensor is real and works fine when entered manually.
    const patterns = incomingSuffixes.map(suffix => ({
        userFirst: new RegExp(`^sensor\\.(.+)_${slug}_${suffix}(?:_\\d+)?$`),
        slugFirst: new RegExp(`^sensor\\.${slug}_(.+)_${suffix}(?:_\\d+)?$`),
        noPrefix:  new RegExp(`^sensor\\.${slug}_${suffix}(?:_\\d+)?$`),
    }));
    const seen = new Map(); // user → slugFirst
    const claimed = new Set(); // entity_ids already matched by the text-based pass
    for (const entityId of Object.keys(hass.states)) {
        for (const { userFirst, slugFirst, noPrefix } of patterns) {
            const m1 = userFirst.exec(entityId);
            if (m1 && !seen.has(m1[1])) { seen.set(m1[1], false); claimed.add(entityId); break; }
            const m2 = slugFirst.exec(entityId);
            if (m2 && !seen.has(m2[1])) { seen.set(m2[1], true); claimed.add(entityId); break; }
            if (noPrefix.test(entityId) && !seen.has('')) { seen.set('', false); claimed.add(entityId); break; }
        }
    }
    const results = [...seen.entries()].map(([user, slugFirst]) => ({ user, slugFirst, deviceId: null }));

    const domain = PLATFORM_DOMAIN[carrierType] || slug;
    let anonCount = 0;
    for (const [deviceId, entities] of registryEntitiesByDevice(hass, domain)) {
        const incoming = entities.find(e => e.translationKey === 'incoming_parcels');
        if (!incoming || claimed.has(incoming.entityId)) continue; // already found by the text pass
        const deviceName = hass.devices?.[deviceId]?.name_by_user || hass.devices?.[deviceId]?.name;
        const user = deviceName ? slugifyUserSlug(deviceName) : `account${++anonCount}`;
        results.push({ user, slugFirst: false, deviceId });
    }
    return results;
}

// The carrier types offered for auto-population when the card is first added
// (HkiParcelsCard.getStubConfig). Excludes postnl (legacy v3.x — same
// sensor_slug as postnl_v4, so detection can't tell them apart; v4 is the
// recommended default and the user can switch the type manually if they're
// still on v3.x) and postnl_legacy / custom (sensor_slug is null — no
// entity-based detection is possible for those).
const AUTO_DETECT_CARRIER_TYPES = ['postnl_v4', 'dhl', 'dpd', 'vinted_go', 'gls', 'dragonfly', 'trunkrs', 'cainiao', 'hermes', 'packeta', 'correos', 'postnord', 'sameday', 'swiss_post', 'planzer', 'austrian_post', 'helthjem', 'dynalogic', 'budbee', 'nova_post', 'delhivery', 'sunyou'];

// Infers a sensible days_back for a freshly auto-populated card: the number
// of days since the oldest currently-visible delivered parcel, across every
// detected carrier's delivered sensor, whichever is largest. This is an
// approximation, not the integration's own configured delivered-filter
// setting — a Lovelace card has no supported way to read another
// integration's stored config-entry options (that only lives in its own
// options-flow, not in any entity state/attribute a card can see). Falls
// back to 90 (the long-standing static default) when nothing is known yet
// (fresh accounts with no delivered history, or hass unavailable).
function inferDaysBack(hass, carriers) {
    const DEFAULT_DAYS_BACK = 90;
    if (!hass?.states) return DEFAULT_DAYS_BACK;
    const now = Date.now();
    let maxDays = 0;
    for (const carrier of carriers) {
        const stateObj = hass.states[carrier.entity_delivered];
        for (const parcel of stateObj?.attributes?.parcels || []) {
            if (!parcel?.delivered_at) continue;
            const deliveredMs = Date.parse(parcel.delivered_at);
            if (Number.isNaN(deliveredMs)) continue;
            const daysAgo = Math.ceil((now - deliveredMs) / 86400000);
            if (daysAgo > maxDays) maxDays = daysAgo;
        }
    }
    return maxDays > 0 ? maxDays : DEFAULT_DAYS_BACK;
}

// Both lowercase (DHL/DPD) and uppercase (ha-postnl v4.x) enum values are accepted.
const CANONICAL_DELIVERED_STATUSES = new Set(['delivered', 'DELIVERED']);

// ============================================================
// Card
// ============================================================

class HkiParcelsCard extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this._activeTab = 'onderweg';
        this._selectedParcel = null;
        this._editingNameKey = null;
        this._isRendered = false;
        // "+ Add parcel" mini-form state (see _renderAddParcelForm / _submitAddParcel).
        this._addParcelOpen = false;
        this._addParcelCarrierIndex = 0;
        this._addParcelValue = '';
        this._addParcelBusy = false;
        this._addParcelMessage = null;
    }

    // Shorthand: resolve a translation key using hass.language.
    _t(key) {
        return getT(this._hass?.language)[key] || key;
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
            title: 'Parcels',
            days_back: 90,
            show_delivered: true,
            show_sent: true,
            show_letters: true,
            show_animation: true,
            show_header: true,
            show_placeholder: true,
            show_tracking_link: true,
            show_add_parcel: true,
            custom_name_scope: 'everyone',
            sort_order: 'auto',
            group_by_carrier: true,
            header_color: '',
            header_text_color: '',
            placeholder_image: DEFAULT_PLACEHOLDER_IMAGE,
            carriers: [],
            layout_order: ['header', 'animation', 'tabs', 'list'],
            ...config
        };
        if (!Array.isArray(this.config.carriers)) this.config.carriers = [];
        if (!Array.isArray(this.config.layout_order) || this.config.layout_order.length === 0) {
            this.config.layout_order = ['header', 'animation', 'tabs', 'list'];
        }
        if (this._hass) this.render();
    }

    static getConfigElement() {
        return document.createElement("hki-parcels-card-editor");
    }

    // HA calls this with the live `hass` object when the card is first added
    // to a dashboard, before the editor opens. Auto-populates one carrier
    // entry per detected account across every installed carrier integration
    // (PostNL, DHL, DPD, GLS), fully filled in via the same detection/entity
    // resolution the editor itself uses — instead of a fixed PostNL+DHL
    // example that had nothing to do with what's actually installed.
    // Falls back to that static example when hass isn't available yet or
    // nothing gets detected (fresh HA instance, no carriers configured).
    static getStubConfig(hass) {
        const carriers = [];
        if (hass) {
            for (const type of AUTO_DETECT_CARRIER_TYPES) {
                const preset = CARRIER_PRESETS[type];
                for (const { user, slugFirst, deviceId } of detectCarrierUsers(hass, type)) {
                    const templated = buildTemplatedEntities(user, type, slugFirst, hass, deviceId);
                    carriers.push({
                        type,
                        name: preset.label,
                        icon: getDefaultIcon(type),
                        color: preset.color,
                        schema: preset.schema,
                        logo_path: '', van_path: '', banner_path: '',
                        user,
                        entity_incoming: templated.entity_incoming || '',
                        entity_delivered: templated.entity_delivered || '',
                        entity_outgoing: preset.supports_outgoing === false ? '' : (templated.entity_outgoing || ''),
                        entity_outgoing_delivered: preset.supports_outgoing === false ? '' : (templated.entity_outgoing_delivered || ''),
                        entity_letters: preset.supports_letters ? (templated.entity_letters || '') : ''
                    });
                }
            }
        }

        if (!carriers.length) {
            carriers.push(
                {
                    type: 'postnl',
                    name: 'PostNL',
                    icon: 'mdi:package-variant-closed',
                    color: '#ed8c00',
                    schema: 'legacy',
                    logo_path: '', van_path: '', banner_path: '',
                    entity_incoming: 'sensor.postnl_incoming_parcels',
                    entity_delivered: 'sensor.postnl_delivered_parcels',
                    entity_outgoing: 'sensor.postnl_outgoing_parcels',
                    entity_outgoing_delivered: 'sensor.postnl_outgoing_delivered_parcels',
                    entity_letters: 'sensor.postnl_letters'
                },
                {
                    type: 'dhl',
                    name: 'DHL',
                    icon: 'mdi:package-variant-closed',
                    color: '#ffcc00',
                    schema: 'canonical',
                    logo_path: '', van_path: '', banner_path: '',
                    entity_incoming: 'sensor.dhl_incoming_parcels',
                    entity_delivered: 'sensor.dhl_delivered_parcels',
                    entity_outgoing: 'sensor.dhl_outgoing_parcels',
                    entity_outgoing_delivered: 'sensor.dhl_outgoing_delivered_parcels',
                    entity_letters: ''
                }
            );
        }

        return {
            title: "Parcels",
            days_back: inferDaysBack(hass, carriers),
            show_delivered: true,
            show_sent: true,
            show_letters: true,
            show_animation: true,
            show_header: true,
            show_placeholder: true,
            header_color: '',
            header_text_color: '',
            placeholder_image: DEFAULT_PLACEHOLDER_IMAGE,
            carriers,
            show_tracking_link: true,
            show_add_parcel: true,
            custom_name_scope: 'everyone',
            sort_order: 'auto',
            group_by_carrier: true,
            layout_order: ['header', 'animation', 'tabs', 'list']
        };
    }

    getCardSize() { return 4; }

    formatDate(dateStr) {
        if (!dateStr) return "";
        return new Date(dateStr).toLocaleDateString(this._hass?.language || 'en', {
            day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
        });
    }

    // ------------------------------------------------------------------
    // Normalization
    // ------------------------------------------------------------------

    _extractRawList(attrs) {
        if (!attrs) return [];
        if (Array.isArray(attrs)) return attrs;
        const normalized = Object.entries(attrs).reduce((acc, [key, value]) => {
            acc[String(key).toLowerCase()] = value;
            return acc;
        }, {});
        const groupedKeys = ['enroute', 'en_route', 'delivered'];
        const groupedShipments = groupedKeys.flatMap(key => Array.isArray(normalized[key]) ? normalized[key] : []);
        if (groupedShipments.length) return groupedShipments;
        if (Array.isArray(normalized.shipments)) return normalized.shipments;
        if (Array.isArray(normalized.parcels)) return normalized.parcels;
        if (Array.isArray(normalized.letters)) return normalized.letters;
        return Object.values(attrs).filter(item => item && typeof item === 'object');
    }

    _carrierBranding(carrier) {
        const preset = CARRIER_PRESETS[carrier.type] || CARRIER_PRESETS.custom;
        const assets  = CARRIER_ASSETS[carrier.type] || CARRIER_ASSETS.custom;
        return {
            carrier_type:   carrier.type,
            carrier_name:   carrier.name,
            carrier_icon:   (carrier.icon && carrier.icon !== DEFAULT_CARRIER_ICON) ? carrier.icon : getDefaultIcon(carrier.type),
            carrier_color:  carrier.color  || preset.color || DEFAULT_CARRIER_COLOR,
            carrier_logo:   carrier.logo_path   || assets.logo   || '',
            carrier_van:    carrier.van_path    || assets.van    || '',
            carrier_banner: carrier.banner_path || assets.banner || '',
            carrier_steps:  assets.steps || null
        };
    }

    _canonicalStatusLabel(statusEnum, pickup) {
        const t = this._t.bind(this);
        const labels = {
            registered:       t('status_registered'),
            in_transit:       t('status_in_transit'),
            out_for_delivery: t('status_out_for_delivery'),
            at_pickup_point:  pickup ? t('status_ready_for_pickup') : t('status_at_pickup_point'),
            delivered:        t('status_delivered'),
            returning:        t('status_returning'),
            problem:          t('status_problem'),
            unknown:          t('status_unknown')
        };
        // ha-postnl v4.x uses UPPERCASE enums; normalise before lookup.
        return labels[String(statusEnum).toLowerCase()] || statusEnum;
    }

    _normalizeCanonical(item, carrier) {
        const statusEnum = item.status || 'unknown';
        const delivered = typeof item.delivered === 'boolean'
            ? item.delivered
            : CANONICAL_DELIVERED_STATUSES.has(statusEnum);
        return {
            ...item,
            key: item.barcode || item.key || item.id,
            name: item.sender ? `${this._t('parcel_from')} ${item.sender}` : (item.name || this._t('unknown')),
            // Off by default: the generic translated label ("Onderweg", "Bezorgd", ...) reads the
            // same across every carrier. Turning this on shows the carrier's own raw_status text
            // instead (e.g. GLS's "Onderweg - geladen voor aflevering") when the integration
            // provides one, falling back to the generic label for statuses/carriers without it.
            status_message: (this.config.show_raw_status && item.raw_status) || this._canonicalStatusLabel(statusEnum, item.pickup),
            delivered,
            delivery_date: item.delivered_at || item.planned_from || item.delivery_date,
            planned_date: item.planned_from,
            ...this._carrierBranding(carrier)
        };
    }

    _normalizeLegacy(item, carrier) {
        const key = item.key || item.barcode || item.id || item.trackingcode || item.tracking_number;
        const name = item.name
            || (item.sender ? `${this._t('parcel_from')} ${item.sender}` : null)
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
            name: name || this._t('unknown'),
            status_message: item.raw_status || statusMessage,
            delivered: !!delivered,
            // Map ha-postnl v4.x field names so the cutoff filter and date display work
            // even when the carrier preset is still set to schema: legacy.
            delivery_date: item.delivery_date || item.delivered_at || item.planned_from || null,
            planned_date:  item.planned_date  || item.planned_from || null,
            ...this._carrierBranding(carrier)
        };
    }

    _normalizeItem(item, carrier) {
        if (!item || typeof item !== 'object') return null;
        const normalized = carrier.schema === 'canonical'
            ? this._normalizeCanonical(item, carrier)
            : this._normalizeLegacy(item, carrier);
        if (normalized && this._customNameScope() !== 'off') {
            const custom = this._getCustomName(normalized.carrier_type, normalized.key);
            if (custom) normalized.custom_name = custom;
        }
        return normalized;
    }

    // ------------------------------------------------------------------
    // Custom parcel names — a small user-friendly label per tracking code,
    // e.g. "Birthday gift" instead of a bare barcode (see GH issue #9).
    // `custom_name_scope` picks where that mapping lives — neither the card nor a
    // live dashboard view can write into the dashboard's own stored YAML config
    // (only the editor can), so this has to live somewhere else:
    //   - 'off'      — the feature is hidden entirely.
    //   - 'device'   — browser localStorage. Simple, no round-trip, but each
    //     browser/device keeps its own names.
    //   - 'me'       — Home Assistant's per-user "frontend user data" store (the
    //     same websocket API HA's own frontend uses for small preferences), via
    //     `frontend/get_user_data`/`frontend/set_user_data`. Server-side, so it's
    //     the same on every device signed into *that one* HA account — but a
    //     different HA user on the same instance does not see it.
    //   - 'everyone' (default) — Home Assistant's instance-wide "frontend system
    //     data" store, via `frontend/get_system_data`/`set_system_data`/
    //     `subscribe_system_data` — genuinely shared by every user of this HA
    //     instance, with live push updates. Added to HA core ~2025.12, and
    //     writes require an admin session (reads don't) — both are enforced
    //     server-side, so on an older core or from a non-admin session this
    //     degrades to "read-only, or empty" rather than silently lying about
    //     what's actually shared, which is what motivated splitting this out
    //     from 'me' in the first place (see the discussion on issue #9: a
    //     single "For everyone" option that was actually just "me" was
    //     genuinely misleading).
    // Keyed by "<carrier_type>:<tracking_code>" so two different carriers
    // reusing the same code never collide. 'shared' is accepted as a legacy
    // alias for 'me' — this project's own name for the option before it split
    // into 'me' + 'everyone'.
    // ------------------------------------------------------------------

    _escapeHtml(str) {
        return String(str ?? '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }

    _customNamesStorageKey() { return 'hki-parcels-card-custom-names'; }

    _customNameScope() {
        const scope = this.config.custom_name_scope;
        if (scope === 'off' || scope === 'device' || scope === 'everyone') return scope;
        if (scope === 'me' || scope === 'shared') return 'me';
        return 'everyone';
    }

    _isAdmin() { return !!this._hass?.user?.is_admin; }

    // Kicks off the async load from HA's per-user store; returns {} until it resolves,
    // then triggers a re-render so the loaded names appear. Cheap to call repeatedly —
    // guarded so only one fetch is ever in flight.
    _fetchMeCustomNames() {
        if (this.__meCustomNamesLoading || !this._hass?.connection) return;
        this.__meCustomNamesLoading = true;
        this._hass.connection.sendMessagePromise({
            type: 'frontend/get_user_data', key: this._customNamesStorageKey()
        }).then(res => {
            this.__meCustomNames = res?.value || {};
        }).catch(() => {
            this.__meCustomNames = this.__meCustomNames || {};
        }).finally(() => {
            this.__meCustomNamesLoading = false;
            this._lastListFingerprint = null;
            this.updateContent();
            this._refreshCarrierPopupIfOpen();
        });
    }

    // Opens (once) a live subscription to HA's instance-wide store — the first event fires
    // synchronously as part of subscribing (an initial snapshot, not just an ack), and further
    // events arrive whenever *any* user/device changes the data, so 'everyone' scope needs no
    // manual refresh to see another device's save. Unsubscribed in disconnectedCallback().
    _subscribeEveryoneCustomNames() {
        if (this.__everyoneSubPromise || !this._hass?.connection) return;
        this.__everyoneSubPromise = this._hass.connection.subscribeMessage(
            (data) => {
                this.__everyoneCustomNames = data?.value || {};
                this._lastListFingerprint = null;
                this.updateContent();
                this._refreshCarrierPopupIfOpen();
            },
            { type: 'frontend/subscribe_system_data', key: this._customNamesStorageKey() }
        ).then(unsub => {
            this.__everyoneUnsub = unsub;
        }).catch(() => {
            // Older HA core (frontend/system_data needs ~2025.12+) or unreachable — leave
            // custom names empty for this scope rather than erroring the whole card, and
            // allow a later retry (e.g. after a reconnect) since the promise is cleared.
            this.__everyoneCustomNames = this.__everyoneCustomNames || {};
            this.__everyoneSubPromise = null;
        });
    }

    disconnectedCallback() {
        if (this.__everyoneUnsub) {
            try { this.__everyoneUnsub(); } catch (e) { /* already gone */ }
            this.__everyoneUnsub = null;
        }
        this.__everyoneSubPromise = null;
    }

    _loadCustomNames() {
        const scope = this._customNameScope();
        if (scope === 'everyone') {
            if (this.__everyoneCustomNames) return this.__everyoneCustomNames;
            this._subscribeEveryoneCustomNames();
            return {};
        }
        if (scope === 'me') {
            if (this.__meCustomNames) return this.__meCustomNames;
            this._fetchMeCustomNames();
            return {};
        }
        if (this.__customNames) return this.__customNames;
        try {
            this.__customNames = JSON.parse(localStorage.getItem(this._customNamesStorageKey()) || '{}') || {};
        } catch (e) {
            this.__customNames = {};
        }
        return this.__customNames;
    }

    _customNameStorageId(carrierType, itemKey) {
        return `${carrierType || ''}:${itemKey || ''}`;
    }

    _getCustomName(carrierType, itemKey) {
        if (!itemKey) return null;
        return this._loadCustomNames()[this._customNameStorageId(carrierType, itemKey)] || null;
    }

    // Deliberately not awaited by callers: everything up to the first `await` inside
    // (including the optimistic cache update below) runs synchronously, so the caller's
    // immediate re-render already reflects the change. The 'me'/'everyone' branches' actual
    // server round-trip then finishes in the background — for 'everyone' the live subscription
    // this card already holds will also deliver the authoritative value once the save lands.
    _setCustomName(carrierType, itemKey, name) {
        if (!itemKey) return;
        const scope = this._customNameScope();
        const id = this._customNameStorageId(carrierType, itemKey);
        const trimmed = (name || '').trim();

        if (scope === 'everyone') {
            // The editor already hides add/edit controls for non-admins under this scope;
            // this is just defense in depth against stale/cached markup calling in anyway.
            if (!this._isAdmin()) return;
            const optimistic = { ...(this.__everyoneCustomNames || {}) };
            if (trimmed) optimistic[id] = trimmed;
            else delete optimistic[id];
            this.__everyoneCustomNames = optimistic;

            if (!this._hass?.connection) return;
            (async () => {
                try {
                    const res = await this._hass.connection.sendMessagePromise({
                        type: 'frontend/get_system_data', key: this._customNamesStorageKey()
                    });
                    const serverNames = res?.value || {};
                    if (trimmed) serverNames[id] = trimmed;
                    else delete serverNames[id];
                    await this._hass.connection.sendMessagePromise({
                        type: 'frontend/set_system_data', key: this._customNamesStorageKey(), value: serverNames
                    });
                } catch (e) {
                    // HA core too old for frontend/system_data, the session turned out not to
                    // be admin after all, or unreachable — the optimistic value stays for the
                    // rest of this session, it just never persisted.
                }
            })();
            return;
        }

        if (scope === 'me') {
            const optimistic = { ...(this.__meCustomNames || {}) };
            if (trimmed) optimistic[id] = trimmed;
            else delete optimistic[id];
            this.__meCustomNames = optimistic;

            if (!this._hass?.connection) return;
            (async () => {
                try {
                    // Re-fetch the current server value first so this save can't clobber a
                    // name another device saved moments earlier — merge, don't overwrite.
                    const res = await this._hass.connection.sendMessagePromise({
                        type: 'frontend/get_user_data', key: this._customNamesStorageKey()
                    });
                    const serverNames = res?.value || {};
                    if (trimmed) serverNames[id] = trimmed;
                    else delete serverNames[id];
                    await this._hass.connection.sendMessagePromise({
                        type: 'frontend/set_user_data', key: this._customNamesStorageKey(), value: serverNames
                    });
                    this.__meCustomNames = serverNames;
                } catch (e) {
                    // HA unreachable or the call was rejected — the optimistic value from
                    // above stays for the rest of this session, it just never persisted.
                }
            })();
            return;
        }

        const names = this._loadCustomNames();
        if (trimmed) names[id] = trimmed;
        else delete names[id];
        try {
            localStorage.setItem(this._customNamesStorageKey(), JSON.stringify(names));
        } catch (e) {
            // Storage full or unavailable (e.g. some private-browsing modes) — the in-memory
            // copy still reflects the change for the rest of this session, just not persisted.
        }
    }

    _getCarrierSensorItems(carrier, entityField) {
        // Carriers without a sender/account concept (e.g. GLS) never have real outgoing
        // sensors. Ignoring the field here — not just hiding it in the editor — also
        // protects against a saved config that still has a stale entity reference left
        // over from switching a carrier's type (e.g. postnl_v4 -> gls) before this was fixed.
        if ((entityField === 'entity_outgoing' || entityField === 'entity_outgoing_delivered')
            && (CARRIER_PRESETS[carrier.type] || CARRIER_PRESETS.custom).supports_outgoing === false) {
            return [];
        }
        const entityId = carrier[entityField];
        if (!entityId || !this._hass) return [];
        const stateObj = this._hass.states[entityId];
        if (!stateObj) return [];
        return this._extractRawList(stateObj.attributes)
            .map(item => this._normalizeItem(item, carrier))
            .filter(Boolean);
    }

    // ------------------------------------------------------------------
    // Data aggregation
    // ------------------------------------------------------------------

    getData() {
        const carriers = this.config.carriers || [];
        if (carriers.length === 0) return null;
        const anyConfigured = carriers.some(c =>
            c.entity_incoming || c.entity_delivered || c.entity_outgoing || c.entity_outgoing_delivered || c.entity_letters || c.entity || c.distribution_entity
        );
        if (!anyConfigured) return null;

        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - (this.config.days_back || 90));

        let onderweg = [], bezorgd = [];
        let verzondenUpcoming = [], verzondenDelivered = [];
        let postUpcoming = [], postDelivered = [];

        carriers.forEach(carrier => {
            const isSingleEntity = (CARRIER_PRESETS[carrier.type] || CARRIER_PRESETS.custom).schema === 'single_entity';
            let merged;

            if (isSingleEntity) {
                const items = this._getCarrierSensorItems(carrier, 'entity');
                merged = items.filter(item => {
                    if (!item.delivered) return true;
                    return new Date(item.delivery_date || item.planned_date || 0) >= cutoffDate;
                });
            } else {
                const incoming  = this._getCarrierSensorItems(carrier, 'entity_incoming').map(i => ({ ...i, delivered: false }));
                const delivered = this._getCarrierSensorItems(carrier, 'entity_delivered').map(i => ({ ...i, delivered: true }));
                const byKey = new Map();
                incoming.concat(delivered).forEach(item => {
                    const key = item.key || JSON.stringify(item);
                    const existing = byKey.get(key);
                    if (!existing || item.delivered) byKey.set(key, item);
                });
                merged = Array.from(byKey.values()).filter(item => {
                    if (!item.delivered) return true;
                    return new Date(item.delivery_date || item.planned_date || 0) >= cutoffDate;
                });
            }

            onderweg = onderweg.concat(merged.filter(i => !i.delivered));
            bezorgd  = bezorgd.concat(merged.filter(i => i.delivered));

            if (isSingleEntity) {
                verzondenUpcoming = verzondenUpcoming.concat(
                    this._getCarrierSensorItems(carrier, 'distribution_entity')
                );
            } else {
                verzondenUpcoming = verzondenUpcoming.concat(
                    this._getCarrierSensorItems(carrier, 'entity_outgoing').map(i => ({ ...i, delivered: false }))
                );
                verzondenDelivered = verzondenDelivered.concat(
                    this._getCarrierSensorItems(carrier, 'entity_outgoing_delivered').map(i => ({ ...i, delivered: true }))
                );
            }

            const carrierLetters = this._getCarrierLetters(carrier);
            const todayStart = new Date();
            todayStart.setHours(0, 0, 0, 0);

            carrierLetters.forEach(letter => {
                if (!letter.delivery_date) {
                    // No date: treat as upcoming (still to be delivered / unknown)
                    postUpcoming.push(letter);
                    return;
                }
                const d = new Date(letter.delivery_date);
                if (isNaN(d)) {
                    postUpcoming.push(letter);
                } else if (d >= todayStart) {
                    postUpcoming.push(letter);
                } else if (d >= cutoffDate) {
                    postDelivered.push(letter);
                }
                // Older than cutoff: silently drop
            });
        });

        // If a letter appears in both entity_delivered (parcels flow → bezorgd) and entity_letters
        // (post flow → postDelivered), remove the duplicate from bezorgd.
        const postKeys = new Set([...postUpcoming, ...postDelivered].map(l => l.key).filter(Boolean));
        if (postKeys.size > 0) {
            bezorgd = bezorgd.filter(i => !postKeys.has(i.key));
        }

        return {
            onderweg, bezorgd,
            verzonden: { upcoming: verzondenUpcoming, delivered: verzondenDelivered },
            post: { upcoming: postUpcoming, delivered: postDelivered }
        };
    }

    // ------------------------------------------------------------------
    // Letters
    // ------------------------------------------------------------------

    _slugify(text) {
        return String(text || '').toLowerCase().trim()
            .replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
    }

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
                name: item.title || (dateStr ? `${this._t('mail_from')} ${dateStr}` : this._t('letterbox_mail')),
                status_message: item.unread ? this._t('unread') : this._t('letterbox_mail'),
                delivery_date: dateStr,
                unread: !!item.unread,
                image_url: item.image_url || '',
                is_placeholder_image: isPlaceholder,
                image_entity_picture: '',
                has_image_prefix: !!imagePrefix,
                ...this._carrierBranding(carrier)
            };
        });

        this._matchLetterImageEntities(letters);
        return letters;
    }

    _matchLetterImageEntities(letters) {
        if (!this._hass) return;
        // Match by mail item id (present in image entity attributes since ha-postnl v4.1.0).
        // The naming convention of image entities changed across versions so pattern matching
        // is unreliable — id-based matching works for any naming scheme.
        const idMap = new Map();
        for (const [entityId, stateObj] of Object.entries(this._hass.states)) {
            if (!entityId.startsWith('image.')) continue;
            if (entityId.toLowerCase().includes('placeholder')) continue;
            if (stateObj.state === 'unavailable') continue;
            const mailId  = stateObj.attributes?.id;
            const picture = stateObj.attributes?.entity_picture;
            if (mailId && picture) idMap.set(mailId, picture);
        }
        letters.forEach(letter => {
            const picture = idMap.get(letter.key);
            if (picture) letter.image_entity_picture = picture;
        });
    }

    hasAnyLettersConfigured() {
        return (this.config.carriers || []).some(c => !!c.entity_letters);
    }

    _countLettersToday(data) {
        const todayStr = new Date().toDateString();
        const allLetters = [...(data?.post?.upcoming || []), ...(data?.post?.delivered || [])];
        return allLetters.filter(l => {
            if (!l.delivery_date) return false;
            const d = new Date(l.delivery_date);
            return !isNaN(d) && d.toDateString() === todayStr;
        }).length;
    }

    // ------------------------------------------------------------------
    // Rendering helpers
    // ------------------------------------------------------------------

    // `ascending` picks the direction; items with no usable date always sort to the bottom
    // regardless of direction, rather than jumping to the top the way a bare `|| 0` fallback
    // would once the comparison flips (see GH issue #11).
    _sortShipments(items, ascending = false) {
        const ts = (x) => {
            const t = new Date(x.delivery_date || x.planned_date || x.expected_datetime || 0).getTime();
            return !t || Number.isNaN(t) ? null : t;
        };
        return [...(items || [])].sort((a, b) => {
            const ta = ts(a), tb = ts(b);
            if (ta === null && tb === null) return 0;
            if (ta === null) return 1;
            if (tb === null) return -1;
            return ascending ? ta - tb : tb - ta;
        });
    }

    // `sort_order` (editor option, GH issue #11): 'auto' (default) is soonest-first for
    // not-yet-delivered lists and most-recent-first for delivered ones — the two other options
    // pin one direction everywhere, for anyone who'd rather it not change per tab/section.
    _resolveSortAscending(defaultAscending) {
        const order = this.config.sort_order;
        if (order === 'newest_first') return false;
        if (order === 'oldest_first') return true;
        return defaultAscending;
    }

    getFilteredShipments(data) {
        if (!data) return [];
        if (this._activeTab === 'post' || this._activeTab === 'verzonden') {
            const bucket = data[this._activeTab] || {};
            return {
                upcoming: this._sortShipments(bucket.upcoming, this._resolveSortAscending(true)),
                delivered: this._sortShipments(bucket.delivered, this._resolveSortAscending(false))
            };
        }
        return this._sortShipments(data[this._activeTab], this._resolveSortAscending(this._activeTab === 'onderweg'));
    }

    _groupByCarrier(items) {
        const order = [];
        const groups = new Map();
        items.forEach(item => {
            const name = item.carrier_name || this._t('unknown');
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
        this._lastListFingerprint = null; // force re-render on tab switch
        this.updateContent();
    }

    handleParcelClick(e) {
        const key = e.currentTarget.dataset.key;
        this._selectedParcel = (this._selectedParcel === key) ? null : key;
        this._lastListFingerprint = null; // force re-render on selection change
        this.updateContent();
    }

    handleLetterThumbClick(e) {
        e.stopPropagation();
        const { letterName, letterDate, letterSrc } = e.currentTarget.dataset;
        this._openLetterPopup(letterSrc, letterName, letterDate);
    }

    // Binds the custom-name controls rendered by _renderCustomNameRow(). Called from every
    // place that renders parcel items — the main list, the full re-render, and the carrier
    // popup — since each owns a separate DOM subtree.
    _bindCustomNameEvents(root) {
        if (!root) return;
        root.querySelectorAll('.custom-name-add-btn, .custom-name-edit-btn').forEach(el =>
            el.addEventListener('click', this._handleCustomNameEditClick.bind(this))
        );
        root.querySelectorAll('.custom-name-save').forEach(el =>
            el.addEventListener('click', this._handleCustomNameSaveClick.bind(this))
        );
        root.querySelectorAll('.custom-name-cancel').forEach(el =>
            el.addEventListener('click', this._handleCustomNameCancelClick.bind(this))
        );
        root.querySelectorAll('.custom-name-input').forEach(el => {
            el.addEventListener('click', e => e.stopPropagation());
            el.addEventListener('keydown', e => {
                if (e.key === 'Enter') this._handleCustomNameSaveClick(e);
                else if (e.key === 'Escape') this._handleCustomNameCancelClick(e);
            });
        });
        // Focus + select whichever input is currently in edit mode, right after it was rendered.
        const activeInput = root.querySelector('.custom-name-editing .custom-name-input');
        if (activeInput) requestAnimationFrame(() => { activeInput.focus(); activeInput.select(); });
    }

    _handleCustomNameEditClick(e) {
        e.stopPropagation();
        const row = e.currentTarget.closest('.custom-name-row');
        if (!row) return;
        this._editingNameKey = this._customNameStorageId(row.dataset.carrierType, row.dataset.key);
        this._lastListFingerprint = null;
        this.updateContent();
        this._refreshCarrierPopupIfOpen();
    }

    _handleCustomNameSaveClick(e) {
        e.stopPropagation();
        const row = e.currentTarget.closest('.custom-name-row');
        if (!row) return;
        const input = row.querySelector('.custom-name-input');
        this._setCustomName(row.dataset.carrierType, row.dataset.key, input?.value || '');
        this._editingNameKey = null;
        this._lastListFingerprint = null;
        this.updateContent();
        this._refreshCarrierPopupIfOpen();
    }

    _handleCustomNameCancelClick(e) {
        e.stopPropagation();
        this._editingNameKey = null;
        this._lastListFingerprint = null;
        this.updateContent();
        this._refreshCarrierPopupIfOpen();
    }

    _getNoSelectionBackground() {
        const carriers = this.config.carriers || [];
        // setConfig() always fills placeholder_image with DEFAULT_PLACEHOLDER_IMAGE when the
        // user leaves it blank, so a plain truthiness check can't tell "default" from "custom".
        const hasCustomPlaceholder = !!this.config.placeholder_image
            && this.config.placeholder_image !== DEFAULT_PLACEHOLDER_IMAGE;
        const placeholderImage = this.config.placeholder_image || DEFAULT_PLACEHOLDER_IMAGE;

        if (carriers.length === 1) {
            const b = this._carrierBranding(carriers[0]);
            const image = b.carrier_banner || b.carrier_logo;
            if (image) return { image, showText: false };
            return { image: placeholderImage, showText: false };
        }

        // 2+ carriers: build a combo banner showing only the configured carriers'
        // own logos, instead of a static image with every possible carrier on it.
        // A user-supplied placeholder_image always wins over this.
        if (carriers.length >= 2 && !hasCustomPlaceholder) {
            const seen = new Set();
            const combo = [];
            for (const c of carriers) {
                const b = this._carrierBranding(c);
                const key = b.carrier_logo || `${c.type}:${b.carrier_name}`;
                if (seen.has(key)) continue;
                seen.add(key);
                combo.push(b);
            }
            if (combo.length) return { image: null, showText: false, comboLogos: combo };
        }

        return { image: placeholderImage, showText: false };
    }

    // Splits items into rows of at most maxPerRow, distributing the count across rows
    // as evenly as possible (e.g. 5 -> [3,2], not [4,1]) rather than filling each row
    // to the cap before starting the next.
    _splitIntoBalancedRows(items, maxPerRow = 4) {
        const rows = Math.max(1, Math.ceil(items.length / maxPerRow));
        const base = Math.floor(items.length / rows);
        const extra = items.length % rows;
        const result = [];
        let i = 0;
        for (let r = 0; r < rows; r++) {
            const count = base + (r < extra ? 1 : 0);
            result.push(items.slice(i, i + count));
            i += count;
        }
        return result;
    }

    _openLetterPopup(src, name, dateLabel) {
        let popup = this.shadowRoot.querySelector('.letter-popup-overlay');
        if (!popup) {
            popup = document.createElement('div');
            popup.className = 'letter-popup-overlay';
            this.shadowRoot.appendChild(popup);
            popup.addEventListener('click', e => {
                if (e.target === popup || e.target.closest('.letter-popup-close')) this._closeLetterPopup();
            });
        }
        popup.innerHTML = `
            <div class="letter-popup-content">
                <button class="letter-popup-close" title="Close"><ha-icon icon="mdi:close"></ha-icon></button>
                <img src="${src}" alt="${name || ''}" />
                <div class="letter-popup-caption"><strong>${name || ''}</strong>${dateLabel ? ` • ${dateLabel}` : ''}</div>
            </div>`;
        popup.classList.add('open');
    }

    _closeLetterPopup() {
        this.shadowRoot.querySelector('.letter-popup-overlay')?.classList.remove('open');
    }

    // Gathers every item for one carrier across all four tabs (onderweg/bezorgd/verzonden/post),
    // grouped into the same sections the popup displays.
    _getCarrierSections(data, carrierName) {
        const forCarrier = (items) => (items || [])
            .filter(i => (i.carrier_name || this._t('unknown')) === carrierName);
        return [
            { label: this._t('tab_in_transit'), items: forCarrier(data.onderweg) },
            { label: this._t('tab_delivered'),  items: forCarrier(data.bezorgd) },
            { label: this._t('tab_sent'),       items: [...forCarrier(data.verzonden?.upcoming), ...forCarrier(data.verzonden?.delivered)] },
            { label: this._t('tab_letters'),    items: [...forCarrier(data.post?.upcoming), ...forCarrier(data.post?.delivered)] },
        ].filter(section => section.items.length > 0);
    }

    _openCarrierPopup(carrierName) {
        if (!carrierName) return;
        this._openPopupCarrierName = carrierName;
        const data = this.getData();
        if (!data) return;
        const sections = this._getCarrierSections(data, carrierName);
        const anyItem = sections[0]?.items[0];
        // Prefer the carrier's own config over an item's branding: a carrier with zero
        // current parcels (e.g. "0 pakketten") has no item to read carrier_icon/color from,
        // which would otherwise wrongly fall back to the generic default icon and colour.
        const carrierConfig = (this.config.carriers || []).find(c => this._carrierBranding(c).carrier_name === carrierName);
        const branding = carrierConfig ? this._carrierBranding(carrierConfig) : null;
        const brandColor = branding?.carrier_color || anyItem?.carrier_color || DEFAULT_CARRIER_COLOR;
        const brandIcon  = branding?.carrier_icon  || anyItem?.carrier_icon  || DEFAULT_CARRIER_ICON;

        let popup = this.shadowRoot.querySelector('.carrier-popup-overlay');
        if (!popup) {
            popup = document.createElement('div');
            popup.className = 'carrier-popup-overlay';
            this.shadowRoot.appendChild(popup);
            popup.addEventListener('click', e => {
                if (e.target === popup || e.target.closest('.carrier-popup-close')) this._closeCarrierPopup();
            });
        }

        popup.innerHTML = `
            <div class="carrier-popup-content">
                <button class="letter-popup-close carrier-popup-close" title="Close"><ha-icon icon="mdi:close"></ha-icon></button>
                <div class="carrier-popup-header" style="--carrier-color:${brandColor};">
                    <ha-icon icon="${brandIcon}"></ha-icon>
                    <span>${carrierName}</span>
                </div>
                <div class="carrier-popup-body">
                    ${sections.length ? sections.map(section => `
                        <div class="post-section">
                            <div class="post-section-title">${section.label}</div>
                            ${section.items.map(item => this._renderParcelItem(item)).join('')}
                        </div>`).join('') : `
                        <div class="empty-state">
                            <ha-icon icon="mdi:package-variant-closed" style="width:48px;height:48px;margin-bottom:10px;"></ha-icon>
                            <div>${this._t('no_parcels')}</div>
                        </div>`}
                </div>
            </div>`;
        popup.classList.add('open');

        popup.querySelectorAll('.parcel-header').forEach(el =>
            el.addEventListener('click', this._handleCarrierPopupItemClick.bind(this))
        );
        popup.querySelectorAll('.letter-thumb').forEach(el =>
            el.addEventListener('click', this.handleLetterThumbClick.bind(this))
        );
        this._bindCustomNameEvents(popup);
    }

    _closeCarrierPopup() {
        this.shadowRoot.querySelector('.carrier-popup-overlay')?.classList.remove('open');
        this._openPopupCarrierName = null;
    }

    // If the carrier popup is open, rebuild it so it reflects the latest custom-name edit —
    // updateContent()/renderList() only ever touch the main list, never the popup's own DOM.
    _refreshCarrierPopupIfOpen() {
        if (this._openPopupCarrierName && this.shadowRoot.querySelector('.carrier-popup-overlay.open')) {
            this._openCarrierPopup(this._openPopupCarrierName);
        }
    }

    // Clicking an item in the carrier popup just expands/collapses its own details panel in
    // place — the exact same accordion behaviour as the main list (.selected .details-panel is
    // shown via CSS) — without touching _activeTab/_selectedParcel or closing the popup.
    _handleCarrierPopupItemClick(e) {
        e.currentTarget.closest('.parcel')?.classList.toggle('selected');
    }

    // ------------------------------------------------------------------
    // "+ Add parcel" — calls the carrier integration's own `<domain>.track_parcel`
    // service so a Track & Trace number entered on the live card actually starts being
    // tracked by the integration, not just displayed. Only offered for carriers whose
    // preset declares `track_parcel_service` (gls/dragonfly/trunkrs/cainiao/hermes/packeta/correos —
    // the account-less "hub + dynamically added parcels" family, see CARRIER_PRESETS).
    // ------------------------------------------------------------------

    // { carrier, index, preset }[] for every configured carrier that supports adding a
    // parcel via service call. Re-evaluated on every render — cheap, and always reflects
    // the current carrier list (e.g. right after the editor adds/removes a carrier).
    _getTrackableCarriers() {
        return (this.config.carriers || [])
            .map((carrier, index) => ({ carrier, index, preset: CARRIER_PRESETS[carrier.type] || CARRIER_PRESETS.custom }))
            .filter(({ preset }) => !!preset.track_parcel_service);
    }

    _renderAddParcelForm() {
        if (this.config.show_add_parcel === false) return '';
        const trackable = this._getTrackableCarriers();
        if (!trackable.length) return '';

        if (!this._addParcelOpen) {
            return `
            <div class="add-parcel-bar">
                <button class="add-parcel-toggle" type="button">
                    <ha-icon icon="mdi:plus-circle-outline"></ha-icon> ${this._t('add_parcel_toggle')}
                </button>
            </div>`;
        }

        const stillValid = trackable.some(t => t.index === this._addParcelCarrierIndex);
        const selIndex = stillValid ? this._addParcelCarrierIndex : trackable[0].index;
        const options = trackable.map(({ carrier, index, preset }) => {
            const label = carrier.user ? `${carrier.name || preset.label} (${carrier.user})` : (carrier.name || preset.label);
            return `<option value="${index}" ${index === selIndex ? 'selected' : ''}>${label}</option>`;
        }).join('');

        const busy = this._addParcelBusy;
        const msg = this._addParcelMessage;

        return `
        <div class="add-parcel-bar open">
            <div class="add-parcel-row">
                ${trackable.length > 1 ? `
                <select class="add-parcel-select" aria-label="${this._t('add_parcel_carrier')}" ${busy ? 'disabled' : ''}>${options}</select>
                ` : ''}
                <input class="add-parcel-input" type="text" placeholder="${this._t('add_parcel_number')}"
                    value="${(this._addParcelValue || '').replace(/"/g, '&quot;')}" ${busy ? 'disabled' : ''} />
                <button class="add-parcel-submit" type="button" ${busy ? 'disabled' : ''}>${busy ? this._t('add_parcel_busy') : this._t('add_parcel_submit')}</button>
                <button class="add-parcel-cancel" type="button" title="Cancel" ${busy ? 'disabled' : ''}><ha-icon icon="mdi:close"></ha-icon></button>
            </div>
            ${msg ? `<div class="add-parcel-msg ${msg.type}">${msg.text}</div>` : ''}
        </div>`;
    }

    // (Re)binds event listeners for the add-parcel container. Called after every
    // (re)render of that container's innerHTML, same pattern as renderList()/render().
    _bindAddParcelEvents(container) {
        if (!container) return;
        container.querySelector('.add-parcel-toggle')?.addEventListener('click', () => {
            this._addParcelOpen = true;
            this._addParcelMessage = null;
            this._updateAddParcelBar();
        });
        container.querySelector('.add-parcel-cancel')?.addEventListener('click', () => {
            this._addParcelOpen = false;
            this._addParcelMessage = null;
            this._updateAddParcelBar();
        });
        container.querySelector('.add-parcel-select')?.addEventListener('change', (ev) => {
            this._addParcelCarrierIndex = parseInt(ev.target.value, 10);
        });
        const input = container.querySelector('.add-parcel-input');
        if (input) {
            input.addEventListener('input', (ev) => { this._addParcelValue = ev.target.value; });
            input.addEventListener('keydown', (ev) => { if (ev.key === 'Enter') this._submitAddParcel(); });
        }
        container.querySelector('.add-parcel-submit')?.addEventListener('click', () => this._submitAddParcel());
    }

    _updateAddParcelBar() {
        const container = this.shadowRoot.querySelector('.add-parcel-container');
        if (!container) return;
        container.innerHTML = this._renderAddParcelForm();
        this._bindAddParcelEvents(container);
        // Focus the number field the moment the form opens, so typing can start immediately.
        if (this._addParcelOpen) container.querySelector('.add-parcel-input')?.focus();
    }

    async _submitAddParcel() {
        const trackable = this._getTrackableCarriers();
        const entry = trackable.find(t => t.index === this._addParcelCarrierIndex) || trackable[0];
        if (!entry) return;
        const value = (this._addParcelValue || '').trim();
        if (!value || !this._hass?.callService) return;

        const { carrier, preset } = entry;
        const svc = preset.track_parcel_service;
        if (!svc) return;

        this._addParcelBusy = true;
        this._addParcelMessage = null;
        this._updateAddParcelBar();

        const data = { [svc.field]: value };
        if (svc.supports_postal_code && carrier.user) data.postal_code = carrier.user;

        try {
            await this._hass.callService(svc.domain, 'track_parcel', data);
            this._addParcelBusy = false;
            this._addParcelValue = '';
            this._addParcelMessage = { type: 'success', text: this._t('add_parcel_success') };
        } catch (err) {
            this._addParcelBusy = false;
            const detail = err?.message || err?.error?.message;
            this._addParcelMessage = { type: 'error', text: detail ? `${this._t('add_parcel_error')} (${detail})` : this._t('add_parcel_error') };
        }
        this._updateAddParcelBar();
    }

    // ------------------------------------------------------------------
    // updateContent — partial DOM update (no full re-render)
    // ------------------------------------------------------------------

    // Stable fingerprint for the displayed list — excludes image URLs (their time= param
    // changes on every HA scan, which would cause constant re-renders and image flickering).
    _listFingerprint(displayed) {
        const items = Array.isArray(displayed)
            ? displayed
            : [...(displayed.upcoming || []), ...(displayed.delivered || [])];
        return items.map(i => `${i.key}|${i.delivered}|${i.status_message || ''}`).join(',');
    }

    updateContent() {
        if (!this._isRendered) return;
        const data = this.getData();
        if (!data) return;

        const displayed = this.getFilteredShipments(data);
        const lettersToday = this.hasAnyLettersConfigured() ? this._countLettersToday(data) : null;
        const statsText = `${data.onderweg.length} ${this._t('stats_in_transit')} • ${data.bezorgd.length} ${this._t('stats_recent')}${lettersToday !== null ? ` • ${lettersToday} ${this._t('stats_letters')}` : ''}`;

        const statsEl    = this.shadowRoot.querySelector('.header-stats');
        const statsBarEl = this.shadowRoot.querySelector('.stats-text');
        if (statsEl)    statsEl.textContent    = statsText;
        if (statsBarEl) statsBarEl.textContent = statsText;

        this.shadowRoot.querySelectorAll('.tab').forEach(tab =>
            tab.classList.toggle('active', tab.dataset.tab === this._activeTab)
        );
        this.updateAnimation(displayed);

        // Only rebuild the list DOM when items actually changed — avoids destroying
        // <img> elements on every hass tick, which causes letter images to flicker.
        const fp = this._listFingerprint(displayed);
        if (fp !== this._lastListFingerprint) {
            this._lastListFingerprint = fp;
            this.renderList(displayed);
        }
    }

    // Renders the 4-step happy-path tracker: a small progress row (registered / in_transit /
    // out_for_delivery / delivered) plus a large "hero" for the current step — the carrier's own
    // step illustration for registered/sorting/delivered, or the existing driving-van visual for
    // out_for_delivery (stepIndex 3), since that's already exactly what "onderweg met bezorger" is.
    _renderStatusTracker(selected, stepIndex) {
        const color = selected.carrier_color || DEFAULT_CARRIER_COLOR;
        const stepKeys = ['registered', 'sorting', 'transit', 'delivered'];
        const stepMiniKeys = ['registered_mini', 'sorting', 'transit', 'delivered_mini'];
        const stepLabelKeys = ['step_label_registered', 'step_label_sorting', 'step_label_transit', 'step_label_delivered'];
        const steps = selected.carrier_steps || {};
        const isFinalStep = stepIndex === STATUS_STEP_ORDER.length;
        const dots = STATUS_STEP_ORDER.map((_, i) => {
            const n = i + 1;
            // Reaching the last step (delivered) IS completion, so it gets the done/checkmark
            // treatment too, not just the "current" ring — there's no step after it to await.
            const state = n < stepIndex || (n === stepIndex && isFinalStep) ? 'done' : n === stepIndex ? 'current' : 'upcoming';
            const colorVar = state !== 'upcoming' ? ` style="--step-color:${color};"` : '';
            // Mini icons never carry a baked-in checkmark (registered/delivered have a plain
            // variant) — completion is shown only via the overlay badge below, never both.
            const icon = steps[stepMiniKeys[i]] || steps[stepKeys[i]];
            const label = this._t(stepLabelKeys[i]);
            const col = `
                <div class="status-step-col">
                    <div class="status-step-icon-wrap ${state}">
                        ${icon ? `<img class="status-step-icon" src="${icon}" alt="${label}" />` : ''}
                        ${state === 'done' ? `<div class="status-step-check"${colorVar}><ha-icon icon="mdi:check"></ha-icon></div>` : ''}
                    </div>
                    <div class="status-step-label ${state !== 'upcoming' ? 'active' : ''}">${label}</div>
                </div>`;
            if (n === STATUS_STEP_ORDER.length) return col;
            const lineDone = n < stepIndex;
            return `${col}<div class="status-step-line ${lineDone ? 'done' : ''}"${lineDone ? ` style="--step-color:${color};"` : ''}></div>`;
        }).join('');

        let heroImgHtml;
        if (stepIndex === 3) {
            heroImgHtml = `
                <div class="visual-road">
                    <div class="house-bg">🏠</div>
                    <div class="road-line"></div>
                    ${selected.carrier_van
                        ? `<img class="carrier-van-gif" src="${selected.carrier_van}" alt="${selected.carrier_name || ''}" style="left:25%;" />`
                        : `<div class="carrier-chip" style="background:${color}; left:25%;"><ha-icon icon="${selected.carrier_icon || DEFAULT_CARRIER_ICON}"></ha-icon></div>`}
                </div>`;
        } else {
            const key = stepIndex === 1 ? 'registered' : stepIndex === 2 ? 'sorting' : 'delivered';
            const img = steps[key];
            heroImgHtml = img ? `<div class="status-hero"><img class="status-hero-img" src="${img}" alt="" /></div>` : '';
        }

        const infos = this._stepHeroInfo(selected, stepIndex);
        const heroHtml = heroImgHtml ? `
            <div class="status-hero-row">
                ${heroImgHtml}
                ${infos.length ? `
                <div class="status-hero-info">
                    ${infos.map(info => `
                    <div class="status-hero-info-block">
                        <div class="status-hero-info-label">${info.label}</div>
                        <div class="status-hero-info-time">${info.time}</div>
                    </div>`).join('')}
                </div>` : ''}
            </div>` : '';

        return `
            <div class="status-tracker">
                <div class="status-steps">${dots}</div>
                ${heroHtml}
            </div>
            <div class="animation-info"><strong>${selected.name}</strong> • ${selected.status_message || ''} • ${selected.carrier_name || ''}</div>`;
    }

    // Time/date detail(s) shown beside the hero image for the current step, each as a label line
    // plus a bold time/date line underneath it. Registered/sorting times come from the optional
    // per-parcel `history` array (only populated when the integration's "include history" option
    // is on). Every non-delivered step additionally shows the expected delivery window (if known)
    // using the same relative-day wording as the parcel list ("Today between 16:00 and 18:00") —
    // for "out for delivery" that's the only block, since it has no step-specific timestamp of its
    // own. Delivered uses delivered_at only; nothing is "expected" once it's already arrived.
    // Returns [] when no relevant data is available rather than showing a placeholder.
    _stepHeroInfo(selected, stepIndex) {
        const infos = [];
        const historyTime = (status) => {
            const entry = Array.isArray(selected.history) ? selected.history.find(h => h?.status === status) : null;
            return entry?.timestamp ? this._formatTime(entry.timestamp) : null;
        };
        if (stepIndex === 1) {
            const time = historyTime('registered');
            if (time) infos.push({ label: this._t('step_info_registered'), time });
        } else if (stepIndex === 2) {
            const time = historyTime('in_transit');
            if (time) infos.push({ label: this._t('step_info_sorting'), time });
        } else if (stepIndex === 4) {
            const dt = this.formatDate(selected.delivered_at);
            if (dt) infos.push({ label: this._t('step_info_delivered'), time: dt });
        }
        if (stepIndex !== 4) {
            const parts = this._expectedDeliveryParts(selected);
            if (parts) infos.push({ label: this._t('step_info_expected_delivery'), time: `${parts.dayPart} ${parts.timePart}` });
        }
        return infos;
    }

    // Shared building block for "expected delivery" wording — a relative-day label ("Today" /
    // "Tomorrow" / "The day after tomorrow", or an "Expected on {date}" fallback beyond that) plus
    // the planned time or window. Used by both the parcel list and the step tracker hero info so
    // they read consistently. Returns null when there's no planned_from to work with.
    _expectedDeliveryParts(item) {
        if (!item.planned_from) return null;
        const dayLabel = this._relativeDayLabel(item.planned_from);
        const fromTime = this._formatTime(item.planned_from);
        const toTime = item.planned_to ? this._formatTime(item.planned_to) : null;
        const dayPart = dayLabel || `${this._t('expected_on')} ${this._formatDateOnly(item.planned_from)}`;
        const timePart = toTime ? `${this._t('between_time')} ${fromTime} ${this._t('step_info_transit_and')} ${toTime}` : fromTime;
        return { dayPart, timePart };
    }

    // Resolves hass.locale.time_format ("12" / "24" / "language" / "system") into a 12h-vs-24h
    // boolean. "language"/"system" have no fixed answer — e.g. "language" is 12h for en-US but
    // 24h for en-GB/nl/de — so this probes Intl with a known 22:00 timestamp and checks whether
    // it rendered as "10" (12h) rather than "22" (24h), mirroring Home Assistant's own frontend
    // (src/common/datetime/use_am_pm.ts) rather than guessing from the language code alone.
    _useAmPm() {
        const tf = this._hass?.locale?.time_format;
        if (!tf || tf === 'language' || tf === 'system') {
            const testLang = tf === 'language' ? this._hass?.language : undefined;
            return new Date('January 1, 2023 22:00:00').toLocaleString(testLang).includes('10');
        }
        return tf === '12';
    }

    _formatTime(dateStr) {
        if (!dateStr) return '';
        return new Date(dateStr).toLocaleTimeString(this._hass?.language || 'en', {
            hour: '2-digit', minute: '2-digit', hour12: this._useAmPm()
        });
    }

    _formatDateOnly(dateStr) {
        if (!dateStr) return '';
        return new Date(dateStr).toLocaleDateString(this._hass?.language || 'en', { day: 'numeric', month: 'short' });
    }

    // 'Today' / 'Tomorrow' / 'the day after tomorrow' for a date within the next 2 calendar
    // days; null otherwise so the caller can fall back to an actual date.
    _relativeDayLabel(dateStr) {
        if (!dateStr) return null;
        const d = new Date(dateStr);
        const now = new Date();
        const startOfDay = (x) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
        const diffDays = Math.round((startOfDay(d) - startOfDay(now)) / 86400000);
        if (diffDays === 0) return this._t('today');
        if (diffDays === 1) return this._t('tomorrow');
        if (diffDays === 2) return this._t('day_after_tomorrow');
        return null;
    }

    // The parcel list row's date label. An expected delivery window (planned_from/planned_to —
    // "verwachte levertijd") always wins over any other date for a parcel still in transit, since
    // it's the most actionable info; shown as "Today between 16:00 and 18:00" or, beyond the next
    // 2 days, "Expected on 12 Jul between 16:00 and 18:00". Delivered parcels are unaffected —
    // they show their actual delivery timestamp, never an "expected" one.
    _parcelDateLabel(item) {
        if (!item.delivered) {
            const parts = this._expectedDeliveryParts(item);
            if (parts) return `${parts.dayPart} ${parts.timePart}`;
        }
        return this.formatDate(item.delivery_date || item.planned_date || item.planned_to);
    }

    updateAnimation(displayed) {
        const animationEl = this.shadowRoot.querySelector('.header-animation');
        if (!animationEl) return;

        const flat = Array.isArray(displayed) ? displayed : [...(displayed.upcoming || []), ...(displayed.delivered || [])];
        const selected = this._selectedParcel
            ? flat.find(s => s.key === this._selectedParcel)
            : null;

        // The combo banner is built purely from static carrier config, never from live hass
        // data, so it never actually changes between ticks. Bail out before any DOM mutation
        // if it's already showing correctly — unconditionally rebuilding it every tick used to
        // reset :hover state on the logos below, making the hover-zoom flicker/repeat for as
        // long as the mouse stayed put. A full rebuild still happens via render() whenever the
        // config itself changes (a fresh render() always clears .combo-placeholder first).
        if (!selected && this.config.show_placeholder) {
            const existingCombo = this._getNoSelectionBackground();
            if (existingCombo.comboLogos && animationEl.classList.contains('combo-placeholder') && animationEl.querySelector('.combo-logo-row')) {
                return;
            }
        }

        animationEl.style.backgroundImage = '';
        animationEl.classList.remove('combo-placeholder');
        animationEl.classList.remove('status-tracker-active');

        // 4-step happy-path tracker (registered -> in_transit -> out_for_delivery -> delivered),
        // only for canonical-schema carriers that have step illustrations configured. Letters and
        // any other status (at_pickup_point, returning, problem, unknown) fall through to the
        // plain van/chip + status-text treatment below, unchanged.
        const stepIndex = (selected && !selected.is_letter && selected.carrier_steps)
            ? STATUS_STEP_ORDER.indexOf(selected.status) + 1 : 0;
        if (this.config.show_animation && selected && stepIndex > 0) {
            animationEl.classList.add('animation-active');
            animationEl.classList.add('status-tracker-active');
            animationEl.innerHTML = this._renderStatusTracker(selected, stepIndex);
            return;
        }

        if (this.config.show_animation && selected?.delivered) {
            const isLetter = !!selected.is_letter;
            animationEl.classList.add('animation-active');
            animationEl.innerHTML = `
                <div class="delivery-complete">
                    <div class="delivery-complete-icon" style="color:${selected.carrier_color || DEFAULT_CARRIER_COLOR};">
                        <ha-icon icon="${isLetter ? 'mdi:email-check' : 'mdi:package-check'}"></ha-icon>
                    </div>
                    <div class="delivery-complete-text">
                        <strong>${selected.name}</strong>
                        <span>${isLetter ? this._t('letterbox_received') : this._t('parcel_delivered_msg')} • ${selected.carrier_name || ''}</span>
                    </div>
                </div>`;
            return;
        }

        if (this.config.show_animation && selected) {
            const vanPos = selected.delivered ? '75%' : '25%';
            const statusText = selected.status_message || (selected.delivered ? this._t('status_delivered') : this._t('status_in_transit'));
            animationEl.classList.add('animation-active');
            animationEl.innerHTML = `
                <div class="visual-road">
                    <div class="house-bg">🏠</div>
                    <div class="road-line"></div>
                    ${selected.carrier_van
                        ? `<img class="carrier-van-gif" src="${selected.carrier_van}" alt="${selected.carrier_name || ''}" style="left:${vanPos};" />`
                        : `<div class="carrier-chip" style="background:${selected.carrier_color || DEFAULT_CARRIER_COLOR}; left:${vanPos};">
                            <ha-icon icon="${selected.carrier_icon || DEFAULT_CARRIER_ICON}"></ha-icon>
                        </div>`
                    }
                </div>
                <div class="animation-info"><strong>${selected.name}</strong> • ${statusText} • ${selected.carrier_name || ''}</div>`;
        } else {
            animationEl.classList.remove('animation-active');
            if (!this.config.show_placeholder) {
                animationEl.style.backgroundImage = '';
                animationEl.innerHTML = '';
                return;
            }
            const bg = this._getNoSelectionBackground();
            if (bg.comboLogos) {
                animationEl.classList.add('combo-placeholder');
                const rows = this._splitIntoBalancedRows(bg.comboLogos, 4);
                animationEl.innerHTML = rows.map(row => `<div class="combo-logo-row">${row.map(c => `
                    <div class="combo-panel" data-carrier="${c.carrier_name || ''}" style="--panel-color:${c.carrier_color || DEFAULT_CARRIER_COLOR};" title="${c.carrier_name || ''}">
                        <div class="combo-panel-bg"></div>
                        ${c.carrier_logo
                            ? `<img class="combo-logo" src="${c.carrier_logo}" alt="${c.carrier_name || ''}" />`
                            : `<div class="combo-logo-chip" style="background:${c.carrier_color || DEFAULT_CARRIER_COLOR};"><ha-icon icon="${c.carrier_icon || DEFAULT_CARRIER_ICON}"></ha-icon></div>`}
                    </div>`
                ).join('')}</div>`).join('');
                animationEl.querySelectorAll('.combo-panel').forEach(el =>
                    el.addEventListener('click', () => this._openCarrierPopup(el.dataset.carrier))
                );
                return;
            }
            animationEl.style.backgroundImage = bg.image ? `url("${bg.image.replace(/"/g, '%22')}")` : '';
            animationEl.innerHTML = bg.showText
                ? `<div class="animation-placeholder"><div class="placeholder-text">${this._t('select_parcel')}</div></div>`
                : '';
        }
    }

    _renderCustomNameRow(item) {
        // Writes under 'everyone' scope require an admin session server-side (reads don't) —
        // mirror that here so non-admins see the shared names read-only instead of an add/edit
        // control that would silently fail (_setCustomName has its own admin check too).
        const canEdit = this._customNameScope() !== 'everyone' || this._isAdmin();
        const storageId = this._customNameStorageId(item.carrier_type, item.key);
        if (canEdit && this._editingNameKey === storageId) {
            return `
            <div class="detail-row custom-name-row custom-name-editing" data-key="${item.key}" data-carrier-type="${item.carrier_type || ''}">
                <input type="text" class="custom-name-input" maxlength="60"
                       value="${this._escapeHtml(item.custom_name || '')}"
                       placeholder="${this._escapeHtml(this._t('custom_name_placeholder'))}" />
                <button class="custom-name-save" title="${this._t('custom_name_save')}"><ha-icon icon="mdi:check"></ha-icon></button>
                <button class="custom-name-cancel" title="${this._t('custom_name_cancel')}"><ha-icon icon="mdi:close"></ha-icon></button>
            </div>`;
        }
        if (!canEdit) {
            if (!item.custom_name) return '';
            return `
            <div class="detail-row custom-name-row">
                <strong>${this._t('label_custom_name')}:</strong> ${this._escapeHtml(item.custom_name)}
            </div>`;
        }
        return `
        <div class="detail-row custom-name-row" data-key="${item.key}" data-carrier-type="${item.carrier_type || ''}">
            ${item.custom_name
                ? `<strong>${this._t('label_custom_name')}:</strong> ${this._escapeHtml(item.custom_name)}
                   <button class="custom-name-edit-btn" title="${this._t('custom_name_edit')}"><ha-icon icon="mdi:pencil"></ha-icon></button>`
                : `<button class="custom-name-add-btn"><ha-icon icon="mdi:plus"></ha-icon> ${this._t('add_custom_name')}</button>`}
        </div>`;
    }

    _renderParcelItem(item, showCarrierIcon = false) {
        const isDelivered = item.delivered;
        const isLetter    = !!item.is_letter;
        const statusMsg   = item.status_message || (isLetter ? this._t('letterbox_mail') : (isDelivered ? this._t('status_delivered') : this._t('status_in_transit')));
        const dateLabel   = this._parcelDateLabel(item);
        const statusIcon  = isLetter ? 'mdi:email' : (isDelivered ? 'mdi:check-circle' : 'mdi:truck-delivery');
        const isSelected  = this._selectedParcel === item.key;
        // Only used in the flat (group_by_carrier: false) list — the grouped view already
        // identifies the carrier via its section header, so repeating it per row there would
        // just be clutter. A tinted generic status icon alone is too subtle to tell carriers
        // apart at a glance when their brand colours are close (e.g. PostNL orange vs DHL
        // yellow/orange) — the carrier's own icon shape is unambiguous regardless of colour.
        const carrierIconHtml = showCarrierIcon
            ? `<ha-icon class="ph-carrier-icon" icon="${item.carrier_icon || DEFAULT_CARRIER_ICON}" style="color:${item.carrier_color || DEFAULT_CARRIER_COLOR};"></ha-icon>`
            : '';

        // For placeholder letters: never show an image, always show "no image" text.
        // For real letters: prefer HA image entity picture, fall back to image_url.
        const letterIsPlaceholder = isLetter && !!item.is_placeholder_image;
        let letterThumb = '';
        if (isLetter && !letterIsPlaceholder) {
            letterThumb = item.image_entity_picture || item.image_url || '';
        }

        const deliveryDetail = typeof item.pickup === 'boolean'
            ? `<div class="detail-row"><strong>${this._t('label_delivery')}:</strong> ${item.pickup ? `${this._t('pickup_point')}${item.pickup_point ? ` (${item.pickup_point})` : ''}` : this._t('home_delivery')}</div>`
            : (item.pickup_point ? `<div class="detail-row"><strong>${this._t('label_pickup_point')}:</strong> ${item.pickup_point}</div>` : '');

        return `
        <div class="parcel ${isSelected ? 'selected' : ''}" data-key="${item.key}" style="--carrier-color:${item.carrier_color || DEFAULT_CARRIER_COLOR};">
            <div class="parcel-header" data-key="${item.key}">
                <div class="ph-left">
                    <span class="ph-name">${carrierIconHtml}${item.custom_name ? this._escapeHtml(item.custom_name) : (item.name || this._t('unknown'))}</span>
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
                ${letterThumb ? `<img class="letter-thumb" src="${letterThumb}" alt="${item.name || ''}"
                     data-letter-name="${item.name || ''}" data-letter-date="${dateLabel || ''}" data-letter-src="${letterThumb}"
                     onerror="this.style.display='none';this.nextElementSibling&&(this.nextElementSibling.style.display='flex');" />` : ''}
                ${isLetter && (!letterThumb || true) ? `<div class="detail-row letter-no-image" style="${letterThumb ? 'display:none;' : ''}"><ha-icon icon="mdi:email-outline"></ha-icon> ${this._t('no_image')}</div>` : ''}
                ${!isLetter && item.key ? `<div class="detail-row"><strong>${this._t('label_tracking')}:</strong> ${item.key}</div>` : ''}
                ${!isLetter && item.key && this._customNameScope() !== 'off' ? this._renderCustomNameRow(item) : ''}
                ${item.raw_status ? `<div class="detail-row"><strong>${this._t('label_status')}:</strong> ${item.raw_status}</div>` : ''}
                ${deliveryDetail}
                <div class="detail-row"><strong>${this._t('label_type')}:</strong> ${isLetter ? this._t('type_letter') : this._t('type_parcel')}</div>
                ${item.url && this.config.show_tracking_link !== false ? `<a href="${item.url}" target="_blank" class="btn-track">${this._t('open_tracking')}</a>` : ''}
            </div>
        </div>`;
    }

    // `group_by_carrier: false` (editor option) renders one flat list sorted purely by the
    // active `sort_order` — parcels from different carriers interleave directly by date instead
    // of being grouped into contiguous per-carrier sections (see GH issue #11 discussion: "eerste
    // volgende bezorging zou carrier onafhankelijk moeten zijn"). Each row still shows its own
    // carrier icon/colour via _renderParcelItem, so carrier identity isn't lost, just not grouped.
    _renderGroupedList(displayed) {
        if (displayed.length === 0) {
            return `<div class="empty-state">
                <ha-icon icon="mdi:package-variant-closed" style="width:48px;height:48px;margin-bottom:10px;"></ha-icon>
                <div>${this._t('no_parcels')}</div>
            </div>`;
        }
        if (this.config.group_by_carrier === false) {
            return displayed.map(item => this._renderParcelItem(item, true)).join('');
        }
        return this._groupByCarrier(displayed).map(group => `
            <div class="carrier-section">
                <div class="carrier-section-header" style="--carrier-color: ${group.color || DEFAULT_CARRIER_COLOR};">
                    <ha-icon icon="${group.icon || DEFAULT_CARRIER_ICON}"></ha-icon>
                    <span>${group.name}</span>
                    <span class="carrier-section-count">${group.items.length}</span>
                </div>
                ${group.items.map(item => this._renderParcelItem(item)).join('')}
            </div>`).join('');
    }

    _renderSplitSections(displayed) {
        const upcoming  = displayed.upcoming  || [];
        const delivered = displayed.delivered || [];
        if (upcoming.length === 0 && delivered.length === 0) {
            return `<div class="empty-state">
                <ha-icon icon="mdi:package-variant-closed" style="width:48px;height:48px;margin-bottom:10px;"></ha-icon>
                <div>${this._t('no_parcels')}</div>
            </div>`;
        }
        return `
            <div class="post-section">
                <div class="post-section-title">${this._t('post_section_upcoming')}</div>
                ${this._renderGroupedList(upcoming)}
            </div>
            <div class="post-section">
                <div class="post-section-title">${this._t('post_section_delivered')}</div>
                ${this._renderGroupedList(delivered)}
            </div>`;
    }

    renderList(displayed) {
        const listEl = this.shadowRoot.querySelector('.list');
        if (!listEl) return;
        const isSplitTab = this._activeTab === 'post' || this._activeTab === 'verzonden';
        listEl.innerHTML = isSplitTab
            ? this._renderSplitSections(displayed)
            : this._renderGroupedList(displayed);
        listEl.querySelectorAll('.parcel-header').forEach(el =>
            el.addEventListener('click', this.handleParcelClick.bind(this))
        );
        listEl.querySelectorAll('.letter-thumb').forEach(el =>
            el.addEventListener('click', this.handleLetterThumbClick.bind(this))
        );
        this._bindCustomNameEvents(listEl);
    }

    render() {
        const data = this.getData();

        if (!data) {
            this.shadowRoot.innerHTML = `<ha-card style="padding:16px;color:red;">
                ${this._t('error_no_carriers')}<br><br>${this._t('error_no_carriers_hint')}
            </ha-card>`;
            return;
        }

        const displayed      = this.getFilteredShipments(data);
        const lettersToday   = this.hasAnyLettersConfigured() ? this._countLettersToday(data) : null;
        const statsText      = `${data.onderweg.length} ${this._t('stats_in_transit')} • ${data.bezorgd.length} ${this._t('stats_recent')}${lettersToday !== null ? ` • ${lettersToday} ${this._t('stats_letters')}` : ''}`;
        const headerColor    = this.config.header_color    || 'var(--card-background-color)';
        const headerTextColor = this.config.header_text_color || 'var(--primary-text-color)';
        const showLettersTab = this.config.show_letters && this.hasAnyLettersConfigured();

        const cssBlock = `<style>
            :host {
                --accent: #ed8c00;
                --header-bg: ${headerColor};
                --header-text: ${headerTextColor};
                --bg-color: var(--card-background-color, white);
            }
            ha-card { background: var(--bg-color); color: var(--primary-text-color); overflow: hidden; border-radius: 12px; }
            .header { background: var(--header-bg); padding: 16px; color: var(--header-text); display: flex; align-items: center; gap: 12px; }
            .header-logo { height: 36px; max-width: 110px; border-radius: 6px; background: white; padding: 4px; box-sizing: border-box; object-fit: contain; flex-shrink: 0; }
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
            .header-animation { background-size: contain; background-position: center; background-repeat: no-repeat; padding: 16px; border-bottom: 1px solid var(--divider-color); height: 150px; box-sizing: border-box; }
            .header-animation.animation-active { background-image: none !important; background-color: var(--card-background-color); }
            .header-animation.combo-placeholder { background-image: none !important; background-color: var(--card-background-color); display: flex; flex-direction: column; padding: 0 !important; height: auto; min-height: 150px; }
            .header-animation.status-tracker-active { height: auto; min-height: 150px; padding-top: 14px; padding-bottom: 12px; }
            .status-tracker { display: flex; flex-direction: column; align-items: center; gap: 14px; }
            .status-steps { display: flex; align-items: flex-start; width: 100%; }
            /* Columns hold their 72px size as long as there's room; lines (flex-shrink: 20)
               absorb space pressure first so icons only shrink as a last resort on very
               narrow cards — keeps the row from overflowing on mobile without shrinking
               icons unnecessarily on normal-width cards. */
            .status-step-col { display: flex; flex-direction: column; align-items: center; flex: 0 1 72px; min-width: 40px; }
            .status-step-icon-wrap { position: relative; width: 100%; max-width: 72px; aspect-ratio: 1 / 1; border-radius: 16px; box-sizing: border-box; background: var(--secondary-background-color, #eee); border: 1px solid var(--divider-color); display: flex; align-items: center; justify-content: center; opacity: 0.5; filter: grayscale(70%); transition: opacity 0.2s ease, filter 0.2s ease, box-shadow 0.2s ease; }
            .status-step-icon-wrap.current, .status-step-icon-wrap.done { opacity: 1; filter: none; box-shadow: 0 0 0 2.5px var(--step-color); }
            .status-step-icon { width: 100%; height: 100%; object-fit: contain; padding: 6px; box-sizing: border-box; }
            .status-step-check { position: absolute; bottom: -7px; right: -7px; width: 26px; height: 26px; border-radius: 50%; background: var(--step-color); display: flex; align-items: center; justify-content: center; box-shadow: 0 0 0 3px var(--card-background-color, #fff); }
            .status-step-check ha-icon { --mdc-icon-size: 16px; color: #fff; }
            .status-step-label { margin-top: 7px; font-size: 11.5px; line-height: 1.2; text-align: center; color: var(--secondary-text-color); }
            .status-step-label.active { color: var(--primary-text-color); font-weight: 600; }
            .status-step-line { flex: 1 20 12px; min-width: 0; height: 2px; background: var(--divider-color); margin-top: 35px; }
            .status-step-line.done { background: var(--step-color); }
            .status-hero-row { display: flex; align-items: center; gap: 16px; width: 100%; box-sizing: border-box; }
            .status-hero { flex: 1 1 auto; min-width: 0; display: flex; align-items: center; justify-content: center; height: 118px; }
            .status-hero-img { max-height: 100%; max-width: 100%; object-fit: contain; }
            .status-hero-info { flex: 0 1 42%; text-align: left; display: flex; flex-direction: column; gap: 10px; }
            .status-hero-info-label { font-size: 14px; line-height: 1.35; color: var(--secondary-text-color); }
            .status-hero-info-time { font-size: 16px; line-height: 1.35; font-weight: 700; color: var(--primary-text-color); margin-top: 2px; }
            .combo-logo-row { display: flex; width: 100%; flex: 1 1 0; min-height: 90px; }
            .combo-logo-row:not(:last-child) { border-bottom: 1px solid var(--divider-color); }
            .combo-panel { flex: 1 1 0; min-width: 0; position: relative; display: flex; align-items: center; justify-content: center; overflow: hidden; }
            .combo-panel:not(:last-child)::after { content: ''; position: absolute; right: 0; top: 24%; bottom: 24%; width: 1px; background: var(--divider-color); opacity: 0.7; }
            .combo-panel-bg { position: absolute; inset: 0; background: var(--panel-color); opacity: 0.09; }
            .combo-logo { max-height: 46%; max-width: 62%; object-fit: contain; position: relative; z-index: 1; filter: drop-shadow(0 1px 3px rgba(0,0,0,0.15)); transition: transform 0.2s ease; }
            .combo-panel:hover .combo-logo { transform: scale(1.06); }
            .combo-logo-chip { width: 40px; height: 40px; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; position: relative; z-index: 1; box-shadow: 0 1px 4px rgba(0,0,0,0.25); }
            .combo-logo-chip ha-icon { --mdc-icon-size: 22px; }
            .visual-road { position: relative; flex: 1 1 auto; min-width: 0; height: 80px; display: flex; align-items: center; box-sizing: border-box; }
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
            .list { max-height: 420px; overflow-y: auto; }
            .empty-state { padding: 32px 16px; text-align: center; color: var(--secondary-text-color); }
            .carrier-section-header { display: flex; align-items: center; gap: 8px; padding: 10px 16px; background: var(--secondary-background-color); font-size: 0.8em; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; color: var(--carrier-color, var(--accent)); border-top: 1px solid var(--divider-color); }
            .carrier-section-header ha-icon { color: var(--carrier-color, var(--accent)); }
            .carrier-section-count { margin-left: auto; background: var(--carrier-color, var(--accent)); color: white; border-radius: 10px; padding: 1px 8px; font-size: 0.85em; }
            .post-section + .post-section { margin-top: 8px; padding-top: 8px; border-top: 1px solid var(--divider-color); }
            .post-section-title { padding: 12px 16px 4px; font-size: 0.95em; font-weight: 700; color: var(--primary-text-color); background: var(--card-background-color); }
            .parcel-header { padding: 16px; cursor: pointer; display: flex; justify-content: space-between; align-items: center; transition: background 0.2s; user-select: none; }
            .parcel-header:hover { background: var(--secondary-background-color); }
            .ph-left { display: flex; flex-direction: column; flex: 1; }
            .ph-name { font-weight: 600; font-size: 1em; margin-bottom: 4px; display: flex; align-items: center; }
            .ph-carrier-icon { width: 24px; height: 24px; margin-right: 8px; flex-shrink: 0; }
            .ph-status { font-size: 0.85em; color: var(--secondary-text-color); display: flex; align-items: center; gap: 10px; }
            .ph-status-icon { color: var(--carrier-color, var(--accent)); flex-shrink: 0; display: flex; align-items: center; }
            .ph-right { display: flex; flex-direction: column; align-items: flex-end; gap: 4px; }
            .ph-date { font-size: 0.85em; color: var(--secondary-text-color); }
            .chevron { transition: transform 0.3s; margin-left: 8px; }
            .selected .chevron { transform: rotate(180deg); color: var(--carrier-color, var(--accent)); }
            .details-panel { padding: 12px 16px; background: var(--secondary-background-color); border-top: 1px solid var(--divider-color); font-size: 0.9em; color: var(--secondary-text-color); display: none; max-height: 0; overflow: hidden; transition: max-height 0.3s ease-out; }
            .selected .details-panel { display: block; max-height: 200px; }
            .detail-row { margin-bottom: 6px; }
            .detail-row strong { color: var(--primary-text-color); }
            .btn-track { background: var(--carrier-color, var(--accent)); color: white; text-decoration: none; padding: 8px 16px; border-radius: 6px; font-size: 0.9em; font-weight: 600; display: inline-block; margin-top: 8px; transition: all 0.2s; }
            .btn-track:hover { box-shadow: 0 2px 8px rgba(0,0,0,0.25); }
            .custom-name-row { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }
            .custom-name-add-btn { background: none; border: none; color: var(--carrier-color, var(--accent)); cursor: pointer; font-size: 0.9em; font-weight: 600; padding: 2px 0; display: inline-flex; align-items: center; gap: 4px; }
            .custom-name-add-btn ha-icon { width: 16px; height: 16px; }
            .custom-name-edit-btn, .custom-name-save, .custom-name-cancel { background: none; border: none; color: var(--secondary-text-color); cursor: pointer; padding: 2px; display: inline-flex; align-items: center; border-radius: 4px; }
            .custom-name-edit-btn ha-icon, .custom-name-save ha-icon, .custom-name-cancel ha-icon { width: 16px; height: 16px; }
            .custom-name-edit-btn:hover, .custom-name-save:hover, .custom-name-cancel:hover { background: var(--divider-color); }
            .custom-name-save { color: var(--success-color, #4caf50); }
            .custom-name-cancel { color: var(--error-color, red); }
            .custom-name-input { flex: 1; min-width: 120px; padding: 6px 8px; border-radius: 4px; border: 1px solid var(--divider-color); background: var(--card-background-color); color: var(--primary-text-color); font-size: 0.9em; }
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
            .carrier-popup-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.7); display: none; align-items: center; justify-content: center; z-index: 9999; padding: 24px; box-sizing: border-box; }
            .carrier-popup-overlay.open { display: flex; }
            .carrier-popup-content { position: relative; background: var(--card-background-color, white); border-radius: 8px; width: 420px; max-width: 90vw; max-height: 85vh; display: flex; flex-direction: column; overflow: hidden; }
            .carrier-popup-header { display: flex; align-items: center; gap: 10px; padding: 16px 44px 16px 16px; font-weight: 600; font-size: 1.05em; color: var(--carrier-color, var(--accent)); border-bottom: 1px solid var(--divider-color); flex-shrink: 0; }
            .carrier-popup-header ha-icon { color: var(--carrier-color, var(--accent)); }
            .carrier-popup-body { overflow-y: auto; padding: 8px 0; }
            .add-parcel-container:empty { display: none; }
            .add-parcel-bar { padding: 10px 16px; border-top: 1px solid var(--divider-color); background: var(--secondary-background-color, #f5f5f5); }
            .add-parcel-toggle { display: inline-flex; align-items: center; gap: 6px; background: none; border: none; color: var(--accent); font-size: 0.9em; font-weight: 600; cursor: pointer; padding: 4px 0; font-family: inherit; }
            .add-parcel-toggle:hover { text-decoration: underline; }
            .add-parcel-row { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
            .add-parcel-select { flex: 0 1 auto; min-width: 0; max-width: 45%; padding: 8px 10px; font-size: 0.85em; border: 1px solid var(--divider-color); border-radius: 6px; background: var(--card-background-color, white); color: var(--primary-text-color); font-family: inherit; }
            .add-parcel-input { flex: 1 1 120px; min-width: 0; padding: 8px 10px; font-size: 0.9em; border: 1px solid var(--divider-color); border-radius: 6px; background: var(--card-background-color, white); color: var(--primary-text-color); font-family: inherit; box-sizing: border-box; }
            .add-parcel-input:focus { outline: none; border-color: var(--accent); }
            .add-parcel-submit { flex-shrink: 0; background: var(--accent); color: white; border: none; border-radius: 6px; padding: 8px 14px; font-size: 0.85em; font-weight: 600; cursor: pointer; font-family: inherit; }
            .add-parcel-submit:disabled { opacity: 0.6; cursor: default; }
            .add-parcel-submit:hover:not(:disabled) { box-shadow: 0 2px 6px rgba(0,0,0,0.2); }
            .add-parcel-cancel { flex-shrink: 0; background: none; border: none; color: var(--secondary-text-color); cursor: pointer; display: flex; align-items: center; padding: 6px; border-radius: 50%; }
            .add-parcel-cancel:hover { background: var(--divider-color); }
            .add-parcel-msg { margin-top: 8px; font-size: 0.85em; }
            .add-parcel-msg.success { color: var(--success-color, #4caf50); }
            .add-parcel-msg.error { color: var(--error-color, red); }
        </style>`;

        const headerLogo = (this.config.carriers || []).length === 1
            ? this._carrierBranding(this.config.carriers[0]).carrier_logo : '';

        const placeholderStyle = this.config.placeholder_image ? `style="background-image:url('${this.config.placeholder_image}')"` : '';

        const blocks = {
            header: this.config.show_header
                ? `<div class="header">
                    ${headerLogo ? `<img class="header-logo" src="${headerLogo}" alt="${this.config.carriers[0].name || ''}">` : ''}
                    <div class="header-info">
                        <span class="header-title">${this.config.title || 'Parcels'}</span>
                        <span class="header-stats">${statsText}</span>
                    </div>
                   </div>`
                : `<div class="stats-bar"><span class="stats-text">${statsText}</span></div>`,
            animation: this.config.show_placeholder !== false
                ? `<div class="header-animation" ${placeholderStyle}></div>` : '',
            tabs: `<div class="tabs">
                    <div class="tab ${this._activeTab === 'onderweg' ? 'active' : ''}" data-tab="onderweg">${this._t('tab_in_transit')}</div>
                    ${this.config.show_delivered ? `<div class="tab ${this._activeTab === 'bezorgd'  ? 'active' : ''}" data-tab="bezorgd">${this._t('tab_delivered')}</div>` : ''}
                    ${this.config.show_sent     ? `<div class="tab ${this._activeTab === 'verzonden' ? 'active' : ''}" data-tab="verzonden">${this._t('tab_sent')}</div>` : ''}
                    ${showLettersTab            ? `<div class="tab ${this._activeTab === 'post'      ? 'active' : ''}" data-tab="post">${this._t('tab_letters')}</div>` : ''}
                   </div>`,
            list: `<div class="list">${(this._activeTab === 'post' || this._activeTab === 'verzonden') ? this._renderSplitSections(displayed) : this._renderGroupedList(displayed)}</div>`
        };

        const layoutOrder = this.config.layout_order || ['header', 'animation', 'tabs', 'list'];
        this.shadowRoot.innerHTML = cssBlock + `<ha-card>${layoutOrder.map(b => blocks[b] || '').join('')}<div class="add-parcel-container">${this._renderAddParcelForm()}</div></ha-card>`;
        this._isRendered = true;

        this.shadowRoot.querySelectorAll('.tab').forEach(el =>
            el.addEventListener('click', this.handleTabClick.bind(this))
        );
        this.shadowRoot.querySelectorAll('.parcel-header').forEach(el =>
            el.addEventListener('click', this.handleParcelClick.bind(this))
        );
        this.shadowRoot.querySelectorAll('.letter-thumb').forEach(el =>
            el.addEventListener('click', this.handleLetterThumbClick.bind(this))
        );
        this._bindCustomNameEvents(this.shadowRoot);
        this._bindAddParcelEvents(this.shadowRoot.querySelector('.add-parcel-container'));
        this.updateAnimation(displayed);
    }
}

// ============================================================
// Editor
// ============================================================

class HkiParcelsCardEditor extends LitElement {
    static get properties() {
        return { hass: { type: Object }, _config: { attribute: false } };
    }

    constructor() {
        super();
        this._config = { carriers: [], layout_order: ['header', 'animation', 'tabs', 'list'] };
        this._openSections = {}; // tracks open state of advanced sections per carrier
    }

    // Shorthand: resolve a translation key using hass.language.
    _t(key) {
        return getT(this.hass?.language)[key] || key;
    }

    setConfig(config) {
        this._config = {
            title: 'Parcels',
            days_back: 90,
            show_delivered: true,
            show_sent: true,
            show_letters: true,
            show_animation: true,
            show_header: true,
            show_placeholder: true,
            show_tracking_link: true,
            show_add_parcel: true,
            custom_name_scope: 'everyone',
            sort_order: 'auto',
            group_by_carrier: true,
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

    _val(ev) { return window.HKI.getSelectValue(ev); }

    _emit() {
        this.dispatchEvent(new CustomEvent("config-changed", {
            detail: { config: this._config }, bubbles: true, composed: true
        }));
    }

    _changed(ev, explicitField = null) {
        ev.stopPropagation();
        const field = explicitField || ev.target?.dataset?.field;
        if (!field || !this._config) return;
        let value = this._val(ev);
        if (new Set(['days_back']).has(field)) value = parseInt(value, 10);
        if (new Set(['show_delivered','show_sent','show_letters','show_animation','show_header','show_placeholder','show_tracking_link','show_add_parcel','show_raw_status','group_by_carrier']).has(field))
            value = !!(ev.target?.checked ?? value);
        this._config = { ...this._config, [field]: value };
        this._emit();
    }

    _carrierChanged(index, field, ev) {
        ev.stopPropagation();
        const carriers = [...(this._config.carriers || [])];
        carriers[index] = { ...carriers[index], [field]: this._val(ev) };
        this._config = { ...this._config, carriers };
        this._emit();
    }

    _carrierTypeChanged(index, ev) {
        ev.stopPropagation();
        const type    = this._val(ev);
        const preset  = CARRIER_PRESETS[type] || CARRIER_PRESETS.custom;
        const carriers = [...(this._config.carriers || [])];
        const current = carriers[index] || {};
        const isSingle = preset.schema === 'single_entity';
        // Auto-detect account when changing type (use existing user if already set).
        const detected     = !isSingle ? this._detectUsers(type) : [];
        const detectedEntry = detected.length === 1 ? detected[0] : null;
        const autoUser     = current.user != null ? current.user : (detectedEntry?.user ?? '');
        const slugFirst    = detectedEntry?.slugFirst ?? false;
        const templated    = !isSingle && detectedEntry !== null ? buildTemplatedEntities(autoUser, type, slugFirst, this.hass, detectedEntry?.deviceId) : {};
        carriers[index] = {
            ...current, type,
            name: preset.label, icon: getDefaultIcon(type), color: preset.color, schema: preset.schema,
            user: autoUser,
            _slugFirst: slugFirst,
            _manualUser: !!current.user,
            entity_incoming:    isSingle ? '' : (templated.entity_incoming    ?? current.entity_incoming    ?? ''),
            entity_delivered:   isSingle ? '' : (templated.entity_delivered   ?? current.entity_delivered   ?? ''),
            entity_outgoing:    (isSingle || preset.supports_outgoing === false) ? '' : (templated.entity_outgoing    ?? current.entity_outgoing    ?? ''),
            entity_outgoing_delivered: (isSingle || preset.supports_outgoing === false) ? '' : (templated.entity_outgoing_delivered ?? current.entity_outgoing_delivered ?? ''),
            entity:             isSingle ? (current.entity ?? '') : '',
            distribution_entity:isSingle ? (current.distribution_entity ?? '') : '',
            entity_letters:     preset.supports_letters ? (templated.entity_letters ?? current.entity_letters ?? '') : ''
        };
        this._config = { ...this._config, carriers };
        this._emit();
    }

    _carrierUserChanged(index, ev) {
        ev.stopPropagation();
        const user    = this._val(ev);
        const carriers = [...(this._config.carriers || [])];
        const current = carriers[index] || {};
        const templated = buildTemplatedEntities(user, current.type, false, this.hass);
        const preset = CARRIER_PRESETS[current.type] || CARRIER_PRESETS.custom;
        carriers[index] = {
            ...current, user,
            entity_incoming:  templated.entity_incoming  ?? current.entity_incoming  ?? '',
            entity_delivered: templated.entity_delivered ?? current.entity_delivered ?? '',
            entity_outgoing:  preset.supports_outgoing === false ? '' : (templated.entity_outgoing  ?? current.entity_outgoing  ?? ''),
            entity_outgoing_delivered: preset.supports_outgoing === false ? '' : (templated.entity_outgoing_delivered ?? current.entity_outgoing_delivered ?? ''),
            entity_letters:   preset.supports_letters
                ? (templated.entity_letters ?? current.entity_letters ?? '') : ''
        };
        this._config = { ...this._config, carriers };
        this._emit();
    }

    _addCarrier() {
        const type   = 'postnl_v4';
        const preset = CARRIER_PRESETS[type];
        // Auto-detect user for the default carrier type immediately.
        const detected  = this._detectUsers(type);
        const autoEntry = detected.length === 1 ? detected[0] : null;
        const autoUser  = autoEntry?.user ?? null;
        const slugFirst = autoEntry?.slugFirst ?? false;
        const templated = autoUser !== null ? buildTemplatedEntities(autoUser, type, slugFirst, this.hass, autoEntry?.deviceId) : {};
        const carriers = [...(this._config.carriers || []), {
            type, name: preset.label, icon: getDefaultIcon(type), color: preset.color,
            schema: preset.schema, logo_path: '', van_path: '', banner_path: '',
            user: autoUser ?? '',
            _slugFirst: slugFirst,
            entity_incoming:  templated.entity_incoming  || '',
            entity_delivered: templated.entity_delivered || '',
            entity_outgoing:  templated.entity_outgoing  || '',
            entity_outgoing_delivered: templated.entity_outgoing_delivered || '',
            entity_letters:   preset.supports_letters ? (templated.entity_letters || '') : '',
            _expanded: true,
            _manualUser: false
        }];
        this._config = { ...this._config, carriers };
        this._emit();
    }

    _removeCarrier(index) {
        const carriers = (this._config.carriers || []).filter((_, i) => i !== index);
        this._config = { ...this._config, carriers };
        this._emit();
    }

    _toggleCarrierExpanded(index) {
        const carriers = [...(this._config.carriers || [])];
        carriers[index] = { ...carriers[index], _expanded: !carriers[index]?._expanded };
        this._config = { ...this._config, carriers };
        this._emit();
    }

    _moveBlock(index, direction) {
        const newOrder = [...this._config.layout_order];
        if (direction === 'up' && index > 0)
            [newOrder[index], newOrder[index - 1]] = [newOrder[index - 1], newOrder[index]];
        else if (direction === 'down' && index < newOrder.length - 1)
            [newOrder[index], newOrder[index + 1]] = [newOrder[index + 1], newOrder[index]];
        this._config = { ...this._config, layout_order: newOrder };
        this._emit();
    }

    // Returns { user, slugFirst }[] for all detected accounts of a carrier type.
    // Thin wrapper — see the module-level detectCarrierUsers() above, shared
    // with HkiParcelsCard.getStubConfig().
    _detectUsers(carrierType) {
        return detectCarrierUsers(this.hass, carrierType);
    }

    // Sanitizes free-text account input: lowercase, non-alnum → underscore, trim underscores.
    // Dutch postcodes (e.g. "1234 AB", used as the GLS hub identifier) are a special case:
    // HA's entity_id has no separator between the digits and letters, so the space is
    // stripped outright rather than turned into an underscore ("1234 AB" → "1234ab").
    _sanitizeUserInput(value) {
        const raw = String(value || '').trim();
        const postcodeMatch = raw.match(/^(\d{4})\s*([a-zA-Z]{2})$/);
        if (postcodeMatch) return (postcodeMatch[1] + postcodeMatch[2]).toLowerCase();
        return raw.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
    }

    _carrierUserInputChanged(index, ev) {
        ev.stopPropagation();
        const raw  = ev.target?.value ?? '';
        const user = this._sanitizeUserInput(raw);
        // Show sanitized result after the user finishes typing (on change/blur).
        if (ev.target && ev.target.value !== user) ev.target.value = user;
        const carriers = [...(this._config.carriers || [])];
        const current  = carriers[index] || {};
        const slugFirst = current._slugFirst ?? false;
        const templated = buildTemplatedEntities(user, current.type, slugFirst, this.hass);
        const preset = CARRIER_PRESETS[current.type] || CARRIER_PRESETS.custom;
        carriers[index] = {
            ...current, user,
            entity_incoming:  templated.entity_incoming  ?? current.entity_incoming  ?? '',
            entity_delivered: templated.entity_delivered ?? current.entity_delivered ?? '',
            entity_outgoing:  preset.supports_outgoing === false ? '' : (templated.entity_outgoing  ?? current.entity_outgoing  ?? ''),
            entity_outgoing_delivered: preset.supports_outgoing === false ? '' : (templated.entity_outgoing_delivered ?? current.entity_outgoing_delivered ?? ''),
            entity_letters:   preset.supports_letters ? (templated.entity_letters ?? current.entity_letters ?? '') : ''
        };
        this._config = { ...this._config, carriers };
        this._emit();
    }

    _carrierUserSelected(index, user) {
        const carriers = [...(this._config.carriers || [])];
        const current  = carriers[index] || {};
        const detected = this._detectUsers(current.type);
        const entry    = detected.find(d => d.user === user);
        const slugFirst = entry?.slugFirst ?? current._slugFirst ?? false;
        const templated = buildTemplatedEntities(user, current.type, slugFirst, this.hass, entry?.deviceId);
        const supportsLetters = (CARRIER_PRESETS[current.type] || CARRIER_PRESETS.custom).supports_letters;
        carriers[index] = {
            ...current, user,
            _slugFirst: slugFirst,
            entity_incoming:  templated.entity_incoming  ?? '',
            entity_delivered: templated.entity_delivered ?? '',
            entity_outgoing:  templated.entity_outgoing  ?? '',
            entity_outgoing_delivered: templated.entity_outgoing_delivered ?? '',
            entity_letters:   supportsLetters ? (templated.entity_letters ?? '') : ''
        };
        this._config = { ...this._config, carriers };
        this._emit();
    }

    static get styles() {
        return css`
            .card-config { padding: 16px; }
            .section-details { margin-bottom: 8px; }
            .section-details summary { list-style: none; }
            .section-details summary::-webkit-details-marker { display: none; }
            .section { margin-top: 24px; margin-bottom: 12px; font-weight: 600; font-size: 14px; color: var(--primary-text-color); text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 2px solid var(--divider-color); padding-bottom: 8px; cursor: pointer; user-select: none; display: flex; align-items: center; justify-content: space-between; }
            .section::after { content: '▾'; font-size: 12px; transition: transform 0.2s ease; }
            .section-details:not([open]) .section::after { transform: rotate(-90deg); }
            .helper-text { font-size: 12px; color: var(--secondary-text-color); margin: 4px 0 16px 0; font-style: italic; }
            ha-selector, ha-textfield { width: 100%; margin-bottom: 16px; }
            .plain-field { margin-bottom: 16px; }
            .plain-field label { display: block; font-size: 12px; color: var(--secondary-text-color); margin-bottom: 4px; }
            .plain-field input { width: 100%; box-sizing: border-box; padding: 10px 12px; font-size: 14px; border: 1px solid var(--divider-color); border-radius: 4px; background: var(--card-background-color, white); color: var(--primary-text-color); font-family: inherit; }
            .plain-field input:focus { outline: none; border-color: var(--primary-color, #03a9f4); }
            .switch-row { display: flex; align-items: center; gap: 16px; margin-bottom: 8px; width: 100%; }
            .switch-row ha-switch { flex-shrink: 0; margin-bottom: 0; }
            .switch-row span { font-size: 14px; color: var(--primary-text-color); flex: 1; line-height: 1.4; }
            .sort-item { display: flex; align-items: center; gap: 8px; background: var(--secondary-background-color); border: 1px solid var(--divider-color); padding: 8px 12px; margin-bottom: 8px; border-radius: 4px; }
            .sort-actions { display: flex; align-items: center; flex-shrink: 0; }
            .sort-label { font-weight: 500; text-transform: capitalize; }
            .carrier-card { border: 1px solid var(--divider-color); border-radius: 8px; padding: 12px; margin-bottom: 16px; background: var(--secondary-background-color); }
            .carrier-card-header { display: flex; justify-content: space-between; align-items: center; font-weight: 600; cursor: pointer; user-select: none; }
            .carrier-card-header-title { display: flex; align-items: center; gap: 8px; }
            .carrier-card-header-title .chevron { transition: transform 0.2s ease; flex-shrink: 0; }
            .carrier-card-header-title .chevron.expanded { transform: rotate(90deg); }
            .carrier-card-body { margin-top: 12px; }
            .advanced-toggle { margin-top: 8px; margin-bottom: 4px; cursor: pointer; font-size: 13px; color: var(--secondary-text-color); padding: 6px 12px; user-select: none; border: 1px solid var(--divider-color); border-radius: 4px; display: inline-flex; align-items: center; gap: 6px; }
            .advanced-toggle:hover { background: var(--card-background-color, white); color: var(--primary-text-color); }
            .advanced-toggle .adv-chevron { font-size: 10px; transition: transform 0.15s ease; }
            .advanced-toggle.open .adv-chevron { transform: rotate(90deg); }
            .advanced-body { padding: 12px 0 4px 0; }
            .color-default-btn { background: none; border: 1px solid var(--divider-color); border-radius: 4px; padding: 3px 8px; font-size: 11px; cursor: pointer; color: var(--secondary-text-color); white-space: nowrap; }
            .color-default-btn:hover:not(:disabled) { background: var(--secondary-background-color); }
            .color-default-btn:disabled { opacity: 0.45; cursor: default; }
            .templated-preview { background: var(--card-background-color, white); border: 1px solid var(--divider-color); border-radius: 4px; padding: 8px 12px; margin-bottom: 16px; font-family: monospace; font-size: 11px; color: var(--secondary-text-color); line-height: 1.6; }
            .inline-fields-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 16px; }
            ha-icon-button.danger { color: var(--error-color, red); }
            .plain-button { margin-top: 4px; padding: 8px 16px; font-size: 14px; font-weight: 500; color: var(--primary-color, #03a9f4); background: transparent; border: 1px solid var(--primary-color, #03a9f4); border-radius: 4px; cursor: pointer; font-family: inherit; }
            .plain-button:hover { background: rgba(3,169,244,0.08); }
            .warning-box-details { background-color: var(--secondary-background-color); border: 1px solid var(--divider-color); border-left: 4px solid #ed8c00; padding: 12px; margin-bottom: 24px; font-size: 13px; line-height: 1.4; border-radius: 4px; color: var(--primary-text-color); }
            .warning-title { font-weight: bold; font-size: 14px; cursor: pointer; user-select: none; }
            .warning-box-details a { color: var(--primary-color, #03a9f4); text-decoration: underline; }

            /* sensor auto-detection */
            .detected-row { display: flex; align-items: center; gap: 10px; background: var(--card-background-color, white); border: 1px solid var(--divider-color); border-radius: 6px; padding: 10px 12px; margin-bottom: 12px; }
            .detected-icon { width: 22px; height: 22px; flex-shrink: 0; }
            .detected-icon.ok   { color: var(--success-color, #4caf50); }
            .detected-icon.multi{ color: var(--primary-color, #03a9f4); }
            .detected-icon.none { color: var(--warning-color, #ff9800); }
            .detected-info { flex: 1; display: flex; flex-direction: column; gap: 2px; }
            .detected-label { font-size: 12px; color: var(--secondary-text-color); font-style: italic; }
            .detected-value { font-size: 13px; font-weight: 600; color: var(--primary-text-color); font-family: monospace; }
            .detected-override { background: none; border: 1px solid var(--divider-color); border-radius: 4px; padding: 4px 8px; cursor: pointer; color: var(--secondary-text-color); font-size: 14px; flex-shrink: 0; }
            .detected-override:hover { background: var(--secondary-background-color); color: var(--primary-text-color); }

            /* appearance override */
            .appearance-row { display: flex; align-items: center; gap: 10px; margin-bottom: 12px; }
            .appearance-preview { width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; background: var(--card-background-color, white); border: 1px solid var(--divider-color); border-radius: 8px; flex-shrink: 0; }
            .appearance-field-grow { flex: 1; }
            .appearance-field-grow ha-selector { width: 100%; }
            .color-row { display: flex; align-items: center; gap: 8px; margin-bottom: 16px; flex-wrap: wrap; }
            .color-label { font-size: 12px; color: var(--secondary-text-color); white-space: nowrap; }
            .color-input-wrap { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
            .color-swatch { width: 40px; height: 32px; border: 1px solid var(--divider-color); border-radius: 4px; cursor: pointer; padding: 2px; background: none; flex-shrink: 0; }
            .color-hex-input { font-family: monospace; font-size: 13px; color: var(--primary-text-color); width: 90px; padding: 4px 8px; border: 1px solid var(--divider-color); border-radius: 4px; background: var(--card-background-color, white); box-sizing: border-box; }
            .color-hex-input:focus { outline: none; border-color: var(--primary-color, #03a9f4); }

            /* URL field with preview */
            .url-field { margin-bottom: 8px; }
            .url-input-row { display: flex; gap: 4px; align-items: center; }
            .url-input-row input { flex: 1; min-width: 0; }
            .browse-btn { flex-shrink: 0; background: var(--secondary-background-color, #2d2d2d); border: 1px solid var(--divider-color); border-radius: 4px; padding: 0 8px; cursor: pointer; color: var(--primary-text-color); display: flex; align-items: center; height: 38px; gap: 4px; font-size: 12px; white-space: nowrap; }
            .browse-btn:hover { background: var(--primary-color, #03a9f4); color: white; border-color: var(--primary-color, #03a9f4); }
            .browse-btn ha-icon { --mdc-icon-size: 16px; }
            .url-preview-wrap { padding: 6px 0 10px; }
            .url-preview { max-height: 56px; max-width: 120px; object-fit: contain; border-radius: 4px; border: 1px solid var(--divider-color); background: white; padding: 4px; display: block; }
            .url-preview-error { display: flex; align-items: center; gap: 6px; font-size: 12px; color: var(--error-color, red); }
        `;
    }

    // Opens a custom media browser overlay above all HA dialogs (z-index 100000).
    // First tries the native HA dialog-media-player-browse (action:'pick') if loaded;
    // falls back to our own WebSocket-based media browser otherwise.
    _openImageBrowser(onSelect) {
        if (!this.hass) return;
        // --- Try native HA media browser dialog ---
        const dialogTag = 'dialog-media-player-browse';
        if (customElements.get(dialogTag)) {
            const entityId = Object.keys(this.hass.states).find(id => id.startsWith('media_player.'));
            if (entityId) {
                const haRoot = document.querySelector('home-assistant');
                if (haRoot) {
                    haRoot.dispatchEvent(new CustomEvent('show-dialog', {
                        bubbles: true,
                        composed: true,
                        detail: {
                            dialogTag,
                            dialogParams: {
                                entityId,
                                action: 'pick',
                                mediaPickedCallback: (item) => {
                                    const url = item?.media_content_id || item?.thumbnail;
                                    if (url) onSelect(url);
                                },
                            },
                        },
                    }));
                    return;
                }
            }
        }
        // --- Fall back to own media browser ---
        // Use showModal() so our dialog enters the browser top-layer above HA's own dialog.
        const backdropStyle = document.createElement('style');
        backdropStyle.textContent = '#hki-media-picker::backdrop{background:rgba(0,0,0,0.65);}';
        document.head.appendChild(backdropStyle);

        const dlg = document.createElement('dialog');
        dlg.id = 'hki-media-picker';
        dlg.style.cssText = 'padding:0;border:none;border-radius:12px;background:transparent;width:520px;max-width:93vw;max-height:82vh;overflow:hidden;box-shadow:0 12px 40px rgba(0,0,0,0.6);';

        const close = () => {
            dlg.close();
            if (dlg.parentNode) dlg.parentNode.removeChild(dlg);
            if (backdropStyle.parentNode) backdropStyle.parentNode.removeChild(backdropStyle);
            blobUrls.forEach(u => URL.revokeObjectURL(u));
        };

        dlg.addEventListener('cancel', close); // ESC key

        const panel = document.createElement('div');
        panel.style.cssText = 'background:var(--card-background-color,#1c1c1c);width:100%;max-height:82vh;display:flex;flex-direction:column;overflow:hidden;border-radius:12px;';

        // Header
        const header = document.createElement('div');
        header.style.cssText = 'display:flex;align-items:center;gap:8px;padding:16px 16px 0;flex-shrink:0;';
        const breadcrumb = document.createElement('div');
        breadcrumb.style.cssText = 'flex:1;font-size:15px;font-weight:500;color:var(--primary-text-color,#fff);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;';
        breadcrumb.textContent = this._t('browse_media');
        const closeBtn = document.createElement('button');
        closeBtn.innerHTML = '✕';
        closeBtn.style.cssText = 'background:none;border:none;cursor:pointer;font-size:20px;color:var(--secondary-text-color,#aaa);line-height:1;padding:4px 6px;flex-shrink:0;';
        closeBtn.onclick = close;
        header.appendChild(breadcrumb);
        header.appendChild(closeBtn);

        // Manual URL input
        const urlRow = document.createElement('div');
        urlRow.style.cssText = 'display:flex;gap:8px;padding:12px 16px 0;flex-shrink:0;';
        const urlInput = document.createElement('input');
        urlInput.type = 'text';
        urlInput.placeholder = '/local/afbeelding.png  of  https://...';
        urlInput.style.cssText = 'flex:1;min-width:0;padding:7px 10px;font-size:13px;border:1px solid var(--divider-color,#444);border-radius:4px;background:var(--secondary-background-color,#2d2d2d);color:var(--primary-text-color,#fff);font-family:inherit;box-sizing:border-box;';
        const urlOk = document.createElement('button');
        urlOk.textContent = 'OK';
        urlOk.style.cssText = 'padding:7px 14px;background:var(--primary-color,#03a9f4);color:white;border:none;border-radius:4px;cursor:pointer;font-weight:500;font-size:13px;';
        urlOk.onclick = () => { const v = urlInput.value.trim(); if (v) { onSelect(v); close(); } };
        urlRow.appendChild(urlInput);
        urlRow.appendChild(urlOk);

        const divLabel = document.createElement('div');
        divLabel.style.cssText = 'padding:10px 16px 4px;font-size:11px;color:var(--secondary-text-color,#888);text-transform:uppercase;letter-spacing:0.05em;flex-shrink:0;';
        divLabel.textContent = 'Mediabibliotheek';

        const content = document.createElement('div');
        content.style.cssText = 'flex:1;overflow-y:auto;padding:0 16px 16px;min-height:80px;';

        panel.appendChild(header);
        panel.appendChild(urlRow);
        panel.appendChild(divLabel);
        panel.appendChild(content);
        dlg.appendChild(panel);
        document.body.appendChild(dlg);
        dlg.showModal();

        const stack = [];
        const blobUrls = []; // track for cleanup on close

        // Get the HA auth token from any available source.
        const getToken = () =>
            this.hass.auth?.data?.access_token
            || this.hass.connection?.options?.auth?.data?.access_token
            || JSON.parse(localStorage.getItem('hassTokens') || 'null')?.access_token;

        // Load thumbnail: first try direct (session cookie), then fetch with Bearer token.
        const loadThumb = (imgEl, url, onFail) => {
            if (!url) { onFail(); return; }
            imgEl.src = url;
            imgEl.onerror = () => {
                const token = getToken();
                if (!token) { onFail(); return; }
                imgEl.onerror = () => onFail();
                fetch(url, { headers: { Authorization: `Bearer ${token}` } })
                    .then(r => { if (!r.ok) throw new Error(); return r.blob(); })
                    .then(blob => {
                        const bUrl = URL.createObjectURL(blob);
                        blobUrls.push(bUrl);
                        imgEl.src = bUrl;
                    })
                    .catch(() => onFail());
            };
        };

        const MEDIA_EMOJI = { music: '🎵', audio: '🎵', podcast: '🎙', video: '🎬', movie: '🎬', tv_show: '📺', episode: '📺', channel: '📺', app: '📱', url: '🔗', image: '🖼', photo: '🖼' };

        // Convert media-source://media_source/local/path → /local/path (served via HA's static file server)
        const mediaSourceToLocal = (id) => {
            if (!id) return null;
            if (id.startsWith('media-source://media_source/local/')) {
                return id.slice('media-source://media_source'.length);
            }
            return null;
        };

        const showImageInThumb = (thumb, url) => {
            const img = document.createElement('img');
            img.alt = '';
            img.style.cssText = 'max-width:100%;max-height:72px;object-fit:contain;';
            const onFail = () => { img.remove(); thumb.textContent = '🖼'; thumb.style.fontSize = '28px'; };
            thumb.textContent = '';
            thumb.appendChild(img);
            loadThumb(img, url, onFail);
        };

        const renderItems = (items) => {
            content.innerHTML = '';
            if (stack.length > 0) {
                const back = document.createElement('button');
                back.innerHTML = '&#8592; Terug';
                back.style.cssText = 'display:inline-flex;align-items:center;gap:4px;margin-bottom:10px;background:none;border:1px solid var(--divider-color,#444);border-radius:4px;padding:4px 10px;cursor:pointer;color:var(--primary-text-color,#fff);font-size:13px;';
                back.onclick = () => { stack.pop(); browse(stack.length ? stack[stack.length-1].id : 'media-source://media_source/local'); breadcrumb.textContent = stack.length ? stack[stack.length-1].title : this._t('browse_media'); };
                content.appendChild(back);
            }
            if (!items || items.length === 0) {
                const msg = document.createElement('div');
                msg.style.cssText = 'text-align:center;padding:32px 0;color:var(--secondary-text-color,#aaa);font-size:13px;font-style:italic;';
                msg.textContent = 'Geen bestanden gevonden';
                content.appendChild(msg);
                return;
            }
            const grid = document.createElement('div');
            grid.style.cssText = 'display:grid;grid-template-columns:repeat(auto-fill,minmax(96px,1fr));gap:8px;';
            items.forEach(item => {
                const isFolder = item.can_expand;
                const isImage = ['image', 'photo'].includes(item.media_class);
                const cell = document.createElement('div');
                cell.style.cssText = 'cursor:pointer;border:2px solid transparent;border-radius:6px;overflow:hidden;background:var(--secondary-background-color,#2a2a2a);';
                cell.title = item.title;
                const thumb = document.createElement('div');
                thumb.style.cssText = 'width:100%;height:72px;display:flex;align-items:center;justify-content:center;overflow:hidden;';
                const defaultEmoji = isFolder ? '📁' : (MEDIA_EMOJI[item.media_class] || '📄');
                thumb.textContent = defaultEmoji;
                thumb.style.fontSize = '28px';

                if (!isFolder) {
                    if (item.thumbnail && !item.thumbnail.startsWith('media-source:')) {
                        // HA provided a usable thumbnail URL — load it with auth support
                        showImageInThumb(thumb, item.thumbnail);
                    } else if (isImage && item.media_content_id) {
                        // Image file: convert media-source://media_source/local/... → /local/...
                        const localUrl = mediaSourceToLocal(item.media_content_id);
                        if (localUrl) showImageInThumb(thumb, localUrl);
                    }
                }

                const lbl = document.createElement('div');
                lbl.textContent = item.title;
                lbl.style.cssText = 'font-size:10px;color:var(--secondary-text-color,#aaa);padding:3px 5px 5px;text-overflow:ellipsis;overflow:hidden;white-space:nowrap;';
                cell.appendChild(thumb);
                cell.appendChild(lbl);
                cell.addEventListener('mouseenter', () => cell.style.borderColor = 'var(--primary-color,#03a9f4)');
                cell.addEventListener('mouseleave', () => cell.style.borderColor = 'transparent');
                cell.addEventListener('click', () => {
                    if (isFolder) {
                        stack.push({ id: item.media_content_id, title: item.title });
                        breadcrumb.textContent = item.title;
                        browse(item.media_content_id);
                    } else {
                        const id = item.media_content_id;
                        const thumb = item.thumbnail;
                        // Never save media-source:// URLs — convert to /local/ path instead
                        const localUrl = mediaSourceToLocal(id);
                        const url = (thumb && !thumb.startsWith('media-source:')) ? thumb : (localUrl || id);
                        onSelect(url);
                        close();
                    }
                });
                grid.appendChild(cell);
            });
            content.appendChild(grid);
        };

        const browse = async (mediaContentId) => {
            content.innerHTML = '<div style="text-align:center;padding:32px;color:var(--secondary-text-color,#aaa);font-size:13px;">Laden…</div>';
            try {
                if (!this.hass?.callWS) throw new Error('callWS not available');
                const result = await this.hass.callWS({
                    type: 'media_source/browse_media',
                    media_content_id: mediaContentId,
                });
                renderItems(result.children || []);
            } catch (err) {
                // Fallback: show image.* entities from HA state machine
                if (!this.hass?.states) {
                    content.innerHTML = '<div style="text-align:center;padding:32px;color:var(--secondary-text-color,#aaa);font-size:13px;">Geen verbinding met Home Assistant.</div>';
                    return;
                }
                const imageEntities = Object.entries(this.hass.states)
                    .filter(([id, s]) => id.startsWith('image.') && s.state !== 'unavailable')
                    .map(([id, s]) => ({
                        media_content_id: id,
                        title: s.attributes?.friendly_name || id.replace('image.', ''),
                        thumbnail: s.attributes?.entity_picture,
                        can_expand: false,
                        can_play: true,
                        media_class: 'image',
                    }))
                    .filter(i => i.thumbnail);

                if (imageEntities.length > 0) {
                    divLabel.textContent = 'Afbeeldingen in Home Assistant';
                    renderItems(imageEntities);
                } else {
                    content.innerHTML = '<div style="text-align:center;padding:32px;color:var(--secondary-text-color,#aaa);font-size:13px;">Geen mediabron beschikbaar — gebruik de URL invoer hierboven.</div>';
                }
            }
        };

        browse('media-source://media_source/local');
    }

    // Renders a URL input field with browse button and a small live image preview below it.
    _renderUrlField(label, value, placeholder, onChange) {
        return html`
            <div class="url-field">
                <div class="plain-field" style="margin-bottom:4px;">
                    <label>${label}</label>
                    <div class="url-input-row">
                        <input type="text" .value=${value || ''} placeholder="${placeholder}" @input=${onChange} />
                        <button class="browse-btn" title="${this._t('browse_media')}"
                            @click=${() => this._openImageBrowser((val) => onChange({ target: { value: val }, stopPropagation: () => {}, preventDefault: () => {} }))}>
                            <ha-icon icon="mdi:folder-open"></ha-icon>
                            ${this._t('browse_media')}
                        </button>
                    </div>
                </div>
                ${value ? html`
                    <div class="url-preview-wrap">
                        <img class="url-preview" src="${value}"
                            alt="${label}"
                            title="${label}"
                            @error=${(ev) => { ev.target.style.display = 'none'; ev.target.nextElementSibling?.style.setProperty('display','flex'); }}
                            @load=${(ev)  => { ev.target.style.display = 'block'; ev.target.nextElementSibling?.style.setProperty('display','none'); }} />
                        <div class="url-preview-error" style="display:none;">
                            <ha-icon icon="mdi:image-broken-variant"></ha-icon>
                            <span>${this._t('url_preview_fail')}</span>
                        </div>
                    </div>` : ''}
            </div>`;
    }

    // Renders a color swatch + hex input + always-visible Standaard button.
    _renderColorPicker(label, currentColor, defaultColor, onChange, onReset) {
        const isDefault = !currentColor || currentColor === defaultColor;
        return html`
            <div class="color-row">
                <label class="color-label">${label}</label>
                <div class="color-input-wrap">
                    <input type="color" class="color-swatch"
                        .value=${currentColor || defaultColor}
                        @input=${(ev) => onChange(ev.target.value)} />
                    <input type="text" class="color-hex-input"
                        .value=${currentColor || defaultColor}
                        placeholder="#rrggbb"
                        @change=${(ev) => {
                            const v = ev.target.value.trim();
                            if (/^#[0-9a-fA-F]{6}$/.test(v)) onChange(v);
                        }} />
                    <button class="color-default-btn"
                        ?disabled=${isDefault}
                        @click=${() => { if (!isDefault) onReset(); }}>
                        ${this._t('color_default')}
                    </button>
                </div>
            </div>`;
    }

    // Renders the "Advanced: appearance override" section with icon-picker, color swatch and image selectors.
    _renderAppearanceOverride(carrier, index, preset) {
        const assets       = CARRIER_ASSETS[carrier.type] || CARRIER_ASSETS.custom;
        const currentIcon  = carrier.icon  || preset.icon;
        const currentColor = carrier.color || preset.color;
        const sectionKey   = `appearance-${index}`;
        const isOpen       = !!this._openSections[sectionKey];

        return html`
            <div class="advanced-toggle ${isOpen ? 'open' : ''}"
                @click=${() => { this._openSections = { ...this._openSections, [sectionKey]: !isOpen }; this.requestUpdate(); }}>
                <span class="adv-chevron">▶</span>
                ${this._t('adv_appearance')}
            </div>
            ${isOpen ? html`
            <div class="advanced-body">
                <div class="helper-text">${this._t('appearance_help')}</div>

                <!-- Icon picker -->
                <div class="appearance-row">
                    <div class="appearance-preview">
                        <ha-icon icon="${currentIcon}" style="color:${currentColor}; width:28px; height:28px;"></ha-icon>
                    </div>
                    <div class="appearance-field-grow">
                        <ha-selector .hass=${this.hass}
                            .selector=${{ icon: {} }}
                            .value=${currentIcon}
                            .label=${this._t('label_icon_pick')}
                            @value-changed=${(ev) => {
                                ev.stopPropagation();
                                const carriers = [...(this._config.carriers || [])];
                                carriers[index] = { ...carriers[index], icon: ev.detail.value };
                                this._config = { ...this._config, carriers };
                                this._emit();
                            }}></ha-selector>
                    </div>
                </div>

                <!-- Color -->
                ${this._renderColorPicker(
                    this._t('label_color_pick'),
                    carrier.color,
                    preset.color,
                    (val) => {
                        const carriers = [...(this._config.carriers || [])];
                        carriers[index] = { ...carriers[index], color: val };
                        this._config = { ...this._config, carriers };
                        this._emit();
                    },
                    () => {
                        const carriers = [...(this._config.carriers || [])];
                        carriers[index] = { ...carriers[index], color: undefined };
                        this._config = { ...this._config, carriers };
                        this._emit();
                    }
                )}

                <!-- Logo -->
                ${this._renderUrlField(this._t('url_logo'), carrier.logo_path, assets.logo || 'https://...', (ev) => this._carrierChanged(index, 'logo_path', ev))}

                <!-- Vehicle GIF -->
                ${this._renderUrlField(this._t('url_van'), carrier.van_path, assets.van || 'https://...', (ev) => this._carrierChanged(index, 'van_path', ev))}

                <!-- Banner -->
                ${this._renderUrlField(this._t('url_banner'), carrier.banner_path, assets.banner || 'https://...', (ev) => this._carrierChanged(index, 'banner_path', ev))}
            </div>` : ''}`;
    }

    // Per-type wording for the "0 detected" manual account/postcode input — one entry per
    // account-less carrier (see CARRIER_PRESETS); everything else falls back to the generic
    // "account part of the sensor name" explanation built from the carrier's sensor_slug.
    _accountHelpText(carrierType, preset) {
        const key = {
            gls: 'gls_account_help',
            trunkrs: 'trunkrs_account_help',
            dragonfly: 'dragonfly_account_help',
            cainiao: 'cainiao_account_help',
            hermes: 'hermes_account_help',
            packeta: 'packeta_account_help',
            correos: 'correos_account_help',
            postnord: 'postnord_account_help',
            sameday: 'sameday_account_help',
            swiss_post: 'swiss_post_account_help',
            planzer: 'planzer_account_help',
            austrian_post: 'austrian_post_account_help',
            helthjem: 'helthjem_account_help',
            dynalogic: 'dynalogic_account_help',
            budbee: 'budbee_account_help',
            nova_post: 'nova_post_account_help',
            delhivery: 'delhivery_account_help',
            sunyou: 'sunyou_account_help',
        }[carrierType];
        if (key) return this._t(key);
        return html`"_${preset.sensor_slug}${this._t('account_help_suffix')}`;
    }

    // Renders the user/account detection block: badge if 1 found, dropdown if multiple, manual if none.
    // Never mutates state during render — auto-fill happens in _addCarrier / _carrierTypeChanged.
    _renderUserDetection(carrier, index, preset, supportsLetters, supportsOutgoing = true) {
        const detected   = this._detectUsers(carrier.type);
        const entityPreview = carrier.entity_incoming ? html`
            <div class="templated-preview">
                <div>${carrier.entity_incoming}</div>
                <div>${carrier.entity_delivered}</div>
                ${supportsOutgoing ? html`
                <div>${carrier.entity_outgoing}</div>
                <div>${carrier.entity_outgoing_delivered}</div>
                ` : ''}
                ${supportsLetters && carrier.entity_letters ? html`<div>${carrier.entity_letters}</div>` : ''}
            </div>` : '';

        // Single account found and not overridden by user → show auto-detected badge.
        if (detected.length === 1 && !carrier._manualUser) {
            return html`
                <div class="detected-row">
                    <ha-icon icon="mdi:check-circle" class="detected-icon ok"></ha-icon>
                    <div class="detected-info">
                        <div class="detected-label">${this._t('detected_one')}</div>
                        <div class="detected-value">${(carrier.user != null ? carrier.user : detected[0].user) || this._t('no_prefix')}</div>
                    </div>
                    <button class="detected-override" title="Enter manually"
                        @click=${() => {
                            const carriers = [...(this._config.carriers || [])];
                            carriers[index] = { ...carriers[index], _manualUser: true };
                            this._config = { ...this._config, carriers };
                            this._emit();
                        }}>✎</button>
                </div>
                ${entityPreview}`;
        }

        // Multiple accounts found and not overridden → show dropdown.
        if (detected.length > 1 && !carrier._manualUser) {
            return html`
                <div class="detected-row">
                    <ha-icon icon="mdi:account-multiple" class="detected-icon multi"></ha-icon>
                    <div class="detected-info detected-label">${this._t('detected_multiple')}</div>
                    <button class="detected-override" title="Enter manually"
                        @click=${() => {
                            const carriers = [...(this._config.carriers || [])];
                            carriers[index] = { ...carriers[index], _manualUser: true };
                            this._config = { ...this._config, carriers };
                            this._emit();
                        }}>✎</button>
                </div>
                <ha-selector .hass=${this.hass}
                    .selector=${{ select: {
                        options: detected.map(u => ({ value: u.user, label: u.user })),
                        mode: 'dropdown'
                    } }}
                    .value=${carrier.user || detected[0].user}
                    .label=${this._t('label_account')}
                    @value-changed=${(ev) => {
                        ev.stopPropagation();
                        this._carrierUserSelected(index, window.HKI.getSelectValue(ev));
                    }}></ha-selector>
                ${entityPreview}`;
        }

        // 0 detected and no manual override yet → if a known repo URL exists, show install link instead of input.
        if (detected.length === 0 && !carrier._manualUser) {
            const repoUrl = CARRIER_REPO_URLS[carrier.type];
            if (repoUrl) {
                return html`
                    <div class="detected-row">
                        <ha-icon icon="mdi:alert-circle-outline" class="detected-icon none"></ha-icon>
                        <div class="detected-info">
                            <div class="detected-label">${this._t('integration_not_found')}</div>
                            <a href="${repoUrl}" target="_blank" rel="noopener" style="font-size:12px;word-break:break-all;">${repoUrl}</a>
                        </div>
                        <button class="detected-override" title="Enter manually"
                            @click=${() => {
                                const carriers = [...(this._config.carriers || [])];
                                carriers[index] = { ...carriers[index], _manualUser: true };
                                this._config = { ...this._config, carriers };
                                this._emit();
                            }}>✎</button>
                    </div>`;
            }
        }

        // 0 detected OR user chose manual entry → text input with sanitization.
        return html`
            ${detected.length > 0 ? html`
                <div class="detected-row">
                    <ha-icon icon="mdi:pencil" class="detected-icon multi"></ha-icon>
                    <div class="detected-info detected-label">${this._t('label_account')}</div>
                    <button class="detected-override" title="Back to auto-detect"
                        @click=${() => {
                            const carriers = [...(this._config.carriers || [])];
                            carriers[index] = { ...carriers[index], _manualUser: false };
                            this._config = { ...this._config, carriers };
                            this._emit();
                        }}>↩</button>
                </div>` : html`
                <div class="detected-row">
                    <ha-icon icon="mdi:help-circle-outline" class="detected-icon none"></ha-icon>
                    <div class="detected-info detected-label">${this._t('detected_none')}</div>
                </div>`}
            <div class="plain-field" style="margin-top:8px;">
                <label for="hki-carrier-user-${index}">${this._t('label_account')}</label>
                <input id="hki-carrier-user-${index}" type="text" placeholder="${['gls', 'trunkrs'].includes(carrier.type) ? 'e.g. 1234ab' : 'e.g. my_account'}"
                    .value=${carrier.user || ''}
                    @change=${(ev) => this._carrierUserInputChanged(index, ev)} />
            </div>
            <div class="helper-text">${this._accountHelpText(carrier.type, preset)}</div>
            ${entityPreview}`;
    }

    _renderEntityPicker(label, value, helper, onChange) {
        return html`
            <div class="plain-field">
                <label>${label}</label>
                <input type="text" .value=${value || ''} placeholder="${helper || ''}" @change=${onChange} />
            </div>`;
    }

    _renderCarrier(carrier, index) {
        const expanded = carrier._expanded !== false;
        const preset   = CARRIER_PRESETS[carrier.type] || CARRIER_PRESETS.custom;
        const supportsLetters = preset.supports_letters;
        const supportsOutgoing = preset.supports_outgoing !== false;

        return html`
            <div class="carrier-card">
                <div class="carrier-card-header" @click=${() => this._toggleCarrierExpanded(index)}>
                    <div class="carrier-card-header-title">
                        <ha-icon class="chevron ${expanded ? 'expanded' : ''}" icon="mdi:chevron-right"></ha-icon>
                        <ha-icon icon="${carrier.icon || preset.icon}" style="color:${carrier.color || preset.color};"></ha-icon>
                        <span>${carrier.name || preset.label || `Carrier ${index + 1}`}</span>
                    </div>
                    <ha-icon-button class="danger" .path=${"M19,13H5V11H19V13Z"}
                        @click=${(ev) => { ev.stopPropagation(); this._removeCarrier(index); }}
                        title="${this._t('btn_remove_carrier')}"></ha-icon-button>
                </div>

                ${expanded ? html`
                <div class="carrier-card-body">
                    <ha-selector .hass=${this.hass}
                        .selector=${{ select: { options: [
                            { value: 'postnl_v4',     label: 'PostNL' },
                            { value: 'dhl',           label: 'DHL' },
                            { value: 'dpd',           label: 'DPD' },
                            { value: 'gls',           label: 'GLS' },
                            { value: 'dragonfly',     label: 'Dragonfly' },
                            { value: 'trunkrs',       label: 'Trunkrs' },
                            { value: 'cainiao',       label: 'Cainiao' },
                            { value: 'hermes',        label: 'Hermes' },
                            { value: 'packeta',       label: 'Packeta' },
                            { value: 'correos',       label: 'Correos' },
                            { value: 'vinted_go',     label: 'Vinted Go' },
                            { value: 'postnord',      label: 'PostNord' },
                            { value: 'sameday',       label: 'Sameday' },
                            { value: 'swiss_post',    label: 'Swiss Post' },
                            { value: 'planzer',       label: 'Planzer' },
                            { value: 'austrian_post', label: 'Austrian Post' },
                            { value: 'helthjem',      label: 'Helthjem' },
                            { value: 'dynalogic',     label: 'Dynalogic' },
                            { value: 'budbee',        label: 'Budbee' },
                            { value: 'nova_post',     label: 'Nova Post' },
                            { value: 'delhivery',     label: 'Delhivery' },
                            { value: 'sunyou',        label: 'SunYou' },
                            { value: 'postnl',        label: 'PostNL (<v4.x)' },
                            { value: 'postnl_legacy', label: 'PostNL (ArjenBos)' },
                            { value: 'custom',        label: 'Custom' }
                        ], mode: 'dropdown' } }}
                        .value=${carrier.type || 'postnl_v4'} .label=${"Carrier"}
                        @value-changed=${(ev) => this._carrierTypeChanged(index, ev)}></ha-selector>

                    ${carrier.type === 'custom' ? html`
                        <div class="plain-field">
                            <label for="hki-carrier-name-${index}">${this._t('label_carrier_name')}</label>
                            <input id="hki-carrier-name-${index}" type="text" .value=${carrier.name || ''}
                                @input=${(ev) => this._carrierChanged(index, 'name', ev)} />
                        </div>
                    ` : carrier.type === 'postnl_legacy' ? html`
                        <div class="helper-text">
                            ⚠ ${this._t('legacy_warning')}
                            (<a href="https://github.com/arjenbos/ha-postnl" target="_blank">arjenbos/ha-postnl</a>)
                        </div>
                        ${this._renderEntityPicker(this._t('postnl_entity_label'), carrier.entity, 'e.g. sensor.postnl_delivery', (ev) => this._carrierChanged(index, 'entity', ev))}
                        ${this._renderEntityPicker(this._t('postnl_dist_label'), carrier.distribution_entity, 'e.g. sensor.postnl_distribution', (ev) => this._carrierChanged(index, 'distribution_entity', ev))}
                    ` : this._renderUserDetection(carrier, index, preset, supportsLetters, supportsOutgoing)}

                    ${carrier.type !== 'postnl_legacy' ? (() => {
                        const sk = `sensors-${index}`;
                        const open = !!this._openSections[sk];
                        return html`
                        <div class="advanced-toggle ${open ? 'open' : ''}"
                            @click=${() => { this._openSections = { ...this._openSections, [sk]: !open }; this.requestUpdate(); }}>
                            <span class="adv-chevron">▶</span>
                            ${this._t('adv_sensors')}
                        </div>
                        ${open ? html`
                        <div class="advanced-body">
                            <div class="helper-text">${this._t('adv_sensors_help')}</div>
                            ${this._renderEntityPicker(this._t('entity_incoming'), carrier.entity_incoming, 'e.g. sensor.dhl_incoming_parcels', (ev) => this._carrierChanged(index, 'entity_incoming', ev))}
                            ${this._renderEntityPicker(this._t('entity_delivered'), carrier.entity_delivered, 'e.g. sensor.dhl_delivered_parcels', (ev) => this._carrierChanged(index, 'entity_delivered', ev))}
                            ${supportsOutgoing ? html`
                            ${this._renderEntityPicker(this._t('entity_outgoing'), carrier.entity_outgoing, 'e.g. sensor.dhl_outgoing_parcels', (ev) => this._carrierChanged(index, 'entity_outgoing', ev))}
                            ${this._renderEntityPicker(this._t('entity_outgoing_delivered'), carrier.entity_outgoing_delivered, 'e.g. sensor.dhl_outgoing_delivered_parcels', (ev) => this._carrierChanged(index, 'entity_outgoing_delivered', ev))}
                            ` : html`<div class="helper-text">${this._t('no_outgoing_support')}</div>`}
                            ${supportsLetters
                                ? this._renderEntityPicker(this._t('entity_letters'), carrier.entity_letters, this._t('letters_entity_help'), (ev) => this._carrierChanged(index, 'entity_letters', ev))
                                : html`<div class="helper-text">${this._t('no_letters_support')}</div>`}
                        </div>` : ''}`;
                    })() : ''}

                    ${this._renderAppearanceOverride(carrier, index, preset)}
                </div>` : ''}
            </div>`;
    }

    render() {
        if (!this._config) return html``;
        const carriers     = Array.isArray(this._config.carriers) ? this._config.carriers : [];
        const currentLayout = this._config.layout_order || ['header', 'animation', 'tabs', 'list'];
        const layoutLabels = {
            header:    this._t('layout_header'),
            animation: this._t('layout_animation'),
            tabs:      this._t('layout_tabs'),
            list:      this._t('layout_list')
        };

        return html`
            <div class="card-config">
                <details class="warning-box-details" open>
                    <summary class="warning-title">${this._t('editor_title')}</summary>
                    <div style="margin-top:8px;">${this._t('editor_intro1')}</div>
                    <div style="margin-top:8px;">${this._t('editor_intro2')}</div>
                </details>

                <details class="section-details" open>
                    <summary class="section">${this._t('section_basic')}</summary>
                    <div class="plain-field">
                        <label for="hki-title-input">${this._t('label_card_title')}</label>
                        <input id="hki-title-input" type="text" .value=${this._config.title || ''}
                            data-field="title" @input=${this._changed} />
                    </div>
                    <div class="plain-field">
                        <label for="hki-days-input">${this._t('label_days_back')}</label>
                        <input id="hki-days-input" type="number" .value=${String(this._config.days_back || 90)}
                            min="1" max="365" data-field="days_back" @input=${this._changed} />
                    </div>
                </details>

                <details class="section-details" open>
                    <summary class="section">${this._t('section_carriers')}</summary>
                    ${carriers.map((carrier, index) => this._renderCarrier(carrier, index))}
                    <button class="plain-button" @click=${() => this._addCarrier()}>${this._t('btn_add_carrier')}</button>
                </details>

                <details class="section-details">
                    <summary class="section">${this._t('section_layout')}</summary>
                    <div class="helper-text">${this._t('layout_help')}</div>
                    ${currentLayout.map((item, index) => html`
                        <div class="sort-item">
                            <div class="sort-actions">
                                <ha-icon-button .path=${"M7.41,15.41L12,10.83L16.59,15.41L18,14L12,8L6,14L7.41,15.41Z"}
                                    @click=${() => this._moveBlock(index, 'up')} ?disabled=${index === 0}></ha-icon-button>
                                <ha-icon-button .path=${"M7.41,8.59L12,13.17L16.59,8.59L18,10L12,16L6,10L7.41,8.59Z"}
                                    @click=${() => this._moveBlock(index, 'down')} ?disabled=${index === currentLayout.length - 1}></ha-icon-button>
                            </div>
                            <span class="sort-label">${layoutLabels[item] || item}</span>
                        </div>`)}
                </details>

                <details class="section-details">
                    <summary class="section">${this._t('section_display')}</summary>
                    <div class="switch-row"><ha-switch .checked=${this._config.show_header !== false} data-field="show_header" @change=${this._changed}></ha-switch><span>${this._t('show_header')}</span></div>
                    <div class="switch-row"><ha-switch .checked=${this._config.show_delivered !== false} data-field="show_delivered" @change=${this._changed}></ha-switch><span>${this._t('show_delivered_tab')}</span></div>
                    <div class="switch-row"><ha-switch .checked=${this._config.show_sent !== false} data-field="show_sent" @change=${this._changed}></ha-switch><span>${this._t('show_sent_tab')}</span></div>
                    <div class="switch-row"><ha-switch .checked=${this._config.show_letters !== false} data-field="show_letters" @change=${this._changed}></ha-switch><span>${this._t('show_letters_tab')}</span></div>
                    <div class="switch-row"><ha-switch .checked=${this._config.show_animation !== false} data-field="show_animation" @change=${this._changed}></ha-switch><span>${this._t('show_animation')}</span></div>
                    <div class="switch-row"><ha-switch .checked=${this._config.show_placeholder !== false} data-field="show_placeholder" @change=${this._changed}></ha-switch><span>${this._t('show_placeholder')}</span></div>
                    <div class="switch-row"><ha-switch .checked=${this._config.show_tracking_link !== false} data-field="show_tracking_link" @change=${this._changed}></ha-switch><span>${this._t('show_tracking_link')}</span></div>
                    <div class="switch-row"><ha-switch .checked=${this._config.show_add_parcel !== false} data-field="show_add_parcel" @change=${this._changed}></ha-switch><span>${this._t('show_add_parcel')}</span></div>
                    <div class="switch-row"><ha-switch .checked=${this._config.show_raw_status === true} data-field="show_raw_status" @change=${this._changed}></ha-switch><span>${this._t('show_raw_status')}</span></div>
                    <div class="plain-field">
                        <label>${this._t('custom_name_scope_label')}</label>
                        <ha-selector .hass=${this.hass}
                            .selector=${{ select: { options: [
                                { value: 'off',      label: this._t('custom_name_scope_off') },
                                { value: 'device',   label: this._t('custom_name_scope_device') },
                                { value: 'me',       label: this._t('custom_name_scope_me') },
                                { value: 'everyone', label: this._t('custom_name_scope_everyone') }
                            ], mode: 'dropdown' } }}
                            .value=${this._config.custom_name_scope || 'everyone'}
                            @value-changed=${(ev) => this._changed(ev, 'custom_name_scope')}></ha-selector>
                        <div class="helper-text">${this._t('custom_name_scope_help')}</div>
                    </div>
                    <div class="plain-field">
                        <label>${this._t('sort_order_label')}</label>
                        <ha-selector .hass=${this.hass}
                            .selector=${{ select: { options: [
                                { value: 'auto',         label: this._t('sort_order_auto') },
                                { value: 'newest_first', label: this._t('sort_order_newest_first') },
                                { value: 'oldest_first', label: this._t('sort_order_oldest_first') }
                            ], mode: 'dropdown' } }}
                            .value=${this._config.sort_order || 'auto'}
                            @value-changed=${(ev) => this._changed(ev, 'sort_order')}></ha-selector>
                        <div class="helper-text">${this._t('sort_order_help')}</div>
                    </div>
                    <div class="switch-row"><ha-switch .checked=${this._config.group_by_carrier !== false} data-field="group_by_carrier" @change=${this._changed}></ha-switch><span>${this._t('group_by_carrier')}</span></div>
                </details>

                <details class="section-details">
                    <summary class="section">${this._t('section_appearance')}</summary>
                    ${this._renderColorPicker(
                        this._t('label_header_color'),
                        this._config.header_color,
                        '',
                        (val) => { this._config = { ...this._config, header_color: val }; this._emit(); },
                        ()    => { this._config = { ...this._config, header_color: '' };  this._emit(); }
                    )}
                    ${this._renderColorPicker(
                        this._t('label_header_text'),
                        this._config.header_text_color,
                        '',
                        (val) => { this._config = { ...this._config, header_text_color: val }; this._emit(); },
                        ()    => { this._config = { ...this._config, header_text_color: '' };  this._emit(); }
                    )}
                    ${this._renderUrlField(
                        this._t('label_placeholder_img'),
                        this._config.placeholder_image,
                        'https://...',
                        (ev) => { this._config = { ...this._config, placeholder_image: ev.target.value }; this._emit(); }
                    )}
                </details>
            </div>`;
    }
}

if (!customElements.get('hki-parcels-card'))
    customElements.define('hki-parcels-card', HkiParcelsCard);
if (!customElements.get('hki-parcels-card-editor'))
    customElements.define('hki-parcels-card-editor', HkiParcelsCardEditor);

window.customCards = window.customCards || [];
window.customCards.push({
    type: "hki-parcels-card",
    name: "HKI Parcels Card",
    description: "Multi-carrier parcel tracker (PostNL, DHL, DPD, GLS, Dragonfly, Trunkrs, Cainiao) — fork of jimz011/hki-elements",
    preview: true
});

})();
