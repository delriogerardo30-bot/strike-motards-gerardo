let cart = [];

// DETECCIÓN DE API: Ya configurado para tu backend en Render
const API_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://localhost:3000'
    : 'https://backend-strike-motards.onrender.com'; 

async function cargarProductos() {
    try {
        const res = await fetch(`${API_URL}/productos`);
        const productos = await res.json();

        const contenedor = document.getElementById('lista-productos');
        if (!contenedor) return; 
        contenedor.innerHTML = '';

        productos.forEach(p => {
            const card = document.createElement('div');
            card.className = 'card';
            
            card.innerHTML = `
                <div class="card-image">
                    <img src="${p.imagen_url || 'https://via.placeholder.com/300'}" alt="${p.nombre}">
                </div>
                <div class="card-content">
                    <span class="category-badge">${p.categoria || 'Accesorio'}</span>
                    <h3>${p.nombre}</h3>
                    <p>${p.descripcion}</p>
                    <div class="card-footer">
                        <div class="price-box">
                            <span class="price">$${p.precio}</span>
                            <span class="currency">MXN</span>
                        </div>
                        <button class="btn-add-circle">+</button>
                    </div>
                </div>
            `;

            const btn = card.querySelector('.btn-add-circle');
            btn.onclick = () => addCart(p);

            contenedor.appendChild(card);
        });
    } catch (error) {
        console.error("Error cargando productos:", error);
    }
}

/* ================= CART LOGIC ================= */

function addCart(producto) {
    cart.push(producto);
    renderCart();
    console.log(`Añadido: ${producto.nombre}`);
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
                <div class="item-info">
                    <p class="item-name">${p.nombre}</p>
                    <p class="item-price">$${p.precio}</p>
                </div>
                <button onclick="removeFromCart(${index})" class="btn-remove">✕</button>
            </div>
        `;
    });

    if (cartList) cartList.innerHTML = html || '<p class="empty-msg">Tu carrito está vacío</p>';
    if (cartTotal) cartTotal.innerText = total.toFixed(2);
}

/* ================= WHATSAPP CHECKOUT ================= */

function sendWhatsApp() {
    if (cart.length === 0) {
        alert("El carrito está vacío. ¡Añade algunos accesorios para tu moto!");
        return;
    }

    let mensaje = "🏍️ *Nuevo Pedido - Strike Motards* %0A%0A";
    let total = 0;

    cart.forEach((p, index) => {
        mensaje += `• *${p.nombre}* - $${p.precio}%0A`;
        total += parseFloat(p.precio);
    });

    mensaje += `%0A💰 *Total a pagar: $${total.toFixed(2)} MXN*%0A%0A¿Me confirman la disponibilidad para entrega?`;

    // No olvides poner tu número real aquí después del 521
    const url = `https://wa.me/521XXXXXXXXXX?text=${mensaje}`;
    window.open(url, "_blank");
}

document.addEventListener('DOMContentLoaded', cargarProductos);