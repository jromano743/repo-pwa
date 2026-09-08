export function inicializarModal() {
  const modal = document.getElementById("modalImagen");
  const modalImg = document.getElementById("modalImg");
  const cerrar = document.getElementById("cerrarModal");

  cerrar.addEventListener("click", cerrarModal);

  modal.addEventListener("click", (e) => {
    if (e.target.id === "modalImagen") cerrarModal();
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") cerrarModal();
  });

  return { abrirModal, cerrarModal };

  function abrirModal(src) {
    modalImg.src = src;
    modal.classList.add("visible");
    document.body.style.overflow = "hidden";
  }

  function cerrarModal() {
    modal.classList.remove("visible");
    modalImg.src = "";
    document.body.style.overflow = "auto";
  }
}
