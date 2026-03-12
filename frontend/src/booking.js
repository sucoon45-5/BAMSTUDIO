import { showToast, apiPost } from './utils.js';

const PRICING = {
    'Recording Studio': 10000,
    'Video Studio': 15000,
    'Podcast Studio': 8000,
    'Mixing & Mastering': 12000,
    'Voice-over Studio': 7000,
};

const TIME_SLOTS = ['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00'];

let state = {
    service: '', date: '', time: '', duration: 2, price: 0,
    name: '', email: '', phone: '', notes: '', bookingId: null,
};
let calDate = new Date();

// ─── Calendar ───
function renderCalendar() {
    const grid = document.getElementById('calendarGrid');
    const label = document.getElementById('monthLabel');
    if (!grid) return;
    calDate.setDate(1);
    const year = calDate.getFullYear(), month = calDate.getMonth();
    label.textContent = calDate.toLocaleDateString('en-NG', { month: 'long', year: 'numeric' });
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const today = new Date(); today.setHours(0, 0, 0, 0);

    let html = '';
    for (let i = 0; i < firstDay; i++) html += '<div></div>';
    for (let d = 1; d <= daysInMonth; d++) {
        const date = new Date(year, month, d);
        const past = date < today;
        const isToday = date.toDateString() === today.toDateString();
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
        const sel = dateStr === state.date;
        html += `<div class="cal-day${past ? ' disabled' : ''}${isToday ? ' today' : ''}${sel ? ' selected' : ''}" data-date="${dateStr}">${d}</div>`;
    }
    grid.innerHTML = html;

    grid.querySelectorAll('.cal-day:not(.disabled)').forEach(day => {
        day.addEventListener('click', () => {
            grid.querySelectorAll('.cal-day').forEach(d => d.classList.remove('selected'));
            day.classList.add('selected');
            state.date = day.dataset.date;
            document.getElementById('selectedDateDisplay').textContent = `Selected: ${new Date(state.date).toLocaleDateString('en-NG', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}`;
            showTimeSlots();
            document.getElementById('timeGroup').style.display = '';
            document.getElementById('durationGroup').style.display = '';
        });
    });
}

function showTimeSlots() {
    const container = document.getElementById('timeSlots');
    container.innerHTML = TIME_SLOTS.map(t => {
        const [h, m] = t.split(':');
        const hour = parseInt(h);
        const label = `${hour > 12 ? hour - 12 : hour || 12}:${m} ${hour >= 12 ? 'PM' : 'AM'}`;
        const sel = t === state.time;
        return `<div class="time-slot${sel ? ' selected' : ''}" data-time="${t}">${label}</div>`;
    }).join('');
    container.querySelectorAll('.time-slot').forEach(slot => {
        slot.addEventListener('click', () => {
            container.querySelectorAll('.time-slot').forEach(s => s.classList.remove('selected'));
            slot.classList.add('selected');
            state.time = slot.dataset.time;
            updatePrice();
        });
    });
}

function updatePrice() {
    const rate = PRICING[state.service] || 0;
    const dur = parseInt(document.getElementById('duration')?.value || 2);
    state.duration = dur;
    state.price = rate * dur;
    const preview = document.getElementById('pricePreview');
    const totalEl = document.getElementById('totalPrice');
    const breakEl = document.getElementById('priceBreakdown');
    if (preview && state.service && state.price > 0) {
        preview.style.display = '';
        totalEl.textContent = `₦${state.price.toLocaleString()}`;
        breakEl.textContent = `₦${rate.toLocaleString()} × ${dur} hours`;
    }
}

// ─── Step navigation ───
function showStep(n) {
    [1, 2, 3].forEach(i => {
        document.getElementById(`step${i}`).style.display = i === n ? '' : 'none';
        const sEl = document.getElementById(`s${i}`);
        if (i < n) { sEl.classList.remove('active'); sEl.classList.add('done'); sEl.innerHTML = '✓'; }
        else if (i === n) { sEl.classList.add('active'); sEl.classList.remove('done'); sEl.innerHTML = i; }
        else { sEl.classList.remove('active', 'done'); sEl.innerHTML = i; }
    });
}

function fillStep2Summary() {
    const fmt = (d) => new Date(d).toLocaleDateString('en-NG', { weekday: 'short', month: 'short', day: 'numeric' });
    const fmtT = (t) => { const [h, m] = t.split(':'); const hr = parseInt(h); return `${hr > 12 ? hr - 12 : hr || 12}:${m} ${hr >= 12 ? 'PM' : 'AM'}`; };
    document.getElementById('sumService').textContent = state.service;
    document.getElementById('sumDate').textContent = fmt(state.date);
    document.getElementById('sumTime').textContent = fmtT(state.time);
    document.getElementById('sumDuration').textContent = `${state.duration} hour${state.duration > 1 ? 's' : ''}`;
    document.getElementById('sumTotal').textContent = `₦${state.price.toLocaleString()}`;
}

function fillStep3Summary() {
    const fmt = (d) => new Date(d).toLocaleDateString('en-NG', { weekday: 'short', month: 'short', day: 'numeric' });
    const fmtT = (t) => { const [h, m] = t.split(':'); const hr = parseInt(h); return `${hr > 12 ? hr - 12 : hr || 12}:${m} ${hr >= 12 ? 'PM' : 'AM'}`; };
    document.getElementById('payService').textContent = state.service;
    document.getElementById('payDateTime').textContent = `${fmt(state.date)} at ${fmtT(state.time)}`;
    document.getElementById('payDuration').textContent = `${state.duration} hour${state.duration > 1 ? 's' : ''}`;
    document.getElementById('payTotal').textContent = `₦${state.price.toLocaleString()}`;
}

