let cart = [];
let allProducts = [];

// Configuración API
const API_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://localhost:3000'
    : 'https://backend-strike-motards.onrender.com'; 

// ==================== CARGAR PRODUCTOS ====================
async function cargarProductos() {
    try {
        const res = await fetch(`${API_URL}/productos`);
        allProducts = await res.json();
        renderFilters();
        renderProducts(allProducts);
    } catch (error) {
        console.error("Error cargando productos:", error);
        document.getElementById('lista-productos').innerHTML = `<p style="text-align:center; padding:60px; color:#aaa;">Error al cargar los productos.</p>`;
    }
}

// ==================== FILTROS Y BÚSQUEDA ====================
function renderFilters() {
    const categories = ['Todos', ...new Set(allProducts.map(p => p.categoria))];
    const container = document.getElementById('category-filters');
    
    container.innerHTML = categories.map(cat => `
        <div class="category-chip ${cat === 'Todos' ? 'active' : ''}" data-category="${cat}">
            ${cat}
        </div>
    `).join('');

    container.querySelectorAll('.category-chip').forEach(chip => {
        chip.addEventListener('click', () => {
            document.querySelectorAll('.category-chip').forEach(c => c.classList.remove('active'));
            chip.classList.add('active');
            filterProducts();
        });
    });

    document.getElementById('search-input').addEventListener('input', filterProducts);
}

function filterProducts() {
    const searchTerm = document.getElementById('search-input').value.toLowerCase().trim();
    const activeCategory = document.querySelector('.category-chip.active')?.dataset.category || 'Todos';

    let filtered = allProducts;

    if (activeCategory !== 'Todos') {
        filtered = filtered.filter(p => p.categoria === activeCategory);
    }

    if (searchTerm) {
        filtered = filtered.filter(p => 
            p.nombre.toLowerCase().includes(searchTerm) || 
            (p.descripcion && p.descripcion.toLowerCase().includes(searchTerm))
        );
    }

    renderProducts(filtered);
}

function renderProducts(productos) {
    const container = document.getElementById('lista-productos');
    container.innerHTML = productos.map(p => `
        <div class="card">
            <img src="${p.imagen_url}" alt="${p.nombre}">
            <div class="card-content">
                <span class="category-badge">${p.categoria}</span>
                <h3>${p.nombre}</h3>
                <p>${p.descripcion || ''}</p>
                <div style="display:flex; justify-content:space-between; align-items:center; margin-top:15px;">
                    <span class="price">$${parseFloat(p.precio).toLocaleString('es-MX')}</span>
                    <button class="btn-add" onclick="addToCart(${p.id})">+</button>
                </div>
            </div>
        </div>
    `).join('');
}

// ==================== CARRITO ====================
function addToCart(id) {
    const product = allProducts.find(p => p.id === id);
    if (!product) return;

    const existing = cart.find(item => item.id === id);
    if (existing) {
        existing.quantity = (existing.quantity || 1) + 1;
    } else {
        cart.push({ ...product, quantity: 1 });
    }

    updateCartCount();
    
    const toast = document.createElement('div');
    toast.style.cssText = 'position:fixed; bottom:20px; left:50%; transform:translateX(-50%); background:#FF3B3B; color:white; padding:12px 24px; border-radius:8px; z-index:3000;';
    toast.textContent = `${product.nombre} añadido`;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 1800);
}

function updateCartCount() {
    const count = cart.reduce((sum, item) => sum + (item.quantity || 1), 0);
    document.getElementById('cart-count').textContent = count;
}

function renderCart() {
    const list = document.getElementById('cart-list');
    let html = '';
    let total = 0;

    cart.forEach((item, index) => {
        const qty = item.quantity || 1;
        total += parseFloat(item.precio) * qty;

        html += `
            <div style="display:flex; gap:15px; padding:15px 0; border-bottom:1px solid #1a4d5c;">
                <img src="${item.imagen_url}" style="width:70px; height:70px; object-fit:cover; border-radius:8px;">
                <div style="flex:1">
                    <p style="font-weight:600;">${item.nombre}</p>
                    <p style="color:#aaa;">$${parseFloat(item.precio).toLocaleString('es-MX')}</p>
                </div>
                <div style="display:flex; align-items:center; gap:8px;">
                    <button onclick="changeQuantity(${index}, -1)" style="width:28px;height:28px;background:#1a4d5c;color:white;border:none;border-radius:6px;">–</button>
                    <span style="min-width:24px;text-align:center;">${qty}</span>
                    <button onclick="changeQuantity(${index}, 1)" style="width:28px;height:28px;background:#1a4d5c;color:white;border:none;border-radius:6px;">+</button>
                </div>
                <button onclick="removeFromCart(${index})" style="background:none;border:none;color:#ff6b6b;font-size:1.6rem;cursor:pointer;">×</button>
            </div>
        `;
    });

    list.innerHTML = html || '<p style="text-align:center; color:#777; padding:80px 0;">Tu carrito está vacío</p>';
    document.getElementById('cart-total').textContent = total.toLocaleString('es-MX');
}

