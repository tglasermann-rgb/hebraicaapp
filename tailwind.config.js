/**
 * Temas "oscuro premium" (por defecto) y "claro": los colores son variables CSS definidas en index.css.
 * Colores de marca tomados del Manual de Identidad Hebraica (2019), con el azul aclarado para que tenga
 * contraste sobre fondo oscuro.
 * En oscuro la escala `slate` está invertida (50 = oscuro, 900 = claro); en claro es la normal.
 */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        fondo: 'rgb(var(--c-fondo) / <alpha-value>)',
        superficie: 'rgb(var(--c-superficie) / <alpha-value>)',
        elevada: 'rgb(var(--c-elevada) / <alpha-value>)',
        blanco: '#FFFFFF',
        // Siempre oscuro (barras y avisos con texto blanco, en cualquier tema)
        noche: '#1F222B',
        tinta: 'rgb(var(--c-tinta) / <alpha-value>)',
        // Líneas y bordes: blanco translúcido en oscuro, negro translúcido en claro
        linea: 'rgb(var(--c-linea) / <alpha-value>)',
        marino: { DEFAULT: '#1C2554', 900: '#121839' },
        azul: { DEFAULT: '#4A66E8', marca: '#293E9B', 50: 'rgb(var(--c-azul-50) / <alpha-value>)', 100: 'rgb(var(--c-azul-100) / <alpha-value>)', 200: 'rgb(var(--c-azul-200) / <alpha-value>)', 600: '#3E58D6', 700: '#3249BF' },
        llama: { DEFAULT: '#F2552C', 50: 'rgb(var(--c-llama-50) / <alpha-value>)' },
        amarillo: '#E7EC18',
        slate: { 50: 'rgb(var(--c-slate-50) / <alpha-value>)', 100: 'rgb(var(--c-slate-100) / <alpha-value>)', 200: 'rgb(var(--c-slate-200) / <alpha-value>)', 300: 'rgb(var(--c-slate-300) / <alpha-value>)', 400: 'rgb(var(--c-slate-400) / <alpha-value>)', 500: 'rgb(var(--c-slate-500) / <alpha-value>)', 600: 'rgb(var(--c-slate-600) / <alpha-value>)', 700: 'rgb(var(--c-slate-700) / <alpha-value>)', 800: 'rgb(var(--c-slate-800) / <alpha-value>)', 900: 'rgb(var(--c-slate-900) / <alpha-value>)' },
        emerald: { 50: 'rgb(var(--c-emerald-50) / <alpha-value>)', 400: 'rgb(var(--c-emerald-400) / <alpha-value>)', 600: 'rgb(var(--c-emerald-600) / <alpha-value>)', 700: 'rgb(var(--c-emerald-700) / <alpha-value>)', 800: 'rgb(var(--c-emerald-800) / <alpha-value>)', 900: 'rgb(var(--c-emerald-900) / <alpha-value>)' },
        red: { 50: 'rgb(var(--c-red-50) / <alpha-value>)', 100: 'rgb(var(--c-red-100) / <alpha-value>)', 200: 'rgb(var(--c-red-200) / <alpha-value>)', 600: 'rgb(var(--c-red-600) / <alpha-value>)', 700: 'rgb(var(--c-red-700) / <alpha-value>)' },
        amber: { 50: 'rgb(var(--c-amber-50) / <alpha-value>)', 200: 'rgb(var(--c-amber-200) / <alpha-value>)', 700: 'rgb(var(--c-amber-700) / <alpha-value>)' },
      },
      fontFamily: {
        sans: ['"Inter Variable"', 'system-ui', 'sans-serif'],
        display: ['"Plus Jakarta Sans Variable"', '"Inter Variable"', 'sans-serif'],
      },
      boxShadow: {
        card: '0 0 0 1px rgb(var(--c-linea) / .05)',
        flota: 'var(--sombra-flota), 0 0 0 1px rgb(var(--c-linea) / .06)',
        brillo: '0 0 0 1px rgb(var(--c-linea) / .08)',
      },
      borderRadius: { '4xl': '2rem' },
    },
  },
  plugins: [],
}
