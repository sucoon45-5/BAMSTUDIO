import { showToast, getUser, logout } from './utils.js';

const NAV_HTML = `
<nav class="navbar py-4 px-6" id="navbar">
  <div class="max-w-7xl mx-auto flex items-center justify-between">
    <a href="/" class="flex items-center gap-3">
      <div class="w-10 h-10 rounded-xl flex items-center justify-center" style="background:linear-gradient(135deg,#ef4444,#f59e0b)">
        <span class="font-black text-black text-lg">B</span>
      </div>
      <span class="font-extrabold text-lg tracking-tight">BAM <span class="neon-text">Studio</span></span>
    </a>
    <div class="hidden md:flex items-center gap-8">
      <a href="/" class="nav-link" id="nav-home">Home</a>
      <a href="/about.html" class="nav-link" id="nav-about">About</a>
      <a href="/pricing.html" class="nav-link" id="nav-pricing">Pricing</a>
      <a href="/gallery.html" class="nav-link" id="nav-gallery">Gallery</a>
      <a href="/contact.html" class="nav-link" id="nav-contact">Contact</a>
    </div>
    <div class="hidden md:flex items-center gap-3" id="navActions"></div>
    <button id="menuBtn" class="md:hidden text-white p-2" aria-label="Menu">
      <svg width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M3 12h18M3 6h18M3 18h18"/></svg>
    </button>
  </div>
</nav>
<div class="mobile-menu" id="mobileMenu">
  <button id="closeMenu" class="absolute top-6 right-6 text-white">
    <svg width="28" height="28" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12"/></svg>
  </button>
  <a href="/" class="text-2xl font-bold text-white">Home</a>
  <a href="/about.html" class="text-2xl font-bold text-white">About</a>
  <a href="/pricing.html" class="text-2xl font-bold text-white">Pricing</a>
  <a href="/gallery.html" class="text-2xl font-bold text-white">Gallery</a>
  <a href="/contact.html" class="text-2xl font-bold text-white">Contact</a>
  <a href="/booking.html" class="btn-primary">Book a Session</a>
</div>`;

const FOOTER_HTML = `
<footer class="py-12 px-6">
  <div class="max-w-7xl mx-auto">
    <div class="grid md:grid-cols-4 gap-8 mb-10">
      <div>
        <div class="flex items-center gap-3 mb-4">
          <div class="w-10 h-10 rounded-xl flex items-center justify-center" style="background:linear-gradient(135deg,#ef4444,#f59e0b)"><span class="font-black text-black text-lg">B</span></div>
          <span class="font-extrabold text-lg">BAM <span class="neon-text">Studio</span></span>
        </div>
        <p class="text-slate-500 text-sm">Nigeria's premier studio. Turning visions into sonic masterpieces.</p>
      </div>
      <div>
        <h4 class="font-semibold mb-4">Quick Links</h4>
        <ul class="space-y-2">
          <li><a href="/" class="footer-link text-sm">Home</a></li>
          <li><a href="/about.html" class="footer-link text-sm">About</a></li>
          <li><a href="/pricing.html" class="footer-link text-sm">Pricing</a></li>
          <li><a href="/booking.html" class="footer-link text-sm">Book Now</a></li>
        </ul>
      </div>
      <div>
        <h4 class="font-semibold mb-4">Services</h4>
        <ul class="space-y-2">
          <li><a href="/booking.html" class="footer-link text-sm">Music Recording</a></li>
          <li><a href="/booking.html" class="footer-link text-sm">Video Production</a></li>
          <li><a href="/booking.html" class="footer-link text-sm">Mixing & Mastering</a></li>
          <li><a href="/booking.html" class="footer-link text-sm">Podcast Studio</a></li>
        </ul>
      </div>
      <div>
        <h4 class="font-semibold mb-4">Contact</h4>
        <p class="text-slate-500 text-sm">12 Studio Ave, Lagos<br>hello@bamstudio.ng<br>+234 800 000 0000</p>
      </div>
    </div>
    <div class="border-t pt-6 text-center text-slate-600 text-sm" style="border-color:var(--dark-border)">
      © ${new Date().getFullYear()} BAM Musical & Video Studio. All rights reserved.
    </div>
  </div>
</footer>`;

