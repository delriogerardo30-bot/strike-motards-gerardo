require('dotenv').config();

const express = require('express');
const cors = require('cors');
const { Sequelize, DataTypes } = require('sequelize');
const PDFDocument = require('pdfkit');
const QRCode = require('qrcode');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');
const cloudinary = require('cloudinary').v2;
const multer = require('multer');
const crypto = require('crypto');

const app = express();

app.use(cors());
app.use(express.json());
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const upload = multer({
  storage: multer.memoryStorage()
});
const adminSessions = new Set();

function verificarAdmin(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      error: 'Acceso no autorizado'
    });
  }

  const token = authHeader.split(' ')[1];

  if (!adminSessions.has(token)) {
    return res.status(403).json({
      error: 'Sesión admin inválida'
    });
  }

  next();
}

/* =========================
   CONEXIÓN A POSTGRES
========================= */
const sequelize = new Sequelize(
  process.env.DATABASE_URL || 'postgres://postgres:12345@localhost:5432/strike_motors_db',
  {
    dialect: 'postgres',
    logging: false,
    dialectOptions: process.env.DATABASE_URL
      ? {
          ssl: {
            require: true,
            rejectUnauthorized: false
          }
        }
      : {}
  }
);

/* =========================
   MODELO PRODUCTOS
========================= */
const Producto = sequelize.define('Producto', {
  nombre: {
    type: DataTypes.STRING,
    allowNull: false
  },
  descripcion: {
    type: DataTypes.TEXT
  },
  precio: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  imagen_url: {
    type: DataTypes.TEXT,
    defaultValue: 'https://via.placeholder.com/300'
  },
  categoria: {
    type: DataTypes.STRING,
    defaultValue: 'Accesorios'
  },
  stock: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0
  }
}, {
  tableName: 'productos',
  timestamps: false
});

/* =========================
   MODELO PEDIDOS
========================= */
const Pedido = sequelize.define('Pedido', {
  nombre_cliente: {
    type: DataTypes.STRING,
    allowNull: false
  },
  telefono: {
    type: DataTypes.STRING,
    allowNull: false
  },
  direccion: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  total: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  estado: {
    type: DataTypes.STRING,
    defaultValue: 'Pendiente'
  },
  fecha: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'pedidos',
  timestamps: false
});/* =========================
   MODELO DETALLE PEDIDOS
========================= */
const DetallePedido = sequelize.define('DetallePedido', {
  pedido_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  producto_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  nombre_producto: {
    type: DataTypes.STRING,
    allowNull: false
  },
  cantidad: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  precio_unitario: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  subtotal: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  }
}, {
  tableName: 'detalle_pedidos',
  timestamps: false
});
/* =========================
   MODELO USUARIOS
========================= */
const Usuario = sequelize.define('Usuario', {
  nombre: {
    type: DataTypes.STRING,
    allowNull: false
  },
  telefono: {
    type: DataTypes.STRING,
    allowNull: false
  },
  correo: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  password: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  fecha_registro: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'usuarios',
  timestamps: false
});

/* =========================
   RELACIONES
========================= */
Pedido.hasMany(DetallePedido, {
  foreignKey: 'pedido_id',
  as: 'detalles'
});

DetallePedido.belongsTo(Pedido, {
  foreignKey: 'pedido_id'
});

Producto.hasMany(DetallePedido, {
  foreignKey: 'producto_id'
});

DetallePedido.belongsTo(Producto, {
  foreignKey: 'producto_id'
});

/* =========================
   SINCRONIZACIÓN
========================= */
sequelize.sync({ alter: true })
  .then(() => console.log('✅ PostgreSQL conectado y tablas sincronizadas'))
  .catch(err => console.error('❌ Error de conexión:', err));

/* =========================
   API PRODUCTOS
========================= */
app.get('/productos', async (req, res) => {
  try {
    const productos = await Producto.findAll({
      order: [['id', 'ASC']]
    });

    res.json(productos);
  } catch (err) {
    console.error('Error al obtener productos:', err);
    res.status(500).json({ error: 'Error en el servidor' });
  }
});

