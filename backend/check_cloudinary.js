require('dotenv').config();
const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
const apiKey    = process.env.CLOUDINARY_API_KEY;
const apiSecret = process.env.CLOUDINARY_API_SECRET;

console.log('CLOUDINARY_CLOUD_NAME:', cloudName  ? 'OK -> ' + cloudName : 'VACIO - falta configurar');
console.log('CLOUDINARY_API_KEY:   ', apiKey     ? 'OK (definida)'       : 'VACIO - falta configurar');
console.log('CLOUDINARY_API_SECRET:', apiSecret  ? 'OK (definida)'       : 'VACIO - falta configurar');

if (cloudName && apiKey && apiSecret) {
  console.log('\n✅ Credenciales cargadas correctamente. El backend puede subir imágenes.');
} else {
  console.log('\n❌ Faltan credenciales. Edita el .env y reinicia el servidor.');
}
