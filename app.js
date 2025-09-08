// Inventario mínimo: nombre, precio, stock.
const productos = [];
const STORAGE_KEY = 'inventario_basico_v1';

const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => Array.from(document.querySelectorAll(sel));

const form = $('#form-producto');
const tbody = $('#tbody');
const totalEl = $('#valorTotal');

function formatoMoneda(n) {
  if (!isFinite(n)) return '$0.00';
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'USD' }).format(n);
}

function guardar() {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(productos)); } catch (_) {}
}

function cargar() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const arr = JSON.parse(raw);
    if (Array.isArray(arr)) {
      arr.forEach((p) => {
        if (!p || typeof p !== 'object') return;
        const nombre = String(p.nombre ?? '').trim();
        const precio = Number(p.precio);
        const stock = Number.isFinite(Number(p.stock)) ? parseInt(p.stock, 10) : 0;
        if (!nombre) return;
        productos.push({ nombre, precio: Math.max(0, +precio.toFixed?.(2) || 0), stock: Math.max(0, stock || 0) });
      });
    }
  } catch (_) {}
}

function render() {
  tbody.innerHTML = '';
  if (productos.length === 0) {
    const tr = document.createElement('tr');
    tr.className = 'empty';
    const td = document.createElement('td');
    td.colSpan = 5;
    td.textContent = 'Sin productos. Agrega el primero arriba.';
    tr.appendChild(td);
    tbody.appendChild(tr);
    totalEl.textContent = '$0.00';
    return;
  }

  let total = 0;
  productos.forEach((p, idx) => {
    const tr = document.createElement('tr');

    const tdNombre = document.createElement('td');
    tdNombre.textContent = p.nombre;

    const tdPrecio = document.createElement('td');
    tdPrecio.className = 'num';
    tdPrecio.textContent = formatoMoneda(p.precio);

    const tdStock = document.createElement('td');
    tdStock.className = 'num';
    tdStock.textContent = p.stock;

    const subtotal = p.precio * p.stock;
    total += subtotal;
    const tdTotal = document.createElement('td');
    tdTotal.className = 'num';
    tdTotal.textContent = formatoMoneda(subtotal);

    const tdAcciones = document.createElement('td');
    tdAcciones.className = 'actions';
    const btnEditar = document.createElement('button');
    btnEditar.type = 'button';
    btnEditar.textContent = 'Editar';
    btnEditar.className = 'secondary';
    btnEditar.addEventListener('click', () => editar(idx));

    const btnEliminar = document.createElement('button');
    btnEliminar.type = 'button';
    btnEliminar.textContent = 'Eliminar';
    btnEliminar.className = 'danger';
    btnEliminar.addEventListener('click', () => eliminar(idx));

    tdAcciones.append(btnEditar, btnEliminar);

    tr.append(tdNombre, tdPrecio, tdStock, tdTotal, tdAcciones);
    tbody.appendChild(tr);
  });

  totalEl.textContent = formatoMoneda(total);
}

function agregar(e) {
  e.preventDefault();
  const nombre = $('#nombre').value.trim();
  const precio = parseFloat($('#precio').value);
  const stock = parseInt($('#stock').value, 10);

  if (!nombre || !Number.isFinite(precio) || precio < 0 || !Number.isFinite(stock) || stock < 0) {
    alert('Completa todos los campos con valores válidos.');
    return;
  }

  productos.push({ nombre, precio: +precio.toFixed(2), stock });
  guardar();
  form.reset();
  $('#nombre').focus();
  render();
}

function editar(i) {
  const p = productos[i];
  if (!p) return;
  const nombre = prompt('Nombre del producto:', p.nombre);
  if (nombre === null) return; // canceló
  const precioStr = prompt('Precio unitario:', String(p.precio));
  if (precioStr === null) return;
  const stockStr = prompt('Stock:', String(p.stock));
  if (stockStr === null) return;

  const nNombre = nombre.trim();
  const nPrecio = parseFloat(precioStr);
  const nStock = parseInt(stockStr, 10);

  if (!nNombre || !Number.isFinite(nPrecio) || nPrecio < 0 || !Number.isFinite(nStock) || nStock < 0) {
    alert('Valores inválidos. No se aplicaron cambios.');
    return;
  }

  p.nombre = nNombre;
  p.precio = +nPrecio.toFixed(2);
  p.stock = nStock;
  guardar();
  render();
}

function eliminar(i) {
  const p = productos[i];
  if (!p) return;
  if (confirm(`¿Eliminar "${p.nombre}" del inventario?`)) {
    productos.splice(i, 1);
    guardar();
    render();
  }
}

form.addEventListener('submit', agregar);

// Inicialización
cargar();
render();

