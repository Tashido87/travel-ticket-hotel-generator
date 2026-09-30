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
    shareAirAsiaTicket
} from './airasia-converter.js';

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
}

// --- AGODA HOTEL BOOKING CONTROLLER ---
function initAgodaHotelFeature() {
    const openBtn = document.getElementById('openChinaHotelBtn');
    const quickBtn = document.getElementById('quickChinaHotelBtn');
    const modal = document.getElementById('chinaHotelModal');
    const closeBtn = document.getElementById('chinaHotelModalCloseBtn');
    const cancelBtn = document.getElementById('chinaHotelCancelBtn');
    const downloadPdfBtn = document.getElementById('chinaHotelDownloadPdfBtn');
    const downloadImgBtn = document.getElementById('chinaHotelDownloadImgBtn');
    const shareBtn = document.getElementById('chinaHotelShareBtn');
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
            clientName: (document.getElementById('agoda_client_name')?.value || 'AUNG KHIN NYUNT').trim().toUpperCase(),
            countryOfResidence: document.getElementById('agoda_country')?.value || 'Myanmar',
            numAdults: parseInt(document.getElementById('agoda_num_adults')?.value || '1', 10),
            numChildren: parseInt(document.getElementById('agoda_num_children')?.value || '0', 10),
            numRooms: parseInt(document.getElementById('agoda_num_rooms')?.value || '1', 10),
            numExtraBeds: parseInt(document.getElementById('agoda_num_extra_beds')?.value || '0', 10),
            roomType: document.getElementById('agoda_room_type')?.value || 'Superior Deluxe',
            promotion: document.getElementById('agoda_promotion')?.value || 'Long Stay Deal. Price includes 10% discount!',
            arrivalDate: document.getElementById('agoda_arrival_date')?.value || 'October 16, 2026',
            departureDate: document.getElementById('agoda_departure_date')?.value || 'October 26, 2026',
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
            document.getElementById('agoda_client_name').value = data.clientName || 'AUNG KHIN NYUNT';
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
            document.getElementById('agoda_arrival_date').value = data.arrivalDate || 'October 16, 2026';
        }
        if (document.getElementById('agoda_departure_date')) {
            document.getElementById('agoda_departure_date').value = data.departureDate || 'October 26, 2026';
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
            cancelInput.value = data.cancellationDate || calculateDefaultCancellationDate(data.arrivalDate || 'October 16, 2026');
            cancelInput.dataset.autoFilled = data.cancellationDate ? 'false' : 'true';
        }
        if (document.getElementById('agoda_remarks_special')) {
            document.getElementById('agoda_remarks_special').value = data.remarksSpecial || 'NonSmoke,LargeBed';
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
            clientName: quickClient || 'AUNG KHIN NYUNT',
            arrivalDate: quickArrival ? formatAgodaDate(quickArrival) : 'October 16, 2026',
            departureDate: quickDeparture ? formatAgodaDate(quickDeparture) : 'October 26, 2026',
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
        const quickClient = (document.getElementById('service_hotel_client_name')?.value || '').trim() || 'AUNG KHIN NYUNT';
        const quickArrival = (document.getElementById('service_hotel_arrival')?.value || '').trim();
        const quickDeparture = (document.getElementById('service_hotel_departure')?.value || '').trim();

        const data = {
            destination: quickDest,
            bookingId: generateRandomBookingId(),
            memberId: generateRandomMemberId(),
            clientName: quickClient,
            propertyName: preset.propertyName,
            propertyAddress: preset.propertyAddress,
            propertyContact: preset.propertyContact,
            arrivalDate: quickArrival ? formatAgodaDate(quickArrival) : 'October 16, 2026',
            departureDate: quickDeparture ? formatAgodaDate(quickDeparture) : 'October 26, 2026',
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

    downloadImgBtn?.addEventListener('click', async () => {
        showToast('Saving official Agoda image...', 'info');
        try {
            downloadImgBtn.disabled = true;
            downloadImgBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Saving Image...';
            const data = collectFormData();
            const filename = await downloadAgodaImage(data);
            showToast(`Image saved: ${filename}`, 'success');
        } catch (err) {
            console.error('Image generation error:', err);
            showToast(`Could not save image: ${err.message}`, 'error');
        } finally {
            downloadImgBtn.disabled = false;
            downloadImgBtn.innerHTML = '<i class="fa-solid fa-image"></i> Save Photo';
        }
    });

    shareBtn?.addEventListener('click', async () => {
        try {
            const data = collectFormData();
            await shareAgodaBooking(data);
        } catch (err) {
            console.error('Share error:', err);
            showToast(`Share failed: ${err.message}`, 'error');
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
    const downloadImgBtn = document.getElementById('airAsiaDownloadImgBtn');
    const shareBtn = document.getElementById('airAsiaShareBtn');
    const previewContainer = document.getElementById('airAsiaPreviewContainer');
    const airlineSelect = document.getElementById('aa_airline_select');
    const addPaxBtn = document.getElementById('aa_add_pax_btn');

    if (!dropZone || !modal) return;

    function renderPassengerRows(passengersList = []) {
        const container = document.getElementById('aa_passengers_list');
        if (!container) return;
        container.innerHTML = '';

        if (!passengersList || passengersList.length === 0) {
            passengersList = [{ name: '', type: 'Adult' }];
        }

        passengersList.forEach((p, idx) => {
            const row = document.createElement('div');
            row.className = 'aa_pax_row';
            row.style.cssText = 'display:flex; gap:8px; align-items:flex-end; background:var(--apple-bg-secondary); padding:8px 10px; border-radius:8px; border:1px solid var(--apple-separator);';
            row.innerHTML = `
                <div style="flex:1;">
                    <label style="font-size:11px; margin-bottom:2px; display:block; color:var(--apple-secondary-label); font-weight:600;">Passenger Name (${idx + 1})</label>
                    <input type="text" class="aa_pax_name_input" value="${p.name || ''}" placeholder="PASSENGER FULL NAME" style="width:100%; font-weight:700; text-transform:uppercase;">
                </div>
                <div style="width:100px;">
                    <label style="font-size:11px; margin-bottom:2px; display:block; color:var(--apple-secondary-label); font-weight:600;">Type</label>
                    <select class="aa_pax_type_input" style="width:100%; font-size:12px;">
                        <option value="Adult" ${p.type === 'Adult' ? 'selected' : ''}>Adult</option>
                        <option value="Child" ${p.type === 'Child' ? 'selected' : ''}>Child</option>
                        <option value="Infant" ${p.type === 'Infant' ? 'selected' : ''}>Infant</option>
                    </select>
                </div>
                <button type="button" class="btn-service btn-secondary aa_remove_pax_btn" style="padding:7px 10px; color:#dc2626; border-radius:6px;" title="Remove Passenger">
                    <i class="fa-solid fa-trash-can"></i>
                </button>
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
        if (!container) return [{ name: '', type: 'Adult' }];
        const rows = container.querySelectorAll('.aa_pax_row');
        const list = [];
        rows.forEach(r => {
            const name = (r.querySelector('.aa_pax_name_input')?.value || '').trim().toUpperCase();
            const type = r.querySelector('.aa_pax_type_input')?.value || 'Adult';
            if (name) {
                list.push({ name, type });
            }
        });
        return list.length > 0 ? list : [{ name: '', type: 'Adult' }];
    }

    addPaxBtn?.addEventListener('click', () => {
        const currentPassengers = collectPassengers();
        currentPassengers.push({ name: '', type: 'Adult' });
        renderPassengerRows(currentPassengers);
        const container = document.getElementById('aa_passengers_list');
        const lastInput = container?.querySelector('.aa_pax_row:last-child .aa_pax_name_input');
        if (lastInput) lastInput.focus();
        updatePreview();
    });

    airlineSelect?.addEventListener('change', (e) => {
        const chosen = e.target.value;
        const airlineInput = document.getElementById('aa_airline_name');
        if (airlineInput) {
            if (chosen === 'VietJet Air' && (!airlineInput.value || airlineInput.value === 'AirAsia Berhad')) {
                airlineInput.value = 'VietJet Air';
            } else if (chosen === 'AirAsia' && (!airlineInput.value || airlineInput.value === 'VietJet Air')) {
                airlineInput.value = 'AirAsia Berhad';
            }
        }
        updatePreview();
    });

    function collectFormData() {
        const passengers = collectPassengers();
        return {
            airline: airlineSelect?.value || 'AirAsia',
            bookingNo: document.getElementById('aa_booking_no')?.value || '',
            pnr: (document.getElementById('aa_pnr')?.value || '').trim().toUpperCase(),
            eTicketNo: document.getElementById('aa_eticket_no')?.value || '',
            flightClass: document.getElementById('aa_class')?.value || 'Economy',
            passengers: passengers,
            passengerName: passengers[0]?.name || '',
            passengerType: passengers[0]?.type || 'Adult',
            flightNo: (document.getElementById('aa_flight_no')?.value || '').trim().toUpperCase(),
            airlineName: document.getElementById('aa_airline_name')?.value || 'AirAsia Berhad',
            depTime: document.getElementById('aa_dep_time')?.value || '',
            depDateFormatted: document.getElementById('aa_dep_date')?.value || '',
            depAirport: document.getElementById('aa_dep_airport')?.value || '',
            depTerminal: document.getElementById('aa_dep_terminal')?.value || '',
            arrTime: document.getElementById('aa_arr_time')?.value || '',
            arrDateFormatted: document.getElementById('aa_arr_date')?.value || '',
            arrAirport: document.getElementById('aa_arr_airport')?.value || '',
            arrTerminal: document.getElementById('aa_arr_terminal')?.value || '',
            route: document.getElementById('aa_route')?.value || '',
            checkedBaggage: document.getElementById('aa_bag_checked')?.value || '',
            carryOnBaggage: document.getElementById('aa_bag_carry')?.value || '',
            personalItem: document.getElementById('aa_bag_personal')?.value || ''
        };
    }

    function updatePreview() {
        if (!previewContainer) return;
        const currentData = collectFormData();
        previewContainer.innerHTML = renderAirAsiaTicketHtml(currentData);
    }

    function populateForm(data) {
        if (airlineSelect) {
            airlineSelect.value = data.airline || 'AirAsia';
        }
        if (document.getElementById('aa_booking_no')) document.getElementById('aa_booking_no').value = data.bookingNo || '';
        if (document.getElementById('aa_pnr')) document.getElementById('aa_pnr').value = data.pnr || '';
        if (document.getElementById('aa_eticket_no')) document.getElementById('aa_eticket_no').value = data.eTicketNo || 'To be advised at check-in';
        if (document.getElementById('aa_class')) document.getElementById('aa_class').value = data.flightClass || 'Economy';
        
        const paxList = (data.passengers && data.passengers.length > 0)
            ? data.passengers
            : [{ name: data.passengerName || '', type: data.passengerType || 'Adult' }];
        renderPassengerRows(paxList);

        if (document.getElementById('aa_flight_no')) document.getElementById('aa_flight_no').value = data.flightNo || '';
        if (document.getElementById('aa_airline_name')) document.getElementById('aa_airline_name').value = data.airlineName || (data.airline === 'VietJet Air' ? 'VietJet Air' : 'AirAsia Berhad');
        if (document.getElementById('aa_dep_time')) document.getElementById('aa_dep_time').value = data.depTime || '';
        if (document.getElementById('aa_dep_date')) document.getElementById('aa_dep_date').value = data.depDateFormatted || '';
        if (document.getElementById('aa_dep_airport')) document.getElementById('aa_dep_airport').value = data.depAirport || '';
        if (document.getElementById('aa_dep_terminal')) document.getElementById('aa_dep_terminal').value = data.depTerminal || '';
        if (document.getElementById('aa_arr_time')) document.getElementById('aa_arr_time').value = data.arrTime || '';
        if (document.getElementById('aa_arr_date')) document.getElementById('aa_arr_date').value = data.arrDateFormatted || '';
        if (document.getElementById('aa_arr_airport')) document.getElementById('aa_arr_airport').value = data.arrAirport || '';
        if (document.getElementById('aa_arr_terminal')) document.getElementById('aa_arr_terminal').value = data.arrTerminal || '';
        if (document.getElementById('aa_route')) document.getElementById('aa_route').value = data.route || '';
        if (document.getElementById('aa_bag_checked')) document.getElementById('aa_bag_checked').value = data.checkedBaggage || '20 kg per person\nDimensions of each piece cannot exceed 119 x 119 x 81 cm';
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
                showToast('Could not extract text from PDF (it might be an image). Opening form for manual entry.', 'warning');
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
            route: '',
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

    downloadImgBtn?.addEventListener('click', async () => {
        try {
            downloadImgBtn.disabled = true;
            downloadImgBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Saving Image...';
            const data = collectFormData();
            const filename = await downloadAirAsiaImage(data);
            showToast(`Image saved: ${filename}`, 'success');
        } catch (err) {
            console.error('Image generation error:', err);
            showToast(`Could not save image: ${err.message}`, 'error');
        } finally {
            downloadImgBtn.disabled = false;
            downloadImgBtn.innerHTML = '<i class="fa-solid fa-image"></i> Save Photo';
        }
    });

    shareBtn?.addEventListener('click', async () => {
        try {
            const data = collectFormData();
            await shareAirAsiaTicket(data);
        } catch (err) {
            console.error('Share error:', err);
            showToast(`Share failed: ${err.message}`, 'error');
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