// Inject nav and footer
function injectNav() {
  const navPH = document.getElementById('nav-placeholder');
  if (navPH) navPH.innerHTML = NAV_HTML;
  const footerPH = document.getElementById('footer-placeholder');
  if (footerPH) footerPH.innerHTML = FOOTER_HTML;
}

// Highlight active nav link
function setActiveNav() {
  const path = window.location.pathname;
  const map = { '/': 'nav-home', '/about.html': 'nav-about', '/pricing.html': 'nav-pricing', '/gallery.html': 'nav-gallery', '/contact.html': 'nav-contact' };
  const id = map[path];
  if (id) document.getElementById(id)?.classList.add('active');
}

// Render nav actions based on auth state
function renderNavActions() {
  const el = document.getElementById('navActions');
  if (!el) return;
  const user = getUser();
  if (user) {
    el.innerHTML = `
      <a href="/dashboard.html" class="btn-outline" style="padding:.6rem 1.3rem;font-size:.875rem">
        ${user.role === 'admin' ? '<a href="/admin.html">Admin</a>' : ''}My Bookings
      </a>
      <button onclick="import('/src/utils.js').then(m => m.logout())" class="btn-primary" style="padding:.65rem 1.5rem;font-size:.875rem">Logout</button>`;
    if (user.role === 'admin') {
      el.innerHTML = `
        <a href="/admin.html" class="btn-outline" style="padding:.6rem 1.3rem;font-size:.875rem">Admin Panel</a>
        <button id="logoutBtn" class="btn-primary" style="padding:.65rem 1.5rem;font-size:.875rem">Logout</button>`;
    } else {
      el.innerHTML = `
        <a href="/dashboard.html" class="btn-outline" style="padding:.6rem 1.3rem;font-size:.875rem">My Bookings</a>
        <button id="logoutBtn" class="btn-primary" style="padding:.65rem 1.5rem;font-size:.875rem">Logout</button>`;
    }
    document.getElementById('logoutBtn')?.addEventListener('click', () => logout());
  } else {
    el.innerHTML = `
      <a href="/login.html" class="btn-outline" style="padding:.6rem 1.3rem;font-size:.875rem">Login</a>
      <a href="/booking.html" class="btn-primary" style="padding:.65rem 1.5rem;font-size:.875rem">Book Now</a>`;
  }
}

// Mobile menu
function initMobileMenu() {
  document.getElementById('menuBtn')?.addEventListener('click', () => {
    document.getElementById('mobileMenu')?.classList.add('open');
  });
  document.getElementById('closeMenu')?.addEventListener('click', () => {
    document.getElementById('mobileMenu')?.classList.remove('open');
  });
}

// Scroll-based navbar styling
function initScrollNav() {
  const navbar = document.getElementById('navbar');
  if (!navbar) return;
  window.addEventListener('scroll', () => {
    navbar.classList.toggle('scrolled', window.scrollY > 50);
  });
}

// AOS-like scroll animation
function initAOS() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('aos-animate'); });
  }, { threshold: 0.08 });
  document.querySelectorAll('[data-aos]').forEach(el => observer.observe(el));
}

// Chat widget
function initChat() {
  const chatBtn = document.getElementById('chatBtn');
  const chatWin = document.getElementById('chatWindow');
  const closeChat = document.getElementById('closeChat');
  if (!chatBtn) return;
  chatBtn.addEventListener('click', () => chatWin.classList.toggle('hidden'));
  closeChat?.addEventListener('click', () => chatWin.classList.add('hidden'));
}

// FAQ accordion
function initFAQ() {
  document.querySelectorAll('.faq-item').forEach(item => {
    item.addEventListener('click', () => {
      const answer = item.querySelector('.faq-answer');
      const icon = item.querySelector('.faq-icon');
      const open = !answer.classList.contains('hidden');
      answer.classList.toggle('hidden', open);
      icon.style.transform = open ? '' : 'rotate(180deg)';
    });
  });
}

// Init everything
document.addEventListener('DOMContentLoaded', () => {
  injectNav();
  setActiveNav();
  renderNavActions();
  initMobileMenu();
  initScrollNav();
  initAOS();
  initChat();
  initFAQ();
});
