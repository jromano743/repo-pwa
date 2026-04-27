let db;
const request = indexedDB.open("bitacora", 1);

request.onupgradeneeded = (e) => {
  db = e.target.result;
  if (!db.objectStoreNames.contains("entradas")) {
    const store = db.createObjectStore("entradas", { keyPath: "id", autoIncrement: true });
    store.createIndex("fecha", "fecha", { unique: false });
  }
};

request.onsuccess = (e) => {
  db = e.target.result;
  listarEntradas();
};

// --- EL OPTIMIZADOR DEFINITIVO (SOLUCIÓN AL ERROR EN MÓVIL) ---
async function optimizarImagen(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.src = e.target.result;
      
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");

        // Bajamos la resolución a un máximo de 1000px (Suficiente para móvil y muy seguro para RAM)
        const MAX_WIDTH = 1000;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_WIDTH) {
            width *= MAX_WIDTH / height;
            height = MAX_WIDTH;
          }
        }

        canvas.width = width;
        canvas.height = height;

        // Forzamos fondo blanco (Crucial para capturas PNG de iPhone/Android)
        ctx.fillStyle = "#FFFFFF";
        ctx.fillRect(0, 0, width, height);
        
        // Dibujamos
        ctx.drawImage(img, 0, 0, width, height);

        // Convertimos a JPEG con calidad 0.6 (muy ligero)
        canvas.toBlob((blob) => {
          // Limpieza inmediata de objetos para liberar RAM
          img.src = ""; 
          if (blob) resolve(blob);
          else reject(new Error("Error Canvas"));
        }, "image/jpeg", 0.6);
      };
      
      img.onerror = () => reject(new Error("Error carga imagen"));
    };
    reader.readAsDataURL(file);
  });
}

// --- GUARDADO SECUENCIAL ---
document.getElementById("formEntrada").addEventListener("submit", async (e) => {
  e.preventDefault();
  const btn = e.target.querySelector("button");
  const originalText = btn.innerText;
  
  const texto = document.getElementById("texto").value;
  const files = Array.from(document.getElementById("fotos").files).slice(0, 4);
  
  if (files.length === 0 && !texto.trim()) return;

  btn.disabled = true;
  btn.innerText = "Procesando...";

  try {
    const fotosOptimizadas = [];
    // PROCESO UNO POR UNO (No usar Promise.all en móviles para capturas pesadas)
    for (const file of files) {
      const optimized = await optimizarImagen(file);
      fotosOptimizadas.push(optimized);
    }

    const tx = db.transaction("entradas", "readwrite");
    tx.objectStore("entradas").add({
      fecha: new Date().toISOString(),
      texto,
      fotos: fotosOptimizadas
    });

    tx.oncomplete = () => {
    // 1. Resetea el formulario (limpia texto e input de archivos)
    document.getElementById("formEntrada").reset();

    // 2. IMPORTANTE: Resetear manualmente el texto del "botón" de fotos
    const fotoLabel = document.querySelector('label[for="fotos"]');
    fotoLabel.innerText = "📷 Seleccionar fotos";
    fotoLabel.style.backgroundColor = "#333"; // Volver al color original

    // 3. Refrescar la lista
    listarEntradas();

    // 4. Restaurar el botón de enviar
    btn.innerText = originalText;
    btn.disabled = false;
  };
  } catch (err) {
    alert("Error: El celular se quedó sin memoria. Intenta con menos fotos.");
    btn.disabled = false;
    btn.innerText = originalText;
  }
});

// --- LISTAR ENTRADAS ---
function listarEntradas() {
  const tx = db.transaction("entradas", "readonly");
  tx.objectStore("entradas").getAll().onsuccess = (e) => {
    const lista = document.getElementById("listaEntradas");
    lista.innerHTML = "";
    e.target.result.reverse().forEach(entrada => {
      const div = document.createElement("div");
      div.className = "entrada";
      div.innerHTML = `<strong>${new Date(entrada.fecha).toLocaleString()}</strong><p>${entrada.texto}</p>`;
      
      if (entrada.fotos?.length) {
        const container = document.createElement("div");
        container.className = "entrada-images";
        entrada.fotos.forEach(blob => {
          const img = document.createElement("img");
          const url = URL.createObjectURL(blob);
          img.src = url;
          img.onclick = () => abrirModal(url);
          container.appendChild(img);
        });
        div.appendChild(container);
      }
      lista.appendChild(div);
    });
  };
}

