let cart = [];
let allProducts = [];

// DETECCIÓN DE API
const API_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://localhost:3000'
    : 'https://backend-strike-motards.onrender.com'; 

async function cargarProductos() {
    try {
        const res = await fetch(`${API_URL}/productos`);
        allProducts = await res.json();

        renderFilters();
        renderProducts(allProducts);
    } catch (error) {
        console.error("Error cargando productos:", error);
        document.getElementById('lista-productos').innerHTML = `
            <p class="loading-msg">Error al cargar los productos. Inténtalo más tarde.</p>
        `;
    }
}

// Renderizar filtros dinámicos
function renderFilters() {
    const categories = ['Todos', ...new Set(allProducts.map(p => p.categoria))];
    const container = document.getElementById('category-filters');
    
    container.innerHTML = categories.map(cat => `
        <div class="category-chip ${cat === 'Todos' ? 'active' : ''}" data-category="${cat}">
            ${cat}
        </div>
    `).join('');

    // Event listeners para filtros
    container.querySelectorAll('.category-chip').forEach(chip => {
        chip.addEventListener('click', () => {
            document.querySelectorAll('.category-chip').forEach(c => c.classList.remove('active'));
            chip.classList.add('active');
            filterProducts();
        });
    });

    // Búsqueda en tiempo real
    document.getElementById('search-input').addEventListener('input', filterProducts);
}

// Filtrar productos
function filterProducts() {
    const searchTerm = document.getElementById('search-input').value.toLowerCase().trim();
    const activeCategory = document.querySelector('.category-chip.active')?.dataset.category || 'Todos';

    let filtered = allProducts;

    // Filtro por categoría
    if (activeCategory !== 'Todos') {
        filtered = filtered.filter(p => p.categoria === activeCategory);
    }

    // Filtro por búsqueda
    if (searchTerm) {
        filtered = filtered.filter(p => 
            p.nombre.toLowerCase().includes(searchTerm) || 
            p.descripcion.toLowerCase().includes(searchTerm)
        );
    }

    renderProducts(filtered);
}

// Renderizar productos
function renderProducts(productos) {
    const contenedor = document.getElementById('lista-productos');
    if (!contenedor) return;

    if (productos.length === 0) {
        contenedor.innerHTML = `<p class="no-results">No se encontraron productos con esos filtros 😔</p>`;
        return;
    }

    contenedor.innerHTML = productos.map(p => `
        <div class="card">
            <img src="${p.imagen_url || 'https://via.placeholder.com/300'}" alt="${p.nombre}">
            <div class="card-content">
                <span class="category-badge">${p.categoria || 'Accesorio'}</span>
                <h3>${p.nombre}</h3>
                <p>${p.descripcion}</p>
                <div class="card-footer">
                    <div class="price-box">
                        <span class="price">$${parseFloat(p.precio).toLocaleString('es-MX')}</span>
                        <span class="currency">MXN</span>
                    </div>
                    <button class="btn-add-circle" onclick="addCartFromId(${p.id || p.nombre})">+</button>
                </div>
            </div>
        </div>
    `).join('');
}

// Función auxiliar para agregar desde ID (mejor compatibilidad)
function addCartFromId(identifier) {
    const product = allProducts.find(p => p.id === identifier || p.nombre === identifier);
    if (product) addCart(product);
}

// ================= CART LOGIC (sin cambios importantes) =================
function addCart(producto) {
    cart.push(producto);
    renderCart();
    // Pequeña animación de feedback
    const toast = document.createElement('div');
    toast.textContent = `✅ ${producto.nombre} añadido`;
    toast.style.cssText = 'position:fixed; bottom:20px; left:50%; transform:translateX(-50%); background:var(--accent); color:white; padding:12px 20px; border-radius:8px; z-index:3000;';
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 2000);
}

function removeFromCart(index) {
    cart.splice(index, 1);
    renderCart();
}

function renderCart() {
    const cartCount = document.getElementById('cart-count');
    const cartList = document.getElementById('cart-list');
    const cartTotal = document.getElementById('cart-total');

    if (cartCount) cartCount.innerText = cart.length;

    let total = 0;
    let html = '';

    cart.forEach((p, index) => {
        total += parseFloat(p.precio);
        html += `
            <div class="cart-item">
                <div>
                    <p style="margin:0; font-weight:600;">${p.nombre}</p>
                    <p style="margin:4px 0 0; color:#aaa;">$${parseFloat(p.precio).toFixed(2)}</p>
                </div>
                <button onclick="removeFromCart(${index})" style="background:none; border:none; color:#ff6b6b; font-size:1.4rem; cursor:pointer;">✕</button>
            </div>
        `;
    });

    if (cartList) {
        cartList.innerHTML = html || '<p style="text-align:center; color:#888; padding:30px 0;">Tu carrito está vacío</p>';
    }
    if (cartTotal) cartTotal.innerText = total.toFixed(2);
}

// ================= WHATSAPP (sin cambios) =================
function sendWhatsApp() {
    if (cart.length === 0) {
        alert("El carrito está vacío. ¡Añade algunos accesorios para tu moto!");
        return;
    }

    let mensaje = "🏍️ *Nuevo Pedido - Strike Motards* %0A%0A";
    let total = 0;

    cart.forEach(p => {
        mensaje += `• *${p.nombre}* - $${p.precio}%0A`;
        total += parseFloat(p.precio);
    });

    mensaje += `%0A💰 *Total: $${total.toFixed(2)} MXN*%0A%0A¿Me confirman disponibilidad?`;

    const url = `https://wa.me/521XXXXXXXXXX?text=${mensaje}`; // ← Cambia tu número
    window.open(url, "_blank");
}

// Inicializar
document.addEventListener('DOMContentLoaded', () => {
    cargarProductos();
});