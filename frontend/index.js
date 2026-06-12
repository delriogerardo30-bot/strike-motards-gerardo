let cart = [];
let allProducts = [];
let productsLoaded = false;

// API backend
const API_URL = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1"
    ? "http://localhost:3000"
    : "https://backend-strike-motards.onrender.com";

const fallbackProducts = [
    {
        id: 1,
        nombre: "Casco Integral Strike Pro",
        categoria: "Cascos",
        precio: 2499,
        stock: 8,
        imagen_url: "https://images.unsplash.com/photo-1558981806-ec527fa84c39?q=80&w=1200&auto=format&fit=crop",
        descripcion: "Casco integral con diseño deportivo para motociclistas."
    },
    {
        id: 2,
        nombre: "Casco Abatible Urban",
        categoria: "Cascos",
        precio: 2199,
        stock: 10,
        imagen_url: "https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?q=80&w=1200&auto=format&fit=crop",
        descripcion: "Casco abatible cómodo para ciudad y carretera."
    },
    {
        id: 3,
        nombre: "Chamarra Motard Negra",
        categoria: "Ropa",
        precio: 1899,
        stock: 7,
        imagen_url: "https://images.unsplash.com/photo-1551028719-00167b16eac5?q=80&w=1200&auto=format&fit=crop",
        descripcion: "Chamarra resistente con estilo urbano premium."
    }
];

