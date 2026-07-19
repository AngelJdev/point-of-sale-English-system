require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('./models/Product');

const Supplier = require('./models/Supplier');

// Datos de prueba para proveedores
const proveedoresData = [
  {
    nombre: 'AutoPartes de la Sierra',
    empresa: 'Grupo Sierra S.A.',
    telefono: '5512345678',
    contacto: 'Juan Pérez',
    lineas_disponibles: ['Aceites', 'Filtros', 'Bujías']
  },
  {
    nombre: 'Frenos y Clutch El Compadre',
    empresa: 'Frenos Compadre S.A. de C.V.',
    telefono: '3398765432',
    contacto: 'María López',
    lineas_disponibles: ['Balatas', 'Líquido de Frenos', 'Clutch']
  },
  {
    nombre: 'Suspensiones Rápidas',
    empresa: 'Suspensur',
    telefono: '8111222333',
    contacto: 'Roberto Gómez',
    lineas_disponibles: ['Amortiguadores', 'Bujes', 'Terminales']
  }
];

const marcas = ['TRW', 'Bosch', 'Brembo', 'Wagner', 'ACDelco', 'Motorcraft', 'NGK', 'Castrol', 'Mobil'];
const coches = ['Nissan Versa', 'Chevrolet Aveo', 'VW Jetta', 'Toyota Hilux', 'Honda CR-V'];

const generarProducto = (index, proveedor) => {
  // Elegir una línea al azar de las que vende este proveedor
  const linea = proveedor.lineas_disponibles[Math.floor(Math.random() * proveedor.lineas_disponibles.length)];
  const marca = marcas[Math.floor(Math.random() * marcas.length)];
  const coche = coches[Math.floor(Math.random() * coches.length)];
  
  const precio = Math.floor(Math.random() * (2000 - 100 + 1) + 100);
  
  return {
    codigo_interno: `REF-${1000 + index}`,
    nombre: `${linea} ${marca} para ${coche}`,
    descripcion: `Excelente calidad.`,
    marca: marca,
    precio_costo: precio * 0.6,
    precio_publico: precio,
    precio_taller: precio * 0.85,
    stock_actual: Math.floor(Math.random() * 20) + 1,
    stock_minimo: 5,
    unidad_medida: 'pza',
    proveedor: proveedor._id,
    linea_producto: linea
  };
};

const seedDatabase = async () => {
  try {
    console.log('⏳ Conectando a MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Conectado exitosamente.');

    console.log('🗑️ Limpiando la BD (Productos y Proveedores)...');
    await Product.deleteMany();
    await Supplier.deleteMany();

    console.log('🌱 Creando Proveedores de prueba...');
    const insertedSuppliers = await Supplier.insertMany(proveedoresData);

    console.log('🌱 Generando 60 productos de prueba (20 por proveedor)...');
    const productos = [];
    let pIndex = 1;

    for (const proveedor of insertedSuppliers) {
      for (let i = 0; i < 20; i++) {
        productos.push(generarProducto(pIndex++, proveedor));
      }
    }

    await Product.insertMany(productos);
    
    console.log('🎉 ¡Listo! La base de datos ha sido poblada con Proveedores y Líneas de Producto.');
    process.exit();
  } catch (error) {
    console.error('❌ Error crítico durante el seedeo:', error);
    process.exit(1);
  }
};

seedDatabase();
