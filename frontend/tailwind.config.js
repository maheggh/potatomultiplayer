/** @type {import('tailwindcss').Config} */
import plugin from "tailwindcss/plugin";
import { fontFamily } from "tailwindcss/defaultTheme";

export default {
  darkMode: "class",
  content: [
    "./index.html",                       // This should point to your public index.html file
    "./src/**/*.{js,ts,jsx,tsx}",         // This ensures Tailwind scans all files in src folder
    "./public/assets/**/*.{js,ts,jsx,tsx}", // Assets if you're adding Tailwind classes here
  ],
  theme: {
    extend: {
      colors: {
        primary: '#ff79c6',
      },
      fontFamily: {
        // Your font configuration
      },
      animation: {
        'fadeIn': 'fadeIn 0.3s ease forwards',
        'slideIn': 'slideIn 0.3s ease forwards',
        'shake': 'shake 0.5s cubic-bezier(.36,.07,.19,.97) both',
        'pulse': 'pulse 1s infinite',
        'bounce': 'bounce 0.5s ease infinite',
        'spin': 'spin 1s linear infinite',
        'shake-hard': 'shake-hard 0.5s cubic-bezier(.36,.07,.19,.97) both',
        'sparkle': 'sparkle 1.5s ease-in-out infinite',
        'jackpot': 'jackpot 1s ease-in-out',
        'alarm': 'alarm 0.5s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideIn: {
          'from': { transform: 'translateY(20px)', opacity: '0' },
          'to': { transform: 'translateY(0)', opacity: '1' },
        },
        shake: {
          '10%, 90%': { transform: 'translate3d(-1px, 0, 0)' },
          '20%, 80%': { transform: 'translate3d(2px, 0, 0)' },
          '30%, 50%, 70%': { transform: 'translate3d(-4px, 0, 0)' },
          '40%, 60%': { transform: 'translate3d(4px, 0, 0)' },
        },
        'shake-hard': {
          '10%, 90%': { transform: 'translate3d(-2px, -2px, 0)' },
          '20%, 80%': { transform: 'translate3d(4px, 0, 0)' },
          '30%, 50%, 70%': { transform: 'translate3d(-8px, 2px, 0)' },
          '40%, 60%': { transform: 'translate3d(8px, -2px, 0)' },
        },
        pulse: {
          '0%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.05)' },
          '100%': { transform: 'scale(1)' },
        },
        bounce: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        spin: {
          'to': { transform: 'rotate(360deg)' },
        },
        sparkle: {
          '0%, 100%': {
            transform: 'scale(1)',
            boxShadow: '0 0 0 rgba(255, 215, 0, 0)'
          },
          '50%': {
            transform: 'scale(1.05)',
            boxShadow: '0 0 20px rgba(255, 215, 0, 0.7)'
          }
        },
        jackpot: {
          '0%': { transform: 'scale(1) rotate(0deg)' },
          '25%': { transform: 'scale(1.2) rotate(-5deg)' },
          '50%': { transform: 'scale(1.1) rotate(5deg)' },
          '75%': { transform: 'scale(1.2) rotate(-3deg)' },
          '100%': { transform: 'scale(1) rotate(0deg)' },
        },
        alarm: {
          '0%': { boxShadow: '0 0 0 rgba(255, 0, 0, 0)' },
          '50%': { boxShadow: '0 0 20px rgba(255, 0, 0, 0.7)' },
          '100%': { boxShadow: '0 0 0 rgba(255, 0, 0, 0)' },
        },
      },
      scale: {
        '102': '1.02',
      },
    },
  },
  plugins: [
    plugin(function ({ addBase, addComponents, addUtilities }) {
      addBase({});
      addComponents({
        ".container": {
          "@apply max-w-[77.5rem] mx-auto px-5 md:px-10 xl:max-w-[87.5rem]": {},
        },
        // Other components...
      });
      addUtilities({
        ".tap-highlight-color": {
          "-webkit-tap-highlight-color": "rgba(0, 0, 0, 0)",
        },
      });
    }),
  ],
};
