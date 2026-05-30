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

    modal.style.display =
        modal.style.display === "flex"
            ? "none"
            : "flex";

    if (modal.style.display === "flex") {
        renderCart();
    }
}// ==================== CHECKOUT CON VALIDACIÓN ====================

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
                    Enviar por WhatsApp
                </button>

            </div>

        </div>
    `;

    const modal =
        document.createElement("div");

    modal.innerHTML = checkoutHTML;
    modal.id = "checkout-modal";

    document.body.appendChild(modal);

    const telefonoInput =
        document.getElementById("cliente-telefono");

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

        let mensaje = "";

        mensaje += "COMANDA DE PEDIDO - STRIKE MOTARDS\n";
        mensaje += "━━━━━━━━━━━━━━━━━━━━\n\n";

        mensaje += `Pedido: #${resultado.pedido_id}\n`;
        mensaje += `Cliente: ${nombre}\n`;
        mensaje += `Teléfono: ${telefono}\n`;
        mensaje += `Dirección: ${direccion}\n\n`;

        mensaje += "PRODUCTOS:\n";

        let total = 0;

        cart.forEach((p, index) => {

            const qty =
                p.quantity || 1;

            const precio =
                Number(p.precio || 0);

            const subtotal =
                precio * qty;

            mensaje += `\n${index + 1}. ${p.nombre}\n`;
            mensaje += `Cantidad: ${qty}\n`;
            mensaje += `Precio unitario: $${precio.toLocaleString("es-MX")} MXN\n`;
            mensaje += `Subtotal: $${subtotal.toLocaleString("es-MX")} MXN\n`;

            total += subtotal;
        });

        mensaje += "\n━━━━━━━━━━━━━━━━━━━━\n";
        mensaje += `TOTAL: $${total.toLocaleString("es-MX")} MXN\n`;
        mensaje += "━━━━━━━━━━━━━━━━━━━━\n";
        mensaje += "\nEstado: Pendiente de confirmación";

        const url =
            `https://wa.me/527292529554?text=${encodeURIComponent(mensaje)}`;

        window.open(url, "_blank");

        closeCheckout();

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

        showToast("Pedido registrado y enviado por WhatsApp");

    } catch (error) {

        console.error("Error al registrar pedido:", error);

        alert("Ocurrió un error al registrar el pedido. Intenta de nuevo.");
    }
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
});