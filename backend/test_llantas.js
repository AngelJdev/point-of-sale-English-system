require('dotenv').config();
const mongoose = require('mongoose');
const Supplier = require('./models/Supplier');
const Product = require('./models/Product');

const runTest = async () => {
  try {
    console.log('⏳ Conectando a la base de datos...');
    await mongoose.connect(process.env.MONGO_URI);
    
    console.log('🔍 Buscando al proveedor "Llantas y Rines El Rayo"...');
    const supplier = await Supplier.findOne({ nombre: 'Llantas y Rines El Rayo' });
    
    if (!supplier) {
      console.log('❌ Proveedor no encontrado. Asegúrate de haber corrido el script anterior.');
      process.exit(1);
    }

    console.log('\n🔧 Agregando 10 Llantas Michelin distintas...');
    
    const modelos = [
      '195/65 R15', '205/55 R16', '225/45 R17', '215/60 R16', '235/55 R18',
      '245/40 R18', '265/65 R17', '275/55 R20', '185/60 R15', '255/50 R19'
    ];

    const productosNuevos = modelos.map((modelo, index) => {
      const precioBase = 1500 + (index * 200);
      return {
        codigo_interno: `TEST-LL-${String(10 + index).padStart(3, '0')}`,
        nombre: `Llanta Michelin ${modelo}`,
        descripcion: `Llanta de alta durabilidad modelo ${modelo}`,
        marca: 'Michelin',
        precio_costo: precioBase * 0.7,
        precio_publico: precioBase,
        precio_taller: precioBase * 0.85,
        stock_actual: Math.floor(Math.random() * 30) + 5,
        stock_minimo: 4,
        unidad_medida: 'pza',
        proveedor: supplier._id,
        linea_producto: 'Llantas'
      };
    });

    await Product.insertMany(productosNuevos);
    console.log(`✅ ¡10 llantas Michelin agregadas exitosamente a la línea "Llantas"!`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error en la prueba:', error);
    process.exit(1);
  }
};

runTest();