/* =========================
   API CREAR PEDIDO
========================= */
app.post('/pedidos', async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const { nombre, telefono, direccion, productos } = req.body;

    if (!nombre || !telefono || !direccion) {
      await transaction.rollback();
      return res.status(400).json({
        error: 'Faltan datos del cliente'
      });
    }

    if (!Array.isArray(productos) || productos.length === 0) {
      await transaction.rollback();
      return res.status(400).json({
        error: 'El pedido no tiene productos'
      });
    }

    let total = 0;
    const detalles = [];

    for (const item of productos) {
      const producto = await Producto.findByPk(item.id, { transaction });

      if (!producto) {
        await transaction.rollback();
        return res.status(404).json({
          error: `Producto no encontrado: ${item.id}`
        });
      }

      const cantidad = Number(item.quantity || item.cantidad || 1);
      const stockActual = Number(producto.stock);
      const precio = Number(producto.precio);

      if (cantidad <= 0) {
        await transaction.rollback();
        return res.status(400).json({
          error: `Cantidad inválida para ${producto.nombre}`
        });
      }

      if (stockActual < cantidad) {
        await transaction.rollback();
        return res.status(400).json({
          error: `Stock insuficiente para ${producto.nombre}. Disponible: ${stockActual}`
        });
      }

      const subtotal = precio * cantidad;
      total += subtotal;

      detalles.push({
        producto,
        cantidad,
        precio,
        subtotal
      });
    }

    const pedido = await Pedido.create({
      nombre_cliente: nombre,
      telefono,
      direccion,
      total,
      estado: 'Pendiente'
    }, { transaction });

    for (const detalle of detalles) {
      await DetallePedido.create({
        pedido_id: pedido.id,
        producto_id: detalle.producto.id,
        nombre_producto: detalle.producto.nombre,
        cantidad: detalle.cantidad,
        precio_unitario: detalle.precio,
        subtotal: detalle.subtotal
      }, { transaction });

      detalle.producto.stock = Number(detalle.producto.stock) - detalle.cantidad;
      await detalle.producto.save({ transaction });
    }

    await transaction.commit();

    res.status(201).json({
      mensaje: 'Pedido registrado correctamente',
      pedido_id: pedido.id,
      total
    });

  } catch (err) {
    await transaction.rollback();

    console.error('Error al crear pedido:', err);

    res.status(500).json({
      error: 'Error al registrar el pedido'
    });
  }
});/* =========================
   API VER PEDIDOS
========================= */
app.get('/pedidos', async (req, res) => {
  try {
    const pedidos = await Pedido.findAll({
      include: [
        {
          model: DetallePedido,
          as: 'detalles'
        }
      ],
      order: [['id', 'DESC']]
    });

    res.json(pedidos);
  } catch (err) {
    console.error('Error al obtener pedidos:', err);
    res.status(500).json({ error: 'Error en el servidor' });
  }
});
/* =========================
   GENERAR TICKET PDF PREMIUM
========================= */
app.get('/pedidos/:id/ticket', async (req, res) => {
  try {
    const { id } = req.params;

    const pedido = await Pedido.findByPk(id, {
      include: [
        {
          model: DetallePedido,
          as: 'detalles'
        }
      ]
    });

    if (!pedido) {
      return res.status(404).json({
        error: 'Pedido no encontrado'
      });
    }

    const doc = new PDFDocument({
      size: 'A4',
      margin: 0
    });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=ticket-strike-motards-${pedido.id}.pdf`
    );

    doc.pipe(res);

    const pageWidth = doc.page.width;
    const pageHeight = doc.page.height;

    const rojo = '#FF3B33';
    const rojoOscuro = '#B91515';
    const negro = '#05090B';
    const negro2 = '#0B1518';
    const gris = '#9CA3AF';
    const blanco = '#FFFFFF';

    const logoPath = path.join(__dirname, '../frontend/assets/logo.png');

    const ticketUrl =
      `https://backend-strike-motards.onrender.com/pedidos/${pedido.id}/ticket`;

    const qrDataUrl = await QRCode.toDataURL(ticketUrl, {
      margin: 1,
      width: 220,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    });

    const qrBase64 =
      qrDataUrl.replace(/^data:image\/png;base64,/, '');

    const qrBuffer =
      Buffer.from(qrBase64, 'base64');

    function money(valor) {
      return `$${Number(valor || 0).toLocaleString('es-MX')} MXN`;
    }

    function drawBox(x, y, w, h, color = negro2, stroke = rojoOscuro) {
      doc
        .save()
        .roundedRect(x, y, w, h, 12)
        .fillAndStroke(color, stroke)
        .restore();
    }

    function drawLabelValue(label, value, x, y, w) {
      doc
        .fillColor(rojo)
        .font('Helvetica-Bold')
        .fontSize(9)
        .text(label.toUpperCase(), x, y, {
          width: w
        });

      doc
        .fillColor(blanco)
        .font('Helvetica')
        .fontSize(11)
        .text(String(value), x, y + 15, {
          width: w
        });
    }

    // Fondo principal
    doc
      .rect(0, 0, pageWidth, pageHeight)
      .fill(negro);

    // Fondo decorativo
    doc
      .save()
      .circle(pageWidth - 60, 120, 160)
      .fillOpacity(0.12)
      .fill(rojo)
      .restore();

    doc
      .save()
      .circle(50, pageHeight - 70, 180)
      .fillOpacity(0.08)
      .fill(rojo)
      .restore();

    // Marco exterior
    doc
      .lineWidth(2)
      .strokeColor(rojo)
      .roundedRect(28, 28, pageWidth - 56, pageHeight - 56, 18)
      .stroke();

    // Encabezado
    doc
      .rect(28, 28, pageWidth - 56, 135)
      .fill('#080D10');

    doc
      .moveTo(28, 163)
      .lineTo(pageWidth - 28, 163)
      .lineWidth(1)
      .strokeColor(rojoOscuro)
      .stroke();

    if (fs.existsSync(logoPath)) {
      doc.image(logoPath, 52, 48, {
        width: 92,
        height: 92,
        fit: [92, 92]
      });
    }

    doc
      .fillColor(blanco)
      .font('Helvetica-Bold')
      .fontSize(34)
      .text('STRIKE', 155, 52, {
        width: 250
      });

    doc
      .fillColor(rojo)
      .fontSize(30)
      .text('MOTARDS', 155, 88, {
        width: 280
      });

    doc
  .fillColor(gris)
  .font('Helvetica-Bold')
  .fontSize(9)
  .text('PREMIUM GEAR FOR REAL RIDERS', 157, 123, {
    width: 300
  });

    

    // Folio derecho
    drawBox(pageWidth - 185, 48, 130, 78, '#0C1114', rojo);

    doc
      .fillColor(blanco)
      .font('Helvetica-Bold')
      .fontSize(10)
      .text('TICKET DE PEDIDO', pageWidth - 170, 62, {
        width: 105,
        align: 'center'
      });

    doc
      .fillColor(rojo)
      .fontSize(28)
      .text(`#${pedido.id}`, pageWidth - 170, 82, {
        width: 105,
        align: 'center'
      });

    // Datos
    const fechaPedido =
      new Date(pedido.fecha).toLocaleString('es-MX');

    drawBox(52, 185, pageWidth - 104, 112, '#0B1518', '#1F2A2E');

    drawLabelValue('Fecha', fechaPedido, 72, 205, 140);
    drawLabelValue('Cliente', pedido.nombre_cliente, 222, 205, 140);
    drawLabelValue('Teléfono', pedido.telefono, 372, 205, 120);
    drawLabelValue('Estado', pedido.estado, 492, 205, 80);

    doc
      .moveTo(72, 250)
      .lineTo(pageWidth - 72, 250)
      .lineWidth(0.7)
      .strokeColor('#27363B')
      .stroke();

    drawLabelValue('Dirección de envío', pedido.direccion, 72, 263, pageWidth - 144);

    // Título productos
    doc
      .save()
      .polygon([52, 330], [185, 330], [165, 365], [52, 365])
      .fill(rojoOscuro)
      .restore();

    doc
      .fillColor(blanco)
      .font('Helvetica-Bold')
      .fontSize(14)
      .text('PRODUCTOS', 72, 340);

    // Tabla
    const tableX = 52;
    let tableY = 380;
    const tableW = pageWidth - 104;

    doc
      .roundedRect(tableX, tableY, tableW, 38, 8)
      .fill('#10181B');

    doc
  .fillColor(gris)
  .font('Helvetica-Bold')
  .fontSize(8)
  .text('PRODUCTO', tableX + 18, tableY + 14, { width: 250 })
  .text('CANT.', tableX + 285, tableY + 14, { width: 45, align: 'center' })
  .text('PRECIO', tableX + 345, tableY + 14, { width: 90, align: 'center' })
  .text('SUBTOTAL', tableX + 420, tableY + 14, { width: 85, align: 'right' });

    tableY += 38;

    pedido.detalles.forEach((detalle, index) => {
      const rowHeight = 54;

      doc
        .rect(tableX, tableY, tableW, rowHeight)
        .fill(index % 2 === 0 ? '#071013' : '#0B1518');

      doc
        .moveTo(tableX, tableY)
        .lineTo(tableX + tableW, tableY)
        .strokeColor('#1F2A2E')
        .lineWidth(0.5)
        .stroke();

      doc
  .fillColor(blanco)
  .font('Helvetica-Bold')
  .fontSize(10)
  .text(`${index + 1}. ${detalle.nombre_producto}`, tableX + 18, tableY + 17, {
    width: 250
  });

doc
  .fillColor(blanco)
  .font('Helvetica')
  .fontSize(11)
  .text(String(detalle.cantidad), tableX + 285, tableY + 17, {
    width: 45,
    align: 'center'
  });

doc
  .fillColor(blanco)
  .fontSize(10)
  .text(money(detalle.precio_unitario), tableX + 345, tableY + 17, {
    width: 90,
    align: 'center'
  });

doc
  .fillColor(rojo)
  .font('Helvetica-Bold')
  .fontSize(10)
  .text(money(detalle.subtotal), tableX + 420, tableY + 17, {
  width: 85,
  align: 'right'
  });
      tableY += rowHeight;
    });
// Si la tabla creció mucho, mandamos el cierre del ticket a otra página
if (tableY > 540) {
  doc.addPage({
    size: 'A4',
    margin: 0
  });

  doc
    .rect(0, 0, pageWidth, pageHeight)
    .fill(negro);

  doc
    .lineWidth(2)
    .strokeColor(rojo)
    .roundedRect(28, 28, pageWidth - 56, pageHeight - 56, 18)
    .stroke();

  tableY = 120;

  doc
    .fillColor(blanco)
    .font('Helvetica-Bold')
    .fontSize(28)
    .text('STRIKE', 52, 55);

  doc
    .fillColor(rojo)
    .fontSize(26)
    .text('MOTARDS', 52, 86);

  doc
    .fillColor(gris)
    .fontSize(10)
    .text(`Continuación del pedido #${pedido.id}`, 52, 120);
}
    // Total
   const totalY = tableY + 35;

    doc
      .save()
      .polygon([
        pageWidth - 300, totalY,
        pageWidth - 52, totalY,
        pageWidth - 52, totalY + 70,
        pageWidth - 330, totalY + 70
      ])
      .fillAndStroke('#0C1114', rojo)
      .restore();

    doc
      .fillColor(gris)
      .font('Helvetica-Bold')
      .fontSize(13)
      .text('TOTAL A PAGAR', pageWidth - 285, totalY + 14, {
        width: 210,
        align: 'center'
      });

    doc
      .fillColor(rojo)
      .fontSize(24)
      .text(money(pedido.total), pageWidth - 300, totalY + 35, {
        width: 230,
        align: 'center'
      });

    // QR
   const qrY = totalY + 105;

    drawBox(52, qrY, 250, 115, '#0B1518', rojoOscuro);

    doc.image(qrBuffer, 68, qrY + 18, {
      width: 78,
      height: 78
    });

    doc
      .fillColor(blanco)
      .font('Helvetica-Bold')
      .fontSize(11)
      .text('ESCANEA PARA VER TU PEDIDO', 158, qrY + 24, {
        width: 125
      });

    doc
      .fillColor(gris)
      .font('Helvetica')
      .fontSize(8)
      .text('El código QR abre el ticket PDF en línea para consultar el pedido.', 158, qrY + 55, {
        width: 125,
        lineGap: 2
      });

    doc
      .fillColor(rojo)
      .font('Helvetica-Bold')
      .fontSize(7)
      .text(`Pedido #${pedido.id}`, 158, qrY + 92, {
        width: 125
      });

    // Gracias
    drawBox(322, qrY, pageWidth - 374, 115, '#0B1518', rojoOscuro);

    doc
      .fillColor(blanco)
      .font('Helvetica-Bold')
      .fontSize(18)
      .text('¡GRACIAS POR TU COMPRA!', 342, qrY + 26, {
        width: pageWidth - 414,
        align: 'center'
      });

    doc
      .fillColor(gris)
      .font('Helvetica')
      .fontSize(10)
      .text('Gracias por confiar en Strike Motards. Nos vemos en la carretera.', 352, qrY + 62, {
        width: pageWidth - 434,
        align: 'center',
        lineGap: 3
      });

    // Footer
    doc
      .rect(28, pageHeight - 86, pageWidth - 56, 58)
      .fill('#080D10');

    doc
      .fillColor(blanco)
      .font('Helvetica-Bold')
      .fontSize(9)
      .text('CALIDAD GARANTIZADA', 72, pageHeight - 65)
      .text('ENVÍO GRATIS', 245, pageHeight - 65)
      .text('PAGO SEGURO', 395, pageHeight - 65);

    doc
      .fillColor(gris)
      .font('Helvetica')
      .fontSize(8)
      .text('Contacto: info@strikemotards.com  |  WhatsApp: 7292529554', 52, pageHeight - 42, {
        width: pageWidth - 104,
        align: 'center'
      });

    doc.end();

  } catch (err) {
    console.error('Error al generar ticket PDF:', err);

    res.status(500).json({
      error: 'Error al generar el ticket PDF'
    });
  }
});
/* =========================
   CAMBIAR ESTADO PEDIDO
========================= */