function changeQuantity(index, change) {
    cart[index].quantity = (cart[index].quantity || 1) + change;
    if (cart[index].quantity < 1) cart[index].quantity = 1;
    renderCart();
    updateCartCount();
}

function removeFromCart(index) {
    cart.splice(index, 1);
    renderCart();
    updateCartCount();
}

function toggleCart() {
    const modal = document.getElementById('cart-modal');
    modal.style.display = modal.style.display === 'flex' ? 'none' : 'flex';
    if (modal.style.display === 'flex') renderCart();
}

// ==================== CHECKOUT CON VALIDACIÓN ====================
function showCheckout() {
    if (cart.length === 0) return alert("El carrito está vacío");

    const total = cart.reduce((sum, item) => sum + parseFloat(item.precio) * (item.quantity || 1), 0);

    const checkoutHTML = `
        <div style="position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.92); z-index:3000; display:flex; align-items:center; justify-content:center;">
            <div style="background:#062D38; padding:30px; border-radius:16px; width:90%; max-width:500px;">
                <h2 style="text-align:center; margin-bottom:20px;">Completa tu Pedido</h2>
                
                <input type="text" id="cliente-nombre" placeholder="Nombre completo *" style="width:100%; padding:12px; margin:8px 0; background:#0A3D4A; border:none; border-radius:8px; color:white;">
                <input type="tel" id="cliente-telefono" placeholder="Teléfono / WhatsApp *" maxlength="10" style="width:100%; padding:12px; margin:8px 0; background:#0A3D4A; border:none; border-radius:8px; color:white;">
                <textarea id="cliente-direccion" placeholder="Dirección de envío (calle, colonia, ciudad, CP)" style="width:100%; padding:12px; margin:8px 0; background:#0A3D4A; border:none; border-radius:8px; color:white; min-height:80px;"></textarea>
                
                <div style="margin:20px 0; padding:15px; background:#0A3D4A; border-radius:8px;">
                    <p><strong>Total: $${total.toLocaleString('es-MX')} MXN</strong></p>
                </div>

                <div style="display:flex; gap:10px;">
                    <button onclick="closeCheckout()" style="flex:1; padding:14px; background:#444; border:none; border-radius:8px; color:white;">Cancelar</button>
                    <button onclick="confirmOrder()" style="flex:1; padding:14px; background:var(--accent); border:none; border-radius:8px; color:white; font-weight:700;">Enviar por WhatsApp</button>
                </div>
            </div>
        </div>
    `;

    const modal = document.createElement('div');
    modal.innerHTML = checkoutHTML;
    modal.id = 'checkout-modal';
    document.body.appendChild(modal);

    // Validación de solo números en teléfono
    const telefonoInput = document.getElementById('cliente-telefono');
    telefonoInput.addEventListener('input', function() {
        this.value = this.value.replace(/[^0-9]/g, '');
    });
}

function closeCheckout() {
    const modal = document.getElementById('checkout-modal');
    if (modal) modal.remove();
}

function confirmOrder() {
    const nombre = document.getElementById('cliente-nombre').value.trim();
    const telefono = document.getElementById('cliente-telefono').value.trim();
    const direccion = document.getElementById('cliente-direccion').value.trim();

    if (!nombre) return alert("Por favor ingresa tu nombre");
    if (!telefono || telefono.length < 10) return alert("Por favor ingresa un teléfono válido (10 dígitos)");
    
    let mensaje = `🚀 *Nuevo Pedido - Strike Motards*%0A%0A`;
    mensaje += `*Cliente:* ${nombre}%0A`;
    mensaje += `*Teléfono:* ${telefono}%0A`;
    if (direccion) mensaje += `*Dirección:* ${direccion}%0A%0A`;

    let total = 0;
    cart.forEach(p => {
        const qty = p.quantity || 1;
        mensaje += `• ${qty}x ${p.nombre} - $${p.precio}%0A`;
        total += parseFloat(p.precio) * qty;
    });

    mensaje += `%0A*Total:* $${total.toLocaleString('es-MX')} MXN`;

    const url = `https://wa.me/527292529554?text=${mensaje}`;
    window.open(url, "_blank");

    closeCheckout();
    cart = [];
    updateCartCount();
    toggleCart();
}

// ==================== INICIALIZACIÓN ====================
document.addEventListener('DOMContentLoaded', () => {
    const exploreBtn = document.querySelector('#inicio button');
    if (exploreBtn) exploreBtn.addEventListener('click', () => mostrarSeccion('tienda'));
});

function mostrarSeccion(id) {
    document.querySelectorAll('.seccion').forEach(sec => sec.classList.remove('active'));
    document.getElementById(id).classList.add('active');
    if (id === 'tienda') cargarProductos();
}