// --- MODAL SIMPLIFICADO ---
function abrirModal(src) {
  const modal = document.getElementById("modalImagen");
  const modalImg = document.getElementById("modalImg");
  modalImg.src = src;
  modal.classList.add("visible");
  document.body.style.overflow = "hidden";
}

document.getElementById("cerrarModal").onclick = () => {
  document.getElementById("modalImagen").classList.remove("visible");
  document.body.style.overflow = "auto";
};

document.getElementById('fotos').addEventListener('change', function() {
    const label = document.querySelector('label[for="fotos"]');
    const numFiles = this.files.length;
    if (numFiles > 0) {
        label.innerText = `✅ ${numFiles} seleccionadas`;
        label.style.backgroundColor = "#1a1a1a"; // Se oscurece al tener archivos
    } else {
        label.innerText = "📷 Seleccionar fotos";
        label.style.backgroundColor = "#333";
    }
});

document.getElementById("exportarPDF").addEventListener("click", async () => {
  const btn = document.getElementById("exportarPDF");
  const originalText = btn.innerText;
  
  btn.innerText = "Generando PDF...";
  btn.disabled = true;

  try {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF('p', 'mm', 'a4');
    const margin = 15;
    let y = margin;

    const tx = db.transaction("entradas", "readonly");
    const store = tx.objectStore("entradas");
    const allEntries = await new Promise((res) => {
      const req = store.getAll();
      req.onsuccess = () => res(req.result.reverse());
    });

    const pageWidth = 210;
    const pageHeight = 297;
    const usableWidth = pageWidth - (margin * 2);
    const maxThumbSize = (usableWidth - 5) / 2; // Tamaño máximo de la celda
    const gap = 5;

    for (let entrada of allEntries) {
      if (y > pageHeight - 40) { doc.addPage(); y = margin; }
      
      doc.setFontSize(10);
      doc.setTextColor(100);
      doc.text(new Date(entrada.fecha).toLocaleString(), margin, y);
      y += 6;

      doc.setFontSize(12);
      doc.setTextColor(0);
      const textLines = doc.splitTextToSize(entrada.texto, usableWidth);
      doc.text(textLines, margin, y);
      y += (textLines.length * 6) + 4;

      if (entrada.fotos && entrada.fotos.length > 0) {
        let col = 0;

        for (let blob of entrada.fotos) {
          const imgData = await blobToBase64(blob);

          // --- LÓGICA PARA NO ESTIRAR ---
          const imgProps = await new Promise((resolve) => {
            const tempImg = new Image();
            tempImg.onload = () => resolve({ w: tempImg.width, h: tempImg.height });
            tempImg.src = imgData;
          });

          // Calculamos el ratio para que quepa en el cuadrado sin deformarse
          const ratio = Math.min(maxThumbSize / imgProps.w, maxThumbSize / imgProps.h);
          const finalW = imgProps.w * ratio;
          const finalH = imgProps.h * ratio;

          // Centrado dentro de su celda de la cuadrícula
          const offsetX = (maxThumbSize - finalW) / 2;
          const offsetY = (maxThumbSize - finalH) / 2;

          if (col === 0 && (y + maxThumbSize > pageHeight - margin)) {
            doc.addPage();
            y = margin;
          }

          const xPos = margin + col * (maxThumbSize + gap);
          
          // Dibujamos la imagen centrada y con su proporción real
          doc.addImage(imgData, 'JPEG', xPos + offsetX, y + offsetY, finalW, finalH);

          col++;
          if (col >= 2) {
            col = 0;
            y += maxThumbSize + gap;
          }
        }
        if (col === 1) y += maxThumbSize + gap;
      }
      y += 10;
      doc.setDrawColor(230);
      doc.line(margin, y - 5, pageWidth - margin, y - 5);
    }

    doc.save(`Bitacora_${new Date().getTime()}.pdf`);

  } catch (error) {
    console.error(error);
    alert("Error al generar PDF.");
  } finally {
    btn.innerText = originalText;
    btn.disabled = false;
  }
});

// Función auxiliar necesaria (asegúrate de tenerla una sola vez)
async function blobToBase64(blob) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.readAsDataURL(blob);
  });
}