// ─── Paystack ───
async function initiatePaystack() {
    const loadEl = document.getElementById('paymentLoading');
    loadEl.classList.remove('hidden');
    document.getElementById('payBtn').disabled = true;

    // First create booking in backend
    const bookingRes = await apiPost('/bookings', {
        customer_name: state.name,
        customer_email: state.email,
        customer_phone: state.phone,
        service: state.service,
        room: state.service,
        date: state.date,
        time: state.time + ':00',
        duration: state.duration,
        notes: state.notes,
    });

    if (!bookingRes.id) {
        showToast(bookingRes.error || 'Failed to create booking.', 'error');
        loadEl.classList.add('hidden');
        document.getElementById('payBtn').disabled = false;
        return;
    }

    state.bookingId = bookingRes.id;

    // Then init Paystack
    const initRes = await apiPost('/payments/initialize', {
        booking_id: state.bookingId,
        email: state.email,
        amount: state.price,
    });

    loadEl.classList.add('hidden');
    document.getElementById('payBtn').disabled = false;

    if (!initRes.authorization_url) {
        showToast('Failed to initialize payment.', 'error');
        return;
    }

    // Paystack inline
    const handler = window.PaystackPop?.setup({
        key: 'pk_test_your_paystack_public_key', // Replace with your actual public key
        email: state.email,
        amount: state.price * 100,
        ref: initRes.reference,
        metadata: { booking_id: state.bookingId },
        callback: async (response) => {
            const verify = await fetch(`http://localhost:5000/api/payments/verify/${response.reference}`).then(r => r.json());
            if (verify.success) {
                showSuccess();
            } else {
                showToast('Payment failed. Please try again.', 'error');
            }
        },
        onClose: () => showToast('Payment window closed.', 'error'),
    });

    if (handler) {
        handler.openIframe();
    } else {
        // Fallback: redirect to Paystack
        window.location.href = initRes.authorization_url;
    }
}

function showSuccess() {
    [1, 2, 3].forEach(i => document.getElementById(`step${i}`).style.display = 'none');
    document.getElementById('stepSuccess').style.display = '';
    const fmt = (d) => new Date(d).toLocaleDateString('en-NG', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
    const fmtT = (t) => { const [h, m] = t.split(':'); const hr = parseInt(h); return `${hr > 12 ? hr - 12 : hr || 12}:${m} ${hr >= 12 ? 'PM' : 'AM'}`; };
    document.getElementById('confirmDetails').innerHTML = `
    <div class="flex justify-between"><span>Service</span><span class="font-semibold text-white">${state.service}</span></div>
    <div class="flex justify-between"><span>Date</span><span class="font-semibold text-white">${fmt(state.date)}</span></div>
    <div class="flex justify-between"><span>Time</span><span class="font-semibold text-white">${fmtT(state.time)}</span></div>
    <div class="flex justify-between"><span>Duration</span><span class="font-semibold text-white">${state.duration} hours</span></div>
    <div class="flex justify-between font-bold text-base border-t pt-2 mt-1" style="border-color:#1e1e2e"><span>Paid</span><span class="neon-text">₦${state.price.toLocaleString()}</span></div>
  `;
}

// ─── Init ───
document.addEventListener('DOMContentLoaded', () => {
    // Service selection
    const serviceEl = document.getElementById('service');
    serviceEl?.addEventListener('change', (e) => {
        state.service = e.target.value;
        if (state.service) {
            document.getElementById('calendarGroup').style.display = '';
            renderCalendar();
            updatePrice();
        }
    });

    // Calendar nav
    document.getElementById('prevMonth')?.addEventListener('click', () => {
        calDate.setMonth(calDate.getMonth() - 1);
        renderCalendar();
    });
    document.getElementById('nextMonth')?.addEventListener('click', () => {
        calDate.setMonth(calDate.getMonth() + 1);
        renderCalendar();
    });

    // Duration change
    document.getElementById('duration')?.addEventListener('change', updatePrice);

    // Step 1 → 2
    document.getElementById('step1Next')?.addEventListener('click', () => {
        if (!state.service) return showToast('Please select a service.', 'error');
        if (!state.date) return showToast('Please select a date.', 'error');
        if (!state.time) return showToast('Please select a time slot.', 'error');
        updatePrice();
        fillStep2Summary();
        showStep(2);
    });

    // Step 2 → 3
    document.getElementById('step2Next')?.addEventListener('click', () => {
        state.name = document.getElementById('custName')?.value.trim();
        state.email = document.getElementById('custEmail')?.value.trim();
        state.phone = document.getElementById('custPhone')?.value.trim();
        state.notes = document.getElementById('bookingNotes')?.value.trim();
        if (!state.name || !state.email || !state.phone) return showToast('Please fill in all required fields.', 'error');
        if (!state.email.includes('@')) return showToast('Enter a valid email.', 'error');
        fillStep3Summary();
        showStep(3);
    });

    // Step 2 ← 1
    document.getElementById('step2Back')?.addEventListener('click', () => showStep(1));

    // Step 3 ← 2
    document.getElementById('step3Back')?.addEventListener('click', () => showStep(2));

    // Pay
    document.getElementById('payBtn')?.addEventListener('click', initiatePaystack);
});
