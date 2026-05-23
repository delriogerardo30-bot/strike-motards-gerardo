let cart = [];
let allProducts = [];
let productsLoaded = false;

// Configuración API
const API_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://localhost:3000'
    : 'https://backend-strike-motards.onrender.com';

// ==================== CARGAR PRODUCTOS ====================
async function cargarProductos() {
    const container = document.getElementById('lista-productos');

    if (productsLoaded) {
        renderProducts(allProducts);
        return;
    }

    try {
        container.innerHTML = `
            <p style="text-align:center; padding:60px; color:#aaa; grid-column:1/-1;">
                Cargando productos...
            </p>
        `;

        const res = await fetch(`${API_URL}/productos`);

        if (!res.ok) {
            throw new Error("No se pudo conectar con el servidor");
        }

        allProducts = await res.json();
        productsLoaded = true;

        renderFilters();
        renderProducts(allProducts);
    } catch (error) {
        console.error("Error cargando productos:", error);
        container.innerHTML = `
            <p style="text-align:center; padding:60px; color:#aaa; grid-column:1/-1;">
                Error al cargar los productos.
            </p>
        `;
    }
}

// ==================== FILTROS Y BÚSQUEDA ====================
function renderFilters() {
    const categories = ['Todos', ...new Set(allProducts.map(p => p.categoria || 'Accesorios'))];
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

    const searchInput = document.getElementById('search-input');

    searchInput.removeEventListener('input', filterProducts);
    searchInput.addEventListener('input', filterProducts);
}

function filterProducts() {
    const searchTerm = document.getElementById('search-input').value.toLowerCase().trim();
    const activeCategory = document.querySelector('.category-chip.active')?.dataset.category || 'Todos';

    let filtered = allProducts;

    if (activeCategory !== 'Todos') {
        filtered = filtered.filter(p => (p.categoria || 'Accesorios') === activeCategory);
    }

    if (searchTerm) {
        filtered = filtered.filter(p =>
            p.nombre.toLowerCase().includes(searchTerm) ||
            (p.descripcion && p.descripcion.toLowerCase().includes(searchTerm)) ||
            (p.categoria && p.categoria.toLowerCase().includes(searchTerm))
        );
    }

    renderProducts(filtered);
}

