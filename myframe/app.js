import { initDB } from "./js/db.js";
import { inicializarFormulario, listarEntradas, inicializarEstados } from "./js/entries.js";
import { inicializarModal } from "./js/modal.js";
import { exportarPDF } from "./js/pdf.js";
import { limpiarObjectUrls } from "./js/images.js";
import { inicializarUI, mostrarErrorGuardado } from "./js/ui.js";
import { inicializarActividades, inicializarGestionActividades } from "./js/activities.js";

const modal = inicializarModal();
inicializarUI();
inicializarEstados();

async function render() {
  await listarEntradas(modal);
}

inicializarFormulario({
  onSaved: render,
  onError: mostrarErrorGuardado
});

document.getElementById("exportarPDF").addEventListener("click", exportarPDF);
document.addEventListener("recargar-entradas", render);

initDB({
  onReady: async () => {
    try {
      await inicializarActividades();
      inicializarGestionActividades();
      await render();
    } catch (error) {
      console.error(error);
      alert("No se pudo inicializar el almacenamiento local.");
    }
  },
  onError: () => alert("No se pudo abrir el almacenamiento local. La aplicación no puede guardar entradas.")
});

window.addEventListener("beforeunload", limpiarObjectUrls);

if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("service-worker.js").catch((error) => {
    console.error("No se pudo registrar el Service Worker:", error);
  });
}
