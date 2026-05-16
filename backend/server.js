require('dotenv').config(); // IMPORTANTE: Carga las variables del archivo .env
const express = require('express');
const cors = require('cors');
const { Sequelize, DataTypes } = require('sequelize');

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

/* =========================
   CONEXIÓN A POSTGRES (Híbrida: Local/Nube)
========================= */
const sequelize = new Sequelize(
  process.env.DATABASE_URL || 'postgres://postgres:12345@localhost:5432/strike_motors_db',
  {
    dialect: 'postgres',
    logging: false,
    dialectOptions: process.env.DATABASE_URL ? {
      ssl: {
        require: true,
        rejectUnauthorized: false
      }
    } : {}
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
  descripcion: DataTypes.TEXT,
  precio: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  imagen_url: {
    type: DataTypes.TEXT,
    defaultValue: 'https://via.placeholder.com/300'
  },
  categoria: { // Añadí categoría para que coincida con tu diseño de Figma
    type: DataTypes.STRING,
    defaultValue: 'Accesorios'
  }
}, {
  tableName: 'productos',
  timestamps: false
});

/* =========================
   SINCRONIZACIÓN
========================= */
sequelize.sync({ alter: true }) 
  .then(() => console.log('✅ PostgreSQL conectado y tablas sincronizadas'))
  .catch(err => console.error('❌ Error de conexión:', err));

/* =========================
   API ENDPOINTS
========================= */
app.get('/productos', async (req, res) => {
  try {
    const productos = await Producto.findAll();
    res.json(productos);
  } catch (err) {
    console.error("Error al obtener productos:", err);
    res.status(500).json({ error: "Error en el servidor" });
  }
});

// Ruta de prueba para saber si el server está vivo en Render
app.get('/', (req, res) => {
    res.send('API de Strike Motards funcionando 🚀');
});

/* =========================
   INICIAR SERVIDOR
========================= */
const PORT = process.env.PORT || 3000;

// Escuchar en 0.0.0.0 es necesario para que Render detecte el servicio externo
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server corriendo en el puerto ${PORT}`);
});
