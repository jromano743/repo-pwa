import { obtenerEntradas } from "./db.js";
import { blobToBase64 } from "./images.js";

const ESTADO_COLORS = {
  Fatal: [190, 55, 55],
  Triste: [75, 115, 180],
  Meh: [150, 150, 150],
  Feliz: [75, 170, 90],
  Alegre: [230, 170, 55]
};

export async function exportarPDF() {
  const btn = document.getElementById("exportarPDF");
  const originalText = btn.innerText;
  btn.innerText = "Generando PDF...";
  btn.disabled = true;

  try {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF("p", "mm", "a4");
    const margin = 15;
    let y = margin;
    const allEntries = await obtenerEntradas();
    const pageWidth = 210;
    const pageHeight = 297;
    const usableWidth = pageWidth - (margin * 2);
    const maxThumbSize = (usableWidth - 5) / 2;
    const gap = 5;

    for (const entrada of allEntries) {
      if (y > pageHeight - 50) { doc.addPage(); y = margin; }

      doc.setFontSize(10);
      doc.setTextColor(100);
      doc.text(new Date(entrada.fecha).toLocaleString(), margin, y);
      y += 6;

      doc.setFontSize(12);
      doc.setTextColor(0);
      const textLines = doc.splitTextToSize(entrada.texto, usableWidth);
      doc.text(textLines, margin, y);
      y += (textLines.length * 6) + 4;

      if (entrada.fotos?.length) {
        let col = 0;
        for (const blob of entrada.fotos) {
          const imgData = await blobToBase64(blob);
          const imgProps = await obtenerDimensiones(imgData);
          const ratio = Math.min(maxThumbSize / imgProps.w, maxThumbSize / imgProps.h);
          const finalW = imgProps.w * ratio;
          const finalH = imgProps.h * ratio;
          const offsetX = (maxThumbSize - finalW) / 2;
          const offsetY = (maxThumbSize - finalH) / 2;

          if (col === 0 && y + maxThumbSize > pageHeight - margin) {
            doc.addPage(); y = margin;
          }

          const xPos = margin + col * (maxThumbSize + gap);
          doc.addImage(imgData, "JPEG", xPos + offsetX, y + offsetY, finalW, finalH);
          col++;
          if (col >= 2) { col = 0; y += maxThumbSize + gap; }
        }
        if (col === 1) y += maxThumbSize + gap;
      }

      y = dibujarMetadata(doc, entrada, y, margin, usableWidth, pageHeight);
      doc.setDrawColor(230);
      doc.line(margin, y + 2, pageWidth - margin, y + 2);
      y += 10;
    }

    doc.save(`Bitacora_${new Date().getTime()}.pdf`);
  } catch (error) {
    console.error(error);
    alert("Error al generar PDF.");
  } finally {
    btn.innerText = originalText;
    btn.disabled = false;
  }
}

function dibujarMetadata(doc, entrada, y, margin, usableWidth, pageHeight) {
  const actividades = entrada.actividades || [];
  const estado = entrada.estado;
  if (!estado && !actividades.length) return y;

  if (y > pageHeight - 30) { doc.addPage(); y = margin; }

  y += 2;
  if (estado) {
    const color = ESTADO_COLORS[estado] || [100, 100, 100];
    doc.setFillColor(...color);
    doc.roundedRect(margin, y - 4, 25, 7, 2, 2, "F");
    doc.setFontSize(9);
    doc.setTextColor(255, 255, 255);
    doc.text(estado, margin + 3, y + 1);
  }

  if (actividades.length) {
    doc.setFontSize(9);
    doc.setTextColor(80);
    const text = `Actividades: ${actividades.join(", ")}`;
    const lines = doc.splitTextToSize(text, usableWidth - (estado ? 30 : 0));
    doc.text(lines, margin + (estado ? 30 : 0), y + 1);
    y += Math.max(7, lines.length * 4);
  } else {
    y += 7;
  }

  return y;
}

function obtenerDimensiones(src) {
  return new Promise((resolve, reject) => {
    const tempImg = new Image();
    tempImg.onload = () => resolve({ w: tempImg.width, h: tempImg.height });
    tempImg.onerror = () => reject(new Error("No se pudo leer una imagen para el PDF"));
    tempImg.src = src;
  });
}
