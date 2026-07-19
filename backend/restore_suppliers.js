require('dotenv').config();
const mongoose = require('mongoose');
const Supplier = require('./models/Supplier');

const restoreSuppliers = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    
    const proveedores = [
      {
        nombre: 'David Tellez Ordoñes',
        empresa: 'Filtros y Aceites de la Sierra',
        telefono: '7641224411',
        lineas_disponibles: ['Filtros', 'Aceites']
      },
      {
        nombre: 'Raymundo Guevara',
        empresa: 'RAYAN compra-venta de refacciones',
        lineas_disponibles: ['Refacciones en general']
      },
      {
        nombre: 'Bardahl',
        contacto: 'Marcos',
        lineas_disponibles: ['Aditivos', 'Líquidos']
      },
      {
        nombre: 'Akron',
        lineas_disponibles: ['Aceites', 'Grasas']
      },
      {
        nombre: 'Truper',
        lineas_disponibles: ['Herramientas']
      },
      {
        nombre: 'Juan Carlos Guevara',
        empresa: 'TORBI-PROTOR',
        lineas_disponibles: ['Refacciones']
      }
    ];

    for (const p of proveedores) {
      const exists = await Supplier.findOne({ nombre: p.nombre });
      if (!exists) {
        await new Supplier(p).save();
      }
    }

    console.log('✅ Proveedores originales restaurados con éxito.');
    process.exit(0);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};
restoreSuppliers();
