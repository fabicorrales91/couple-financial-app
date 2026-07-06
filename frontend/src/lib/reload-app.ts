/**
 * Comprueba en segundo plano si hay una version nueva del bundle publicada
 * (le pide al service worker que revise), pero SIN recargar la pagina. El SW
 * con registerType: "autoUpdate" se activa solo en un reload natural futuro;
 * esto solo adelanta la deteccion, no fuerza nada visible para el usuario.
 */
export async function checkForAppUpdate() {
  try {
    const registration = await navigator.serviceWorker?.getRegistration();
    await registration?.update();
  } catch {
    // sin service worker o sin conexion: no bloquea el resto de la app
  }
}
