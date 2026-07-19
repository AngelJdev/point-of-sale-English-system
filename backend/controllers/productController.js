const Product = require('../models/Product');
const { cloudinary } = require('../config/cloudinary');
const { GoogleGenerativeAI } = require('@google/generative-ai');

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

// @desc    Crear un nuevo producto (con imagen opcional en Cloudinary)
// @route   POST /api/products
// @access  Private
const createProduct = async (req, res) => {
  try {
    // req.file es inyectado por multer+Cloudinary si el frontend envía una imagen.
    // multer-storage-cloudinary ya subió el archivo; path contiene la secure_url.
    const imageUrl = req.file ? req.file.path : '';

    const product = new Product({
      ...req.body,
      precio_publico: Number(req.body.precio_publico),
      precio_costo: Number(req.body.precio_costo || 0),
      precio_taller: Number(req.body.precio_taller || 0),
      stock_actual:   Number(req.body.stock_actual),
      stock_minimo:   Number(req.body.stock_minimo || 0),
      imageUrl,
    });

    const createdProduct = await product.save();
    res.status(201).json(createdProduct);
  } catch (error) {
    // Si el error es de clave duplicada (codigo_interno), mensaje claro
    if (error.code === 11000) {
      return res.status(400).json({ message: 'El código interno ya existe', error: error.message });
    }
    res.status(500).json({ message: 'Error al crear el producto', error: error.message });
  }
};

// @desc    Actualizar un producto existente (reemplaza imagen si se envía una nueva)
// @route   PUT /api/products/:id
// @access  Private
const updateProduct = async (req, res) => {
  try {
    const updateData = {
      ...req.body,
      precio_publico: Number(req.body.precio_publico),
      precio_costo: Number(req.body.precio_costo || 0),
      precio_taller: Number(req.body.precio_taller || 0),
      stock_actual:   Number(req.body.stock_actual),
      stock_minimo:   Number(req.body.stock_minimo || 0),
    };

    // Si el frontend mandó una nueva imagen, sustituimos la URL
    if (req.file) {
      // Eliminar la imagen anterior de Cloudinary para no acumular archivos huérfanos
      const existing = await Product.findById(req.params.id).select('imageUrl');
      if (existing?.imageUrl) {
        // Extraer el public_id de la URL (formato: ...refaccionaria-inventario/<public_id>.<ext>)
        const parts = existing.imageUrl.split('/');
        const publicId = `refaccionaria-inventario/${parts[parts.length - 1].split('.')[0]}`;
        await cloudinary.uploader.destroy(publicId).catch(() => {}); // fallo silencioso
      }
      updateData.imageUrl = req.file.path;
    } else if (req.body.removeImage === 'true') {
      // El usuario quitó la imagen sin subir una nueva → borrar de Cloudinary y limpiar DB
      const existing = await Product.findById(req.params.id).select('imageUrl');
      if (existing?.imageUrl) {
        const parts = existing.imageUrl.split('/');
        const publicId = `refaccionaria-inventario/${parts[parts.length - 1].split('.')[0]}`;
        await cloudinary.uploader.destroy(publicId).catch(() => {});
      }
      updateData.imageUrl = '';
    }

    const updatedProduct = await Product.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
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

const extractData = async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: 'No se enviaron imágenes para analizar' });
    }

    if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY.includes('tu_api_key_de_gemini')) {
      return res.status(500).json({ message: 'Falta configurar GEMINI_API_KEY en el .env del backend' });
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    // Descargar las imágenes de Cloudinary en memoria para enviarlas a Gemini
    const imageParts = [];
    for (const file of req.files) {
      const response = await fetch(file.path);
      const arrayBuffer = await response.arrayBuffer();
      const base64 = Buffer.from(arrayBuffer).toString('base64');
      imageParts.push({
        inlineData: {
          data: base64,
          mimeType: file.mimetype
        }
      });
    }

    const { origen, codigo_escaneado } = req.body;

    const prompt = `Analiza estas imágenes de un producto. Extrae la información visible y devuélvela ÚNICAMENTE en formato JSON estricto (sin bloques de código markdown, solo el texto JSON).
    ${codigo_escaneado ? `NOTA MUY IMPORTANTE: La cámara del celular ya escaneó el código de barras y es "${codigo_escaneado}". DEBES usar EXACTAMENTE ese valor para "codigo_interno".` : ''}
    Estructura requerida:
    {
      "codigo_interno": "String (Si tienes la NOTA IMPORTANTE, usa ese número. Si no, usa el código de barras numérico si es visible, o el número de parte impreso. Si no hay, usa una palabra clave)",
      "nombre": "String (Descripción del producto, ej. Mini Facial, Filtro, etc.)",
      "marca": "String (Marca del producto)",
      "ubicacion_fisica": "",
      "precio_publico": "0",
      "stock_actual": "1",
      "stock_minimo": "1"
    }`;

    const result = await model.generateContent([prompt, ...imageParts]);
    const responseText = result.response.text();

    let extractedData = {};
    try {
      const cleanJson = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
      extractedData = JSON.parse(cleanJson);
    } catch (e) {
      console.error('Error parseando JSON de Gemini:', responseText);
      throw new Error('La IA devolvió un formato no válido');
    }

    res.status(200).json({ 
      message: 'Datos extraídos correctamente con Inteligencia Artificial', 
      extractedData,
      files: req.files.map(f => f.path) 
    });
  } catch (error) {
    res.status(500).json({ message: 'Error en extracción de IA', error: error.message });
  }
};