app.put('/admin/pedidos/:id/estado', verificarAdmin, async (req, res) => {

  try {

    const { id } = req.params;

    const { estado } = req.body;

    const pedido = await Pedido.findByPk(id);

    if (!pedido) {
      return res.status(404).json({
        error: 'Pedido no encontrado'
      });
    }

    pedido.estado = estado;

    await pedido.save();

    res.json({
      mensaje: 'Estado actualizado correctamente',
      pedido
    });

  } catch (err) {

    console.error('Error al cambiar estado:', err);

    res.status(500).json({
      error: 'Error al actualizar estado'
    });

  }

});
/* =========================
   API RESUMEN ADMIN
========================= */
app.get('/admin/resumen', verificarAdmin, async (req, res) => {
  try {
    const totalProductos = await Producto.count();
    const totalPedidos = await Pedido.count();

    const pedidos = await Pedido.findAll();

    const totalVentas = pedidos.reduce((sum, pedido) => {
      return sum + Number(pedido.total || 0);
    }, 0);

    const productosBajoStock = await Producto.findAll({
      where: {
        stock: {
          [Sequelize.Op.lte]: 3
        }
      },
      order: [['stock', 'ASC']]
    });

    res.json({
      totalProductos,
      totalPedidos,
      totalVentas,
      productosBajoStock
    });

  } catch (err) {
    console.error('Error en resumen admin:', err);
    res.status(500).json({ error: 'Error en el servidor' });
  }
});
/* =========================
   ADMIN PRODUCTOS
========================= */

