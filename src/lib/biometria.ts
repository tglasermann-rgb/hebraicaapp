// Bloqueo del app con Face ID / huella usando WebAuthn (autenticador del dispositivo).
// Es un candado local: la sesión de Supabase sigue siendo la que autoriza los datos.
// Al empaquetar con Capacitor se reemplaza por el plugin nativo de biometría.

const CLAVE = 'mi-hebraica-biometria'

const b64 = (buf: ArrayBuffer) => btoa(String.fromCharCode(...new Uint8Array(buf)))
const desdeB64 = (s: string) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0))

export async function biometriaDisponible(): Promise<boolean> {
  try {
    return !!window.PublicKeyCredential && (await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable())
  } catch {
    return false
  }
}

export function biometriaActiva(): boolean {
  try {
    return !!localStorage.getItem(CLAVE)
  } catch {
    return false
  }
}

export async function activarBiometria(nombre: string): Promise<void> {
  const cred = (await navigator.credentials.create({
    publicKey: {
      challenge: crypto.getRandomValues(new Uint8Array(32)),
      rp: { name: 'Mi Hebraica' },
      user: { id: crypto.getRandomValues(new Uint8Array(16)), name: nombre, displayName: nombre },
      pubKeyCredParams: [{ type: 'public-key', alg: -7 }, { type: 'public-key', alg: -257 }],
      authenticatorSelection: { authenticatorAttachment: 'platform', userVerification: 'required', residentKey: 'discouraged' },
      timeout: 60000,
    },
  })) as PublicKeyCredential | null
  if (!cred) throw new Error('No se pudo activar')
  localStorage.setItem(CLAVE, b64(cred.rawId))
}

export function desactivarBiometria() {
  try {
    localStorage.removeItem(CLAVE)
  } catch {
    /* ignorar */
  }
}

export async function verificarBiometria(): Promise<boolean> {
  const id = localStorage.getItem(CLAVE)
  if (!id) return true
  try {
    const r = await navigator.credentials.get({
      publicKey: {
        challenge: crypto.getRandomValues(new Uint8Array(32)),
        allowCredentials: [{ type: 'public-key', id: desdeB64(id) }],
        userVerification: 'required',
        timeout: 60000,
      },
    })
    return !!r
  } catch {
    return false
  }
}
