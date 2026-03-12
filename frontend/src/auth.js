import { showToast, apiPost } from './utils.js';

function switchTab(show, hide) {
    document.getElementById(show).classList.remove('hidden');
    document.getElementById(hide).classList.add('hidden');
}

document.addEventListener('DOMContentLoaded', () => {
    // Tab switching
    document.getElementById('loginTab')?.addEventListener('click', () => {
        switchTab('loginForm', 'registerForm');
        document.getElementById('loginTab').style.cssText = 'background:linear-gradient(135deg,#f97316,#f59e0b);color:#000';
        document.getElementById('registerTab').style.cssText = 'color:#94a3b8';
    });
    document.getElementById('registerTab')?.addEventListener('click', () => {
        switchTab('registerForm', 'loginForm');
        document.getElementById('registerTab').style.cssText = 'background:linear-gradient(135deg,#f97316,#f59e0b);color:#000';
        document.getElementById('loginTab').style.cssText = 'color:#94a3b8';
    });
    document.getElementById('toRegister')?.addEventListener('click', () =>
        document.getElementById('registerTab').click());
    document.getElementById('toLogin')?.addEventListener('click', () =>
        document.getElementById('loginTab').click());

    // Login
    document.getElementById('loginBtn')?.addEventListener('click', async () => {
        const email = document.getElementById('loginEmail').value.trim();
        const password = document.getElementById('loginPassword').value;
        if (!email || !password) return showToast('Please fill in all fields.', 'error');
        const btn = document.getElementById('loginBtn');
        btn.disabled = true; btn.textContent = 'Signing in...';
        const res = await apiPost('/auth/login', { email, password });
        btn.disabled = false; btn.textContent = 'Sign In';
        if (res.token) {
            localStorage.setItem('bam_token', res.token);
            localStorage.setItem('bam_user', JSON.stringify(res.user));
            showToast('Welcome back! 🎵', 'success');
            setTimeout(() => window.location.href = res.user.role === 'admin' ? '/admin.html' : '/dashboard.html', 1000);
        } else {
            showToast(res.error || 'Login failed.', 'error');
        }
    });

    // Register
    document.getElementById('registerBtn')?.addEventListener('click', async () => {
        const name = document.getElementById('regName').value.trim();
        const email = document.getElementById('regEmail').value.trim();
        const phone = document.getElementById('regPhone').value.trim();
        const password = document.getElementById('regPass').value;
        if (!name || !email || !password) return showToast('Please fill in all required fields.', 'error');
        if (password.length < 8) return showToast('Password must be at least 8 characters.', 'error');
        const btn = document.getElementById('registerBtn');
        btn.disabled = true; btn.textContent = 'Creating account...';
        const res = await apiPost('/auth/register', { name, email, phone, password });
        btn.disabled = false; btn.textContent = 'Create Account';
        if (res.token) {
            localStorage.setItem('bam_token', res.token);
            localStorage.setItem('bam_user', JSON.stringify(res.user));
            showToast('Account created! Welcome to BAM Studio 🎵', 'success');
            setTimeout(() => window.location.href = '/dashboard.html', 1000);
        } else {
            showToast(res.error || 'Registration failed.', 'error');
        }
    });
});
