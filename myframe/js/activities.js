import {
  obtenerActividades,
  crearActividad,
  actualizarActividad,
  eliminarActividad
} from "./db.js";

let actividades = [];

export async function inicializarActividades() {
  await recargarActividades();
  renderSelector();
  renderGestion();
}

export async function recargarActividades() {
  actividades = await obtenerActividades();
  return actividades;
}

export function obtenerActividadesActuales() {
  return [...actividades];
}

export function obtenerActividadesSeleccionadas() {
  return [...document.querySelectorAll('#actividadesMenu input[type="checkbox"]:checked')]
    .map((input) => input.value);
}

export function seleccionarActividades(nombres = []) {
  const seleccionadas = new Set(nombres);
  document.querySelectorAll('#actividadesMenu input[type="checkbox"]').forEach((input) => {
    input.checked = seleccionadas.has(input.value);
  });
  actualizarResumen();
}

function renderSelector() {
  const menu = document.getElementById("actividadesMenu");
  menu.replaceChildren();

  actividades.forEach((actividad) => {
    const label = document.createElement("label");
    label.className = "activity-option";

    const input = document.createElement("input");
    input.type = "checkbox";
    input.value = actividad.nombre;
    input.addEventListener("change", actualizarResumen);

    const text = document.createElement("span");
    text.textContent = actividad.nombre;

    label.append(input, text);
    menu.appendChild(label);
  });

  actualizarResumen();
}

function actualizarResumen() {
  const seleccionadas = obtenerActividadesSeleccionadas();
  document.getElementById("actividadesResumen").textContent = seleccionadas.length
    ? seleccionadas.join(", ")
    : "Sin actividades";
}

function renderGestion() {
  const lista = document.getElementById("listaActividades");
  lista.replaceChildren();

  actividades.forEach((actividad) => {
    const row = document.createElement("div");
    row.className = "activity-management-row";

    const name = document.createElement("span");
    name.textContent = actividad.nombre;

    const actions = document.createElement("div");

    const edit = document.createElement("button");
    edit.type = "button";
    edit.className = "small-btn";
    edit.textContent = "Editar";
    edit.addEventListener("click", () => editarActividadUI(actividad));

    const remove = document.createElement("button");
    remove.type = "button";
    remove.className = "small-btn danger";
    remove.textContent = "Eliminar";
    remove.addEventListener("click", () => eliminarActividadUI(actividad));

    actions.append(edit, remove);
    row.append(name, actions);
    lista.appendChild(row);
  });
}

async function editarActividadUI(actividad) {
  const nombre = prompt("Nuevo nombre de la actividad:", actividad.nombre);
  if (nombre === null) return;
  const nuevoNombre = nombre.trim();
  if (!nuevoNombre) return alert("El nombre no puede estar vacío.");

  try {
    await actualizarActividad({ id: actividad.id, nombre: nuevoNombre });
    await refrescarTodo();
  } catch (error) {
    console.error(error);
    alert("No se pudo editar la actividad. Puede que ya exista otra con ese nombre.");
  }
}

async function eliminarActividadUI(actividad) {
  if (!confirm(`¿Eliminar la actividad "${actividad.nombre}"?`)) return;

  try {
    await eliminarActividad(actividad.id);
    await refrescarTodo();
  } catch (error) {
    console.error(error);
    alert("No se pudo eliminar la actividad.");
  }
}

async function refrescarTodo() {
  const seleccionadasAntes = obtenerActividadesSeleccionadas();
  await recargarActividades();
  renderSelector();
  seleccionarActividades(seleccionadasAntes.filter((nombre) => actividades.some((a) => a.nombre === nombre)));
  renderGestion();
}

export function inicializarGestionActividades() {
  document.getElementById("agregarActividad").addEventListener("click", async () => {
    const nombre = prompt("Nombre de la nueva actividad:");
    if (nombre === null) return;
    if (!nombre.trim()) return alert("El nombre no puede estar vacío.");

    try {
      await crearActividad(nombre);
      await refrescarTodo();
    } catch (error) {
      console.error(error);
      alert("No se pudo crear la actividad. Puede que ya exista otra con ese nombre.");
    }
  });

  const selectorToggle = document.getElementById("actividadesToggle");
  const selectorMenu = document.getElementById("actividadesMenu");
  selectorToggle.addEventListener("click", () => selectorMenu.classList.toggle("visible"));

  const toggle = document.getElementById("toggleActividades");
  const panel = document.getElementById("gestionActividades");
  toggle.addEventListener("click", () => {
    const visible = panel.classList.toggle("visible");
    toggle.textContent = visible ? "Ocultar actividades" : "Gestionar actividades";
  });
}
