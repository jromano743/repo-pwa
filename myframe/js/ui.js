export function mostrarErrorGuardado(error) {
  const message = error?.name === "QuotaExceededError"
    ? "No hay suficiente espacio disponible para guardar la entrada."
    : "No se pudo guardar la entrada. Intenta nuevamente.";
  alert(message);
}

export function inicializarUI() {
  // Punto central para futuras interacciones globales de interfaz.
}
