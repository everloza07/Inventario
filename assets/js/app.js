// Inventario mínimo: nombre, precio, stock.
const productos = [];
const STORAGE_KEY = "inventario_basico_v1";

const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => Array.from(document.querySelectorAll(sel));

const form = $("#form-producto");
const tbody = $("#tbody");
const totalEl = $("#valorTotal");

function formatoMoneda(n) {
  if (!isFinite(n)) n = 0;
  return new Intl.NumberFormat("es-PE", {
    style: "currency",
    currency: "PEN",
  }).format(n);
}

function guardar() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(productos));
  } catch (_) {}
}

function cargar() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const arr = JSON.parse(raw);
    if (Array.isArray(arr)) {
      arr.forEach((p) => {
        if (!p || typeof p !== "object") return;
        const nombre = String(p.nombre ?? "").trim();
        const precio = Number(p.precio);
        const stock = Number.isFinite(Number(p.stock))
          ? parseInt(p.stock, 10)
          : 0;
        if (!nombre) return;
        productos.push({
          nombre,
          precio: Math.max(0, +(+precio).toFixed(2) || 0),
          stock: Math.max(0, stock || 0),
        });
      });
    }
  } catch (_) {}
}

// Utilidad: validar y normalizar datos de un producto
function validarProducto(nombre, precio, stock) {
  const nNombre = String(nombre ?? "").trim();
  const nPrecio = parseFloat(precio);
  const nStock = parseInt(stock, 10);
  if (
    !nNombre ||
    !Number.isFinite(nPrecio) ||
    nPrecio < 0 ||
    !Number.isFinite(nStock) ||
    nStock < 0
  )
    return null;
  return { nombre: nNombre, precio: +nPrecio.toFixed(2), stock: nStock };
}

function render() {
  if (!tbody || !totalEl) return;
  tbody.innerHTML = "";
  if (productos.length === 0) {
    const tr = document.createElement("tr");
    tr.className = "empty";
    const td = document.createElement("td");
    td.colSpan = 5;
    td.textContent = "Sin productos. Agrega el primero arriba.";
    tr.appendChild(td);
    tbody.appendChild(tr);
    totalEl.textContent = formatoMoneda(0);
    return;
  }

  let total = 0;
  productos.forEach((p, idx) => {
    const tr = document.createElement("tr");

    const tdNombre = document.createElement("td");
    tdNombre.textContent = p.nombre;

    const tdPrecio = document.createElement("td");
    tdPrecio.className = "num";
    tdPrecio.textContent = formatoMoneda(p.precio);

    const tdStock = document.createElement("td");
    tdStock.className = "num";
    tdStock.textContent = p.stock;

    const subtotal = p.precio * p.stock;
    total += subtotal;
    const tdTotal = document.createElement("td");
    tdTotal.className = "num";
    tdTotal.textContent = formatoMoneda(subtotal);

    const tdAcciones = document.createElement("td");
    tdAcciones.className = "actions";
    const btnEditar = document.createElement("button");
    btnEditar.type = "button";
    btnEditar.textContent = "Editar";
    btnEditar.className = "secondary js-edit";
    btnEditar.dataset.index = idx;

    const btnEliminar = document.createElement("button");
    btnEliminar.type = "button";
    btnEliminar.textContent = "Eliminar";
    btnEliminar.className = "danger js-delete";
    btnEliminar.dataset.index = idx;

    tdAcciones.append(btnEditar, btnEliminar);

    tr.append(tdNombre, tdPrecio, tdStock, tdTotal, tdAcciones);
    tbody.appendChild(tr);
  });

  totalEl.textContent = formatoMoneda(total);
}

function onSubmitAgregar(e) {
  e.preventDefault();
  const parsed = validarProducto(
    $("#nombre")?.value,
    $("#precio")?.value,
    $("#stock")?.value
  );
  if (!parsed) {
    alert("Completa todos los campos con valores válidos.");
    return;
  }
  productos.push(parsed);
  guardar();
  form?.reset();
  $("#nombre")?.focus();
  render();
}

