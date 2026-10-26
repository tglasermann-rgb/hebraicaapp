/** Colores tomados del Manual de Identidad Institucional Hebraica (2019). */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        marino: { DEFAULT: '#293779', 900: '#1B2556' },
        azul: { DEFAULT: '#293E9B', 50: '#EEF0F9', 100: '#DDE2F3', 200: '#B9C2E6', 600: '#22348A', 700: '#1E2E78' },
        llama: { DEFAULT: '#F14D23', 50: '#FEEDE8' },
        amarillo: '#E7EC18',
        fondo: '#F5F6FA',
        tinta: '#0E1430',
      },
      fontFamily: {
        sans: ['"Inter Variable"', 'system-ui', 'sans-serif'],
        display: ['"Plus Jakarta Sans Variable"', '"Inter Variable"', 'sans-serif'],
      },
      boxShadow: {
        card: '0 1px 2px rgba(14,20,48,.04), 0 8px 24px -8px rgba(14,20,48,.08)',
        flota: '0 12px 40px -8px rgba(14,20,48,.25)',
        brillo: '0 10px 30px -10px rgba(41,62,155,.6)',
      },
      borderRadius: { '4xl': '2rem' },
    },
  },
  plugins: [],
}