function escapeHTML(texto) {
    return String(texto ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

function getImage(producto) {
    return producto.imagen_url || producto.imagen || "https://via.placeholder.com/600x400?text=Strike+Motards";
}

function getStock(producto) {
    return Number(producto.stock || 0);
}

// ==================== CARGAR PRODUCTOS ====================

async function cargarProductos() {

    const container =
        document.getElementById("lista-productos");

    if (!container) return;

    if (productsLoaded) {
        filterProducts();
        return;
    }

    try {

        container.innerHTML = `
            <p style="
                text-align:center;
                padding:60px;
                color:#aaa;
                grid-column:1/-1;
            ">
                Cargando productos...
            </p>
        `;

        const res =
            await fetch(`${API_URL}/productos`);

        if (!res.ok) {
            throw new Error("No se pudo conectar con el servidor");
        }

        const data =
            await res.json();

        if (!Array.isArray(data) || data.length === 0) {
            throw new Error("No hay productos");
        }

        allProducts = data;
        productsLoaded = true;

        renderFilters();
        filterProducts();

    } catch (error) {

        console.warn("Modo local activado", error);

        allProducts = fallbackProducts;
        productsLoaded = true;

        renderFilters();
        filterProducts();

        showToast("Catálogo cargado en modo local");
    }
}// ==================== FILTROS Y BÚSQUEDA ====================

function normalizarCategoria(texto) {
    return (texto || "")
        .toString()
        .trim()
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");
}

function renderFilters() {

    const container =
        document.getElementById("category-filters");

    const searchInput =
        document.getElementById("search-input");

    if (!container || !searchInput) return;

    const ordenBase =
        ["Todos", "Cascos", "Ropa", "Accesorios", "Calzado", "Tecnología"];

    container.innerHTML =
        ordenBase.map(cat => `
            <div
                class="category-chip ${cat === "Todos" ? "active" : ""}"
                data-category="${escapeHTML(cat)}"
            >
                ${escapeHTML(cat)}
            </div>
        `).join("");

    container
        .querySelectorAll(".category-chip")
        .forEach(chip => {

            chip.addEventListener("click", () => {

                container
                    .querySelectorAll(".category-chip")
                    .forEach(c => c.classList.remove("active"));

                chip.classList.add("active");

                filterProducts();
            });

        });

    searchInput.oninput = filterProducts;
}

function filterProducts() {

    const searchInput =
        document.getElementById("search-input");

    const activeCategory =
        document.querySelector(".category-chip.active")
            ?.dataset.category || "Todos";

    const searchTerm =
        (searchInput?.value || "")
            .toLowerCase()
            .trim();

    let filtered =
        [...allProducts];

    if (activeCategory !== "Todos") {

        filtered =
            filtered.filter(p =>
                normalizarCategoria(p.categoria) ===
                normalizarCategoria(activeCategory)
            );
    }

    if (searchTerm) {

        filtered =
            filtered.filter(p => {

                const nombre =
                    (p.nombre || "").toLowerCase();

                const descripcion =
                    (p.descripcion || "").toLowerCase();

                const categoria =
                    (p.categoria || "").toLowerCase();

                return (
                    nombre.includes(searchTerm) ||
                    descripcion.includes(searchTerm) ||
                    categoria.includes(searchTerm)
                );
            });
    }

    renderProducts(filtered);
}

// ==================== RENDER PRODUCTOS ====================

function renderProducts(productos) {

    const container =
        document.getElementById("lista-productos");

    if (!container) return;

    if (!productos.length) {

        container.innerHTML = `
            <p style="
                text-align:center;
                padding:60px;
                color:#aaa;
                grid-column:1/-1;
            ">
                No se encontraron productos.
            </p>
        `;

        return;
    }

    container.innerHTML =
        productos.map(p => {

            const id =
                Number(p.id);

            const nombre =
                escapeHTML(p.nombre || "Producto");

            const categoria =
                escapeHTML(p.categoria || "Accesorios");

            const descripcion =
                escapeHTML(
                    p.descripcion ||
                    "Producto premium para motociclistas."
                );

            const precio =
                Number(p.precio || 0);

            const imagen =
                escapeHTML(getImage(p));

            const stock =
                getStock(p);

            const agotado =
                stock <= 0;

            return `
                <div class="card" onclick="abrirModalProducto(${p.id})">

                    <div class="card-img-wrap">
                        <img src="${imagen}" alt="${nombre}">
                    </div>

                    <div class="card-content">

                        <span class="category-badge">
                            ${categoria}
                        </span>

                        <h3>${nombre}</h3>

                        <p>${descripcion}</p>

                        <div style="
                            margin-top:12px;
                            font-size:0.92rem;
                            font-weight:700;
                            color:${agotado 
                                ? '#ff5b5b'
                                 : stock <= 5
                                  ? '#ff3b3b'
                                   : stock <= 10
                                    ? '#ffb703'
                                      : '#00d084'};
                        ">
                            ${agotado
                                 ? '❌ Agotado'
                                  : stock <= 5
                                   ? `🔴 Últimas piezas: ${stock}`
                                    : stock <= 10
                                    ? `🟡 Pocas piezas: ${stock}`
                                    : `🟢 Stock disponible: ${stock}`
                            }
                        </div>

                        <div style="
                            display:flex;
                            justify-content:space-between;
                            align-items:center;
                            margin-top:18px;
                            gap:12px;
                        ">

                            <span class="price">
                                $${precio.toLocaleString("es-MX")}
                            </span>

                            <button
                                class="btn-add"
                               onclick="event.stopPropagation(); addToCart(${id})"
                                ${agotado ? "disabled" : ""}
                                style="
                                    ${agotado
                                        ? "opacity:0.5; cursor:not-allowed; background:#555;"
                                        : ""
                                    }
                                "
                            >
                                ${agotado ? "Agotado" : "Agregar"}
                            </button>

                        </div>

                    </div>

                </div>
            `;
        }).join("");
}// ==================== CARRITO ====================

function addToCart(id) {

    const product =
        allProducts.find(p => Number(p.id) === Number(id));

    if (!product) return;

    const stock =
        getStock(product);

    const existing =
        cart.find(item => Number(item.id) === Number(id));

    const cantidadActual =
        existing ? existing.quantity || 1 : 0;

    if (cantidadActual >= stock) {

        showToast(`⚠️ Solo quedan ${stock} unidades disponibles`);
        return;
    }

    if (existing) {

        existing.quantity =
            (existing.quantity || 1) + 1;

    } else {

        cart.push({
            ...product,
            quantity: 1
        });
    }

    updateCartCount();
    renderCart();

    showToast(`${product.nombre} añadido al carrito`);
}

function updateCartCount() {

    const count =
        cart.reduce((sum, item) => {
            return sum + (item.quantity || 1);
        }, 0);

    const countElement =
        document.getElementById("cart-count");

    if (countElement) {
        countElement.textContent = count;
    }
}

function renderCart() {

    const list =
        document.getElementById("cart-list");

    const subtotalElement =
        document.getElementById("subtotal");

    const totalElement =
        document.getElementById("cart-total");

    if (!list || !subtotalElement || !totalElement) return;

    let html = "";
    let total = 0;

    cart.forEach((item, index) => {

        const qty =
            item.quantity || 1;

        const precio =
            Number(item.precio || 0);

        const stock =
            getStock(item);

        const itemTotal =
            precio * qty;

        total += itemTotal;

        html += `
            <div class="cart-item">

                <img
                    src="${escapeHTML(getImage(item))}"
                    alt="${escapeHTML(item.nombre)}"
                >

                <div style="flex:1">

                    <p style="font-weight:800;">
                        ${escapeHTML(item.nombre)}
                    </p>

                    <p style="color:#aaa;">
                        $${precio.toLocaleString("es-MX")} MXN
                    </p>

                    <p style="color:#00d084; font-size:0.9rem;">
                        📦 Stock: ${stock}
                    </p>

                    <p style="color:var(--teal); font-size:0.9rem;">
                        Subtotal:
                        $${itemTotal.toLocaleString("es-MX")}
                    </p>

                </div>

                <div style="
                    display:flex;
                    align-items:center;
                    gap:8px;
                ">

                    <button
                        class="qty-btn"
                        onclick="changeQuantity(${index}, -1)"
                    >
                        –
                    </button>

                    <span style="
                        min-width:24px;
                        text-align:center;
                        font-weight:800;
                    ">
                        ${qty}
                    </span>

                    <button
                        class="qty-btn"
                        onclick="changeQuantity(${index}, 1)"
                    >
                        +
                    </button>

                </div>

                <button
                    class="remove-btn"
                    onclick="removeFromCart(${index})"
                >
                    ×
                </button>

            </div>
        `;
    });

    list.innerHTML = html || `
        <p style="
            text-align:center;
            color:#777;
            padding:80px 0;
        ">
            Tu carrito está vacío
        </p>
    `;

    subtotalElement.textContent =
        `$${total.toLocaleString("es-MX")}`;

    totalElement.textContent =
        `$${total.toLocaleString("es-MX")}`;
}

function changeQuantity(index, change) {

    if (!cart[index]) return;

    const stock =
        getStock(cart[index]);

    const nuevaCantidad =
        (cart[index].quantity || 1) + change;

    if (nuevaCantidad > stock) {

        showToast(`⚠️ Stock máximo: ${stock}`);
        return;
    }

    cart[index].quantity = nuevaCantidad;

    if (cart[index].quantity < 1) {
        cart.splice(index, 1);
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

    const modal =
        document.getElementById("cart-modal");

    if (!modal) return;

    const estaAbierto =
        modal.style.display === "flex";

    // Si el carrito ya está abierto, dejar cerrarlo aunque esté vacío
    if (estaAbierto) {
        modal.style.display = "none";
        return;
    }

    // Si está cerrado y no hay productos, no abrirlo
    if (cart.length === 0) {
        showToast("Tu carrito está vacío. Agrega al menos un producto.");
        return;
    }

    modal.style.display = "flex";
    renderCart();
}

// ==================== CHECKOUT CON VALIDACIÓN ====================

function showCheckout() {

    if (cart.length === 0) {
        alert("El carrito está vacío");
        return;
    }

    if (document.getElementById("checkout-modal")) return;

    const total = cart.reduce((sum, item) => {
        return sum + Number(item.precio || 0) * (item.quantity || 1);
    }, 0);

    const checkoutHTML = `
        <div class="checkout-card">

            <h2>Completa tu Pedido</h2>

            <input
                type="text"
                id="cliente-nombre"
                placeholder="Nombre completo *"
                maxlength="50"
            >
            <div class="checkout-error" id="error-nombre">
                Ingresa un nombre válido entre 3 y 50 caracteres.
            </div>

            <input
                type="tel"
                id="cliente-telefono"
                placeholder="Teléfono / WhatsApp *"
                maxlength="10"
            >
            <div class="checkout-error" id="error-telefono">
                El teléfono debe tener exactamente 10 dígitos.
            </div>

            <textarea
                id="cliente-direccion"
                rows="4"
                maxlength="120"
                placeholder="Dirección de envío: calle, colonia, ciudad y CP *"
            ></textarea>
            <div class="checkout-error" id="error-direccion">
                La dirección debe tener entre 10 y 120 caracteres.
            </div>

            <div class="checkout-total">
                <p>
                    <strong>
                        Total: $${total.toLocaleString("es-MX")} MXN
                    </strong>
                </p>
            </div>

            <div class="checkout-actions">

                <button
                    onclick="closeCheckout()"
                    class="btn-cancel"
                >
                    Cancelar
                </button>

                <button
                    onclick="confirmOrder()"
                    class="btn-whatsapp"
                >
                    Confirmar pedido
                </button>

            </div>

        </div>
    `;

    const modal =
        document.createElement("div");

    modal.innerHTML = checkoutHTML;
    modal.id = "checkout-modal";

    document.body.appendChild(modal);

    const nombreInput =
    document.getElementById("cliente-nombre");

const telefonoInput =
    document.getElementById("cliente-telefono");

if (usuarioActual) {
    nombreInput.value = usuarioActual.nombre || "";
    telefonoInput.value = usuarioActual.telefono || "";
}

telefonoInput.addEventListener("input", function () {
    this.value = this.value.replace(/[^0-9]/g, "");
});
}

function closeCheckout() {

    const modal =
        document.getElementById("checkout-modal");

    if (modal) {
        modal.remove();
    }
}

function clearCheckoutErrors() {

    document.querySelectorAll(".checkout-error")
        .forEach(error => {
            error.classList.remove("show");
        });

    document.querySelectorAll(
        "#checkout-modal input, #checkout-modal textarea"
    ).forEach(input => {
        input.classList.remove("input-error");
    });
}

function setCheckoutError(inputId, errorId) {

    document.getElementById(inputId)
        ?.classList.add("input-error");

    document.getElementById(errorId)
        ?.classList.add("show");
}

async function confirmOrder() {

    const nombreInput =
        document.getElementById("cliente-nombre");

    const telefonoInput =
        document.getElementById("cliente-telefono");

    const direccionInput =
        document.getElementById("cliente-direccion");

    const nombre =
        nombreInput.value.trim();

    const telefono =
        telefonoInput.value.trim();

    const direccion =
        direccionInput.value.trim();

    clearCheckoutErrors();

    let valido = true;

    if (!/^[A-Za-zÁÉÍÓÚáéíóúÑñ ]{3,50}$/.test(nombre)) {
        setCheckoutError("cliente-nombre", "error-nombre");
        valido = false;
    }

    if (!/^\d{10}$/.test(telefono)) {
        setCheckoutError("cliente-telefono", "error-telefono");
        valido = false;
    }

    if (direccion.length < 10 || direccion.length > 120) {
        setCheckoutError("cliente-direccion", "error-direccion");
        valido = false;
    }

    if (!valido) return;

    try {

        const productosPedido =
            cart.map(item => ({
                id: item.id,
                nombre: item.nombre,
                precio: Number(item.precio || 0),
                cantidad: item.quantity || 1,
                subtotal: Number(item.precio || 0) * (item.quantity || 1)
            }));

        const respuesta =
            await fetch(`${API_URL}/pedidos`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
    nombre,
    telefono,
    direccion,
    usuario_id: usuarioActual ? usuarioActual.id : null,
    productos: cart.map(item => ({
        id: item.id,
        cantidad: item.quantity || 1
    }))
})
            });

        const resultado =
            await respuesta.json();

        if (!respuesta.ok) {
            alert(resultado.error || "No se pudo registrar el pedido");
            return;
        }

        const total =
            productosPedido.reduce((sum, item) => {
                return sum + item.subtotal;
            }, 0);

        closeCheckout();

        const pedidoGenerado = {
            id: resultado.pedido_id,
            nombre,
            telefono,
            direccion,
            productos: productosPedido,
            total,
            fecha: new Date().toLocaleString("es-MX")
        };

        cart = [];

        updateCartCount();
        renderCart();

        const cartModal =
            document.getElementById("cart-modal");

        if (cartModal) {
            cartModal.style.display = "none";
        }

        productsLoaded = false;
        await cargarProductos();

        mostrarTicketPedido(pedidoGenerado);

        showToast("Pedido registrado correctamente");

    } catch (error) {

        console.error("Error al registrar pedido:", error);

        alert("Ocurrió un error al registrar el pedido. Intenta de nuevo.");
    }
}
/* ====================
   TICKET VISUAL
==================== */

