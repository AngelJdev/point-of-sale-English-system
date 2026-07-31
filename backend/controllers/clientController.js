const Client = require('../models/Client');
const Transaction = require('../models/Transaction');
const Sale = require('../models/Sale');

const getClients = async (req, res) => {
  try {
    const clients = await Client.find({});
    res.json(clients);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching clients', error: error.message });
  }
};

const getClientById = async (req, res) => {
  try {
    const client = await Client.findById(req.params.id);
    if (client) {
      res.json(client);
    } else {
      res.status(404).json({ message: 'Client not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Error fetching client', error: error.message });
  }
};

const createClient = async (req, res) => {
  try {
    const client = new Client(req.body);
    const createdClient = await client.save();
    res.status(201).json(createdClient);
  } catch (error) {
    res.status(400).json({ message: 'Error creating client', error: error.message });
  }
};

const updateClient = async (req, res) => {
  try {
    const client = await Client.findById(req.params.id);
    if (client) {
      Object.assign(client, req.body);
      const updatedClient = await client.save();
      res.json(updatedClient);
    } else {
      res.status(404).json({ message: 'Client not found' });
    }
  } catch (error) {
    res.status(400).json({ message: 'Error updating client', error: error.message });
  }
};

const deleteClient = async (req, res) => {
  try {
    const client = await Client.findById(req.params.id);
    if (client) {
      // Opcional: verificar si tiene deudas antes de eliminar
      if (client.balance > 0) {
        return res.status(400).json({ message: 'Cannot delete client with pending balance' });
      }
      await client.deleteOne();
      res.json({ message: 'Client removed' });
    } else {
      res.status(404).json({ message: 'Client not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Error deleting client', error: error.message });
  }
};

const payBalance = async (req, res) => {
  try {
    const { amount, description } = req.body;
    const client = await Client.findById(req.params.id);
    
    if (!client) {
      return res.status(404).json({ message: 'Client not found' });
    }

    if (!amount || amount <= 0) {
      return res.status(400).json({ message: 'Invalid payment amount' });
    }

    // Registrar la transaccion
    const transaction = new Transaction({
      tipo: 'client_payment',
      monto: amount,
      descripcion: description || 'Abono a cuenta',
      client: client._id,
      user: req.user._id
    });

    await transaction.save();

    // Actualizar el saldo del cliente
    client.balance -= amount;
    await client.save();

    res.json({ client, transaction });
  } catch (error) {
    res.status(500).json({ message: 'Error processing payment', error: error.message });
  }
};

// Obtener historial de pagos/transacciones de un cliente
const getClientTransactions = async (req, res) => {
  try {
    const transactions = await Transaction.find({ client: req.params.id }).populate('user', 'nombre').sort({ fecha: -1 });
    res.json(transactions);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching transactions', error: error.message });
  }
};

// Obtener historial de movimientos (cargos y abonos) de un cliente
const getClientHistory = async (req, res) => {
  try {
    const clientId = req.params.id;

    // Obtener abonos
    const transactions = await Transaction.find({ client: clientId })
      .populate('user', 'nombre')
      .lean();

    // Obtener ventas a crédito (cargos)
    const sales = await Sale.find({ 
      cliente_id: clientId, 
      metodo_pago: 'Crédito',
      estado: 'completada'
    }).populate('items.producto_id', 'nombre').lean();

    // Formatear abonos
    const formattedTransactions = transactions.map(t => ({
      _id: t._id,
      fecha: t.fecha,
      tipo: 'Abono',
      monto: t.monto,
      descripcion: t.descripcion || 'Abono a cuenta',
      usuario: t.user?.nombre || 'N/A'
    }));

    // Formatear cargos
    const formattedSales = sales.map(s => {
      // Crear descripcion con los productos
      const productNames = s.items.map(item => {
        const name = item.producto_id?.nombre || 'Producto Desconocido';
        return `${item.cantidad}x ${name}`;
      }).join(', ');

      return {
        _id: s._id,
        fecha: s.fecha,
        tipo: 'Cargo',
        monto: s.total,
        descripcion: `Venta: ${productNames}`.substring(0, 100), // Limitar longitud
        usuario: 'Sistema' // Podría venir de la venta si se guardara el usuario
      };
    });

    // Combinar y ordenar por fecha descendente (más reciente primero)
    const history = [...formattedTransactions, ...formattedSales].sort((a, b) => {
      return new Date(b.fecha) - new Date(a.fecha);
    });

    res.json(history);
  } catch (error) {
    console.error('Error fetching client history:', error);
    res.status(500).json({ message: 'Error fetching client history', error: error.message });
  }
};

module.exports = {
  getClients,
  getClientById,
  createClient,
  updateClient,
  deleteClient,
  payBalance,
  getClientTransactions,
  getClientHistory
};
