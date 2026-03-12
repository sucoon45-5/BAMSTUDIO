import { showToast, getUser, apiGet, apiPatch, formatPrice, formatDate, formatTime } from './utils.js';

async function loadStats() {
    const res = await apiGet('/admin/stats');
    if (res.total !== undefined) {
        document.getElementById('aStatTotal').textContent = res.total || 0;
        document.getElementById('aStatPending').textContent = res.pending || 0;
        document.getElementById('aStatApproved').textContent = res.approved || 0;
        document.getElementById('aStatRevenue').textContent = `₦${Number(res.total_revenue || 0).toLocaleString()}`;
    }
}

function statusBadge(s) {
    const map = { approved: 'badge-green', pending: 'badge-orange', cancelled: 'badge-red', rejected: 'badge-red' };
    return `<span class="badge ${map[s] || 'badge-blue'}">${s}</span>`;
}

async function loadBookings(search = '') {
    const res = await apiGet('/admin/bookings');
    const tbody = document.getElementById('adminBookingsTable');
    if (!Array.isArray(res)) { tbody.innerHTML = '<tr><td colspan="8" class="text-center py-8 text-red-400">Failed to load.</td></tr>'; return; }
    const filtered = search ? res.filter(b => b.customer_name?.toLowerCase().includes(search.toLowerCase()) || b.service?.toLowerCase().includes(search.toLowerCase())) : res;
    tbody.innerHTML = filtered.length === 0
        ? '<tr><td colspan="8" class="text-center py-8 text-slate-500">No bookings.</td></tr>'
        : filtered.map(b => `
      <tr>
        <td class="text-slate-500">#${b.id}</td>
        <td>
          <div class="font-medium text-sm">${b.customer_name || '—'}</div>
          <div class="text-slate-500 text-xs">${b.customer_email || ''}</div>
        </td>
        <td class="text-sm">${b.service}</td>
        <td class="text-sm text-slate-400">${formatDate(b.date)}<br>${formatTime(b.time)}</td>
        <td class="font-semibold neon-text">${formatPrice(b.price)}</td>
        <td>${statusBadge(b.payment_status)}</td>
        <td>${statusBadge(b.status)}</td>
        <td>
          <div class="flex gap-2">
            ${b.status === 'pending' ? `
              <button class="badge badge-green cursor-pointer approve-btn" data-id="${b.id}">Approve</button>
              <button class="badge badge-red cursor-pointer reject-btn" data-id="${b.id}">Reject</button>
            ` : `<span class="text-slate-600 text-xs">${b.status}</span>`}
          </div>
        </td>
      </tr>
    `).join('');

    tbody.querySelectorAll('.approve-btn').forEach(btn => {
        btn.addEventListener('click', async () => {
            await apiPatch(`/admin/bookings/${btn.dataset.id}/status`, { status: 'approved' });
            showToast('Booking approved ✅', 'success');
            loadBookings(); loadStats();
        });
    });
    tbody.querySelectorAll('.reject-btn').forEach(btn => {
        btn.addEventListener('click', async () => {
            await apiPatch(`/admin/bookings/${btn.dataset.id}/status`, { status: 'rejected' });
            showToast('Booking rejected.', 'error');
            loadBookings(); loadStats();
        });
    });
}

async function loadPayments() {
    const res = await apiGet('/admin/payments');
    const tbody = document.getElementById('adminPaymentsTable');
    if (!Array.isArray(res)) { tbody.innerHTML = '<tr><td colspan="7" class="text-red-400 text-center py-4">Failed.</td></tr>'; return; }
    tbody.innerHTML = res.length === 0
        ? '<tr><td colspan="7" class="text-center py-8 text-slate-500">No payments.</td></tr>'
        : res.map(p => `
      <tr>
        <td class="text-slate-500">#${p.id}</td>
        <td class="text-sm">${p.customer_name || '—'}</td>
        <td class="text-sm">${p.service || '—'}</td>
        <td class="font-semibold neon-text">${formatPrice(p.amount)}</td>
        <td class="text-slate-400 text-xs font-mono">${p.paystack_reference || '—'}</td>
        <td><span class="badge ${p.status === 'success' ? 'badge-green' : 'badge-orange'}">${p.status}</span></td>
        <td class="text-slate-500 text-sm">${new Date(p.created_at).toLocaleDateString()}</td>
      </tr>
    `).join('');
}

async function loadUsers() {
    const res = await apiGet('/admin/users');
    const tbody = document.getElementById('adminUsersTable');
    if (!Array.isArray(res)) { tbody.innerHTML = '<tr><td colspan="6" class="text-red-400 text-center py-4">Failed.</td></tr>'; return; }
    tbody.innerHTML = res.length === 0
        ? '<tr><td colspan="6" class="text-center py-8 text-slate-500">No users.</td></tr>'
        : res.map(u => `
      <tr>
        <td class="text-slate-500">#${u.id}</td>
        <td class="font-medium">${u.name}</td>
        <td class="text-slate-400">${u.email}</td>
        <td class="text-slate-400">${u.phone || '—'}</td>
        <td><span class="badge ${u.role === 'admin' ? 'badge-orange' : 'badge-blue'}">${u.role}</span></td>
        <td class="text-slate-500 text-sm">${new Date(u.created_at).toLocaleDateString()}</td>
      </tr>
    `).join('');
}

document.addEventListener('DOMContentLoaded', () => {
    const user = getUser();
    if (!user || user.role !== 'admin') {
        document.getElementById('notAdmin').classList.remove('hidden');
        document.getElementById('adminContent').classList.add('hidden');
        document.getElementById('adminBadge').classList.add('hidden');
        return;
    }

    loadStats();
    loadBookings();

    // Tab switching
    document.querySelectorAll('[data-tab]').forEach(tab => {
        tab.addEventListener('click', () => {
            document.querySelectorAll('[data-tab]').forEach(t => t.classList.remove('active'));
            document.querySelectorAll('.admin-tab').forEach(p => p.classList.add('hidden'));
            tab.classList.add('active');
            const target = document.getElementById(`tab-${tab.dataset.tab}`);
            target?.classList.remove('hidden');
            if (tab.dataset.tab === 'payments') loadPayments();
            if (tab.dataset.tab === 'users') loadUsers();
            if (tab.dataset.tab === 'bookings') loadBookings();
        });
    });

    // Search
    let searchTimer;
    document.getElementById('bookingSearch')?.addEventListener('input', (e) => {
        clearTimeout(searchTimer);
        searchTimer = setTimeout(() => loadBookings(e.target.value), 300);
    });
});
