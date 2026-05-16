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
        const contenedor = document.getElementById('lista-productos');
        if (contenedor) {
            contenedor.innerHTML = `<p class="loading-msg">Error al cargar los productos. Inténtalo más tarde.</p>`;
        }
    }
}

function renderFilters() {
    const categories = ['Todos', ...new Set(allProducts.map(p => p.categoria))];
    const container = document.getElementById('category-filters');
    if (!container) return;
    
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
            p.descripcion.toLowerCase().includes(searchTerm)
        );
    }
    renderProducts(filtered);
}

function renderProducts(productos) {
    const contenedor = document.getElementById('lista-productos');
    if (!contenedor) return;

    if (productos.length === 0) {
        contenedor.innerHTML = `<p class="no-results">No se encontraron productos 😔</p>`;
        return;
    }

    contenedor.innerHTML = productos.map(p => `
        <div class="card">
            <div style="position: relative;">
                <img src="${p.imagen_url || 'https://via.placeholder.com/300'}" alt="${p.nombre}">
                <span class="category-badge" style="position: absolute; top: 15px; left: 15px;">
                    ${p.categoria || 'Accesorio'}
                </span>
            </div>
            <div class="card-content">
                <h3 style="margin: 0 0 10px 0;">${p.nombre}</h3>
                <p style="height: 40px; overflow: hidden;">${p.descripcion}</p>
                <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 20px;">
                    <div class="price-box">
                        <span class="price">$${parseFloat(p.precio).toLocaleString('es-MX')}</span>
                        <span style="font-size: 0.8rem; font-weight: 600; color: #aaa;">MXN</span>
                    </div>
                    <button class="btn-add-circle" onclick="addCartFromId(${p.id})">+</button>
                </div>
            </div>
        </div>
    `).join('');
}

function addCartFromId(id) {
    const product = allProducts.find(p => p.id === id);
    if (product) addCart(product);
}

function addCart(producto) {
    cart.push(producto);
    renderCart();
    const toast = document.createElement('div');
    toast.textContent = `✅ ${producto.nombre} añadido`;
    toast.style.cssText = 'position:fixed; bottom:20px; left:50%; transform:translateX(-50%); background:var(--accent); color:white; padding:12px 20px; border-radius:8px; z-index:3000;';
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 2000);
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
            <div style="display: flex; justify-content: space-between; margin-bottom: 15px; background: rgba(255,255,255,0.05); padding: 10px; border-radius: 10px;">
                <div>
                    <p style="margin:0; font-weight:600;">${p.nombre}</p>
                    <p style="margin:4px 0 0; color: var(--accent);">$${parseFloat(p.precio).toFixed(2)}</p>
                </div>
                <button onclick="removeFromCart(${index})" style="background:none; border:none; color:#ff6b6b; cursor:pointer;">✕</button>
            </div>`;
    });

    if (cartList) cartList.innerHTML = html || '<p style="text-align:center; color:#888;">Tu carrito está vacío</p>';
    if (cartTotal) cartTotal.innerText = total.toFixed(2);
}

function removeFromCart(index) {
    cart.splice(index, 1);
    renderCart();
}

function sendWhatsApp() {
    if (cart.length === 0) return alert("El carrito está vacío");
    let mensaje = "🏍️ *Nuevo Pedido - Strike Motards* %0A%0A";
    let total = 0;
    cart.forEach(p => {
        mensaje += `• *${p.nombre}* - $${p.precio}%0A`;
        total += parseFloat(p.precio);
    });
    mensaje += `%0A💰 *Total: $${total.toFixed(2)} MXN*`;
    window.open(`https://wa.me/521XXXXXXXXXX?text=${mensaje}`, "_blank");
}

document.addEventListener('DOMContentLoaded', cargarProductos);