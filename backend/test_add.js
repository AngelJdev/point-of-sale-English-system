require('dotenv').config();
const mongoose = require('mongoose');
const Supplier = require('./models/Supplier');
const Product = require('./models/Product');

const runTest = async () => {
  try {
    console.log('⏳ Conectando a la base de datos...');
    await mongoose.connect(process.env.MONGO_URI);
    
    console.log('🏭 Creando Proveedor de Prueba...');
    const newSupplier = new Supplier({
      nombre: 'Llantas y Rines El Rayo',
      empresa: 'Grupo Rayo Automotriz',
      telefono: '5544332211',
      contacto: 'Don Rayo',
      lineas_disponibles: ['Llantas', 'Rines', 'Tapones', 'Válvulas']
    });
    
    const savedSupplier = await newSupplier.save();
    console.log(`✅ Proveedor creado: ${savedSupplier.nombre}`);
    console.log(`📦 Líneas que maneja: ${savedSupplier.lineas_disponibles.join(', ')}`);

    console.log('\n🔧 Agregando 2 Productos usando las líneas predefinidas del proveedor...');
    
    const prod1 = new Product({
      codigo_interno: 'TEST-LL-001',
      nombre: 'Llanta Michelin 205/55 R16',
      descripcion: 'Llanta de alta durabilidad',
      marca: 'Michelin',
      precio_costo: 1200,
      precio_publico: 1800,
      precio_taller: 1500,
      stock_actual: 40,
      stock_minimo: 10,
      unidad_medida: 'pza',
      proveedor: savedSupplier._id,
      linea_producto: 'Llantas' // Una de las líneas del proveedor
    });

    const prod2 = new Product({
      codigo_interno: 'TEST-RN-002',
      nombre: 'Rin Deportivo 16 pulgadas',
      descripcion: 'Rin de aluminio color negro',
      marca: 'MOMO',
      precio_costo: 800,
      precio_publico: 1300,
      precio_taller: 1100,
      stock_actual: 12,
      stock_minimo: 4,
      unidad_medida: 'pza',
      proveedor: savedSupplier._id,
      linea_producto: 'Rines' // Otra línea del proveedor
    });

    await prod1.save();
    await prod2.save();
    console.log(`✅ Productos agregados correctamente:`);
    console.log(`  - ${prod1.nombre} (Línea: ${prod1.linea_producto})`);
    console.log(`  - ${prod2.nombre} (Línea: ${prod2.linea_producto})`);

    console.log('\n🎉 ¡Prueba de flujo exitosa!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error en la prueba:', error);
    process.exit(1);
  }
};

runTest();
