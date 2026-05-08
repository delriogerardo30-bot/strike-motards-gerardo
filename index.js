const express = require('express');
const { Sequelize, DataTypes } = require('sequelize');
const path = require('path');

const app = express();

/* =========================================
   CONEXIÓN POSTGRESQL RENDER
========================================= */

const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: 'postgres',
  protocol: 'postgres',
  logging: false
});

/* =========================================
   VERIFICAR CONEXIÓN
========================================= */

sequelize.authenticate()
  .then(() => {
    console.log('✅ Conexión exitosa a PostgreSQL');
  })
  .catch(err => {
    console.error('❌ Error conectando PostgreSQL:', err);
  });

/* =========================================
   MODELO PRODUCTOS
========================================= */

const Producto = sequelize.define('Producto', {
  nombre: {
    type: DataTypes.STRING
  },
  descripcion: {
    type: DataTypes.TEXT
  },
  precio: {
    type: DataTypes.DECIMAL(10, 2)
  },
  imagen_url: {
    type: DataTypes.TEXT
  }
}, {
  tableName: 'productos',
  timestamps: false
});

/* =========================================
   ARCHIVOS ESTÁTICOS
========================================= */

app.use(express.static(path.join(__dirname, 'public')));

/* =========================================
   API PRODUCTOS
========================================= */

app.get('/api/productos', async (req, res) => {

  try {

    const productos = await Producto.findAll();

    res.json(productos);

  } catch (err) {

    console.error('❌ Error API productos:', err);

    res.status(500).json({
      error: 'Error de conexión',
      detalle: err.message
    });

  }

});

/* =========================================
   PUERTO
========================================= */

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🚀 Servidor listo en puerto ${PORT}`);
});