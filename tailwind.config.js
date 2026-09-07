/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        claude: {
          bg: '#181715',
          panel: '#201e1b',
          elevated: '#282522',
          surface: '#2a2724',
          border: '#35322c',
          borderLight: '#444039',
          terracotta: '#cc785c',
          terracottaHover: '#ba674d',
          terracottaMuted: 'rgba(204, 120, 92, 0.15)',
          text: '#f4f3ef',
          muted: '#8e8b82',
          subtle: '#625f58',
        },
      },
    },
  },
  plugins: [],
}
