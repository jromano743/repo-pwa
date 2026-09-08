import { obtenerEntradas, guardarEntrada, actualizarEntrada, eliminarEntrada } from "./db.js";
import { crearObjectURL, limpiarObjectUrls, optimizarImagen } from "./images.js";
import { obtenerActividadesSeleccionadas, seleccionarActividades } from "./activities.js";

const ESTADOS = ["Fatal", "Triste", "Meh", "Feliz", "Alegre"];

let entradaEditando = null;

export async function listarEntradas({ abrirModal, cerrarModal } = {}) {
  try {
    const entradas = await obtenerEntradas();
    const lista = document.getElementById("listaEntradas");
    const modal = document.getElementById("modalImagen");

    if (modal.classList.contains("visible")) cerrarModal?.();
    limpiarObjectUrls();
    lista.replaceChildren();

    entradas.forEach((entrada) => {
      const div = document.createElement("article");
      div.className = `entrada estado-${(entrada.estado || "").toLowerCase()}`;

      const header = document.createElement("div");
      header.className = "entrada-header";

      const fecha = document.createElement("strong");
      fecha.textContent = new Date(entrada.fecha).toLocaleString();

      const actions = document.createElement("div");
      actions.className = "entrada-actions";

      const edit = crearBoton("Editar", "small-btn", () => iniciarEdicion(entrada));
      const remove = crearBoton("Eliminar", "small-btn danger", () => eliminarEntradaUI(entrada));
      actions.append(edit, remove);
      header.append(fecha, actions);
      div.appendChild(header);

      const texto = document.createElement("p");
      texto.textContent = entrada.texto;
      div.appendChild(texto);

      if (entrada.fotos?.length) {
        const container = document.createElement("div");
        container.className = "entrada-images";

        entrada.fotos.forEach((blob) => {
          const img = document.createElement("img");
          const url = crearObjectURL(blob);
          img.src = url;
          img.alt = "Foto de la entrada";
          img.loading = "lazy";
          img.addEventListener("click", () => abrirModal?.(url));
          container.appendChild(img);
        });

        div.appendChild(container);
      }

      const metadata = document.createElement("div");
      metadata.className = "entrada-metadata";

      if (entrada.estado) {
        const estado = document.createElement("span");
        estado.className = `estado-badge estado-${entrada.estado.toLowerCase()}`;
        estado.textContent = entrada.estado;
        metadata.appendChild(estado);
      }

      if (entrada.actividades?.length) {
        const actividades = document.createElement("div");
        actividades.className = "actividad-badges";
        entrada.actividades.forEach((nombre) => {
          const badge = document.createElement("span");
          badge.className = "actividad-badge";
          badge.textContent = nombre;
          actividades.appendChild(badge);
        });
        metadata.appendChild(actividades);
      }

      if (metadata.children.length) div.appendChild(metadata);
      lista.appendChild(div);
    });
  } catch (error) {
    console.error("Error al listar entradas:", error);
    alert("No se pudieron cargar las entradas guardadas.");
  }
}

export async function crearEntrada({ onSaved, onError } = {}) {
  const form = document.getElementById("formEntrada");
  const btn = form.querySelector("button[type=submit]");
  const originalText = btn.innerText;
  const texto = document.getElementById("texto").value;
  const files = Array.from(document.getElementById("fotos").files).slice(0, 4);
  const estado = document.getElementById("estado").value || null;
  const actividades = obtenerActividadesSeleccionadas();

  if (files.length === 0 && !texto.trim()) return;

  btn.disabled = true;
  btn.innerText = "Procesando...";

  try {
    const fotosOptimizadas = [];
    for (const file of files) fotosOptimizadas.push(await optimizarImagen(file));

    await guardarEntrada({
      fecha: new Date().toISOString(),
      texto,
      fotos: fotosOptimizadas,
      estado,
      actividades
    });

    form.reset();
    seleccionarActividades([]);
    resetFotoLabel();
    onSaved?.();
  } catch (err) {
    console.error("Error al guardar entrada:", err);
    onError?.(err);
  } finally {
    btn.innerText = originalText;
    btn.disabled = false;
  }
}

