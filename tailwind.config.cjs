module.exports = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        roster: {
          header: '#f4d35e',
          ap: '#ee964b',
          early: '#9ad0ec',
          late: '#a0d995',
          absent: '#f7f48b',
          special: '#d4c2fc',
          connox: '#e6c08b',
          schmalgang: '#d9d9d9',
          aussenlager: '#f1d2c5',
          kleinteile: '#cfe8d5',
          neutral: '#f2efe9',
          contrast: '#0b3d91',
          contrastAccent: '#f4a259'
        }
      },
      fontFamily: {
        sans: ['"Inter"', 'system-ui', 'sans-serif']
      }
    }
  },
  plugins: []
};