function mostrarTicketPedido(pedido) {

    const ticketExistente =
        document.getElementById("ticket-modal");

    if (ticketExistente) {
        ticketExistente.remove();
    }

    const productosHTML =
        pedido.productos.map((item, index) => {
            return `
                <div class="ticket-product-row">

                    <div>
                        <strong>${index + 1}. ${escapeHTML(item.nombre)}</strong>
                        <small>
                            Cantidad: ${item.cantidad} × $${item.precio.toLocaleString("es-MX")} MXN
                        </small>
                    </div>

                    <span>
                        $${item.subtotal.toLocaleString("es-MX")} MXN
                    </span>

                </div>
            `;
        }).join("");

    const ticketHTML = `
        <div id="ticket-modal">

            <div class="ticket-card">

                <button class="ticket-close" onclick="cerrarTicketPedido()">
                    ×
                </button>

                <div class="ticket-header">

                    <div class="ticket-logo-box">
                        <img src="assets/logo.png" alt="Strike Motards">
                    </div>

                    <h2>STRIKE MOTARDS</h2>
                    <p>Ticket de compra</p>

                </div>

                <div class="ticket-info-grid">

                    <div>
                        <span>Folio</span>
                        <strong>#${pedido.id}</strong>
                    </div>

                    <div>
                        <span>Fecha</span>
                        <strong>${pedido.fecha}</strong>
                    </div>

                    <div>
                        <span>Cliente</span>
                        <strong>${escapeHTML(pedido.nombre)}</strong>
                    </div>

                    <div>
                        <span>Teléfono</span>
                        <strong>${escapeHTML(pedido.telefono)}</strong>
                    </div>

                </div>

                <div class="ticket-address">
                    <span>Dirección de envío</span>
                    <p>${escapeHTML(pedido.direccion)}</p>
                </div>

                <div class="ticket-products">

                    <h3>Productos</h3>

                    ${productosHTML}

                </div>

                <div class="ticket-total">
                    <span>Total</span>
                    <strong>$${pedido.total.toLocaleString("es-MX")} MXN</strong>
                </div>

                <div class="ticket-actions">

                    <button onclick="descargarTicketPDF(${pedido.id})">
                        Descargar ticket PDF
                    </button>

                    <button onclick="contactarVendedorWhatsApp(${pedido.id})">
                        Contactar vendedor por WhatsApp
                    </button>

                </div>

                <p class="ticket-footer-text">
                    Gracias por comprar en Strike Motards. Tu pedido quedó registrado correctamente.
                </p>

            </div>

        </div>
    `;

    document.body.insertAdjacentHTML("beforeend", ticketHTML);
}

