import { defineConfig } from 'vite';

export default defineConfig({
    build: {
        rollupOptions: {
            input: {
                main: 'index.html',
                about: 'about.html',
                pricing: 'pricing.html',
                booking: 'booking.html',
                dashboard: 'dashboard.html',
                login: 'login.html',
                admin: 'admin.html',
                gallery: 'gallery.html',
                contact: 'contact.html',
            },
        },
    },
    server: {
        port: 5173,
        open: true,
    },
});
