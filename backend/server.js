require('dotenv').config();

const express = require('express');
const cors = require('cors');
const { Sequelize, DataTypes } = require('sequelize');

const app = express();

app.use(cors());
app.use(express.json());

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
   CAMBIAR ESTADO PEDIDO
========================= */

app.put('/admin/pedidos/:id/estado', async (req, res) => {

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
app.get('/admin/resumen', async (req, res) => {
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
app.post('/admin/productos', async (req, res) => {
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
app.put('/admin/productos/:id', async (req, res) => {
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
app.delete('/admin/productos/:id', async (req, res) => {
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
   RUTA DE PRUEBA
========================= */
app.get('/', (req, res) => {
  res.send('API de Strike Motards funcionando 🚀');
});

/* =========================
   INICIAR SERVIDOR
========================= */
const PORT = process.env.PORT || 3000;

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server corriendo en el puerto ${PORT}`);
});