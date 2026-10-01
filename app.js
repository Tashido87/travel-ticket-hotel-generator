/**
 * Travel Document & E-Ticket Generator
 * Standalone Web Application
 */

import { showToast } from './utils.js';
import {
    renderAgodaHotelHtml,
    downloadAgodaPdf,
    downloadAgodaImage,
    shareAgodaBooking,
    generateRandomBookingId,
    generateRandomMemberId,
    formatAgodaDate,
    calculateDefaultCancellationDate,
    DESTINATION_PRESETS
} from './agoda-hotel-converter.js';

import {
    extractTextFromPdf,
    parseItineraryText,
    renderAirAsiaTicketHtml,
    downloadAirAsiaPdf,
    downloadAirAsiaImage,
    shareAirAsiaTicket,
    formatCheckedBaggageLine
} from './airasia-converter.js';

// --- DATE HELPER & PAIRED DATEPICKER LOGIC ---
function parseDateInput(value) {
    if (!value) return null;
    if (value instanceof Date) return isNaN(value.getTime()) ? null : new Date(value.getFullYear(), value.getMonth(), value.getDate(), 0, 0, 0, 0);
    const safeStr = String(value).trim();
    if (!safeStr) return null;

    const parts = safeStr.split(/[-\/]/);
    if (parts.length === 3) {
        let day, month, year;
        if (parts[0].length === 4) {
            year = parseInt(parts[0], 10);
            month = parseInt(parts[1], 10) - 1;
            day = parseInt(parts[2], 10);
        } else {
            day = parseInt(parts[0], 10);
            month = parseInt(parts[1], 10) - 1;
            year = parseInt(parts[2], 10);
        }
        if (!isNaN(day) && !isNaN(month) && !isNaN(year) && year > 1900 && month >= 0 && month < 12 && day >= 1 && day <= 31) {
            return new Date(year, month, day, 0, 0, 0, 0);
        }
    }
    const d = new Date(safeStr);
    return (d && !isNaN(d.getTime())) ? new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0) : null;
}

function setupPairedDatepickers(arrivalId, departureId) {
    const arrEl = document.getElementById(arrivalId);
    const depEl = document.getElementById(departureId);
    if (!arrEl || !depEl) return null;

    function sync() {
        const arrDate = parseDateInput(arrEl.value);
        if (!depEl.datepicker) return;

        if (arrDate) {
            const arrStr = `${String(arrDate.getDate()).padStart(2, '0')}/${String(arrDate.getMonth() + 1).padStart(2, '0')}/${arrDate.getFullYear()}`;
            depEl.datepicker.setOptions({
                minDate: arrStr,
                defaultViewDate: arrStr
            });

            if (typeof depEl.datepicker.setFocusedDate === 'function') {
                depEl.datepicker.setFocusedDate(arrDate);
            }

            // If departure date is earlier than arrival, clear it
            const curDep = parseDateInput(depEl.value);
            if (curDep && curDep.getTime() < arrDate.getTime()) {
                depEl.datepicker.setDate({ clear: true });
                depEl.value = '';
                showToast('Departure date was earlier than arrival date and has been cleared.', 'info');
            }
        } else {
            depEl.datepicker.setOptions({
                minDate: null
            });
        }
    }

    arrEl.addEventListener('changeDate', sync);
    arrEl.addEventListener('change', sync);
    arrEl.addEventListener('input', sync);

    depEl.addEventListener('show', sync);
    depEl.addEventListener('focus', sync);

    if (arrEl.value) {
        sync();
    }

    return sync;
}

let syncModalDates = null;
let syncQuickDates = null;

// --- INITIALIZE DATEPICKERS ---
function initDatepickers() {
    const defaultOptions = {
        format: 'dd/mm/yyyy',
        autohide: true,
        todayHighlight: true
    };

    const datePickerIds = [
        'service_hotel_arrival',
        'service_hotel_departure',
        'agoda_arrival_date',
        'agoda_departure_date'
    ];

    datePickerIds.forEach(id => {
        const el = document.getElementById(id);
        if (el && window.Datepicker) {
            new window.Datepicker(el, defaultOptions);
        }
    });

    syncQuickDates = setupPairedDatepickers('service_hotel_arrival', 'service_hotel_departure');
    syncModalDates = setupPairedDatepickers('agoda_arrival_date', 'agoda_departure_date');
}

