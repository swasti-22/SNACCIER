/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#F3B6C6",
          hover: "#E8A2B4",
        },
        secondary: {
          DEFAULT: "#F8EDE7",
          hover: "#EADCD4",
        },
        accent: {
          DEFAULT: "#D9C7F7",
          hover: "#CBB6F2",
        },
        marigold: {
          DEFAULT: "#FF9933", // Steaming Indian Saffron Marigold
          hover: "#E58A00",
        },
        cardamom: {
          DEFAULT: "#138808", // Indian Cardamom Green
          hover: "#0F6E06",
        },
        tandoori: {
          DEFAULT: "#EF4444", // Spice Tandoori Red
          hover: "#DC2626",
        },
        background: "#FFFDFB",
        textDark: "#2B2730",
        mutedGrey: "#7E7685",
      },
      fontFamily: {
        sans: ["var(--font-inter)", "sans-serif"],
        poppins: ["var(--font-poppins)", "sans-serif"],
      },
      boxShadow: {
        'warm-sm': '0 4px 12px rgba(243, 182, 198, 0.1)',
        'warm-md': '0 10px 30px rgba(43, 39, 48, 0.05)',
        'warm-lg': '0 16px 40px rgba(243, 182, 198, 0.15)',
        'marigold': '0 10px 30px rgba(255, 153, 51, 0.15)',
      },
      borderRadius: {
        'xl': '16px',
        '2xl': '24px',
      }
    },
  },
  plugins: [],
}