function cerrarTicketPedido() {

    const modal =
        document.getElementById("ticket-modal");

    if (modal) {
        modal.remove();
    }
}

function descargarTicketPDF(pedidoId) {

    const ticketUrl =
        `${API_URL}/pedidos/${pedidoId}/ticket`;

    const link =
        document.createElement("a");

    link.href = ticketUrl;
    link.download =
        `ticket-strike-motards-${pedidoId}.pdf`;

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

function contactarVendedorWhatsApp(pedidoId) {

    const ticketLink =
        `${API_URL}/pedidos/${pedidoId}/ticket`;

    const mensaje =
        `Hola, acabo de realizar un pedido en Strike Motards.\n\n` +
        `Pedido: #${pedidoId}\n` +
        `Ticket PDF: ${ticketLink}\n\n` +
        `Quisiera confirmar mi compra con un vendedor.`;

    const whatsappUrl =
        `https://wa.me/527292529554?text=${encodeURIComponent(mensaje)}`;

    window.open(whatsappUrl, "_blank");
}

// ==================== TOAST ====================

function showToast(message) {

    const oldToast =
        document.querySelector(".toast");

    if (oldToast) {
        oldToast.remove();
    }

    const toast =
        document.createElement("div");

    toast.className = "toast";
    toast.textContent = message;

    document.body.appendChild(toast);

    setTimeout(() => {
        toast.remove();
    }, 1800);
}

// ==================== SECCIONES ====================

function mostrarSeccion(id) {

    const section =
        document.getElementById(id);

    if (!section) return;

    document.querySelectorAll(".seccion")
        .forEach(sec => sec.classList.remove("active"));

    section.classList.add("active");
    document.querySelectorAll(".home-only")
    .forEach(sec => {
        sec.style.display = id === "inicio" ? "block" : "none";
    });

    if (id === "tienda") {

        cargarProductos();

        setTimeout(() => {
            section.scrollIntoView({
                behavior: "smooth",
                block: "start"
            });
        }, 100);

    } else {

        window.scrollTo({
            top: 0,
            behavior: "smooth"
        });
    }
}
function irCategoriaDestacada(categoria) {

    mostrarSeccion("tienda");

    setTimeout(() => {

        const chips =
            document.querySelectorAll(".category-chip");

        chips.forEach(chip => {

            if (
                chip.dataset.category &&
                normalizarCategoria(chip.dataset.category) === normalizarCategoria(categoria)
            ) {
                chip.click();
            }

        });

    }, 400);
}
function abrirModalProducto(id){

    const producto = allProducts.find(p => p.id === id);

    if(!producto){
        console.log("Producto no encontrado");
        return;
    }

    document.getElementById("modalProducto").style.display = "flex";
    document.getElementById("modalImagen").src = producto.imagen_url;
    document.getElementById("modalCategoria").textContent = producto.categoria;
    document.getElementById("modalNombre").textContent = producto.nombre;
    document.getElementById("modalDescripcion").textContent = producto.descripcion;

    document.getElementById("modalPrecio").textContent =
        `$${Number(producto.precio).toLocaleString("es-MX")}`;

    document.getElementById("modalStock").textContent =
        `Stock disponible: ${producto.stock}`;

    document.getElementById("modalAgregarBtn").onclick = (e) => {
        e.stopPropagation();
        addToCart(producto.id);
          cerrarModalProducto();
    };
}

function cerrarModalProducto(){
    document.getElementById("modalProducto").style.display = "none";
}
// ==================== INICIALIZACIÓN ====================

document.addEventListener("DOMContentLoaded", () => {

    updateCartCount();

    cargarUsuarioGuardado();

    setTimeout(() => {

        if (!usuarioActual) {

            openUserModal();

        }

    }, 700);

});
/* =========================
   LOGIN / REGISTRO
========================= */

let authMode = "login";
let usuarioActual = null;

function openUserModal() {

   if (usuarioActual) {

    document.getElementById('perfil-nombre').textContent =
        usuarioActual.nombre || '';

    document.getElementById('perfil-correo').textContent =
        usuarioActual.correo || '';

    document.getElementById('perfil-telefono').textContent =
        usuarioActual.telefono || '';

    document.getElementById('profile-modal').style.display =
    'flex';

cargarPedidosPerfil();

return;
}
    const modal =
        document.getElementById("user-modal");

    if (modal) {
        modal.style.display = "flex";
    }
}

function closeUserModal() {

    const modal =
        document.getElementById("user-modal");

    if (modal) {
        modal.style.display = "none";
    }
}
function closeProfileModal(){

    const modal =
        document.getElementById('profile-modal');

    if(modal){
        modal.style.display = 'none';
    }

}
async function cargarPedidosPerfil(){

    const contenedor =
        document.getElementById('perfil-pedidos');

    if(!contenedor || !usuarioActual){
        return;
    }

    contenedor.innerHTML =
        '<p style="color:#a7b4bb;">Cargando pedidos...</p>';

    try{

        const respuesta =
            await fetch(`${API_URL}/usuarios/${usuarioActual.id}/pedidos`);

        const pedidos =
            await respuesta.json();

        if(!respuesta.ok){
            contenedor.innerHTML =
                '<p style="color:#ff9a9a;">No se pudieron cargar tus pedidos.</p>';
            return;
        }

        if(!pedidos.length){
            contenedor.innerHTML =
                '<p style="color:#a7b4bb;">Aún no tienes pedidos registrados.</p>';
            return;
        }

        contenedor.innerHTML =
            pedidos.map(pedido => `
                <div style="
                    padding:14px;
                    border-radius:14px;
                    background:rgba(255,255,255,0.07);
                    margin-bottom:12px;
                    border:1px solid rgba(255,255,255,0.10);
                ">
                    <strong>Pedido #${pedido.id}</strong><br>
                    Estado: ${pedido.estado}<br>
                    Total: $${Number(pedido.total).toLocaleString('es-MX')} MXN<br>
                    Fecha: ${new Date(pedido.fecha).toLocaleString('es-MX')}

                    <br><br>

                    <button
                        onclick="descargarTicketPDF(${pedido.id})"
                        style="
                            padding:10px 14px;
                            border:none;
                            border-radius:10px;
                            background:#18c3ff;
                            color:white;
                            font-weight:800;
                            cursor:pointer;
                        "
                    >
                        📄 Descargar ticket
                    </button>
                </div>
            `).join('');

    }catch(error){

        console.error('Error cargando pedidos perfil:', error);

        contenedor.innerHTML =
            '<p style="color:#ff9a9a;">Error al cargar pedidos.</p>';
    }
}

function logoutUsuarioDesdePerfil(){

    closeProfileModal();

    logoutUsuario();

}

function toggleAuthMode() {

    authMode =
        authMode === "login"
            ? "register"
            : "login";

    const title =
        document.getElementById("auth-title");

    const subtitle =
        document.getElementById("auth-subtitle");

    const registerFields =
        document.getElementById("register-fields");

    const toggleText =
        document.getElementById("auth-toggle-text");

    if (authMode === "register") {

        title.textContent =
            "Crear cuenta";

        subtitle.textContent =
            "Regístrate para guardar tus datos y comprar más rápido.";

        registerFields.style.display =
            "block";

        toggleText.textContent =
            "¿Ya tienes cuenta? Inicia sesión";

    } else {

        title.textContent =
            "Iniciar sesión";

        subtitle.textContent =
            "Ingresa con tu correo y contraseña.";

        registerFields.style.display =
            "none";

        toggleText.textContent =
            "¿No tienes cuenta? Regístrate";
    }
}
function actualizarBotonUsuario() {

    const userBtn =
        document.getElementById("user-btn");

    if (!userBtn) return;

    if (usuarioActual) {
        userBtn.textContent =
            `👤 ${usuarioActual.nombre.split(" ")[0]}`;
    } else {
        userBtn.textContent =
            "👤 Iniciar sesión";
    }
}

function cargarUsuarioGuardado() {

    const usuarioGuardado =
        localStorage.getItem("strikeUser");

    if (!usuarioGuardado) return;

    try {
        usuarioActual =
            JSON.parse(usuarioGuardado);

        actualizarBotonUsuario();

    } catch (error) {
        localStorage.removeItem("strikeUser");
    }
}

function logoutUsuario() {

    usuarioActual = null;

    localStorage.removeItem("strikeUser");

    actualizarBotonUsuario();

    showToast("Sesión cerrada correctamente");
}
async function submitAuthForm() {

    const correo =
        document.getElementById("auth-correo").value.trim();

    const password =
        document.getElementById("auth-password").value.trim();

    const nombre =
        document.getElementById("auth-nombre")?.value.trim();

    const telefono =
        document.getElementById("auth-telefono")?.value.trim();

    if (!correo || !password) {
        alert("Correo y contraseña son obligatorios");
        return;
    }

    if (authMode === "register") {

        if (!nombre || !telefono) {
            alert("Nombre y teléfono son obligatorios");
            return;
        }

        if (!/^[A-Za-zÁÉÍÓÚáéíóúÑñ ]{3,50}$/.test(nombre)) {
            alert("Ingresa un nombre válido");
            return;
        }

        if (!/^\d{10}$/.test(telefono)) {
            alert("El teléfono debe tener 10 dígitos");
            return;
        }
    }

    try {

        const endpoint =
            authMode === "login"
                ? "/usuarios/login"
                : "/usuarios/registro";

        const body =
            authMode === "login"
                ? { correo, password }
                : { nombre, telefono, correo, password };

        const respuesta =
            await fetch(`${API_URL}${endpoint}`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(body)
            });

        const data =
            await respuesta.json();

        if (!respuesta.ok) {
            alert(data.error || "Error al procesar la solicitud");
            return;
        }

        usuarioActual =
            data.usuario;

        localStorage.setItem(
            "strikeUser",
            JSON.stringify(usuarioActual)
        );

        actualizarBotonUsuario();

        closeUserModal();

        showToast(
            authMode === "login"
                ? "Sesión iniciada correctamente"
                : "Cuenta creada correctamente"
        );

    } catch (error) {

        console.error("Error de usuario:", error);

        alert("Error al conectar con el servidor");
    }
}