// --- AGODA HOTEL BOOKING CONTROLLER ---
function initAgodaHotelFeature() {
    const openBtn = document.getElementById('openChinaHotelBtn');
    const quickBtn = document.getElementById('quickChinaHotelBtn');
    const modal = document.getElementById('chinaHotelModal');
    const closeBtn = document.getElementById('chinaHotelModalCloseBtn');
    const cancelBtn = document.getElementById('chinaHotelCancelBtn');
    const downloadPdfBtn = document.getElementById('chinaHotelDownloadPdfBtn');
    const previewContainer = document.getElementById('agodaPreviewContainer');
    const rollBookingBtn = document.getElementById('agoda_roll_booking_id');
    const rollMemberBtn = document.getElementById('agoda_roll_member_id');
    const destSelect = document.getElementById('agoda_destination');

    if (!modal) return;

    function collectFormData() {
        const dest = destSelect?.value || 'Bangkok';
        const preset = DESTINATION_PRESETS[dest] || DESTINATION_PRESETS.Bangkok;

        return {
            destination: dest,
            bookingId: document.getElementById('agoda_booking_id')?.value || generateRandomBookingId(),
            memberId: document.getElementById('agoda_member_id')?.value || generateRandomMemberId(),
            bookingRefNo: document.getElementById('agoda_booking_ref_no')?.value || '',
            clientName: (document.getElementById('agoda_client_name')?.value || '').trim().toUpperCase(),
            countryOfResidence: document.getElementById('agoda_country')?.value || 'Myanmar',
            numAdults: parseInt(document.getElementById('agoda_num_adults')?.value || '1', 10),
            numChildren: parseInt(document.getElementById('agoda_num_children')?.value || '0', 10),
            numRooms: parseInt(document.getElementById('agoda_num_rooms')?.value || '1', 10),
            numExtraBeds: parseInt(document.getElementById('agoda_num_extra_beds')?.value || '0', 10),
            roomType: document.getElementById('agoda_room_type')?.value || 'Superior Deluxe',
            promotion: document.getElementById('agoda_promotion')?.value || 'Long Stay Deal. Price includes 10% discount!',
            arrivalDate: document.getElementById('agoda_arrival_date')?.value || '',
            departureDate: document.getElementById('agoda_departure_date')?.value || '',
            propertyName: document.getElementById('agoda_property_name')?.value || preset.propertyName,
            propertyAddress: document.getElementById('agoda_property_address')?.value || preset.propertyAddress,
            propertyContact: document.getElementById('agoda_property_contact')?.value || preset.propertyContact,
            cancellationDate: document.getElementById('agoda_cancellation_date')?.value || '',
            remarksSpecial: document.getElementById('agoda_remarks_special')?.value || 'NonSmoke,LargeBed'
        };
    }

    function updatePreview() {
        if (!previewContainer) return;
        const currentData = collectFormData();
        previewContainer.innerHTML = renderAgodaHotelHtml(currentData);
    }

    function populateForm(data = {}) {
        const dest = data.destination || destSelect?.value || 'Bangkok';
        const preset = DESTINATION_PRESETS[dest] || DESTINATION_PRESETS.Bangkok;

        if (destSelect) destSelect.value = dest;
        if (document.getElementById('agoda_booking_id')) {
            document.getElementById('agoda_booking_id').value = data.bookingId || generateRandomBookingId();
        }
        if (document.getElementById('agoda_member_id')) {
            document.getElementById('agoda_member_id').value = data.memberId || generateRandomMemberId();
        }
        if (document.getElementById('agoda_booking_ref_no')) {
            document.getElementById('agoda_booking_ref_no').value = data.bookingRefNo || '';
        }
        if (document.getElementById('agoda_client_name')) {
            document.getElementById('agoda_client_name').value = data.clientName || '';
        }
        if (document.getElementById('agoda_country')) {
            document.getElementById('agoda_country').value = data.countryOfResidence || 'Myanmar';
        }
        if (document.getElementById('agoda_num_adults')) {
            document.getElementById('agoda_num_adults').value = data.numAdults !== undefined ? data.numAdults : 1;
        }
        if (document.getElementById('agoda_num_children')) {
            document.getElementById('agoda_num_children').value = data.numChildren !== undefined ? data.numChildren : 0;
        }
        if (document.getElementById('agoda_num_rooms')) {
            document.getElementById('agoda_num_rooms').value = data.numRooms !== undefined ? data.numRooms : 1;
        }
        if (document.getElementById('agoda_num_extra_beds')) {
            document.getElementById('agoda_num_extra_beds').value = data.numExtraBeds !== undefined ? data.numExtraBeds : 0;
        }
        if (document.getElementById('agoda_room_type')) {
            document.getElementById('agoda_room_type').value = data.roomType || 'Superior Deluxe';
        }
        if (document.getElementById('agoda_promotion')) {
            document.getElementById('agoda_promotion').value = data.promotion || 'Long Stay Deal. Price includes 10% discount!';
        }
        if (document.getElementById('agoda_arrival_date')) {
            document.getElementById('agoda_arrival_date').value = data.arrivalDate || '';
        }
        if (document.getElementById('agoda_departure_date')) {
            document.getElementById('agoda_departure_date').value = data.departureDate || '';
        }
        if (document.getElementById('agoda_property_name')) {
            document.getElementById('agoda_property_name').value = data.propertyName || preset.propertyName;
        }
        if (document.getElementById('agoda_property_address')) {
            document.getElementById('agoda_property_address').value = data.propertyAddress || preset.propertyAddress;
        }
        if (document.getElementById('agoda_property_contact')) {
            document.getElementById('agoda_property_contact').value = data.propertyContact || preset.propertyContact;
        }
        if (document.getElementById('agoda_cancellation_date')) {
            const cancelInput = document.getElementById('agoda_cancellation_date');
            cancelInput.value = data.cancellationDate || (data.arrivalDate ? calculateDefaultCancellationDate(data.arrivalDate) : '');
            cancelInput.dataset.autoFilled = data.cancellationDate ? 'false' : 'true';
        }
        if (document.getElementById('agoda_remarks_special')) {
            document.getElementById('agoda_remarks_special').value = data.remarksSpecial || 'NonSmoke,LargeBed';
        }

        if (typeof syncModalDates === 'function') {
            syncModalDates();
        }

        updatePreview();
    }

    // Destination change in modal
    destSelect?.addEventListener('change', (e) => {
        const dest = e.target.value;
        const preset = DESTINATION_PRESETS[dest] || DESTINATION_PRESETS.Bangkok;
        if (document.getElementById('agoda_property_name')) {
            document.getElementById('agoda_property_name').value = preset.propertyName;
        }
        if (document.getElementById('agoda_property_address')) {
            document.getElementById('agoda_property_address').value = preset.propertyAddress;
        }
        if (document.getElementById('agoda_property_contact')) {
            document.getElementById('agoda_property_contact').value = preset.propertyContact;
        }
        updatePreview();
    });

    // Inputs live sync
    const inputs = modal.querySelectorAll('.airasia-form-scroll input, .airasia-form-scroll select, .airasia-form-scroll textarea');
    inputs.forEach(input => {
        const handleInput = () => {
            if (input.id === 'agoda_arrival_date') {
                const cancelInput = document.getElementById('agoda_cancellation_date');
                if (cancelInput && (!cancelInput.value || cancelInput.dataset.autoFilled === 'true')) {
                    cancelInput.value = calculateDefaultCancellationDate(input.value);
                    cancelInput.dataset.autoFilled = 'true';
                }
            }
            updatePreview();
        };
        input.addEventListener('input', handleInput);
        input.addEventListener('change', handleInput);
    });

    document.getElementById('agoda_cancellation_date')?.addEventListener('input', (e) => {
        e.target.dataset.autoFilled = 'false';
    });

    // Roll IDs
    rollBookingBtn?.addEventListener('click', () => {
        const el = document.getElementById('agoda_booking_id');
        if (el) {
            el.value = generateRandomBookingId();
            updatePreview();
            showToast('New Booking ID generated!', 'info');
        }
    });

    rollMemberBtn?.addEventListener('click', () => {
        const el = document.getElementById('agoda_member_id');
        if (el) {
            el.value = generateRandomMemberId();
            updatePreview();
            showToast('New Member ID generated!', 'info');
        }
    });

    // Open Hotel Editor
    openBtn?.addEventListener('click', () => {
        const quickDest = document.getElementById('service_hotel_destination')?.value || 'Bangkok';
        const preset = DESTINATION_PRESETS[quickDest] || DESTINATION_PRESETS.Bangkok;
        const quickClient = (document.getElementById('service_hotel_client_name')?.value || '').trim();
        const quickArrival = (document.getElementById('service_hotel_arrival')?.value || '').trim();
        const quickDeparture = (document.getElementById('service_hotel_departure')?.value || '').trim();

        populateForm({
            destination: quickDest,
            bookingId: generateRandomBookingId(),
            memberId: generateRandomMemberId(),
            clientName: quickClient || '',
            arrivalDate: quickArrival ? formatAgodaDate(quickArrival) : '',
            departureDate: quickDeparture ? formatAgodaDate(quickDeparture) : '',
            propertyName: preset.propertyName,
            propertyAddress: preset.propertyAddress,
            propertyContact: preset.propertyContact,
            numRooms: 1,
            numExtraBeds: 0,
            numAdults: 1,
            numChildren: 0
        });

        modal.classList.add('show');
    });

    // Quick Generate
    quickBtn?.addEventListener('click', async () => {
        const quickDest = document.getElementById('service_hotel_destination')?.value || 'Bangkok';
        const preset = DESTINATION_PRESETS[quickDest] || DESTINATION_PRESETS.Bangkok;
        const quickClient = (document.getElementById('service_hotel_client_name')?.value || '').trim();
        const quickArrival = (document.getElementById('service_hotel_arrival')?.value || '').trim();
        const quickDeparture = (document.getElementById('service_hotel_departure')?.value || '').trim();

        if (!quickClient) {
            showToast('Please enter Client / Guest Name before downloading PDF.', 'warning');
            document.getElementById('service_hotel_client_name')?.focus();
            return;
        }
        if (!quickArrival) {
            showToast('Please enter Arrival Date before downloading PDF.', 'warning');
            document.getElementById('service_hotel_arrival')?.focus();
            return;
        }
        if (!quickDeparture) {
            showToast('Please enter Departure Date before downloading PDF.', 'warning');
            document.getElementById('service_hotel_departure')?.focus();
            return;
        }

        const data = {
            destination: quickDest,
            bookingId: generateRandomBookingId(),
            memberId: generateRandomMemberId(),
            clientName: quickClient,
            propertyName: preset.propertyName,
            propertyAddress: preset.propertyAddress,
            propertyContact: preset.propertyContact,
            arrivalDate: formatAgodaDate(quickArrival),
            departureDate: formatAgodaDate(quickDeparture),
            numRooms: 1,
            numExtraBeds: 0,
            numAdults: 1,
            numChildren: 0
        };

        showToast('Generating Agoda Booking PDF...', 'info');
        try {
            const filename = await downloadAgodaPdf(data);
            showToast(`PDF downloaded: ${filename}`, 'success');
        } catch (e) {
            console.error(e);
            showToast(`Error generating PDF: ${e.message}`, 'error');
        }
    });

    // Modal buttons
    closeBtn?.addEventListener('click', () => modal.classList.remove('show'));
    cancelBtn?.addEventListener('click', () => modal.classList.remove('show'));

    modal.addEventListener('click', (e) => {
        if (e.target === modal) modal.classList.remove('show');
    });

    downloadPdfBtn?.addEventListener('click', async () => {
        const clientName = (document.getElementById('agoda_client_name')?.value || '').trim();
        const arrivalDate = (document.getElementById('agoda_arrival_date')?.value || '').trim();
        const departureDate = (document.getElementById('agoda_departure_date')?.value || '').trim();

        if (!clientName) {
            showToast('Please enter Client / Guest Name before downloading PDF.', 'warning');
            document.getElementById('agoda_client_name')?.focus();
            return;
        }
        if (!arrivalDate) {
            showToast('Please enter Arrival Date before downloading PDF.', 'warning');
            document.getElementById('agoda_arrival_date')?.focus();
            return;
        }
        if (!departureDate) {
            showToast('Please enter Departure Date before downloading PDF.', 'warning');
            document.getElementById('agoda_departure_date')?.focus();
            return;
        }

        showToast('Generating official Agoda PDF...', 'info');
        try {
            downloadPdfBtn.disabled = true;
            const data = collectFormData();
            const filename = await downloadAgodaPdf(data);
            showToast(`PDF downloaded: ${filename}`, 'success');
        } catch (err) {
            console.error('PDF generation error:', err);
            showToast(`PDF generation failed: ${err.message}`, 'error');
        } finally {
            downloadPdfBtn.disabled = false;
        }
    });
}