// AGREGAR PRODUCTO
app.post('/admin/productos', verificarAdmin, async (req, res) => {
  try {
    const { nombre, descripcion, precio, imagen_url, categoria, stock } = req.body;

    if (!nombre || !precio || !categoria) {
      return res.status(400).json({ error: 'Faltan datos obligatorios' });
    }

    const nuevoProducto = await Producto.create({
      nombre,
      descripcion,
      precio,
      imagen_url,
      categoria,
      stock: Number(stock || 0)
    });

    res.status(201).json({
      mensaje: 'Producto agregado correctamente',
      producto: nuevoProducto
    });

  } catch (err) {
    console.error('Error al agregar producto:', err);
    res.status(500).json({ error: 'Error al agregar producto' });
  }
});

// EDITAR PRODUCTO
app.put('/admin/productos/:id', verificarAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, descripcion, precio, imagen_url, categoria, stock } = req.body;

    const producto = await Producto.findByPk(id);

    if (!producto) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }

    await producto.update({
      nombre,
      descripcion,
      precio,
      imagen_url,
      categoria,
      stock: Number(stock || 0)
    });

    res.json({
      mensaje: 'Producto actualizado correctamente',
      producto
    });

  } catch (err) {
    console.error('Error al editar producto:', err);
    res.status(500).json({ error: 'Error al editar producto' });
  }
});

