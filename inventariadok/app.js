const { jsPDF } = window.jspdf;

let db = JSON.parse(localStorage.getItem('db')) || {
    products: [],
    sales: [],
    settings: { commissionRate: 0.4 }
};

// backward compatibility
if (!db.settings) db.settings = { commissionRate: 0.4 };

function save() { localStorage.setItem('db', JSON.stringify(db)); }
function $(id) { return document.getElementById(id); }

function show(view) {
    document.querySelectorAll('.container').forEach(d => d.classList.add('hidden'));
    $(view).classList.remove('hidden');
    render(view);
}

function back() { show('menu'); }

function addProduct() {
    const n = $('name').value;
    const p = Number($('price').value);
    const s = Number($('stock').value);
    if (!n) return alert('Nombre requerido');
    db.products.push({ id: Date.now(), name: n, price: p || 0, stock: s || 0, sold: 0 });
    save();
    $('name').value = ''; $('price').value = ''; $('stock').value = '';
    back();
}

function render(view) {
    if (view === 'sale') {
        let html = '<h3>Ventas</h3>';
        db.products.forEach(p => {
            html += `<div class="product">
      <div><b>${p.name}</b></div>
      <div class="small">Stock: ${p.stock} | Vendidos: ${p.sold}</div>
      <div class="row">
        <button onclick="sell(${p.id})">+</button>
        <button onclick="undo(${p.id})">-</button>
      </div>
    </div>`;
        });
        html += '<button onclick="back()">Volver</button>';
        $('sale').innerHTML = html;
    }

    if (view === 'config') {
        let html = '<h3>Configuracion</h3>';
        html += `<div>
    <label>Comision (%)</label>
    <input type="number" id="commissionInput" value="${db.settings.commissionRate * 100}">
    <button onclick="saveCommission()">Guardar %</button>
  </div>`;

        html += '<button onclick="resetSales()">Limpiar historico</button>';
        db.products.forEach(p => {
            html += `<div class="row product">
      <span>${p.name}</span>
      <button onclick="editProduct(${p.id})">✏️</button>
    </div>`;
        });
        html += '<button onclick="back()">Volver</button>';
        $('config').innerHTML = html;
    }

    if (view === 'export') {
        $('export').innerHTML = `
  <h3>Exportar</h3>
  <button onclick="exportJSON()">Exportar JSON</button>
  <button onclick="exportByProduct()">PDF por producto</button>
  <button onclick="exportByDate()">PDF por fecha</button>
  <button onclick="back()">Volver</button>`;
    }
}

function saveCommission() {
    const val = Number($('commissionInput').value);
    db.settings.commissionRate = val / 100;
    save();
    alert('Comision guardada');
}

function sell(id) {
    let p = db.products.find(x => x.id === id);
    if (p && p.stock > 0) {
        p.stock--; p.sold++;
        db.sales.push({ productId: id, ts: Date.now(), priceSnapshot: p.price });
    }
    save(); render('sale');
}

function undo(id) {
    let index = [...db.sales].map(s => s.productId).lastIndexOf(id);
    if (index > -1) {
        let sale = db.sales.splice(index, 1)[0];
        let p = db.products.find(x => x.id === sale.productId);
        if (p) { p.stock++; p.sold--; }
    }
    save(); render('sale');
}

function resetSales() {
    db.products.forEach(p => p.sold = 0);
    db.sales = [];
    save(); render('config');
}

function editProduct(id) {
    let p = db.products.find(x => x.id === id);
    if (!p) return;
    const n = prompt('Nombre', p.name);
    const pr = prompt('Precio', p.price);
    const st = prompt('Stock', p.stock);
    if (n !== null) p.name = n;
    if (pr !== null) p.price = Number(pr);
    if (st !== null) p.stock = Number(st);
    save(); render('config');
}

function exportJSON() {
    let blob = new Blob([JSON.stringify(db, null, 2)], { type: 'application/json' });
    let a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'inventariadOK.json'; a.click();
}

function exportByProduct() {
    const doc = new jsPDF();
    doc.setFontSize(14);
    doc.text('Reporte por Producto', 10, 10);

    let y = 20;
    doc.setFontSize(10);

    let totalGeneral = 0;

    db.products.forEach(p => {
        const total = p.price * p.sold;
        totalGeneral += total;

        const line1 = `${p.name}`;
        const line2 = `Stock: ${p.stock} | Vendidos: ${p.sold}`;
        const line3 = `Precio: $${p.price} | Total: $${total}`;

        doc.text(line1, 10, y); y += 6;
        doc.text(line2, 10, y); y += 6;
        doc.text(line3, 10, y); y += 10;

        if (y > 280) {
            doc.addPage();
            y = 10;
        }
    });

    const comision = totalGeneral * db.settings.commissionRate;
    const format = (n) => `$${n.toFixed(2)}`;

    doc.setFontSize(12);
    doc.text(`TOTAL GENERAL: ${format(totalGeneral)}`, 10, y + 5);
    doc.text(`COMISION (${db.settings.commissionRate * 100}%): ${format(comision)}`, 10, y + 12);

    doc.save('reporte_productos.pdf');
}

function exportByDate() {
    const doc = new jsPDF();
    doc.text('Reporte por Fecha', 10, 10);
    let y = 20;
    db.sales.forEach(s => {
        const p = db.products.find(p => p.id === s.productId);
        const date = new Date(s.ts).toLocaleString();
        doc.text(`${date} - ${p ? p.name : '??'} - $${s.priceSnapshot}`, 10, y);
        y += 10;
    });
    doc.save('reporte_fechas.pdf');
}

// init
show('menu');