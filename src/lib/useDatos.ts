import { useCallback, useEffect, useState } from 'react'

/** Carga datos asíncronos con estado de carga, error y recarga. */
export function useDatos<T>(fn: () => Promise<T>, deps: unknown[] = []) {
  const [datos, setDatos] = useState<T | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [cargando, setCargando] = useState(true)

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const cargar = useCallback(fn, deps)

  const recargar = useCallback(async () => {
    setCargando(true)
    try {
      setDatos(await cargar())
      setError(null)
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setCargando(false)
    }
  }, [cargar])

  useEffect(() => {
    recargar()
  }, [recargar])

  return { datos, error, cargando, recargar, setDatos }
}
