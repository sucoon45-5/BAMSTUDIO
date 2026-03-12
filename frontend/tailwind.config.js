/** @type {import('tailwindcss').Config} */
export default {
    content: ['./**/*.html', './src/**/*.{js,ts}'],
    theme: {
        extend: {
            colors: {
                neon: { DEFAULT: '#ef4444', gold: '#f59e0b', purple: '#a855f7', cyan: '#06b6d4' },
                dark: { DEFAULT: '#0a0a0f', card: '#111118', border: '#1e1e2e' },
            },
            fontFamily: { sans: ['Inter', 'sans-serif'] },
            animation: {
                'pulse-slow': 'pulse 3s ease-in-out infinite',
                'float': 'float 6s ease-in-out infinite',
            },
            keyframes: {
                float: { '0%,100%': { transform: 'translateY(0)' }, '50%': { transform: 'translateY(-10px)' } },
            },
        },
    },
    plugins: [],
};
