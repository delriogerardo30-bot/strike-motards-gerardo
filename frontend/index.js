let cart = [];
let allProducts = [];
let productsLoaded = false;

// API del backend.
// Si no carga el backend, el proyecto seguirá funcionando con productos de respaldo.
const API_URL = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1"
    ? "http://localhost:3000"
    : "https://backend-strike-motards.onrender.com";

const fallbackProducts = [
    {
        id: 1,
        nombre: "Casco Integral Strike Pro",
        categoria: "Cascos",
        precio: 2499,
        imagen_url: "https://images.unsplash.com/photo-1558981806-ec527fa84c39?q=80&w=1200&auto=format&fit=crop",
        descripcion: "Casco integral con diseño deportivo para motociclistas."
    },
    {
        id: 2,
        nombre: "Casco Abatible Urban",
        categoria: "Cascos",
        precio: 2199,
        imagen_url: "https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?q=80&w=1200&auto=format&fit=crop",
        descripcion: "Casco abatible cómodo para ciudad y carretera."
    },
    {
        id: 3,
        nombre: "Chamarra Motard Negra",
        categoria: "Ropa",
        precio: 1899,
        imagen_url: "https://images.unsplash.com/photo-1551028719-00167b16eac5?q=80&w=1200&auto=format&fit=crop",
        descripcion: "Chamarra resistente con estilo urbano premium."
    },
    {
        id: 4,
        nombre: "Playera Strike Motards",
        categoria: "Ropa",
        precio: 399,
        imagen_url: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?q=80&w=1200&auto=format&fit=crop",
        descripcion: "Playera casual para amantes de las motocicletas."
    },
    {
        id: 5,
        nombre: "Guantes Racing",
        categoria: "Accesorios",
        precio: 699,
        imagen_url: "https://images.unsplash.com/photo-1611241443322-78fd047e0e8b?q=80&w=1200&auto=format&fit=crop",
        descripcion: "Guantes cómodos con protección para conducción."
    },
    {
        id: 6,
        nombre: "Mochila Impermeable",
        categoria: "Accesorios",
        precio: 899,
        imagen_url: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?q=80&w=1200&auto=format&fit=crop",
        descripcion: "Mochila resistente al agua para rutas largas."
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

// ==================== CARGAR PRODUCTOS ====================

async function cargarProductos() {
    const container = document.getElementById("lista-productos");

    if (!container) return;

    if (productsLoaded) {
        filterProducts();
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

        const data = await res.json();

        if (!Array.isArray(data) || data.length === 0) {
            throw new Error("La respuesta del servidor no contiene productos");
        }

        allProducts = data;
        productsLoaded = true;

        renderFilters();
        filterProducts();
    } catch (error) {
        console.warn("No se pudieron cargar productos del backend. Se usarán productos de respaldo.", error);

        allProducts = fallbackProducts;
        productsLoaded = true;

        renderFilters();
        filterProducts();

        showToast("Catálogo cargado en modo local");
    }
}// ==================== FILTROS Y BÚSQUEDA ====================

function renderFilters() {
    const container = document.getElementById("category-filters");
    const searchInput = document.getElementById("search-input");

    if (!container || !searchInput) return;

    const categoriasBackend = allProducts
        .map(p => p.categoria || "Accesorios")
        .filter(Boolean);

    const ordenBase = ["Todos", "Cascos", "Ropa", "Accesorios"];
    const otrasCategorias = [...new Set(categoriasBackend)]
        .filter(cat => !ordenBase.includes(cat));

    const categories = [...ordenBase, ...otrasCategorias];

    container.innerHTML = categories.map(cat => `
        <div class="category-chip ${cat === "Todos" ? "active" : ""}" data-category="${escapeHTML(cat)}">
            ${escapeHTML(cat)}
        </div>
    `).join("");

    container.querySelectorAll(".category-chip").forEach(chip => {

        chip.addEventListener("click", () => {

            container.querySelectorAll(".category-chip")
                .forEach(c => c.classList.remove("active"));

            chip.classList.add("active");

            filterProducts();
        });

    });

    searchInput.addEventListener("input", filterProducts);
}

function filterProducts() {

    const searchInput = document.getElementById("search-input");

    const activeCategory =
        document.querySelector(".category-chip.active")
        ?.dataset.category || "Todos";

    const searchTerm =
        (searchInput?.value || "")
        .toLowerCase()
        .trim();

    let filtered = [...allProducts];

    // CORRECCIÓN DEL BUG DE "TODOS"
    if (activeCategory !== "Todos") {

        filtered = filtered.filter(p =>
            (p.categoria || "Accesorios") === activeCategory
        );
    }

    if (searchTerm) {

        filtered = filtered.filter(p => {

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

    container.innerHTML = productos.map(p => {

        const id = Number(p.id);

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

        return `
            <div class="card">

                <div class="card-img-wrap">

                    <img
                        src="${imagen}"
                        alt="${nombre}"
                    >

                </div>

                <div class="card-content">

                    <span class="category-badge">
                        ${categoria}
                    </span>

                    <h3>${nombre}</h3>

                    <p>${descripcion}</p>

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
                            onclick="addToCart(${id})"
                        >
                            Agregar
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

    const existing =
        cart.find(item => Number(item.id) === Number(id));

    if (existing) {
        existing.quantity = (existing.quantity || 1) + 1;
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

                    <p style="color:var(--teal); font-size:0.9rem;">
                        Subtotal: $${itemTotal.toLocaleString("es-MX")}
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

    cart[index].quantity =
        (cart[index].quantity || 1) + change;

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
        modal.style.display === "flex" ? "none" : "flex";

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
            >
            <div class="checkout-error" id="error-nombre">
                Ingresa un nombre válido de al menos 3 letras.
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
                placeholder="Dirección de envío: calle, colonia, ciudad y CP *"
            ></textarea>
            <div class="checkout-error" id="error-direccion">
                Ingresa una dirección válida de al menos 10 caracteres.
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

    const modal = document.createElement("div");
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

function confirmOrder() {

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

    if (!/^[A-Za-zÁÉÍÓÚáéíóúÑñ ]{3,}$/.test(nombre)) {
        setCheckoutError("cliente-nombre", "error-nombre");
        valido = false;
    }

    if (!/^\d{10}$/.test(telefono)) {
        setCheckoutError("cliente-telefono", "error-telefono");
        valido = false;
    }

    if (direccion.length < 10) {
        setCheckoutError("cliente-direccion", "error-direccion");
        valido = false;
    }

    if (!valido) return;

    let mensaje =
        "🚀 *Nuevo Pedido - Strike Motards*%0A%0A";

    mensaje +=
        `*Cliente:* ${encodeURIComponent(nombre)}%0A`;

    mensaje +=
        `*Teléfono:* ${encodeURIComponent(telefono)}%0A`;

    mensaje +=
        `*Dirección:* ${encodeURIComponent(direccion)}%0A%0A`;

    let total = 0;

    cart.forEach(p => {

        const qty =
            p.quantity || 1;

        const precio =
            Number(p.precio || 0);

        const subtotal =
            precio * qty;

        mensaje +=
            `• ${qty}x ${encodeURIComponent(p.nombre)} - $${subtotal.toLocaleString("es-MX")} MXN%0A`;

        total += subtotal;
    });

    mensaje +=
        `%0A*Total:* $${total.toLocaleString("es-MX")} MXN`;

    const url =
        `https://wa.me/527292529554?text=${mensaje}`;

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

    showToast("Pedido enviado por WhatsApp");
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

// ==================== INICIALIZACIÓN ====================

document.addEventListener("DOMContentLoaded", () => {
    updateCartCount();
});