function renderProducts(productos) {
    const container = document.getElementById('lista-productos');

    if (!productos.length) {
        container.innerHTML = `
            <p style="text-align:center; padding:60px; color:#aaa; grid-column:1/-1;">
                No se encontraron productos.
            </p>
        `;
        return;
    }

    container.innerHTML = productos.map(p => `
        <div class="card">
            <div class="card-img-wrap">
                <img src="${p.imagen_url}" alt="${p.nombre}">
            </div>

            <div class="card-content">
                <span class="category-badge">${p.categoria || 'Accesorios'}</span>
                <h3>${p.nombre}</h3>
                <p>${p.descripcion || 'Producto premium para motociclistas.'}</p>

                <div style="display:flex; justify-content:space-between; align-items:center; margin-top:18px; gap:12px;">
                    <span class="price">$${parseFloat(p.precio).toLocaleString('es-MX')}</span>
                    <button class="btn-add" onclick="addToCart(${p.id})">Agregar</button>
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
    showToast(`${product.nombre} añadido al carrito`);
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
        const itemTotal = parseFloat(item.precio) * qty;
        total += itemTotal;

        html += `
            <div class="cart-item">
                <img src="${item.imagen_url}" alt="${item.nombre}">

                <div style="flex:1">
                    <p style="font-weight:800;">${item.nombre}</p>
                    <p style="color:#aaa;">$${parseFloat(item.precio).toLocaleString('es-MX')} MXN</p>
                    <p style="color:var(--teal); font-size:0.9rem;">
                        Subtotal: $${itemTotal.toLocaleString('es-MX')}
                    </p>
                </div>

                <div style="display:flex; align-items:center; gap:8px;">
                    <button class="qty-btn" onclick="changeQuantity(${index}, -1)">–</button>
                    <span style="min-width:24px;text-align:center;font-weight:800;">${qty}</span>
                    <button class="qty-btn" onclick="changeQuantity(${index}, 1)">+</button>
                </div>

                <button class="remove-btn" onclick="removeFromCart(${index})">×</button>
            </div>
        `;
    });

    list.innerHTML = html || `
        <p style="text-align:center; color:#777; padding:80px 0;">
            Tu carrito está vacío
        </p>
    `;

    document.getElementById('subtotal').textContent = `$${total.toLocaleString('es-MX')}`;
    document.getElementById('cart-total').textContent = `$${total.toLocaleString('es-MX')}`;
}

function changeQuantity(index, change) {
    cart[index].quantity = (cart[index].quantity || 1) + change;

    if (cart[index].quantity < 1) {
        cart[index].quantity = 1;
    }

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

    if (modal.style.display === 'flex') {
        renderCart();
    }
}

// ==================== CHECKOUT CON VALIDACIÓN ====================
function showCheckout() {
    if (cart.length === 0) {
        return alert("El carrito está vacío");
    }

    const total = cart.reduce((sum, item) => {
        return sum + parseFloat(item.precio) * (item.quantity || 1);
    }, 0);

    const checkoutHTML = `
        <div class="checkout-modal">
            <div class="checkout-card">
                <h2>Completa tu Pedido</h2>

                <input type="text" id="cliente-nombre" placeholder="Nombre completo *">
                <input type="tel" id="cliente-telefono" placeholder="Teléfono / WhatsApp *" maxlength="10">
                <textarea id="cliente-direccion" placeholder="Dirección de envío (calle, colonia, ciudad, CP)"></textarea>

                <div class="checkout-total">
                    <p><strong>Total: $${total.toLocaleString('es-MX')} MXN</strong></p>
                </div>

                <div class="checkout-actions">
                    <button onclick="closeCheckout()" class="btn-cancel">Cancelar</button>
                    <button onclick="confirmOrder()" class="btn-whatsapp">Enviar por WhatsApp</button>
                </div>
            </div>
        </div>
    `;

    const modal = document.createElement('div');
    modal.innerHTML = checkoutHTML;
    modal.id = 'checkout-modal';
    document.body.appendChild(modal);

    const telefonoInput = document.getElementById('cliente-telefono');

    telefonoInput.addEventListener('input', function () {
        this.value = this.value.replace(/[^0-9]/g, '');
    });
}

function closeCheckout() {
    const modal = document.getElementById('checkout-modal');

    if (modal) {
        modal.remove();
    }
}

function confirmOrder() {
    const nombre = document.getElementById('cliente-nombre').value.trim();
    const telefono = document.getElementById('cliente-telefono').value.trim();
    const direccion = document.getElementById('cliente-direccion').value.trim();

    if (!nombre) {
        return alert("Por favor ingresa tu nombre");
    }

    if (!telefono || telefono.length < 10) {
        return alert("Por favor ingresa un teléfono válido de 10 dígitos");
    }

    let mensaje = `🚀 *Nuevo Pedido - Strike Motards*%0A%0A`;
    mensaje += `*Cliente:* ${nombre}%0A`;
    mensaje += `*Teléfono:* ${telefono}%0A`;

    if (direccion) {
        mensaje += `*Dirección:* ${direccion}%0A%0A`;
    }

    let total = 0;

    cart.forEach(p => {
        const qty = p.quantity || 1;
        const subtotal = parseFloat(p.precio) * qty;

        mensaje += `• ${qty}x ${p.nombre} - $${subtotal.toLocaleString('es-MX')} MXN%0A`;
        total += subtotal;
    });

    mensaje += `%0A*Total:* $${total.toLocaleString('es-MX')} MXN`;

    const url = `https://wa.me/527292529554?text=${mensaje}`;
    window.open(url, "_blank");

    closeCheckout();
    cart = [];
    updateCartCount();

    const cartModal = document.getElementById('cart-modal');
    cartModal.style.display = 'none';

    showToast("Pedido enviado por WhatsApp");
}

// ==================== TOAST ====================
function showToast(message) {
    const oldToast = document.querySelector('.toast');

    if (oldToast) {
        oldToast.remove();
    }

    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;

    document.body.appendChild(toast);

    setTimeout(() => {
        toast.remove();
    }, 1800);
}

// ==================== SECCIONES ====================
function mostrarSeccion(id) {
    document.querySelectorAll('.seccion').forEach(sec => sec.classList.remove('active'));
    document.getElementById(id).classList.add('active');

    if (id === 'tienda') {
        cargarProductos();

        setTimeout(() => {
            document.getElementById('tienda').scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }, 100);
    } else {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    }
}

// ==================== INICIALIZACIÓN ====================
document.addEventListener('DOMContentLoaded', () => {
    updateCartCount();
});