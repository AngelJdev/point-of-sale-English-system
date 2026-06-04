const Supplier = require('../models/Supplier');
const Transaction = require('../models/Transaction');

const getSuppliers = async (req, res) => {
  try {
    const suppliers = await Supplier.find({});
    res.json(suppliers);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching suppliers', error: error.message });
  }
};

const getSupplierById = async (req, res) => {
  try {
    const supplier = await Supplier.findById(req.params.id);
    if (supplier) {
      res.json(supplier);
    } else {
      res.status(404).json({ message: 'Supplier not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Error fetching supplier', error: error.message });
  }
};

const createSupplier = async (req, res) => {
  try {
    const supplier = new Supplier(req.body);
    const createdSupplier = await supplier.save();
    res.status(201).json(createdSupplier);
  } catch (error) {
    res.status(400).json({ message: 'Error creating supplier', error: error.message });
  }
};

const updateSupplier = async (req, res) => {
  try {
    const supplier = await Supplier.findById(req.params.id);
    if (supplier) {
      Object.assign(supplier, req.body);
      const updatedSupplier = await supplier.save();
      res.json(updatedSupplier);
    } else {
      res.status(404).json({ message: 'Supplier not found' });
    }
  } catch (error) {
    res.status(400).json({ message: 'Error updating supplier', error: error.message });
  }
};

const deleteSupplier = async (req, res) => {
  try {
    const supplier = await Supplier.findById(req.params.id);
    if (supplier) {
      if (supplier.balanceOwed > 0) {
        return res.status(400).json({ message: 'Cannot delete supplier with pending balance' });
      }
      await supplier.deleteOne();
      res.json({ message: 'Supplier removed' });
    } else {
      res.status(404).json({ message: 'Supplier not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Error deleting supplier', error: error.message });
  }
};

const addInvoice = async (req, res) => {
  try {
    const { amount, description } = req.body;
    const supplier = await Supplier.findById(req.params.id);
    
    if (!supplier) {
      return res.status(404).json({ message: 'Supplier not found' });
    }

    if (!amount || amount <= 0) {
      return res.status(400).json({ message: 'Invalid invoice amount' });
    }

    const transaction = new Transaction({
      tipo: 'supplier_invoice',
      monto: amount,
      descripcion: description || 'Factura de compra',
      supplier: supplier._id,
      user: req.user._id
    });

    await transaction.save();

    supplier.balanceOwed += amount;
    await supplier.save();

    res.json({ supplier, transaction });
  } catch (error) {
    res.status(500).json({ message: 'Error adding invoice', error: error.message });
  }
};

const paySupplier = async (req, res) => {
  try {
    const { amount, description } = req.body;
    const supplier = await Supplier.findById(req.params.id);
    
    if (!supplier) {
      return res.status(404).json({ message: 'Supplier not found' });
    }

    if (!amount || amount <= 0) {
      return res.status(400).json({ message: 'Invalid payment amount' });
    }

    const transaction = new Transaction({
      tipo: 'supplier_payment',
      monto: amount,
      descripcion: description || 'Pago a proveedor',
      supplier: supplier._id,
      user: req.user._id
    });

    await transaction.save();

    supplier.balanceOwed -= amount;
    await supplier.save();

    res.json({ supplier, transaction });
  } catch (error) {
    res.status(500).json({ message: 'Error processing payment', error: error.message });
  }
};

const getSupplierTransactions = async (req, res) => {
  try {
    const transactions = await Transaction.find({ supplier: req.params.id }).populate('user', 'nombre').sort({ fecha: -1 });
    res.json(transactions);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching transactions', error: error.message });
  }
};

module.exports = {
  getSuppliers,
  getSupplierById,
  createSupplier,
  updateSupplier,
  deleteSupplier,
  addInvoice,
  paySupplier,
  getSupplierTransactions
};
