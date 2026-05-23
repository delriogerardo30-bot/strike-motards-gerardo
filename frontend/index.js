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

// ==================== FILTROS Y BÚSQUEDA (sin cambios) ====================
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

// ==================== CARRITO MEJORADO (Estilo Figma) ====================
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
            <div class="cart-item">
                <img src="${item.imagen_url}" alt="${item.nombre}" style="width:70px; height:70px; object-fit:cover; border-radius:8px;">
                <div style="flex:1; margin-left:15px;">
                    <p style="margin:0; font-weight:600;">${item.nombre}</p>
                    <p style="margin:4px 0 0; color:#aaa; font-size:0.95rem;">$${parseFloat(item.precio).toLocaleString('es-MX')}</p>
                </div>
                <div class="quantity-controls">
                    <button class="quantity-btn" onclick="changeQuantity(${index}, -1)">–</button>
                    <span style="min-width:30px; text-align:center; font-weight:600;">${qty}</span>
                    <button class="quantity-btn" onclick="changeQuantity(${index}, 1)">+</button>
                </div>
                <button onclick="removeFromCart(${index})" style="background:none; border:none; color:#ff6b6b; font-size:1.6rem; cursor:pointer; margin-left:15px;">×</button>
            </div>
        `;
    });

    list.innerHTML = html || '<p style="text-align:center; color:#777; padding:80px 0;">Tu carrito está vacío</p>';
    
    // Actualizar total en el resumen
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

function clearCart() {
    cart = [];
    renderCart();
    updateCartCount();
    toggleCart();
}

// ==================== CHECKOUT ====================
function showCheckout() {
    if (cart.length === 0) return alert("El carrito está vacío");
    // Aquí puedes mantener o mejorar el modal de datos
    alert("Funcionalidad de checkout en desarrollo. Por ahora usa WhatsApp.");
    // toggleCart();
}

function toggleCart() {
    const modal = document.getElementById('cart-modal');
    modal.style.display = modal.style.display === 'flex' ? 'none' : 'flex';
    if (modal.style.display === 'flex') renderCart();
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