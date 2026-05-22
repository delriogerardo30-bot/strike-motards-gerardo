const { Sequelize, DataTypes } = require('sequelize');

const sequelize = new Sequelize('postgresql://db_strike_motards_user:nl9WU9z39iN62Zj0CPuRJ47w2jg7K0mF@dpg-d7v58jbeo5us73ebm2l0-a.oregon-postgres.render.com/db_strike_motards', {
  dialect: 'postgres',
  logging: false,
  dialectOptions: {
    ssl: { require: true, rejectUnauthorized: false }
  },
  pool: { max: 5, acquire: 120000 }
});

const Producto = sequelize.define('Producto', {
  nombre: DataTypes.STRING,
  descripcion: DataTypes.TEXT,
  precio: DataTypes.DECIMAL(10, 2),
  imagen_url: DataTypes.TEXT,
  categoria: DataTypes.STRING
}, { tableName: 'productos', timestamps: false });

async function sembrarDatos() {
  try {
    await sequelize.authenticate();
    console.log('✅ Conexión establecida.');

    const datos = [
      // === CASCOS (8) ===
      { nombre: "Casco Shark Spartan", descripcion: "Fibra de vidrio con visor solar integrado y aerodinámica avanzada.", precio: 5800, imagen_url: "https://images.unsplash.com/photo-1627435601361-ec25f5b1d0e5?q=80&w=600", categoria: "Cascos" },
      { nombre: "Casco Fox V3 Motocross", descripcion: "Sistema MIPS y ventilación optimizada para off-road.", precio: 4200, imagen_url: "https://images.unsplash.com/photo-1558981403-c5f91cbba527?q=80&w=600", categoria: "Cascos" },
      { nombre: "Casco HJC RPHA 11", descripcion: "Premium con excelente ventilación y peso ligero.", precio: 6500, imagen_url: "https://images.unsplash.com/photo-1590502593744-8c3a5c9f8a0c?q=80&w=600", categoria: "Cascos" },
      { nombre: "Casco Arai Corsair-X", descripcion: "Máxima protección y confort profesional.", precio: 9200, imagen_url: "https://images.unsplash.com/photo-1617112848920-5e9c8c8c8c8c?q=80&w=600", categoria: "Cascos" },
      { nombre: "Casco Shoei NXR2", descripcion: "Alta gama con aislamiento acústico superior.", precio: 8500, imagen_url: "https://images.unsplash.com/photo-1600585154340-be6161a56a9c?q=80&w=600", categoria: "Cascos" },
      { nombre: "Casco Bell Qualifier", descripcion: "Excelente relación calidad-precio.", precio: 3200, imagen_url: "https://images.unsplash.com/photo-1558981403-c5f91cbba527?q=80&w=600", categoria: "Cascos" },

      // === ROPA (8) ===
      { nombre: "Chamarra Alpine Tech", descripcion: "Protección nivel 2 con ventilación regulable.", precio: 4950, imagen_url: "https://images.unsplash.com/photo-1591637333184-19aa84b3e01f?q=80&w=600", categoria: "Ropa" },
      { nombre: "Protector Espalda Pro", descripcion: "Nivel máximo de seguridad ergonómico.", precio: 1100, imagen_url: "https://images.unsplash.com/photo-1444858291040-58f756a3bdd6?q=80&w=600", categoria: "Ropa" },
      { nombre: "Pantalón Racing Kevlar", descripcion: "Alta resistencia con protecciones en rodillas.", precio: 3200, imagen_url: "https://images.unsplash.com/photo-1600585154340-be6161a56a9c?q=80&w=600", categoria: "Ropa" },
      { nombre: "Chaleco Airbag", descripcion: "Tecnología de airbag para máxima protección.", precio: 8500, imagen_url: "https://images.unsplash.com/photo-1551028719-00167b16b4d0?q=80&w=600", categoria: "Ropa" },
      { nombre: "Sudadera Motard Hoodie", descripcion: "Estilo urbano con protecciones homologadas.", precio: 1850, imagen_url: "https://images.unsplash.com/photo-1552374196-c4e7ffc2f4e3?q=80&w=600", categoria: "Ropa" },
      { nombre: "Traje de Lluvia Pro", descripcion: "Conjunto completo impermeable.", precio: 1450, imagen_url: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=600", categoria: "Ropa" },

      // === ACCESORIOS (8) ===
      { nombre: "Guantes GP Plus", descripcion: "Piel con protecciones de carbono en nudillos.", precio: 1250, imagen_url: "https://images.unsplash.com/photo-1582531608229-239414e259e8?q=80&w=600", categoria: "Accesorios" },
      { nombre: "Mochila Rígida Carbon", descripcion: "Diseño aerodinámico resistente al agua.", precio: 1550, imagen_url: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?q=80&w=600", categoria: "Accesorios" },
      { nombre: "Antirrobo Disco Freno", descripcion: "Alta seguridad con alarma incorporada.", precio: 980, imagen_url: "https://images.unsplash.com/photo-1605559424843-9e4c228d1c8e?q=80&w=600", categoria: "Accesorios" },
      { nombre: "Kit Herramientas Moto", descripcion: "Set profesional compacto para ruta.", precio: 890, imagen_url: "https://images.unsplash.com/photo-1581235720704-06d3acfcb36f?q=80&w=600", categoria: "Accesorios" },
      { nombre: "Cargador USB Dual", descripcion: "Carga rápida impermeable.", precio: 650, imagen_url: "https://images.unsplash.com/photo-1583394838336-acd97773efff?q=80&w=600", categoria: "Accesorios" },

      // === CALZADO (4) ===
      { nombre: "Botas Sport Track", descripcion: "Refuerzo en tobillo y gran agarre.", precio: 2800, imagen_url: "https://images.unsplash.com/photo-1609144089237-775905d5154e?q=80&w=600", categoria: "Calzado" },
      { nombre: "Botas Touring Impermeables", descripcion: "Máxima comodidad y protección contra lluvia.", precio: 3650, imagen_url: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=600", categoria: "Calzado" },
      { nombre: "Botas Urban Cortas", descripcion: "Estilo casual con protección homologada.", precio: 2350, imagen_url: "https://images.unsplash.com/photo-1600585154340-be6161a56a9c?q=80&w=600", categoria: "Calzado" },

      // === TECNOLOGÍA (4) ===
      { nombre: "Intercomunicador Mesh", descripcion: "Sonido Premium y comunicación grupal.", precio: 3900, imagen_url: "https://images.unsplash.com/photo-1599819811279-d5ad9cccf838?q=80&w=600", categoria: "Tecnología" },
      { nombre: "Cámara 360 para Moto", descripcion: "Grabación 4K con visión panorámica.", precio: 4500, imagen_url: "https://images.unsplash.com/photo-1605559424843-9e4c228d1c8e?q=80&w=600", categoria: "Tecnología" },
      { nombre: "GPS Garmin Zumo", descripcion: "Navegación especializada para motociclistas.", precio: 7200, imagen_url: "https://images.unsplash.com/photo-1617112848920-5e9c8c8c8c8c?q=80&w=600", categoria: "Tecnología" }
    ];

    await Producto.destroy({ where: {}, truncate: true });
    await Producto.bulkCreate(datos);

    console.log(`🚀 ¡${datos.length} productos insertados con éxito!`);
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

sembrarDatos();