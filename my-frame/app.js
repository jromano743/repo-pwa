let db;
const request = indexedDB.open("bitacora", 1);

// MODAL
const modal = document.getElementById("modalImagen");
const modalImg = document.getElementById("modalImg");
const cerrarModal = document.getElementById("cerrarModal");

// Mostrar modal con animación
document.getElementById("listaEntradas").addEventListener("click", (e) => {
  if (e.target.tagName === "IMG") {
    modalImg.src = e.target.src;
    modal.classList.add("visible");
  }
});

// Cerrar modal con animación
function cerrarModalConAnimacion() {
  const modalContent = modal.querySelector(".modal-content");
  modalContent.classList.add("closing");
  setTimeout(() => {
    modal.classList.remove("visible");
    modalContent.classList.remove("closing");
    modalImg.src = "";
  }, 250);
}

// Click en la X
cerrarModal.addEventListener("click", cerrarModalConAnimacion);

// Click fuera de la imagen
modal.addEventListener("click", (e) => {
  if (e.target === modal) cerrarModalConAnimacion();
});

// INDEXEDDB
request.onupgradeneeded = function(event) {
  db = event.target.result;
  const store = db.createObjectStore("entradas", { keyPath: "id", autoIncrement: true });
  store.createIndex("fecha", "fecha", { unique: false });
};

request.onsuccess = function(event) {
  db = event.target.result;
  listarEntradas();
};

request.onerror = function(event) {
  console.error("Error abriendo IndexedDB", event);
};

// Agregar entrada
document.getElementById("formEntrada").addEventListener("submit", async (e) => {
  e.preventDefault();
  const texto = document.getElementById("texto").value;
  let files = Array.from(document.getElementById("fotos").files).slice(0,4);
  const fotos = files.map(f => f);

  const tx = db.transaction("entradas", "readwrite");
  const store = tx.objectStore("entradas");
  store.add({ fecha: new Date().toISOString(), texto, fotos });
  tx.oncomplete = () => {
    document.getElementById("formEntrada").reset();
    listarEntradas();
  };
});

// Listar entradas
async function listarEntradas() {
  const tx = db.transaction("entradas", "readonly");
  const store = tx.objectStore("entradas");
  const requestAll = store.getAll();

  requestAll.onsuccess = () => {
    const lista = document.getElementById("listaEntradas");
    lista.innerHTML = "";

    for (let entrada of requestAll.result.reverse()) {
      const div = document.createElement("div");
      div.className = "entrada";
      div.innerHTML = `<strong>${new Date(entrada.fecha).toLocaleString()}</strong>
                       <p>${entrada.texto}</p>`;

      if (entrada.fotos && entrada.fotos.length > 0) {
        const fotosContainer = document.createElement("div");
        fotosContainer.className = "entrada-images";

        for (let blob of entrada.fotos) {
          const img = document.createElement("img");
          const url = URL.createObjectURL(blob);
          img.src = url;
          img.onload = () => URL.revokeObjectURL(url);
          fotosContainer.appendChild(img);
        }

        div.appendChild(fotosContainer);
      }

      lista.appendChild(div);
    }
  };
}

// Blob a Base64
async function blobToBase64Image(blob) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.readAsDataURL(blob);
  });
}

// Exportar JSON
document.getElementById("exportar").addEventListener("click", async () => {
  const tx = db.transaction("entradas", "readonly");
  const store = tx.objectStore("entradas");
  const allEntries = await new Promise((res, rej) => {
    const req = store.getAll();
    req.onsuccess = () => res(req.result);
    req.onerror = () => rej(req.error);
  });

  for (let entrada of allEntries) {
    if (entrada.fotos && entrada.fotos.length) {
      entrada.fotos = await Promise.all(entrada.fotos.map(blob => blobToBase64Image(blob)));
    }
  }

  const jsonData = JSON.stringify(allEntries, null, 2);
  const blob = new Blob([jsonData], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `entradas_${new Date().toISOString()}.json`;
  a.click();
  URL.revokeObjectURL(url);
});

// Exportar PDF
document.getElementById("exportarPDF").addEventListener("click", async () => {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF('p', 'mm', 'a4');
  const margin = 10;
  let y = margin;

  const tx = db.transaction("entradas", "readonly");
  const store = tx.objectStore("entradas");
  const allEntries = await new Promise((res, rej) => {
    const req = store.getAll();
    req.onsuccess = () => res(req.result.reverse());
    req.onerror = () => rej(req.error);
  });

  const pageWidth = 210;
  const pageHeight = 297;
  const usableWidth = pageWidth - 2 * margin;
  const maxThumbSize = (usableWidth - 5) / 2;
  const gap = 5;

  for (let entrada of allEntries) {
    const textLines = doc.splitTextToSize(`Entrada: ${entrada.texto}`, usableWidth);
    const textHeight = textLines.length * 6;

    if (y + 6 + textHeight > pageHeight - margin) {
      doc.addPage();
      y = margin;
    }

    doc.setFontSize(12);
    doc.text(`Fecha: ${new Date(entrada.fecha).toLocaleString()}`, margin, y);
    y += 6;
    doc.text(textLines, margin, y);
    y += textHeight + 2;

    if (entrada.fotos && entrada.fotos.length) {
      let col = 0, row = 0;

      for (let i = 0; i < entrada.fotos.length; i++) {
        const blob = entrada.fotos[i];
        const imgData = await blobToBase64Image(blob);

        const img = new Image();
        img.src = imgData;
        await img.decode();

        const scale = Math.min(maxThumbSize / img.width, maxThumbSize / img.height);
        const w = img.width * scale;
        const h = img.height * scale;

        if (col === 0 && row === 0 && y + maxThumbSize > pageHeight - margin) {
          doc.addPage();
          y = margin;
        }

        if (col === 0 && row > 0 && y + (row + 1) * (maxThumbSize + gap) > pageHeight - margin) {
          doc.addPage();
          y = margin;
          row = 0;
        }

        const x = margin + col * (maxThumbSize + gap) + (maxThumbSize - w) / 2;
        const yPos = y + row * (maxThumbSize + gap) + (maxThumbSize - h) / 2;

        doc.addImage(imgData, 'PNG', x, yPos, w, h);

        col++;
        if (col >= 2) {
          col = 0;
          row++;
        }
      }

      y += Math.ceil(entrada.fotos.length / 2) * (maxThumbSize + gap) + 5;

      if (y > pageHeight - margin) {
        doc.addPage();
        y = margin;
      }
    }
  }

  doc.save(`entradas_${new Date().toISOString()}.pdf`);
});
