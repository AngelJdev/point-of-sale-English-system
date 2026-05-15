require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('./models/Product');

// Arreglos de datos para combinaciones aleatorias y realistas
const marcas = ['TRW', 'Bosch', 'Brembo', 'Wagner', 'ACDelco', 'Motorcraft', 'NGK', 'Denso', 'Castrol', 'Mobil', 'Valvoline', 'Fram', 'Gonher', 'LTH'];
const categorias = ['Balatas', 'Bujías', 'Filtro de Aceite', 'Filtro de Aire', 'Aceite Sintético', 'Aceite Mineral', 'Batería', 'Amortiguador', 'Bomba de Agua', 'Banda de Tiempo', 'Anticongelante', 'Líquido de Frenos'];
const ubicaciones = ['Pasillo 1', 'Pasillo 2', 'Pasillo 3', 'Pasillo 4', 'Estante A', 'Estante B', 'Estante C', 'Mostrador', 'Almacén Trasero'];
const coches = ['Nissan Versa', 'Chevrolet Aveo', 'VW Jetta', 'Toyota Hilux', 'Honda CR-V', 'Kia Rio', 'Ford Figo'];

const generarProducto = (index) => {
  const categoria = categorias[Math.floor(Math.random() * categorias.length)];
  const marca = marcas[Math.floor(Math.random() * marcas.length)];
  const ubicacion = ubicaciones[Math.floor(Math.random() * ubicaciones.length)];
  const coche = coches[Math.floor(Math.random() * coches.length)];
  
  // Precio aleatorio entre $50 y $3500
  const precio = Math.floor(Math.random() * (3500 - 50 + 1) + 50);
  
  // Stock actual aleatorio entre 0 y 30 (para que algunos salgan en Urgente Resurtir)
  const stock_actual = Math.floor(Math.random() * 31);
  // Stock mínimo aleatorio entre 2 y 10
  const stock_minimo = Math.floor(Math.random() * 9) + 2; 
  
  return {
    codigo_interno: `REF-${10000 + index}`, // Ej. REF-10001
    numero_parte_oem: `OEM-${Math.floor(Math.random() * 900000) + 100000}`,
    nombre: `${categoria} ${marca} para ${coche}`,
    descripcion: `Producto automotriz de alta calidad. Categoría: ${categoria}.`,
    marca: marca,
    precio_costo: precio * 0.6, // Costo simulado del 60%
    precio_publico: precio,
    precio_mayoreo: precio * 0.85,
    stock_actual: stock_actual,
    stock_minimo: stock_minimo,
    ubicacion_fisica: ubicacion,
    unidad_medida: 'pieza',
    compatibilidad: coche,
    imageUrl: ''
  };
};

const seedDatabase = async () => {
  try {
    console.log('⏳ Conectando a MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Conectado exitosamente.');

    console.log('🗑️ Limpiando el catálogo anterior de productos...');
    await Product.deleteMany();

    console.log('🌱 Generando 1000 productos aleatorios de refaccionaria...');
    const productos = [];
    for (let i = 1; i <= 1000; i++) {
      productos.push(generarProducto(i));
    }

    console.log('💾 Insertando 1000 productos en la base de datos (esto tomará unos segundos)...');
    await Product.insertMany(productos);
    
    console.log('🎉 ¡Listo! La base de datos ha sido poblada masivamente.');
    process.exit();
  } catch (error) {
    console.error('❌ Error crítico durante el seedeo:', error);
    process.exit(1);
  }
};

seedDatabase();