// ELIMINAR PRODUCTO
app.delete('/admin/productos/:id', verificarAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const producto = await Producto.findByPk(id);

    if (!producto) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }

    await producto.destroy();

    res.json({
      mensaje: 'Producto eliminado correctamente'
    });

  } catch (err) {
    console.error('Error al eliminar producto:', err);
    res.status(500).json({ error: 'Error al eliminar producto' });
  }
});
/* =========================
   REGISTRO DE USUARIO
========================= */
app.post('/usuarios/registro', async (req, res) => {
  try {
    const { nombre, telefono, correo, password } = req.body;

    if (!nombre || !telefono || !correo || !password) {
      return res.status(400).json({
        error: 'Todos los campos son obligatorios'
      });
    }

    if (!/^[A-Za-zÁÉÍÓÚáéíóúÑñ ]{3,50}$/.test(nombre)) {
      return res.status(400).json({
        error: 'Nombre inválido'
      });
    }

    if (!/^\d{10}$/.test(telefono)) {
      return res.status(400).json({
        error: 'El teléfono debe tener 10 dígitos'
      });
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo)) {
      return res.status(400).json({
        error: 'Correo inválido'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        error: 'La contraseña debe tener mínimo 6 caracteres'
      });
    }

    const usuarioExistente = await Usuario.findOne({
      where: { correo }
    });

    if (usuarioExistente) {
      return res.status(400).json({
        error: 'Este correo ya está registrado'
      });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const nuevoUsuario = await Usuario.create({
      nombre,
      telefono,
      correo,
      password: passwordHash
    });

    res.status(201).json({
      mensaje: 'Usuario registrado correctamente',
      usuario: {
        id: nuevoUsuario.id,
        nombre: nuevoUsuario.nombre,
        telefono: nuevoUsuario.telefono,
        correo: nuevoUsuario.correo
      }
    });

  } catch (err) {
    console.error('Error al registrar usuario:', err);

    res.status(500).json({
      error: 'Error al registrar usuario'
    });
  }
});
/* =========================
   ADMIN VER USUARIOS
========================= */
app.get('/admin/usuarios', verificarAdmin, async (req, res) => {
  try {
    const usuarios = await Usuario.findAll({
      attributes: ['id', 'nombre', 'telefono', 'correo', 'fecha_registro'],
      order: [['id', 'DESC']]
    });

    res.json(usuarios);

  } catch (err) {
    console.error('Error al obtener usuarios:', err);

    res.status(500).json({
      error: 'Error al obtener usuarios'
    });
  }
});
/* =========================
   LOGIN ADMIN
========================= */
app.post('/admin/login', (req, res) => {
  const { usuario, password } = req.body;

  const ADMIN_USER = process.env.ADMIN_USER || 'admin';
  const ADMIN_PASS = process.env.ADMIN_PASS || 'geramx';

  if (usuario === ADMIN_USER && password === ADMIN_PASS) {
    const token = crypto.randomBytes(32).toString('hex');

    adminSessions.add(token);

    return res.json({
      ok: true,
      mensaje: 'Login correcto',
      token
    });
  }

  return res.status(401).json({
    ok: false,
    error: 'Usuario o contraseña incorrectos'
  });
});
/* =========================
   LOGIN DE USUARIO
========================= */
app.post('/usuarios/login', async (req, res) => {
  try {
    const { correo, password } = req.body;

    if (!correo || !password) {
      return res.status(400).json({
        error: 'Correo y contraseña son obligatorios'
      });
    }

    const usuario = await Usuario.findOne({
      where: { correo }
    });

    if (!usuario) {
      return res.status(401).json({
        error: 'Correo o contraseña incorrectos'
      });
    }

    const passwordCorrecta =
      await bcrypt.compare(password, usuario.password);

    if (!passwordCorrecta) {
      return res.status(401).json({
        error: 'Correo o contraseña incorrectos'
      });
    }

    res.json({
      mensaje: 'Inicio de sesión correcto',
      usuario: {
        id: usuario.id,
        nombre: usuario.nombre,
        telefono: usuario.telefono,
        correo: usuario.correo
      }
    });

  } catch (err) {
    console.error('Error al iniciar sesión:', err);

    res.status(500).json({
      error: 'Error al iniciar sesión'
    });
  }
});
/* =========================
   RUTA DE PRUEBA
========================= */
app.get('/', (req, res) => {
  res.send('API de Strike Motards funcionando 🚀');
});
// ====================================
// SUBIR IMÁGENES A CLOUDINARY
// ====================================

app.post('/admin/upload-imagen', verificarAdmin, upload.single('imagen'), async (req, res) => {

  
  try {

    if (!req.file) {
      return res.status(400).json({
        error: 'No se recibió ninguna imagen'
      });
    }

    const resultado = await new Promise((resolve, reject) => {

      const stream = cloudinary.uploader.upload_stream(
        {
          folder: 'strike-motards'
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );

      stream.end(req.file.buffer);
    });

    res.json({
      url: resultado.secure_url
    });

  } catch (error) {

    console.error(error);

    res.status(500).json({
      error: 'Error al subir imagen'
    });

  }
});

/* =========================
   INICIAR SERVIDOR
========================= */
const PORT = process.env.PORT || 3000;

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server corriendo en el puerto ${PORT}`);
});