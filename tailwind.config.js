/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        admin: {
          900: "#0f2438",
          800: "#1a3a52",
          700: "#102b40",
          600: "#15242c",
          accent: "#5cd9e0",
          accentSoft: "#7eeaf0",
          pink: "#f5b8d1",
          surface: "#111a20",
          panel: "#0d151a",
          ink: "#f8fafc",
          muted: "#b0d4e3",
          text: "#8aa8b7",
        },
      },
      boxShadow: {
        admin: "0 18px 45px rgba(15, 36, 56, 0.45)",
      },
      backgroundImage: {
        "admin-gradient": "linear-gradient(90deg, #5cd9e0 0%, #f5b8d1 100%)",
      },
    },
  },
  plugins: [],
};
