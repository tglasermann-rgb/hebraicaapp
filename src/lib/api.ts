import type { Backend } from './backend'
import { crearDemoBackend } from './demoBackend'
import { crearSupabaseBackend } from './supabaseBackend'

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
// Supabase llama a la clave pública "anon" o "publishable" según la versión del panel: se acepta cualquiera
const key = (import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ?? import.meta.env.VITE_SUPABASE_ANON_KEY) as string | undefined

/** Si hay credenciales de Supabase se usa el backend real; si no, el modo demo. */
export const api: Backend = url && key ? crearSupabaseBackend(url, key) : crearDemoBackend()
