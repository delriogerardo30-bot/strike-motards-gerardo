const { Sequelize, DataTypes } = require('sequelize');

// Usamos la URL interna para que Render se conecte directamente dentro de su red
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
    console.log('✅ Conexión interna establecida con éxito.');

    const productos = [
      // --- LOS 5 ORIGINALES ---
      { nombre: "Casco Shark Spartan", descripcion: "Fibra de vidrio y visor solar.", precio: 5800, categoria: "Cascos", imagen_url: "https://images.unsplash.com/photo-1627435601361-ec25f5b1d0e5?w=500" },
      { nombre: "Casco Fox V3", descripcion: "Protección MIPS profesional.", precio: 4200, categoria: "Cascos", imagen_url: "https://images.unsplash.com/photo-1558981403-c5f91bbba527?w=500" },
      { nombre: "Chamarra Alpine Tech", descripcion: "Protección nivel 2.", precio: 4950, categoria: "Ropa", imagen_url: "https://images.unsplash.com/photo-1591637333184-19aa84b3e01f?w=500" },
      { nombre: "Guantes GP Plus", descripcion: "Piel y fibra de carbono.", precio: 1250, categoria: "Accesorios", imagen_url: "https://images.unsplash.com/photo-1582531608229-239414e259e8?w=500" },
      { nombre: "Intercomunicador Mesh", descripcion: "Sonido Premium HD.", precio: 3900, categoria: "Tecnología", imagen_url: "https://images.unsplash.com/photo-1599819811279-d5ad9cccf838?w=500" },
      
      // --- LOS 10 NUEVOS REGISTROS ---
      { nombre: "Botas Racing Sport", descripcion: "Protección rígida en tobillos y deslizadores de acero.", precio: 3400.00, categoria: "Calzado", imagen_url: "https://images.unsplash.com/photo-1614164185128-e4ec99c436d7?w=500" },
      { nombre: "Pantalón Kevlar Street", descripcion: "Reforzado con fibra de Kevlar y protecciones en rodillas.", precio: 2100.00, categoria: "Ropa", imagen_url: "https://images.unsplash.com/photo-1542272454315-4c01d7afdf4a?w=500" },
      { nombre: "Mochila Rígida Carbon", descripcion: "Diseño aerodinámico e impermeable para altas velocidades.", precio: 1550.00, categoria: "Accesorios", imagen_url: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=500" },
      { nombre: "Soporte Celular CNC", descripcion: "Aluminio aeronáutico con vibración reducida.", precio: 850.00, categoria: "Tecnología", imagen_url: "https://images.unsplash.com/photo-1586776977607-310e9c725c37?w=500" },
      { nombre: "Funda Motocicleta Pro", descripcion: "Protección UV y lluvia con interior afelpado.", precio: 650.00, categoria: "Accesorios", imagen_url: "https://images.unsplash.com/photo-1558981420-87aa9dad1c89?w=500" },
      { nombre: "Kit de Limpieza Cadena", descripcion: "Desengrasante potente y cepillo ergonómico.", precio: 450.00, categoria: "Mantenimiento", imagen_url: "https://images.unsplash.com/photo-1611003228941-98a5216802ff?w=500" },
      { nombre: "Espejos Bar End", descripcion: "Diseño café racer en aluminio negro mate.", precio: 1100.00, categoria: "Accesorios", imagen_url: "https://images.unsplash.com/photo-1591132807183-4917f9d7b1ca?w=500" },
      { nombre: "Cargador USB Dual", descripcion: "Carga rápida con voltímetro integrado.", precio: 380.00, categoria: "Tecnología", imagen_url: "https://images.unsplash.com/photo-1583394838336-acd97773efff?w=500" },
      { nombre: "Slider de Motor Gix", descripcion: "Protección anticaídas de alta resistencia.", precio: 1800.00, categoria: "Accesorios", imagen_url: "https://images.unsplash.com/photo-1622185135505-2d795003994a?w=500" },
      { nombre: "Guantes Invierno Thermal", descripcion: "Membrana impermeable y forro térmico interno.", precio: 950.00, categoria: "Accesorios", imagen_url: "https://images.unsplash.com/photo-1582531608229-239414e259e8?w=500" }
    ];

    // Borramos los registros viejos para que no se dupliquen
    await Producto.destroy({ where: {}, truncate: true, cascade: true });
    
    // Insertamos la lista completa
    await Producto.bulkCreate(productos);
    
    console.log('🚀 ¡Catálogo de 15 productos actualizado exitosamente en Render!');
    process.exit(0);
  } catch (e) {
    console.error('❌ Error durante el sembrado:', e.message);
    process.exit(1);
  }
}

insertar();