form && form.addEventListener("submit", onSubmitAgregar);

// Delegación de eventos para acciones en la tabla
tbody &&
  tbody.addEventListener("click", (e) => {
    const btn = e.target.closest("button");
    if (!btn || !tbody.contains(btn)) return;
    const idx = parseInt(btn.dataset.index, 10);
    if (!Number.isFinite(idx)) return;
    if (btn.classList.contains("js-edit")) editar(idx);
    else if (btn.classList.contains("js-delete")) eliminar(idx);
  });

// Inicialización
cargar();
render();

// =====================
// Modales (Editar/Eliminar) con clase reutilizable
// =====================
class Modal {
  constructor(overlay) {
    this.overlay = overlay;
    if (!overlay) return;
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) this.close();
    });
    overlay
      .querySelectorAll("[data-close]")
      .forEach((el) => el.addEventListener("click", () => this.close()));
  }
  open() {
    if (!this.overlay) return;
    this.overlay.classList.add("show");
    this.overlay.setAttribute("aria-hidden", "false");
    document.body.classList.add("modal-open");
  }
  close() {
    if (!this.overlay) return;
    this.overlay.classList.remove("show");
    this.overlay.setAttribute("aria-hidden", "true");
    document.body.classList.remove("modal-open");
  }
  isOpen() {
    return !!this.overlay && this.overlay.classList.contains("show");
  }
}
let idxEdit = null;
let idxDelete = null;

const modalEdit = document.querySelector("#modal-edit")
  ? new Modal(document.querySelector("#modal-edit"))
  : null;
const modalDelete = document.querySelector("#modal-delete")
  ? new Modal(document.querySelector("#modal-delete"))
  : null;
const editForm = document.querySelector("#form-edit");
const editNombre = document.querySelector("#edit-nombre");
const editPrecio = document.querySelector("#edit-precio");
const editStock = document.querySelector("#edit-stock");
const deleteMessage = document.querySelector("#delete-message");
const btnConfirmDelete = document.querySelector("#btn-confirm-delete");

// Reemplaza prompts con modal de edición
function editar(i) {
  const p = productos[i];
  if (!p || !modalEdit) return;
  idxEdit = i;
  if (editNombre) editNombre.value = p.nombre;
  if (editPrecio) editPrecio.value = String(p.precio);
  if (editStock) editStock.value = String(p.stock);
  modalEdit.open();
  setTimeout(() => editNombre && editNombre.focus(), 0);
}

editForm &&
  editForm.addEventListener("submit", (e) => {
    e.preventDefault();
    if (idxEdit == null) return modalEdit?.close();
    const p = productos[idxEdit];
    if (!p) return modalEdit?.close();
    const parsed = validarProducto(
      editNombre?.value,
      editPrecio?.value,
      editStock?.value
    );
    if (!parsed) {
      alert("Revisa los valores ingresados.");
      return;
    }
    p.nombre = parsed.nombre;
    p.precio = parsed.precio;
    p.stock = parsed.stock;
    guardar();
    render();
    modalEdit?.close();
  });

// Reemplaza confirm con modal de eliminación
function eliminar(i) {
  const p = productos[i];
  if (!p || !modalDelete) return;
  idxDelete = i;
  if (deleteMessage)
    deleteMessage.textContent = `¿Eliminar "${p.nombre}" del inventario?`;
  modalDelete.open();
}

btnConfirmDelete &&
  btnConfirmDelete.addEventListener("click", () => {
    if (idxDelete == null) return modalDelete?.close();
    productos.splice(idxDelete, 1);
    guardar();
    render();
    modalDelete?.close();
  });

// Escape para cerrar
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    if (modalEdit?.isOpen()) modalEdit.close();
    else if (modalDelete?.isOpen()) modalDelete.close();
  }
});

