const { Sequelize, DataTypes } = require('sequelize');

// Usamos la URL interna porque el script correrá dentro de Render
const DATABASE_URL = 'postgresql://db_strike_motards_user:nl9WU9z39iN62Zj0CPuRJ47w2jg7K0mF@dpg-d7v58jbeo5us73ebm2l0-a/db_strike_motards';

const sequelize = new Sequelize(DATABASE_URL, {
  dialect: 'postgres',
  logging: false,
  dialectOptions: { ssl: { require: true, rejectUnauthorized: false } }
});

const Producto = sequelize.define('Producto', {
  nombre: DataTypes.STRING,
  descripcion: DataTypes.TEXT,
  precio: DataTypes.DECIMAL(10, 2),
  imagen_url: DataTypes.TEXT,
  categoria: DataTypes.STRING
}, { tableName: 'productos', timestamps: false });

async function insertar() {
  try {
    await sequelize.authenticate();
    console.log('✅ Conexión interna establecida.');

    const productos = [
      { nombre: "Casco Shark Spartan", descripcion: "Fibra de vidrio y visor solar.", precio: 5800, categoria: "Cascos", imagen_url: "https://images.unsplash.com/photo-1627435601361-ec25f5b1d0e5?w=500" },
      { nombre: "Casco Fox V3", descripcion: "Protección MIPS profesional.", precio: 4200, categoria: "Cascos", imagen_url: "https://images.unsplash.com/photo-1558981403-c5f91bbba527?w=500" },
      { nombre: "Chamarra Alpine Tech", descripcion: "Protección nivel 2.", precio: 4950, categoria: "Ropa", imagen_url: "https://images.unsplash.com/photo-1591637333184-19aa84b3e01f?w=500" },
      { nombre: "Guantes GP Plus", descripcion: "Piel y fibra de carbono.", precio: 1250, categoria: "Accesorios", imagen_url: "https://images.unsplash.com/photo-1582531608229-239414e259e8?w=500" },
      { nombre: "Intercomunicador Mesh", descripcion: "Sonido Premium HD.", precio: 3900, categoria: "Tecnología", imagen_url: "https://images.unsplash.com/photo-1599819811279-d5ad9cccf838?w=500" }
      // ... puedes añadir los 20 aquí siguiendo el mismo formato
    ];

    await Producto.destroy({ where: {}, truncate: true, cascade: true });
    await Producto.bulkCreate(productos);
    console.log('🚀 ¡Catálogo actualizado exitosamente en la nube!');
    process.exit(0);
  } catch (e) {
    console.error('❌ Error:', e.message);
    process.exit(1);
  }
}

insertar();