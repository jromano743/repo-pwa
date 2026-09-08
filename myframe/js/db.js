let db = null;

const DB_NAME = "bitacora";
const DB_VERSION = 2;

export function initDB({ onReady, onError } = {}) {
  const request = indexedDB.open(DB_NAME, DB_VERSION);

  request.onupgradeneeded = (e) => {
    db = e.target.result;

    if (!db.objectStoreNames.contains("entradas")) {
      const store = db.createObjectStore("entradas", { keyPath: "id", autoIncrement: true });
      store.createIndex("fecha", "fecha", { unique: false });
    }

    if (!db.objectStoreNames.contains("actividades")) {
      const store = db.createObjectStore("actividades", { keyPath: "id", autoIncrement: true });
      store.createIndex("nombre", "nombre", { unique: true });

      ["Trabajo", "Estudio", "Ejercicio", "Ocio", "Familia", "Amigos"].forEach((nombre) => {
        store.add({ nombre });
      });
    }
  };

  request.onerror = () => {
    console.error("No se pudo abrir IndexedDB:", request.error);
    onError?.(request.error);
  };

  request.onblocked = () => {
    console.warn("La apertura de IndexedDB está bloqueada por otra conexión abierta.");
  };

  request.onsuccess = (e) => {
    db = e.target.result;
    db.onversionchange = () => db.close();
    onReady?.(db);
  };
}

export function getDB() {
  return db;
}

export function guardarEntrada(entrada) {
  if (!db) return Promise.reject(new Error("La base de datos aún no está disponible"));

  return new Promise((resolve, reject) => {
    const tx = db.transaction("entradas", "readwrite");
    tx.objectStore("entradas").add(entrada);
    tx.oncomplete = resolve;
    tx.onerror = () => reject(tx.error || new Error("Error de IndexedDB"));
    tx.onabort = () => reject(tx.error || new Error("Transacción cancelada"));
  });
}

export function actualizarEntrada(entrada) {
  if (!db) return Promise.reject(new Error("La base de datos aún no está disponible"));

  return new Promise((resolve, reject) => {
    const tx = db.transaction("entradas", "readwrite");
    tx.objectStore("entradas").put(entrada);
    tx.oncomplete = resolve;
    tx.onerror = () => reject(tx.error || new Error("Error de IndexedDB"));
    tx.onabort = () => reject(tx.error || new Error("Transacción cancelada"));
  });
}

export function eliminarEntrada(id) {
  if (!db) return Promise.reject(new Error("La base de datos aún no está disponible"));

  return new Promise((resolve, reject) => {
    const tx = db.transaction("entradas", "readwrite");
    tx.objectStore("entradas").delete(id);
    tx.oncomplete = resolve;
    tx.onerror = () => reject(tx.error || new Error("Error de IndexedDB"));
    tx.onabort = () => reject(tx.error || new Error("Transacción cancelada"));
  });
}

export function obtenerEntrada(id) {
  if (!db) return Promise.reject(new Error("La base de datos aún no está disponible"));

  return new Promise((resolve, reject) => {
    const request = db.transaction("entradas", "readonly").objectStore("entradas").get(id);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error("Error al leer entrada"));
  });
}

export function obtenerEntradas() {
  if (!db) return Promise.reject(new Error("La base de datos aún no está disponible"));

  return new Promise((resolve, reject) => {
    const request = db.transaction("entradas", "readonly").objectStore("entradas").getAll();
    request.onsuccess = () => resolve(request.result.sort((a, b) => new Date(b.fecha) - new Date(a.fecha)));
    request.onerror = () => reject(request.error || new Error("Error al leer entradas"));
  });
}

export function obtenerActividades() {
  if (!db) return Promise.reject(new Error("La base de datos aún no está disponible"));

  return new Promise((resolve, reject) => {
    const request = db.transaction("actividades", "readonly").objectStore("actividades").getAll();
    request.onsuccess = () => resolve(request.result.sort((a, b) => a.nombre.localeCompare(b.nombre)));
    request.onerror = () => reject(request.error || new Error("Error al leer actividades"));
  });
}

export function crearActividad(nombre) {
  if (!db) return Promise.reject(new Error("La base de datos aún no está disponible"));
  const actividad = { nombre: nombre.trim() };

  return new Promise((resolve, reject) => {
    const tx = db.transaction("actividades", "readwrite");
    tx.objectStore("actividades").add(actividad);
    tx.oncomplete = () => resolve(actividad);
    tx.onerror = () => reject(tx.error || new Error("No se pudo crear la actividad"));
    tx.onabort = () => reject(tx.error || new Error("Transacción cancelada"));
  });
}

export function actualizarActividad(actividad) {
  if (!db) return Promise.reject(new Error("La base de datos aún no está disponible"));

  return new Promise((resolve, reject) => {
    const tx = db.transaction("actividades", "readwrite");
    tx.objectStore("actividades").put({ ...actividad, nombre: actividad.nombre.trim() });
    tx.oncomplete = resolve;
    tx.onerror = () => reject(tx.error || new Error("No se pudo actualizar la actividad"));
    tx.onabort = () => reject(tx.error || new Error("Transacción cancelada"));
  });
}

export function eliminarActividad(id) {
  if (!db) return Promise.reject(new Error("La base de datos aún no está disponible"));

  return new Promise((resolve, reject) => {
    const tx = db.transaction("actividades", "readwrite");
    tx.objectStore("actividades").delete(id);
    tx.oncomplete = resolve;
    tx.onerror = () => reject(tx.error || new Error("No se pudo eliminar la actividad"));
    tx.onabort = () => reject(tx.error || new Error("Transacción cancelada"));
  });
}
