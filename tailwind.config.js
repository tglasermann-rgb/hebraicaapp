/**
 * Tema "oscuro premium". Colores de marca tomados del Manual de Identidad Hebraica (2019),
 * con el azul aclarado para que tenga contraste sobre fondo oscuro.
 * La escala `slate` está invertida (50 = oscuro, 900 = claro) para que todo el app sea oscuro.
 */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        fondo: '#0B0C10',
        superficie: '#15171E',
        elevada: '#1F222B',
        blanco: '#FFFFFF',
        tinta: '#F3F5FA',
        marino: { DEFAULT: '#1C2554', 900: '#121839' },
        azul: { DEFAULT: '#4A66E8', marca: '#293E9B', 50: '#161C36', 100: '#1D2547', 200: '#2B3768', 600: '#3E58D6', 700: '#3249BF' },
        llama: { DEFAULT: '#F2552C', 50: '#2E1810' },
        amarillo: '#E7EC18',
        slate: {
          50: '#1A1D25', 100: '#20232C', 200: '#2A2E39', 300: '#3A3F4C', 400: '#6B7180',
          500: '#8C93A3', 600: '#A6ADBB', 700: '#C4C9D4', 800: '#DDE1E8', 900: '#EEF0F4',
        },
        emerald: { 50: '#0F2A22', 400: '#34D399', 600: '#34D399', 700: '#6EE7B7', 800: '#A7F3D0', 900: '#D1FAE5' },
        red: { 50: '#2D1517', 100: '#3A1A1D', 200: '#5A2328', 600: '#F87171', 700: '#FCA5A5' },
        amber: { 50: '#2B2210', 200: '#FCD34D', 700: '#FCD34D' },
      },
      fontFamily: {
        sans: ['"Inter Variable"', 'system-ui', 'sans-serif'],
        display: ['"Plus Jakarta Sans Variable"', '"Inter Variable"', 'sans-serif'],
      },
      boxShadow: {
        card: '0 0 0 1px rgba(255,255,255,.05)',
        flota: '0 20px 50px -12px rgba(0,0,0,.8), 0 0 0 1px rgba(255,255,255,.06)',
        brillo: '0 0 0 1px rgba(255,255,255,.08)',
      },
      borderRadius: { '4xl': '2rem' },
    },
  },
  plugins: [],
}
