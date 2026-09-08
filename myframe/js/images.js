const objectUrls = new Set();

export async function optimizarImagen(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      const img = new Image();

      img.onload = () => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");

        const MAX_WIDTH = 1000;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else if (height > MAX_WIDTH) {
          width *= MAX_WIDTH / height;
          height = MAX_WIDTH;
        }

        canvas.width = width;
        canvas.height = height;

        ctx.fillStyle = "#FFFFFF";
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob((blob) => {
          img.src = "";
          if (blob) resolve(blob);
          else reject(new Error("Error Canvas"));
        }, "image/jpeg", 0.6);
      };

      img.onerror = () => reject(new Error("Error carga imagen"));
      img.src = e.target.result;
    };

    reader.onerror = () => reject(new Error("Error leyendo imagen"));
    reader.readAsDataURL(file);
  });
}

export function crearObjectURL(blob) {
  const url = URL.createObjectURL(blob);
  objectUrls.add(url);
  return url;
}

export function limpiarObjectUrls() {
  for (const url of objectUrls) {
    URL.revokeObjectURL(url);
  }
  objectUrls.clear();
}

export function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error || new Error("Error leyendo imagen para PDF"));
    reader.readAsDataURL(blob);
  });
}
