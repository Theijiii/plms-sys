module.exports = {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        montserrat: [
          "Montserrat",
          "Segoe UI",
          "Arial",
          "Helvetica Neue",
          "sans-serif",
        ],
        poppins: [
          "Poppins",
          "Segoe UI",
          "Arial",
          "Helvetica Neue",
          "sans-serif",
        ],
      },

      colors: {
        primary: '#4CAF50',
        secondary: '#4A90E2',
        accent: '#FDA811',
        background: '#FBFBFB',

        textmain: '#4D4A4A',
        border: '#E9E7E7',

        // Status colors
        success: '#4CAF50',
        danger: '#E53935',
        info: '#4A90E2',
      },

      backgroundImage: {
        'user-bg': "url('/BG.jpg')",
      },
    },
  },
  plugins: [],
};
