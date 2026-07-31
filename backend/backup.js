require('dotenv').config();
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

// Models
const Product = require('./models/Product');
const Sale = require('./models/Sale');
const Client = require('./models/Client');
const Supplier = require('./models/Supplier');
const User = require('./models/User');
const CashRegister = require('./models/CashRegister');
const Transaction = require('./models/Transaction');

const backupDatabase = async () => {
  try {
    console.log('⏳ Conectando a la base de datos...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Base de datos conectada.');

    // Crear carpeta de backups si no existe
    const backupDir = path.join(__dirname, 'backups');
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir);
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const folderName = `backup_${timestamp}`;
    const targetDir = path.join(backupDir, folderName);
    fs.mkdirSync(targetDir);

    console.log(`📁 Creando respaldo en: ${targetDir}`);

    const models = {
      Product,
      Sale,
      Client,
      Supplier,
      User,
      CashRegister,
      Transaction
    };

    for (const [name, model] of Object.entries(models)) {
      console.log(`Descargando colección: ${name}...`);
      const data = await model.find({});
      fs.writeFileSync(
        path.join(targetDir, `${name.toLowerCase()}s.json`),
        JSON.stringify(data, null, 2)
      );
      console.log(`✅ ${name} guardado. (${data.length} registros)`);
    }

    console.log(`\n🎉 Respaldo completado con éxito en la carpeta "backups/${folderName}"`);
    process.exit(0);
  } catch (error) {
    console.error('❌ Error al realizar el respaldo:', error);
    process.exit(1);
  }
};

backupDatabase();
