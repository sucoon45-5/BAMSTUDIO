// Shared utility functions
const prod = window.location.hostname !== 'localhost';
export const API = prod ? '/api' : 'http://localhost:5000/api';

export function getToken() {
    return localStorage.getItem('bam_token');
}

export function getUser() {
    const u = localStorage.getItem('bam_user');
    return u ? JSON.parse(u) : null;
}

export function logout() {
    localStorage.removeItem('bam_token');
    localStorage.removeItem('bam_user');
    window.location.href = '/login.html';
}

export function showToast(msg, type = 'info') {
    const toast = document.getElementById('toast');
    if (!toast) return;
    toast.className = `toast ${type}`;
    toast.innerHTML = msg;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 4000);
}

export function formatPrice(n) {
    return '₦' + Number(n).toLocaleString();
}

export function formatDate(d) {
    return new Date(d).toLocaleDateString('en-NG', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
}

export function formatTime(t) {
    const [h, m] = t.split(':');
    const hour = parseInt(h);
    return `${hour > 12 ? hour - 12 : hour || 12}:${m} ${hour >= 12 ? 'PM' : 'AM'}`;
}

export async function apiGet(path) {
    const token = getToken();
    const res = await fetch(API + path, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    return res.json();
}

export async function apiPost(path, body) {
    const token = getToken();
    const res = await fetch(API + path, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify(body),
    });
    return res.json();
}

export async function apiPatch(path, body = {}) {
    const token = getToken();
    const res = await fetch(API + path, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(body),
    });
    return res.json();
}