// @desc    Actualizar precios masivamente (por marca, proveedor, línea)
// @route   PUT /api/products/bulk/update-prices
// @access  Private
const bulkUpdatePrices = async (req, res) => {
  try {
    const { 
      proveedor, 
      linea_producto, 
      marca, 
      increaseType, // 'percentage' | 'fixed'
      increaseValue,
      applyTo // array of strings: ['publico', 'costo', 'taller'] o por defecto los tres
    } = req.body;

    // Construir el filtro de búsqueda dinámico
    const filter = {};
    if (proveedor) filter.proveedor = proveedor;
    if (linea_producto) filter.linea_producto = linea_producto;
    if (marca) filter.marca = marca;

    // Validar que haya al menos un filtro para evitar actualizar todo por error
    if (Object.keys(filter).length === 0) {
      return res.status(400).json({ message: 'Se requiere al menos un filtro (proveedor, línea o marca) para la actualización masiva.' });
    }

    const value = Number(increaseValue);
    if (isNaN(value) || value === 0) {
      return res.status(400).json({ message: 'El valor de aumento debe ser un número válido diferente de cero.' });
    }

    // Definir los campos de precio a afectar (por defecto los 3)
    const fieldsToUpdate = applyTo && applyTo.length > 0 ? applyTo : ['publico', 'costo', 'taller'];
    
    // Obtener los productos que coinciden
    const products = await Product.find(filter);
    
    if (products.length === 0) {
      return res.status(404).json({ message: 'No se encontraron productos con esos filtros.' });
    }

    let updateCount = 0;

    // Iterar y guardar uno por uno para asegurar que corran validaciones (como min: 0) o usar updateMany
    // Dado que necesitamos calcular el porcentaje sobre el valor actual de cada uno, updateMany con aggregation pipeline es la mejor opción en Mongoose > 4.2
    
    const updatePipeline = {};
    
    if (increaseType === 'percentage') {
      const multiplier = 1 + (value / 100);
      
      const setFields = {};
      if (fieldsToUpdate.includes('publico')) setFields.precio_publico = { $multiply: ["$precio_publico", multiplier] };
      if (fieldsToUpdate.includes('costo')) setFields.precio_costo = { $multiply: ["$precio_costo", multiplier] };
      if (fieldsToUpdate.includes('taller')) setFields.precio_taller = { $multiply: ["$precio_taller", multiplier] };
      
      await Product.updateMany(filter, [ { $set: setFields } ]);
    } else if (increaseType === 'fixed') {
      // Para cantidad fija, el aggregation pipeline es usar $add
      const setFields = {};
      if (fieldsToUpdate.includes('publico')) setFields.precio_publico = { $add: ["$precio_publico", value] };
      if (fieldsToUpdate.includes('costo')) setFields.precio_costo = { $add: ["$precio_costo", value] };
      if (fieldsToUpdate.includes('taller')) setFields.precio_taller = { $add: ["$precio_taller", value] };
      
      // Mongoose asegura min:0 si validamos al guardar, pero updateMany no dispara validadores fácilmente en aggregation,
      // así que usamos $max para evitar precios negativos si value es negativo
      for (const key in setFields) {
        setFields[key] = { $max: [0, setFields[key]] };
      }

      await Product.updateMany(filter, [ { $set: setFields } ]);
    } else {
      return res.status(400).json({ message: 'Tipo de aumento inválido. Use "percentage" o "fixed".' });
    }

    res.json({ message: `Se actualizaron los precios de ${products.length} productos correctamente.` });
  } catch (error) {
    res.status(500).json({ message: 'Error al actualizar precios masivamente', error: error.message });
  }
};

module.exports = {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  extractData,
  bulkUpdatePrices
};
