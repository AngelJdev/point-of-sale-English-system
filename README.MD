# SISTEMA PUNTO DE VENTA (V1) - Refaccionaria Automotriz

Este es un sistema integral de Punto de Venta (POS) diseñado específicamente para refaccionarias, optimizado para la gestión eficiente de inventarios automotrices, procesamiento de ventas rápido y control de caja.

## 🚀 Funcionalidades Principales

### 📦 Gestión de Inventario
- **CRUD Completo:** Registro, edición y eliminación de refacciones.
- **Control de Stock:** Alertas visuales para productos con stock bajo.
- **Búsqueda Avanzada:** Filtrado por nombre, código interno o compatibilidad de vehículos en tiempo real.
- **Paginación Inteligente:** Carga optimizada de productos para manejar catálogos extensos.

### 💰 Punto de Venta (POS)
- **Carrito de Compras:** Interfaz intuitiva para agregar artículos, ajustar cantidades y calcular totales automáticamente.
- **Doble Confirmación:** Diálogos de seguridad antes de finalizar ventas para evitar errores operativos.
- **Métodos de Pago:** Soporte para Efectivo y Tarjeta.
- **Ticket de Venta:** Generación de comprobantes optimizados para impresoras térmicas (58mm/80mm).

### 📑 Historial y Devoluciones
- **Historial Completo:** Consulta de todas las ventas realizadas con búsqueda por folio (ID).
- **Módulo de Devoluciones:** Proceso automatizado que reintegra artículos al inventario y ajusta el corte de caja del día.
- **Reimpresión:** Capacidad de reimprimir tickets de ventas pasadas desde el historial.

### 🔐 Seguridad y Roles
- **Autenticación JWT:** Sistema seguro de inicio de sesión con tokens de larga duración.
- **Roles de Usuario:** Diferenciación entre Admin (Control total) y Staff (Operación de ventas).
- **Protección de Rutas:** Interfaz protegida para asegurar que solo personal autorizado acceda a datos sensibles.

### 📈 Reportes y Corte de Caja
- **Corte Diario:** Resumen de ingresos y tickets generados en el día actual.
- **Historial de Cortes:** Registro de cierres de caja previos para auditoría mensual.
- **Actualización Dinámica:** Capacidad de actualizar cortes cerrados ante ventas imprevistas.

## 🛠️ Stack Tecnológico
- **Frontend:** React.js, Context API, Lucide React (iconografía).
- **Backend:** Node.js, Express.js.
- **Base de Datos:** MongoDB con Mongoose.
- **Estilos:** Vanilla CSS (Diseño Premium y Responsivo).
- **Notificaciones:** React Hot Toast y SweetAlert2.
- **Despliegue:** Preparado para Vercel (Frontend) y Render/Railway (Backend).

## 🤖 Metodología de Desarrollo (Prompts Aplicados)
El sistema fue desarrollado siguiendo una secuencia lógica de prompts especializados:
1. **Estructura Base:** Configuración de servidor y modelos Mongoose.
2. **Autenticación:** Implementación de JWT y Login Premium con transiciones de carga.
3. **Módulo POS:** Desarrollo del carrito de compras y lógica de transacciones seguras.
4. **Impresión Térmica:** Creación del componente de ticket y reglas CSS `@media print`.
5. **Historial Avanzado:** Implementación de búsqueda por folio y paginación en ventas.
6. **Devoluciones:** Lógica de reversión de stock y anulación de ventas.
7. **Producción:** Centralización de Axios con interceptores y configuración de CORS.

## ⚙️ Instalación y Uso Local

### Requisitos
- Node.js (v16+)
- MongoDB (Local o Atlas)

### Pasos
1. **Clonar repositorio:** `git clone https://github.com/AngelJdev/point-of-sale-English-system.git`
2. **Backend:**
   - `cd backend`
   - `npm install`
   - Configurar `.env` basándose en `.env.example`.
   - `npm run dev`
3. **Frontend:**
   - `cd frontend`
   - `npm install`
   - Configurar `.env` basándose en `.env.example`.
   - `npm run dev`

---
*Desarrollado como una solución profesional para la gestión de refaccionarias modernas.*