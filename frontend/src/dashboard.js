import { showToast, getUser, getToken, apiGet, apiPatch, formatPrice, formatDate, formatTime } from './utils.js';

let allBookings = [];
let currentFilter = 'all';

function statusBadge(s) {
    const map = { approved: 'badge-green', pending: 'badge-orange', cancelled: 'badge-red', rejected: 'badge-red' };
    return `<span class="badge ${map[s] || 'badge-blue'}">${s}</span>`;
}

function payBadge(s) {
    const map = { completed: 'badge-green', pending: 'badge-orange', failed: 'badge-red', cancelled: 'badge-red' };
    return `<span class="badge ${map[s] || 'badge-blue'}">${s}</span>`;
}

function renderBookings(bookings) {
    const el = document.getElementById('bookingsList');
    if (!bookings?.length) {
        el.innerHTML = `<div class="text-center py-12 text-slate-400">
      <div class="text-5xl mb-3">📅</div>
      <p>No bookings found.</p>
      <a href="/booking.html" class="btn-primary inline-flex mt-4" style="font-size:.875rem">Book Your First Session</a>
    </div>`;
        return;
    }
    el.innerHTML = `<div class="space-y-4">${bookings.map(b => `
    <div class="card p-5" style="border-color:${b.status === 'approved' ? 'rgba(34,197,94,.25)' : b.status === 'cancelled' ? 'rgba(239,68,68,.2)' : 'rgba(239,68,68,.15)'}">
      <div class="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div class="flex items-center gap-3 mb-1 flex-wrap">
            <span class="font-bold">${b.service}</span>
            ${statusBadge(b.status)}
            ${payBadge(b.payment_status)}
          </div>
          <div class="text-slate-400 text-sm">${formatDate(b.date)} at ${formatTime(b.time)} · ${b.duration} hr${b.duration > 1 ? 's' : ''}</div>
          ${b.room ? `<div class="text-slate-500 text-xs mt-0.5">Room: ${b.room}</div>` : ''}
        </div>
        <div class="text-right">
          <div class="font-bold neon-text text-lg">${formatPrice(b.price)}</div>
          ${b.status !== 'cancelled' && b.status !== 'approved' ? `
          <div class="flex gap-2 mt-2 justify-end flex-wrap">
            <button class="btn-outline reschedule-btn" data-id="${b.id}" style="font-size:.75rem;padding:.35rem .75rem">Reschedule</button>
            <button class="btn-outline cancel-btn" data-id="${b.id}" style="font-size:.75rem;padding:.35rem .75rem;border-color:#ef4444;color:#ef4444">Cancel</button>
          </div>
          ` : ''}
        </div>
      </div>
    </div>
  `).join('')}</div>`;

    // Event listeners
    el.querySelectorAll('.cancel-btn').forEach(btn => {
        btn.addEventListener('click', async () => {
            if (!confirm('Cancel this booking?')) return;
            const res = await apiPatch(`/bookings/${btn.dataset.id}/cancel`);
            if (res.message) { showToast('Booking cancelled.', 'success'); loadBookings(); }
            else showToast(res.error, 'error');
        });
    });

    el.querySelectorAll('.reschedule-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.getElementById('rescheduleId').value = btn.dataset.id;
            const modal = document.getElementById('rescheduleModal');
            modal.classList.remove('hidden'); modal.classList.add('flex');
        });
    });
}

async function loadBookings() {
    const res = await apiGet('/bookings/my');
    if (Array.isArray(res)) {
        allBookings = res;
        const filtered = currentFilter === 'all' ? res : res.filter(b => b.status === currentFilter);
        renderBookings(filtered);

        // Stats
        document.getElementById('statTotal').textContent = res.length;
        document.getElementById('statConfirmed').textContent = res.filter(b => b.status === 'approved').length;
        document.getElementById('statPending').textContent = res.filter(b => b.status === 'pending').length;
        const spent = res.filter(b => b.payment_status === 'completed').reduce((s, b) => s + Number(b.price), 0);
        document.getElementById('statSpent').textContent = `₦${(spent / 1000).toFixed(0)}k`;
    } else {
        document.getElementById('bookingsList').innerHTML = `<div class="text-center py-8 text-red-400">Failed to load bookings. Is the server running?</div>`;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const user = getUser();
    if (!user || !getToken()) {
        document.getElementById('guestWarning').classList.remove('hidden');
        document.getElementById('dashboardContent').classList.add('hidden');
        return;
    }

    loadBookings();

    // Filter tabs
    document.querySelectorAll('[data-filter]').forEach(tab => {
        tab.addEventListener('click', () => {
            document.querySelectorAll('[data-filter]').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            currentFilter = tab.dataset.filter;
            const filtered = currentFilter === 'all' ? allBookings : allBookings.filter(b => b.status === currentFilter);
            renderBookings(filtered);
        });
    });

    // Reschedule modal
    document.getElementById('cancelReschedule')?.addEventListener('click', () => {
        const m = document.getElementById('rescheduleModal');
        m.classList.add('hidden'); m.classList.remove('flex');
    });
    document.getElementById('confirmReschedule')?.addEventListener('click', async () => {
        const id = document.getElementById('rescheduleId').value;
        const date = document.getElementById('rescheduleDate').value;
        const time = document.getElementById('rescheduleTime').value;
        if (!date || !time) return showToast('Select date and time.', 'error');
        const res = await apiPatch(`/bookings/${id}/reschedule`, { date, time: time + ':00' });
        if (res.message) {
            showToast('Booking rescheduled! ✅', 'success');
            const m = document.getElementById('rescheduleModal');
            m.classList.add('hidden'); m.classList.remove('flex');
            loadBookings();
        } else showToast(res.error, 'error');
    });
});
