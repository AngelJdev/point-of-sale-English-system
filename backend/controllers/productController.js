const Product = require('../models/Product');

// @desc    Obtener todos los productos (con búsqueda avanzada multicriterio)
// @route   GET /api/products
// @access  Public
const getProducts = async (req, res) => {
  try {
    const { search, page = 1, limit = 12, lowStock } = req.query;
    let query = {};

    if (search) {
      // Expresión regular para búsqueda case-insensitive
      const regex = new RegExp(search, 'i');
      
      query.$or = [
        { codigo_interno: regex },
        { numero_parte_oem: regex },
        { nombre: regex },
        { marca: regex },
        { compatibilidad: regex }
      ];
    }

    if (lowStock === 'true') {
      // Búsqueda en Mongoose donde stock_actual es menor o igual a stock_minimo
      query.$expr = { $lte: ["$stock_actual", "$stock_minimo"] };
    }

    const pageNumber = parseInt(page);
    const limitNumber = parseInt(limit);
    const skip = (pageNumber - 1) * limitNumber;

    const totalItems = await Product.countDocuments(query);
    const totalPages = Math.ceil(totalItems / limitNumber);

    const products = await Product.find(query)
      .skip(skip)
      .limit(limitNumber);

    res.json({
      products,
      currentPage: pageNumber,
      totalPages,
      totalItems
    });
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener los productos', error: error.message });
  }
};

// @desc    Obtener un producto por ID
// @route   GET /api/products/:id
// @access  Public
const getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    
    if (!product) {
      return res.status(404).json({ message: 'Producto no encontrado' });
    }
    
    res.json(product);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener el producto', error: error.message });
  }
};

// @desc    Crear un nuevo producto
// @route   POST /api/products
// @access  Public
const createProduct = async (req, res) => {
  try {
    const product = new Product(req.body);
    const createdProduct = await product.save();
    
    res.status(201).json(createdProduct);
  } catch (error) {
    res.status(500).json({ message: 'Error al crear el producto', error: error.message });
  }
};

// @desc    Actualizar un producto existente
// @route   PUT /api/products/:id
// @access  Public
const updateProduct = async (req, res) => {
  try {
    const updatedProduct = await Product.findByIdAndUpdate(
      req.params.id, 
      req.body, 
      {
        new: true, // Devuelve el documento modificado, no el original
        runValidators: true // Valida los datos según el esquema de Mongoose
      }
    );

    if (!updatedProduct) {
      return res.status(404).json({ message: 'Producto no encontrado para actualizar' });
    }

    res.json(updatedProduct);
  } catch (error) {
    res.status(500).json({ message: 'Error al actualizar el producto', error: error.message });
  }
};

// @desc    Eliminar un producto
// @route   DELETE /api/products/:id
// @access  Public
const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    
    if (!product) {
      return res.status(404).json({ message: 'Producto no encontrado para eliminar' });
    }
    
    res.json({ message: 'Producto eliminado correctamente' });
  } catch (error) {
    res.status(500).json({ message: 'Error al eliminar el producto', error: error.message });
  }
};

module.exports = {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct
};
