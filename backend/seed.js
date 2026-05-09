const { Sequelize, DataTypes } = require('sequelize');

// Conexión directa usando tu URL de Render para evitar errores de variable indefinida
const sequelize = new Sequelize('postgresql://db_strike_motards_user:nl9WU9z39iN62Zj0CPuRJ47w2jg7K0mF@dpg-d7v58jbeo5us73ebm2l0-a.oregon-postgres.render.com/db_strike_motards', {
  dialect: 'postgres',
  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false
    }
  }
});

// Definición del modelo Producto
const Producto = sequelize.define('Producto', {
  nombre: DataTypes.STRING,
  descripcion: DataTypes.TEXT,
  precio: DataTypes.DECIMAL(10, 2),
  imagen_url: DataTypes.TEXT,
  categoria: DataTypes.STRING
}, { 
  tableName: 'productos', 
  timestamps: false 
});

async function sembrarDatos() {
  try {
    await sequelize.authenticate();
    console.log('✅ Conexión establecida con la base de datos de Render.');

    // Datos premium para Strike Motards
   // Nuevos datos extendidos para Strike Motards
const datos = [
      { 
        nombre: 'Casco Shark Spartan', 
        descripcion: 'Fibra de vidrio con visor solar integrado y aerodinámica avanzada.', 
        precio: 5800.00, 
        imagen_url: 'https://images.unsplash.com/photo-1627435601361-ec25f5b1d0e5?q=80&w=500', 
        categoria: 'Cascos' 
      },
      { 
        nombre: 'Chamarra Alpine Tech', 
        descripcion: 'Protección de nivel 2 con ventilación regulable y tejido impermeable.', 
        precio: 4950.00, 
        imagen_url: 'https://images.unsplash.com/photo-1591637333184-19aa84b3e01f?q=80&w=500', 
        categoria: 'Ropa' 
      },
      { 
        nombre: 'Guantes GP Plus', 
        descripcion: 'Piel de plena flor con protecciones de carbono en nudillos.', 
        precio: 1250.00, 
        imagen_url: 'https://images.unsplash.com/photo-1582531608229-239414e259e8?q=80&w=500', 
        categoria: 'Accesorios' 
      },
      { 
        nombre: 'Botas Sport Track', 
        descripcion: 'Botas con refuerzo en tobillo y suela antideslizante de alto agarre.', 
        precio: 2800.00, 
        imagen_url: 'https://images.unsplash.com/photo-1609144089237-775905d5154e?q=80&w=500', 
        categoria: 'Calzado' 
      },
      { 
        nombre: 'Intercomunicador Mesh', 
        descripcion: 'Sonido Premium y tecnología Mesh Intercom para grupos.', 
        precio: 3900.00, 
        imagen_url: 'https://images.unsplash.com/photo-1599819811279-d5ad9cccf838?q=80&w=500', 
        categoria: 'Tecnología' 
      },
      { 
        nombre: 'Mochila Rígida Carbon', 
        descripcion: 'Diseño aerodinámico resistente al agua para motociclistas.', 
        precio: 1550.00, 
        imagen_url: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?q=80&w=500', 
        categoria: 'Accesorios' 
      },
      { 
        nombre: 'Casco Fox V3 Motocross', 
        descripcion: 'Sistema de protección MIPS y ventilación optimizada para off-road.', 
        precio: 4200.00, 
        imagen_url: 'https://images.unsplash.com/photo-1558981403-c5f91cbba527?q=80&w=500', 
        categoria: 'Cascos' 
      },
      { 
        nombre: 'Protector Espalda Pro', 
        descripcion: 'Nivel máximo de seguridad con ajuste ergonómico y ultra ligero.', 
        precio: 1100.00, 
        imagen_url: 'https://images.unsplash.com/photo-1444858291040-58f756a3bdd6?q=80&w=500', 
        categoria: 'Ropa' 
      }
    ];
    // Limpiar tabla e insertar nuevos datos
    await Producto.destroy({ where: {}, truncate: true }); // Opcional: limpia la tabla antes de insertar
    await Producto.bulkCreate(datos);
    
    console.log('🚀 ¡Datos inyectados en la nube con éxito!');
    process.exit();
  } catch (error) {
    console.error('❌ Error al inyectar datos:', error);
    process.exit(1);
  }
}

sembrarDatos();