// --- AIRASIA & VIETJET CONTROLLER ---
function initAirAsiaFeature() {
    const dropZone = document.getElementById('airAsiaDropZone');
    const fileInput = document.getElementById('airAsiaFileInput');
    const uploadBtn = document.getElementById('airAsiaUploadBtn');
    const manualBtn = document.getElementById('airAsiaManualBtn');
    const modal = document.getElementById('airAsiaModal');
    const closeBtn = document.getElementById('airAsiaModalCloseBtn');
    const cancelBtn = document.getElementById('airAsiaCancelBtn');
    const downloadPdfBtn = document.getElementById('airAsiaDownloadPdfBtn');
    const previewContainer = document.getElementById('airAsiaPreviewContainer');
    const airlineSelect = document.getElementById('aa_airline_select');
    const addPaxBtn = document.getElementById('aa_add_pax_btn');

    if (!dropZone || !modal) return;

    function escapeAaHtml(str) {
        if (!str) return '';
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }

    function renderPassengerRows(passengersList = []) {
        const container = document.getElementById('aa_passengers_list');
        if (!container) return;
        container.innerHTML = '';

        if (!passengersList || passengersList.length === 0) {
            passengersList = [{ name: '', type: 'Adult', eticket: '', passport: '', expiry: '' }];
        }

        passengersList.forEach((p, idx) => {
            const row = document.createElement('div');
            row.className = 'aa_pax_row';
            row.style.cssText = 'background:var(--apple-bg-secondary); padding:10px 12px; border-radius:8px; border:1px solid var(--apple-separator); display:flex; flex-direction:column; gap:8px;';
            row.innerHTML = `
                <div style="display:flex; justify-content:space-between; align-items:center;">
                    <span style="font-size:12px; font-weight:700; color:var(--apple-label);"><i class="fa-solid fa-user" style="color:var(--apple-blue); margin-right:4px;"></i> Passenger ${idx + 1}</span>
                    <button type="button" class="btn-service btn-secondary aa_remove_pax_btn" style="padding:1px 6px; font-size:11px; border:none; background:transparent; color:#dc2626; cursor:pointer;" title="Remove Passenger">
                        <i class="fa-solid fa-trash-can"></i> Remove
                    </button>
                </div>
                <div class="airasia-form-row">
                    <div class="airasia-form-group" style="flex:2;">
                        <label style="font-size:10.5px;">Passenger Name</label>
                        <input type="text" class="aa_pax_name_input" value="${escapeAaHtml(p.name || '')}" placeholder="PASSENGER FULL NAME" style="font-weight:700; text-transform:uppercase;">
                    </div>
                    <div class="airasia-form-group" style="flex:1;">
                        <label style="font-size:10.5px;">Type</label>
                        <select class="aa_pax_type_input" style="font-size:12px;">
                            <option value="Adult" ${p.type === 'Adult' ? 'selected' : ''}>Adult</option>
                            <option value="Child" ${p.type === 'Child' ? 'selected' : ''}>Child</option>
                            <option value="Infant" ${p.type === 'Infant' ? 'selected' : ''}>Infant</option>
                        </select>
                    </div>
                </div>
                <div class="airasia-form-row">
                    <div class="airasia-form-group">
                        <label style="font-size:10.5px;">E-Ticket No.</label>
                        <input type="text" class="aa_pax_ticket_input" value="${escapeAaHtml(p.eticket || p.eTicketNo || '')}" placeholder="e.g. 2172350542658">
                    </div>
                    <div class="airasia-form-group">
                        <label style="font-size:10.5px;">Passport No.</label>
                        <input type="text" class="aa_pax_passport_input" value="${escapeAaHtml(p.passport || '')}" placeholder="e.g. MJ432310" style="text-transform:uppercase;">
                    </div>
                    <div class="airasia-form-group">
                        <label style="font-size:10.5px;">Passport Expiry</label>
                        <input type="text" class="aa_pax_expiry_input" value="${escapeAaHtml(p.expiry || '')}" placeholder="e.g. 2029-09-12">
                    </div>
                </div>
            `;

            row.querySelectorAll('input, select').forEach(el => {
                el.addEventListener('input', updatePreview);
                el.addEventListener('change', updatePreview);
            });

            row.querySelector('.aa_remove_pax_btn').addEventListener('click', () => {
                const totalRows = container.querySelectorAll('.aa_pax_row').length;
                if (totalRows <= 1) {
                    row.querySelector('.aa_pax_name_input').value = '';
                    row.querySelector('.aa_pax_type_input').value = 'Adult';
                    row.querySelector('.aa_pax_ticket_input').value = '';
                    row.querySelector('.aa_pax_passport_input').value = '';
                    row.querySelector('.aa_pax_expiry_input').value = '';
                } else {
                    row.remove();
                }
                updatePreview();
            });

            container.appendChild(row);
        });
    }

    function collectPassengers() {
        const container = document.getElementById('aa_passengers_list');
        if (!container) return [{ name: '', type: 'Adult', eticket: '', passport: '', expiry: '' }];
        const rows = container.querySelectorAll('.aa_pax_row');
        const list = [];
        rows.forEach(r => {
            const name = (r.querySelector('.aa_pax_name_input')?.value || '').trim().toUpperCase();
            const type = r.querySelector('.aa_pax_type_input')?.value || 'Adult';
            const eticket = (r.querySelector('.aa_pax_ticket_input')?.value || '').trim();
            const passport = (r.querySelector('.aa_pax_passport_input')?.value || '').trim().toUpperCase();
            const expiry = (r.querySelector('.aa_pax_expiry_input')?.value || '').trim();
            if (name) {
                list.push({ name, type, eticket, passport, expiry });
            }
        });
        return list.length > 0 ? list : [{ name: '', type: 'Adult', eticket: '', passport: '', expiry: '' }];
    }

    function renderFlightRows(flightsList) {
        const container = document.getElementById('aa_flights_list');
        if (!container) return;
        container.innerHTML = '';

        flightsList.forEach((f, idx) => {
            const card = document.createElement('div');
            card.className = 'aa_flight_card';
            card.style.cssText = 'background:var(--apple-bg-secondary); border:1px solid var(--apple-separator); border-radius:10px; padding:12px; position:relative;';
            card.innerHTML = `
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px; padding-bottom:6px; border-bottom:1px dashed var(--apple-separator);">
                    <strong style="color:var(--apple-label); font-size:12px;"><i class="fa-solid fa-plane" style="color:var(--apple-blue); margin-right:4px;"></i> Sector ${idx + 1}</strong>
                    ${flightsList.length > 1 ? `<button type="button" class="btn-service btn-secondary btn-sm aa_remove_flight_btn" style="padding:2px 8px; font-size:11px; color:#dc2626;"><i class="fa-solid fa-trash-can"></i> Remove</button>` : ''}
                </div>
                <div class="airasia-form-row" style="margin-bottom:8px;">
                    <div class="airasia-form-group" style="grid-column: 1 / -1;">
                        <label style="font-size:11px;">Route</label>
                        <input type="text" class="aa_flight_route" value="${escapeAaHtml(f.route || '')}" placeholder="e.g. Bangkok (BKK) - London (LHR)">
                    </div>
                </div>
                <div class="airasia-form-row" style="margin-bottom:8px;">
                    <div class="airasia-form-group">
                        <label style="font-size:11px;">Flight Number</label>
                        <input type="text" class="aa_flight_no" value="${escapeAaHtml(f.flightNo || '')}" placeholder="e.g. TG 910 / FD252 / VJ334" style="text-transform:uppercase; font-weight:700;">
                    </div>
                    <div class="airasia-form-group">
                        <label style="font-size:11px;">Airline / Carrier</label>
                        <input type="text" class="aa_flight_airline" value="${escapeAaHtml(f.airlineName || '')}" placeholder="e.g. Thai Airways International">
                    </div>
                    <div class="airasia-form-group">
                        <label style="font-size:11px;">Sector Booking Ref (PNR)</label>
                        <input type="text" class="aa_flight_pnr" value="${escapeAaHtml(f.pnr || '')}" placeholder="e.g. BINUFH" style="text-transform:uppercase; font-weight:700; color:var(--apple-blue);">
                    </div>
                </div>
                <div class="airasia-form-row" style="margin-bottom:8px;">
                    <div class="airasia-form-group">
                        <label style="font-size:11px;">Duration</label>
                        <input type="text" class="aa_flight_duration" value="${escapeAaHtml(f.duration || '12h 30min, Non-Stop')}" placeholder="e.g. 12h 30min, Non-Stop">
                    </div>
                    <div class="airasia-form-group">
                        <label style="font-size:11px;">Aircraft</label>
                        <input type="text" class="aa_flight_aircraft" value="${escapeAaHtml(f.aircraft || 'Boeing 777-300ER')}" placeholder="e.g. Boeing 777-300ER">
                    </div>
                    <div class="airasia-form-group">
                        <label style="font-size:11px;">Sector Class</label>
                        <input type="text" class="aa_flight_class" value="${escapeAaHtml(f.flightClass || 'Economy (T)')}" placeholder="e.g. Economy (T)">
                    </div>
                </div>
                
                <div style="font-size:11px; font-weight:700; color:var(--apple-blue); margin:6px 0 4px 0;">Departure</div>
                <div class="airasia-form-row" style="margin-bottom:6px;">
                    <div class="airasia-form-group">
                        <label style="font-size:10.5px;">Departure Time</label>
                        <input type="text" class="aa_flight_dep_time" value="${escapeAaHtml(f.depTime || '')}" placeholder="e.g. 00:45">
                    </div>
                    <div class="airasia-form-group">
                        <label style="font-size:10.5px;">Departure Date</label>
                        <input type="text" class="aa_flight_dep_date" value="${escapeAaHtml(f.depDateFormatted || '')}" placeholder="e.g. Wednesday, 30 September 2026">
                    </div>
                </div>
                <div class="airasia-form-row" style="margin-bottom:8px;">
                    <div class="airasia-form-group">
                        <label style="font-size:10.5px;">Departure Airport (with code)</label>
                        <input type="text" class="aa_flight_dep_airport" value="${escapeAaHtml(f.depAirport || '')}" placeholder="e.g. Bangkok - Suvarnabhumi Intl (BKK)">
                    </div>
                    <div class="airasia-form-group">
                        <label style="font-size:10.5px;">Terminal</label>
                        <input type="text" class="aa_flight_dep_terminal" value="${escapeAaHtml(f.depTerminal || '')}" placeholder="Terminal 1">
                    </div>
                </div>

                <div style="font-size:11px; font-weight:700; color:var(--apple-blue); margin:6px 0 4px 0;">Arrival</div>
                <div class="airasia-form-row" style="margin-bottom:6px;">
                    <div class="airasia-form-group">
                        <label style="font-size:10.5px;">Arrival Time</label>
                        <input type="text" class="aa_flight_arr_time" value="${escapeAaHtml(f.arrTime || '')}" placeholder="e.g. 07:15">
                    </div>
                    <div class="airasia-form-group">
                        <label style="font-size:10.5px;">Arrival Date</label>
                        <input type="text" class="aa_flight_arr_date" value="${escapeAaHtml(f.arrDateFormatted || '')}" placeholder="e.g. Wednesday, 30 September 2026">
                    </div>
                </div>
                <div class="airasia-form-row">
                    <div class="airasia-form-group">
                        <label style="font-size:10.5px;">Arrival Airport (with code)</label>
                        <input type="text" class="aa_flight_arr_airport" value="${escapeAaHtml(f.arrAirport || '')}" placeholder="e.g. London - Heathrow (LHR), Terminal 2">
                    </div>
                    <div class="airasia-form-group">
                        <label style="font-size:10.5px;">Terminal</label>
                        <input type="text" class="aa_flight_arr_terminal" value="${escapeAaHtml(f.arrTerminal || '')}" placeholder="Terminal 2">
                    </div>
                </div>
            `;

            card.querySelectorAll('input').forEach(inp => {
                inp.addEventListener('input', updatePreview);
                inp.addEventListener('change', updatePreview);
            });

            card.querySelector('.aa_remove_flight_btn')?.addEventListener('click', () => {
                const currentFlights = collectFlights();
                currentFlights.splice(idx, 1);
                renderFlightRows(currentFlights.length > 0 ? currentFlights : [{
                    flightNo: '', airlineName: 'AirAsia Berhad', duration: '12h 30min, Non-Stop', aircraft: 'Boeing 777-300ER', flightClass: 'Economy', depTime: '', depDateFormatted: '', depAirport: '', depTerminal: '', arrTime: '', arrDateFormatted: '', arrAirport: '', arrTerminal: '', route: ''
                }]);
                updatePreview();
            });

            container.appendChild(card);
        });
    }

    function collectFlights() {
        const container = document.getElementById('aa_flights_list');
        if (!container) return [];
        const cards = container.querySelectorAll('.aa_flight_card');
        const list = [];
        cards.forEach(card => {
            list.push({
                route: (card.querySelector('.aa_flight_route')?.value || '').trim(),
                flightNo: (card.querySelector('.aa_flight_no')?.value || '').trim().toUpperCase(),
                airlineName: (card.querySelector('.aa_flight_airline')?.value || '').trim(),
                pnr: (card.querySelector('.aa_flight_pnr')?.value || '').trim().toUpperCase(),
                duration: (card.querySelector('.aa_flight_duration')?.value || '').trim(),
                aircraft: (card.querySelector('.aa_flight_aircraft')?.value || '').trim(),
                flightClass: (card.querySelector('.aa_flight_class')?.value || '').trim(),
                depTime: (card.querySelector('.aa_flight_dep_time')?.value || '').trim(),
                depDateFormatted: (card.querySelector('.aa_flight_dep_date')?.value || '').trim(),
                depAirport: (card.querySelector('.aa_flight_dep_airport')?.value || '').trim(),
                depTerminal: (card.querySelector('.aa_flight_dep_terminal')?.value || '').trim(),
                arrTime: (card.querySelector('.aa_flight_arr_time')?.value || '').trim(),
                arrDateFormatted: (card.querySelector('.aa_flight_arr_date')?.value || '').trim(),
                arrAirport: (card.querySelector('.aa_flight_arr_airport')?.value || '').trim(),
                arrTerminal: (card.querySelector('.aa_flight_arr_terminal')?.value || '').trim()
            });
        });
        return list;
    }

    const addFlightBtn = document.getElementById('aa_add_flight_btn');
    addFlightBtn?.addEventListener('click', () => {
        const currentFlights = collectFlights();
        const currentA = document.getElementById('aa_airline_select')?.value;
        const defaultA = currentA === 'Thai Airways' ? 'Thai Airways International' : (currentA === 'VietJet Air' ? 'VietJet Air' : 'Thai AirAsia');
        const defaultFN = currentA === 'Thai Airways' ? 'TG 910' : '';
        currentFlights.push({
            flightNo: defaultFN,
            airlineName: defaultA,
            pnr: '',
            duration: '12h 30min, Non-Stop',
            aircraft: 'Boeing 777-300ER',
            flightClass: 'Economy (T)',
            depTime: '',
            depDateFormatted: '',
            depAirport: '',
            depTerminal: '',
            arrTime: '',
            arrDateFormatted: '',
            arrAirport: '',
            arrTerminal: '',
            route: ''
        });
        renderFlightRows(currentFlights);
        const container = document.getElementById('aa_flights_list');
        const lastInput = container?.querySelector('.aa_flight_card:last-child .aa_flight_route');
        if (lastInput) lastInput.focus();
        updatePreview();
    });

    addPaxBtn?.addEventListener('click', () => {
        const currentPassengers = collectPassengers();
        currentPassengers.push({ name: '', type: 'Adult', eticket: '', passport: '', expiry: '' });
        renderPassengerRows(currentPassengers);
        const container = document.getElementById('aa_passengers_list');
        const lastInput = container?.querySelector('.aa_pax_row:last-child .aa_pax_name_input');
        if (lastInput) lastInput.focus();
        updatePreview();
    });

    document.getElementById('aa_airline_select')?.addEventListener('change', (e) => {
        const selectedAirline = e.target.value;
        const bagCheckedEl = document.getElementById('aa_bag_checked');
        const currentFlights = collectFlights();
        const currentBagVal = bagCheckedEl?.value || '';
        const isStandardLayoutAirline = ['EVA Air', 'Thai Airways', 'Singapore Airlines', 'Scoot'].includes(selectedAirline);

        if (isStandardLayoutAirline && bagCheckedEl) {
            bagCheckedEl.value = formatCheckedBaggageLine(currentBagVal);
        } else if (!isStandardLayoutAirline && bagCheckedEl && currentBagVal.startsWith('Checked:')) {
            const kgMatch = currentBagVal.match(/(\d+)\s*kg/i);
            const kg = kgMatch ? kgMatch[1] : (selectedAirline === 'VietJet Air' ? '20' : '30');
            bagCheckedEl.value = `${kg} kg per person\nDimensions of each piece cannot exceed 119 x 119 x 81 cm`;
        }

        if (selectedAirline === 'Scoot') {
            const checkinEl = document.getElementById('aa_checkin_notice');
            if (checkinEl && !checkinEl.value) {
                checkinEl.value = '(SIN) 1 Nov 2026, 7:00 AM';
            }
            currentFlights.forEach(f => {
                if (!f.airlineName || /airasia|vietjet|thai|singapore|eva/i.test(f.airlineName)) {
                    f.airlineName = 'Scoot';
                }
                if (!f.flightNo || /^(AK|VJ|TG|SQ|BR)/i.test(f.flightNo)) {
                    f.flightNo = 'TR 001';
                }
                if (!f.duration) f.duration = '2h 30min, Non-Stop';
                if (!f.aircraft) f.aircraft = 'Airbus A320neo';
                if (!f.flightClass || f.flightClass === 'Economy') f.flightClass = 'Economy (Fly)';
                if (!f.depAirport || f.depAirport.includes('Kuala Lumpur') || f.depAirport.includes('Taipei')) {
                    f.depAirport = 'Singapore - Changi (SIN)';
                    f.depTerminal = 'Terminal 1';
                }
                if (!f.arrAirport || f.arrAirport.includes('London')) {
                    f.arrAirport = 'Bangkok - Don Mueang (DMK)';
                    f.arrTerminal = 'Terminal 1';
                }
                if (!f.route || f.route.includes('KUL') || f.route.includes('TPE')) {
                    f.route = 'SIN - DMK';
                }
            });
            renderFlightRows(currentFlights);
        } else if (selectedAirline === 'EVA Air') {
            const checkinEl = document.getElementById('aa_checkin_notice');
            if (checkinEl && !checkinEl.value) {
                checkinEl.value = '(TPE) 1 Nov 2026, 6:25 AM';
            }
            currentFlights.forEach(f => {
                if (!f.airlineName || /airasia|vietjet|thai|singapore|scoot/i.test(f.airlineName)) {
                    f.airlineName = 'EVA Air';
                }
                if (!f.flightNo || /^(AK|VJ|TG|SQ|TR)/i.test(f.flightNo)) {
                    f.flightNo = 'BR 001';
                }
                if (!f.duration) f.duration = '3h 40min, Non-Stop';
                if (!f.aircraft) f.aircraft = 'Boeing 787-10';
                if (!f.flightClass || f.flightClass === 'Economy') f.flightClass = 'Economy (Y)';
                if (!f.depAirport || f.depAirport.includes('Kuala Lumpur') || f.depAirport.includes('Singapore')) {
                    f.depAirport = 'Taipei - Taoyuan (TPE)';
                    f.depTerminal = 'Terminal 2';
                }
                if (!f.arrAirport || f.arrAirport.includes('London')) {
                    f.arrAirport = 'Bangkok - Suvarnabhumi (BKK)';
                    f.arrTerminal = '';
                }
                if (!f.route || f.route.includes('KUL') || f.route.includes('SIN')) {
                    f.route = 'TPE - BKK';
                }
            });
            renderFlightRows(currentFlights);
        } else if (selectedAirline === 'Singapore Airlines') {
            const checkinEl = document.getElementById('aa_checkin_notice');
            if (checkinEl && !checkinEl.value) {
                checkinEl.value = '(SIN) 1 Nov 2026, 6:00 AM';
            }
            currentFlights.forEach(f => {
                if (!f.airlineName || /airasia|vietjet|thai|scoot/i.test(f.airlineName)) {
                    f.airlineName = 'Singapore Airlines';
                }
                if (!f.flightNo || /^(AK|VJ|TG|TR)/i.test(f.flightNo)) {
                    f.flightNo = 'SQ 001';
                }
                if (!f.duration) f.duration = '13h 30min, Non-Stop';
                if (!f.aircraft) f.aircraft = 'Airbus A380-800';
                if (!f.flightClass || f.flightClass === 'Economy') f.flightClass = 'Economy (S)';
                if (!f.depAirport || f.depAirport.includes('Kuala Lumpur') || f.depAirport.includes('Bangkok')) {
                    f.depAirport = 'Singapore - Changi (SIN)';
                    f.depTerminal = 'Terminal 3';
                }
                if (!f.arrAirport) {
                    f.arrAirport = 'London - Heathrow (LHR)';
                    f.arrTerminal = 'Terminal 2';
                }
                if (!f.route || f.route.includes('KUL') || f.route.includes('BKK')) {
                    f.route = 'SIN - LHR';
                }
            });
            renderFlightRows(currentFlights);
        } else if (selectedAirline === 'Thai Airways') {
            const checkinEl = document.getElementById('aa_checkin_notice');
            if (checkinEl && !checkinEl.value) {
                checkinEl.value = '(BKK) 29 Sep 2026, 9:45 PM';
            }
            currentFlights.forEach(f => {
                if (!f.airlineName || /airasia|vietjet|singapore|scoot/i.test(f.airlineName)) {
                    f.airlineName = 'Thai Airways International';
                }
                if (!f.flightNo || /^(AK|VJ|SQ|TR)/i.test(f.flightNo)) {
                    f.flightNo = 'TG 910';
                }
                if (!f.duration) f.duration = '12h 30min, Non-Stop';
                if (!f.aircraft) f.aircraft = 'Boeing 777-300ER';
                if (!f.flightClass || f.flightClass === 'Economy') f.flightClass = 'Economy (T)';
                if (!f.depAirport || f.depAirport.includes('Kuala Lumpur')) {
                    f.depAirport = 'Bangkok - Suvarnabhumi Intl (BKK)';
                    f.depTerminal = '';
                }
                if (!f.arrAirport) {
                    f.arrAirport = 'London - Heathrow (LHR)';
                    f.arrTerminal = 'Terminal 2';
                }
                if (!f.route || f.route.includes('KUL')) {
                    f.route = 'BKK - LHR';
                }
            });
            renderFlightRows(currentFlights);
        } else if (selectedAirline === 'VietJet Air') {
            currentFlights.forEach(f => {
                if (!f.airlineName || /airasia|thai|singapore|scoot/i.test(f.airlineName)) f.airlineName = 'VietJet Air';
                if (!f.flightNo || /^(AK|TG|SQ|TR)/i.test(f.flightNo)) f.flightNo = 'VJ';
            });
            renderFlightRows(currentFlights);
        } else if (selectedAirline === 'AirAsia') {
            currentFlights.forEach(f => {
                if (!f.airlineName || /vietjet|thai|singapore|scoot/i.test(f.airlineName)) f.airlineName = 'AirAsia Berhad';
                if (!f.flightNo || /^(VJ|TG|SQ|TR)/i.test(f.flightNo)) f.flightNo = 'AK';
            });
            renderFlightRows(currentFlights);
        }
        updatePreview();
    });

    function collectFormData() {
        const passengers = collectPassengers();
        const flights = collectFlights();
        const selectedA = document.getElementById('aa_airline_select')?.value || 'AirAsia';
        const primaryFlight = flights[0] || {};

        let defaultAirlineName = 'AirAsia Berhad';
        let defaultFlightNo = 'AK';
        if (selectedA === 'Scoot') {
            defaultAirlineName = 'Scoot';
            defaultFlightNo = 'TR 001';
        } else if (selectedA === 'EVA Air') {
            defaultAirlineName = 'EVA Air';
            defaultFlightNo = 'BR 001';
        } else if (selectedA === 'Singapore Airlines') {
            defaultAirlineName = 'Singapore Airlines';
            defaultFlightNo = 'SQ 001';
        } else if (selectedA === 'Thai Airways') {
            defaultAirlineName = 'Thai Airways International';
            defaultFlightNo = 'TG 910';
        } else if (selectedA === 'VietJet Air') {
            defaultAirlineName = 'VietJet Air';
            defaultFlightNo = 'VJ';
        }

        const safeAirlineName = (primaryFlight.airlineName && (
            (selectedA === 'Scoot' && !/airasia|vietjet|thai|singapore|eva/i.test(primaryFlight.airlineName)) ||
            (selectedA === 'EVA Air' && !/airasia|vietjet|thai|singapore|scoot/i.test(primaryFlight.airlineName)) ||
            (selectedA === 'Singapore Airlines' && !/airasia|vietjet|thai|eva|scoot/i.test(primaryFlight.airlineName)) ||
            (selectedA === 'Thai Airways' && !/airasia|vietjet|singapore|eva|scoot/i.test(primaryFlight.airlineName)) ||
            (selectedA === 'VietJet Air' && !/airasia|thai|singapore|eva|scoot/i.test(primaryFlight.airlineName)) ||
            (selectedA === 'AirAsia' && !/vietjet|thai|singapore|eva|scoot/i.test(primaryFlight.airlineName))
        )) ? primaryFlight.airlineName : defaultAirlineName;

        const safeFlightNo = (primaryFlight.flightNo && (
            (selectedA === 'Scoot' && !/^(AK|VJ|TG|SQ|BR)/i.test(primaryFlight.flightNo)) ||
            (selectedA === 'EVA Air' && !/^(AK|VJ|TG|SQ|TR)/i.test(primaryFlight.flightNo)) ||
            (selectedA === 'Singapore Airlines' && !/^(AK|VJ|TG|BR|TR)/i.test(primaryFlight.flightNo)) ||
            (selectedA === 'Thai Airways' && !/^(AK|VJ|SQ|BR|TR)/i.test(primaryFlight.flightNo)) ||
            (selectedA === 'VietJet Air' && !/^(AK|TG|SQ|BR|TR)/i.test(primaryFlight.flightNo)) ||
            (selectedA === 'AirAsia' && !/^(VJ|TG|SQ|BR|TR)/i.test(primaryFlight.flightNo))
        )) ? primaryFlight.flightNo : defaultFlightNo;

        const formPnr = (document.getElementById('aa_pnr')?.value || '').trim().toUpperCase();
        const sectorPnrs = [];
        flights.forEach(f => {
            if (f.pnr) {
                f.pnr.split(/[\/\s]+/).forEach(p => {
                    const cleanP = p.trim().toUpperCase();
                    if (cleanP && !sectorPnrs.includes(cleanP)) sectorPnrs.push(cleanP);
                });
            }
        });
        const effectivePnr = (sectorPnrs.length > 1) ? sectorPnrs.join(' / ') : formPnr;

        return {
            airline: selectedA,
            bookingNo: document.getElementById('aa_booking_no')?.value || '',
            pnr: effectivePnr,
            pnrs: sectorPnrs,
            eTicketNo: document.getElementById('aa_eticket_no')?.value || '',
            flightClass: document.getElementById('aa_class')?.value || (selectedA === 'Thai Airways' ? 'Economy (T)' : 'Economy'),
            issuedDate: document.getElementById('aa_issued_date')?.value || '',
            checkinNotice: document.getElementById('aa_checkin_notice')?.value || '',
            passengers: passengers,
            passengerName: passengers[0]?.name || '',
            passengerType: passengers[0]?.type || 'Adult',
            flights: flights,
            flightNo: safeFlightNo,
            airlineName: safeAirlineName,
            duration: primaryFlight.duration || '12h 30min, Non-Stop',
            aircraft: primaryFlight.aircraft || 'Boeing 777-300ER',
            depTime: primaryFlight.depTime || '',
            depDateFormatted: primaryFlight.depDateFormatted || '',
            depAirport: primaryFlight.depAirport || '',
            depTerminal: primaryFlight.depTerminal || '',
            arrTime: primaryFlight.arrTime || '',
            arrDateFormatted: primaryFlight.arrDateFormatted || '',
            arrAirport: primaryFlight.arrAirport || '',
            arrTerminal: primaryFlight.arrTerminal || '',
            route: primaryFlight.route || '',
            checkedBaggage: document.getElementById('aa_bag_checked')?.value || '',
            carryOnBaggage: document.getElementById('aa_bag_carry')?.value || '',
            personalItem: document.getElementById('aa_bag_personal')?.value || ''
        };
    }

    function updatePreview() {
        if (!previewContainer) return;
        try {
            const currentData = collectFormData();
            previewContainer.innerHTML = renderAirAsiaTicketHtml(currentData);
        } catch (err) {
            console.error('Preview update error:', err);
        }
    }

    function populateForm(data) {
        if (document.getElementById('aa_airline_select')) {
            document.getElementById('aa_airline_select').value = data.airline || 'AirAsia';
        }
        if (document.getElementById('aa_booking_no')) document.getElementById('aa_booking_no').value = data.bookingNo || '';
        if (document.getElementById('aa_pnr')) document.getElementById('aa_pnr').value = data.pnr || '';
        if (document.getElementById('aa_eticket_no')) document.getElementById('aa_eticket_no').value = data.eTicketNo || 'To be advised at check-in';
        if (document.getElementById('aa_class')) document.getElementById('aa_class').value = data.flightClass || 'Economy';
        if (document.getElementById('aa_issued_date')) document.getElementById('aa_issued_date').value = data.issuedDate || '';
        if (document.getElementById('aa_checkin_notice')) document.getElementById('aa_checkin_notice').value = data.checkinNotice || '';
        
        const paxList = (data.passengers && data.passengers.length > 0)
            ? data.passengers
            : [{ name: data.passengerName || '', type: data.passengerType || 'Adult', eticket: data.eTicketNo || '', passport: '', expiry: '' }];
        renderPassengerRows(paxList);

        const flList = (data.flights && data.flights.length > 0)
            ? data.flights
            : [{
                flightNo: data.flightNo || '',
                airlineName: data.airlineName || (data.airline === 'VietJet Air' ? 'VietJet Air' : 'AirAsia Berhad'),
                duration: data.duration || '12h 30min, Non-Stop',
                aircraft: data.aircraft || 'Boeing 777-300ER',
                flightClass: data.flightClass || 'Economy (T)',
                depTime: data.depTime || '',
                depDateFormatted: data.depDateFormatted || '',
                depAirport: data.depAirport || '',
                depTerminal: data.depTerminal || '',
                arrTime: data.arrTime || '',
                arrDateFormatted: data.arrDateFormatted || '',
                arrAirport: data.arrAirport || '',
                arrTerminal: data.arrTerminal || '',
                route: data.route || ''
            }];
        renderFlightRows(flList);

        const isStandardLayoutAirline = ['EVA Air', 'Thai Airways', 'Singapore Airlines', 'Scoot'].includes(data.airline);
        let initialCheckedBag = data.checkedBaggage;
        if (isStandardLayoutAirline) {
            initialCheckedBag = formatCheckedBaggageLine(initialCheckedBag || 'Checked: 30 kg   |   Carry-on: 7 kg');
        } else if (!initialCheckedBag) {
            initialCheckedBag = '30 kg per person\nDimensions of each piece cannot exceed 119 x 119 x 81 cm';
        }
        if (document.getElementById('aa_bag_checked')) document.getElementById('aa_bag_checked').value = initialCheckedBag;
        if (document.getElementById('aa_bag_carry')) document.getElementById('aa_bag_carry').value = data.carryOnBaggage || '1 piece per person\nMax 56 x 36 x 23 cm per piece';
        if (document.getElementById('aa_bag_personal')) document.getElementById('aa_bag_personal').value = data.personalItem || '1 piece per person\nMax 40 x 30 x 10 cm per piece, fits under the seat in front of you';

        updatePreview();
    }

    const formInputs = modal.querySelectorAll('.airasia-form-scroll input, .airasia-form-scroll select, .airasia-form-scroll textarea');
    formInputs.forEach(input => {
        input.addEventListener('input', updatePreview);
        input.addEventListener('change', updatePreview);
    });

    async function handleFile(file) {
        if (!file || !file.name.toLowerCase().endsWith('.pdf')) {
            showToast('Please select a valid PDF file.', 'error');
            return;
        }

        showToast('Extracting itinerary from PDF...', 'info');
        try {
            const rawText = await extractTextFromPdf(file);
            if (!rawText || rawText.trim().length < 30) {
                showToast('Could not extract text from PDF (it might be a scanned image). Opening form for manual review.', 'warning');
            }
            const parsedData = parseItineraryText(rawText);
            populateForm(parsedData);
            modal.classList.add('show');
            const detectedName = parsedData.airline || 'Airline';
            showToast(`${detectedName} ticket data extracted successfully!`, 'success');
        } catch (err) {
            console.error('PDF parsing error:', err);
            showToast(`PDF parsing failed: ${err.message}`, 'error');
        }
    }

    uploadBtn?.addEventListener('click', () => fileInput?.click());
    dropZone?.addEventListener('click', () => fileInput?.click());

    fileInput?.addEventListener('change', (e) => {
        const file = e.target.files?.[0];
        if (file) handleFile(file);
        e.target.value = '';
    });

    dropZone?.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropZone.classList.add('dragover');
    });
    dropZone?.addEventListener('dragleave', () => {
        dropZone.classList.remove('dragover');
    });
    dropZone?.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.classList.remove('dragover');
        const file = e.dataTransfer.files?.[0];
        if (file) handleFile(file);
    });

    manualBtn?.addEventListener('click', () => {
        populateForm({
            airline: 'AirAsia',
            bookingNo: '',
            pnr: '',
            eTicketNo: 'To be advised at check-in',
            flightClass: 'Economy',
            passengers: [{ name: '', type: 'Adult' }],
            passengerType: 'Adult',
            flights: [{
                flightNo: 'AK',
                airlineName: 'AirAsia Berhad',
                depTime: '12:00',
                depDateFormatted: '',
                depAirport: 'Kuala Lumpur International Airport (KUL)',
                depTerminal: 'Terminal 2',
                arrTime: '13:00',
                arrDateFormatted: '',
                arrAirport: '',
                arrTerminal: '',
                route: ''
            }],
            checkedBaggage: '30 kg per person\nEach piece max 119 x 119 x 81 cm (total 319 cm)',
            carryOnBaggage: '1 piece per person\nMax 56 x 36 x 23 cm per piece',
            personalItem: '1 piece per person\nMax 40 x 30 x 10 cm per piece, fits under the seat in front of you'
        });
        modal.classList.add('show');
    });

    closeBtn?.addEventListener('click', () => modal.classList.remove('show'));
    cancelBtn?.addEventListener('click', () => modal.classList.remove('show'));

    modal.addEventListener('click', (e) => {
        if (e.target === modal) modal.classList.remove('show');
    });

    downloadPdfBtn?.addEventListener('click', async () => {
        try {
            downloadPdfBtn.disabled = true;
            downloadPdfBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Generating PDF...';
            const data = collectFormData();
            const filename = await downloadAirAsiaPdf(data);
            showToast(`AirAsia PDF downloaded: ${filename}`, 'success');
        } catch (err) {
            console.error('PDF generation error:', err);
            showToast(`Could not generate PDF: ${err.message}`, 'error');
        } finally {
            downloadPdfBtn.disabled = false;
            downloadPdfBtn.innerHTML = '<i class="fa-solid fa-file-pdf"></i> Download PDF';
        }
    });
}

// --- APP INIT ---
window.addEventListener('DOMContentLoaded', () => {
    // Set Header Today's Date
    const todayEl = document.getElementById('headerTodayDateText');
    if (todayEl) {
        const now = new Date();
        todayEl.textContent = now.toLocaleDateString('en-GB', {
            weekday: 'short',
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });
    }

    // Escape key closes modals
    window.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            document.querySelectorAll('.modal.show').forEach(m => m.classList.remove('show'));
        }
    });

    initDatepickers();
    initAgodaHotelFeature();
    initAirAsiaFeature();
});