function iniciarEdicion(entrada) {
  entradaEditando = entrada;
  document.getElementById("texto").value = entrada.texto || "";
  document.getElementById("estado").value = entrada.estado || "";
  seleccionarActividades(entrada.actividades || []);

  const submit = document.querySelector('#formEntrada button[type="submit"]');
  submit.textContent = "Actualizar Entrada";
  document.getElementById("cancelarEdicion").hidden = false;
  window.scrollTo({ top: 0, behavior: "smooth" });
}

export function cancelarEdicion() {
  entradaEditando = null;
  document.getElementById("formEntrada").reset();
  seleccionarActividades([]);
  resetFotoLabel();
  document.querySelector('#formEntrada button[type="submit"]').textContent = "Guardar Entrada";
  document.getElementById("cancelarEdicion").hidden = true;
}

async function actualizarEntradaUI() {
  const form = document.getElementById("formEntrada");
  const btn = form.querySelector("button[type=submit]");
  const files = Array.from(document.getElementById("fotos").files).slice(0, 4);

  btn.disabled = true;
  btn.innerText = "Actualizando...";

  try {
    const fotos = files.length
      ? await Promise.all(files.map(optimizarImagen))
      : entradaEditando.fotos;

    await actualizarEntrada({
      ...entradaEditando,
      texto: document.getElementById("texto").value,
      estado: document.getElementById("estado").value || null,
      actividades: obtenerActividadesSeleccionadas(),
      fotos
    });

    cancelarEdicion();
    document.dispatchEvent(new CustomEvent("recargar-entradas"));
  } catch (error) {
    console.error(error);
    alert(error?.name === "QuotaExceededError"
      ? "No hay suficiente espacio disponible para actualizar la entrada."
      : "No se pudo actualizar la entrada.");
  } finally {
    btn.disabled = false;
    if (entradaEditando) btn.innerText = "Actualizar Entrada";
  }
}

async function eliminarEntradaUI(entrada) {
  if (!confirm("¿Eliminar esta entrada? Esta acción no se puede deshacer.")) return;

  try {
    await eliminarEntrada(entrada.id);
    document.dispatchEvent(new CustomEvent("recargar-entradas"));
  } catch (error) {
    console.error(error);
    alert("No se pudo eliminar la entrada.");
  }
}

export function inicializarFormulario({ onSaved, onError } = {}) {
  document.getElementById("formEntrada").addEventListener("submit", async (e) => {
    e.preventDefault();
    if (entradaEditando) await actualizarEntradaUI();
    else await crearEntrada({ onSaved, onError });
  });

  document.getElementById("cancelarEdicion").addEventListener("click", cancelarEdicion);
  document.getElementById("fotos").addEventListener("change", function () {
    actualizarFotoLabel(this.files.length);
  });
}

function crearBoton(texto, className, handler) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = className;
  button.textContent = texto;
  button.addEventListener("click", handler);
  return button;
}

function actualizarFotoLabel(numFiles) {
  const label = document.querySelector('label[for="fotos"]');
  if (numFiles > 0) {
    label.innerText = `✅ ${numFiles} seleccionadas`;
    label.style.backgroundColor = "#1a1a1a";
  } else resetFotoLabel();
}

function resetFotoLabel() {
  const label = document.querySelector('label[for="fotos"]');
  label.innerText = "📷 Seleccionar fotos";
  label.style.backgroundColor = "#333";
}

export { ESTADOS };

export function inicializarEstados() {
  const select = document.getElementById("estado");
  ESTADOS.forEach((estado) => {
    const option = document.createElement("option");
    option.value = estado;
    option.textContent = estado;
    select.appendChild(option);
  });
}

