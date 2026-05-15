## 🛠️ Stack Tecnológico

El proyecto está construido sobre el stack **MERN**, optimizado para alta concurrencia y un frontend altamente reactivo:

* **Frontend:** React.js con Context API para el manejo global del carrito y estado de búsqueda.
* **Backend:** Node.js con Express.
* **Base de Datos:** MongoDB (Mongoose) estructurada para soportar relaciones complejas de refacciones automotrices.
* **Almacenamiento de Imágenes:** [Servicio por definir, ej. Cloudinary/AWS S3] para servir las fotografías de las refacciones sin saturar la base de datos.
* **Entorno de Desarrollo:** Antigravity (AI Code Editor).

## 🤖 Metodología de Desarrollo Asistido por IA

Este proyecto se construye iterativamente utilizando **Antigravity**. Para mantener el contexto y evitar degradación del código, el desarrollo se divide en módulos o *prompts* aislados. 

El editor debe referenciar este archivo para mantener la coherencia arquitectónica en cada iteración.

### Índice de Prompts (Roadmap)

1. **Prompt 01 - Estructura Base y Modelos de Datos:** Configuración del servidor Node/Express y definición del esquema Mongoose para el inventario (incluyendo `numero_parte`, `compatibilidad`, `ubicacion_fisica`, `stock_minimo` e `imageUrl`).
2. **Prompt 02 - API CRUD de Inventario:** Controladores y rutas para buscar, agregar y actualizar refacciones. Implementación de búsqueda avanzada multicriterio.
3. **Prompt 03 - UI Base y Layout (React):** Configuración del enrutador, barra de navegación, y el contenedor principal aplicando principios de accesibilidad (fuentes grandes, alto contraste).
4. **Prompt 04 - Módulo de Búsqueda y Tarjetas Visules:** Creación del buscador unificado y el componente de tarjeta de producto con fotografía y estado de stock visible.
5. **Prompt 05 - Módulo de Caja (POS) y Carrito:** Lógica de estado para agregar/quitar artículos, cálculo de totales, y pantalla de confirmación de venta.
6. **Prompt 06 - Procesamiento de Ventas:** Conexión del carrito con el backend para descontar inventario de forma segura y registrar el ticket.

## 📂 Estructura de Directorios (Aproximación)

```text
/
├── backend/
│   ├── models/         # Esquemas de Mongoose
│   ├── controllers/    # Lógica de negocio (Inventario, Ventas)
│   ├── routes/         # Endpoints de la API
│   └── server.js       # Entrada principal
└── frontend/
    ├── src/
    │   ├── components/ # Componentes reutilizables (ProductCard, SearchBar)
    │   ├── pages/      # Vistas principales (POS, Inventory)
    │   ├── context/    # Estado global (CartContext)
    │   └── App.js


    ## 🗄️ Esquema de Base de Datos Principal (Core Data)

Para que el sistema maneje el inventario automotriz de manera eficiente, el modelo principal de `Product` (Refacción) en MongoDB debe estructurarse con los siguientes campos clave:

* **`codigo_interno` / `codigo_barras`:** (String, Unique) Identificador principal para el escáner.
* **`numero_parte_oem`:** (String) Número de pieza original del fabricante.
* **`nombre` / `descripcion`:** (String) Descripción clara (ej. "Balatas Delanteras Cerámicas").
* **`marca`:** (String) Marca de la refacción (ej. Bosch, TRW, genérica).
* **`compatibilidad`:** (Array of Strings) Lista de vehículos compatibles (ej. `["Nissan Versa 2015-2019", "Nissan March 2012-2020"]`). *Crucial para el buscador.*
* **`precio_publico` y `precio_taller`:** (Numbers) Manejo de doble tarifa.
* **`stock_actual` y `stock_minimo`:** (Numbers) Para disparar alertas visuales en la interfaz.
* **`ubicacion_fisica`:** (String) Pasillo/Estante (ej. "Pasillo 3 - Nivel B") para agilizar el despacho.
* **`imageUrl`:** (String) URL de la fotografía de la pieza almacenada en la nube para validación visual.

## 📡 Endpoints Principales (API REST)

El backend expondrá las siguientes rutas para que el frontend consuma los datos:

**Inventario:**
* `GET /api/products` - Obtiene el catálogo (soporta queries de búsqueda por código, OEM o vehículo).
* `GET /api/products/:id` - Obtiene el detalle de una pieza específica.
* `POST /api/products` - Crea una nueva refacción en el sistema.
* `PUT /api/products/:id` - Actualiza stock, precios o ubicación.

**Ventas (POS):**
* `POST /api/sales` - Procesa el carrito de compras, calcula el total, registra el ticket y **descuenta el stock** de los productos vendidos en una sola transacción.
* `GET /api/sales/daily` - Obtiene el corte de caja del día.

## ⚙️ Estrategia de Despliegue y Hardware

1.  **Fase 1 (Nube/PWA):** El sistema operará inicialmente desde el navegador. El frontend en React se diseñará responsivo y se podrá "instalar" como PWA para acceso rápido.
2.  **Fase 2 (Local/Desktop):** Cuando se integre hardware físico (impresora térmica, cajón de dinero conectado por RJ11/USB), el frontend se empaquetará utilizando **Electron.js** para obtener permisos de sistema operativo y manejar los puertos locales sin las restricciones de seguridad de un navegador web estándar.