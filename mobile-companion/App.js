import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
  SafeAreaView,
  StatusBar,
  Platform,
  ScrollView,
  TextInput,
  KeyboardAvoidingView,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';

// ─────────────────────────────────────────────────────────────────────────────
// ⚠️ CONFIGURACIÓN DE BACKEND
// ─────────────────────────────────────────────────────────────────────────────
const HOST_IP = '192.168.1.79'; // Cambia esto si tu IP cambia
const BACKEND_URL = `http://${HOST_IP}:5000/api/products`;
const LOGIN_URL = `http://${HOST_IP}:5000/api/users/login`;
const DATA_EXTRACT_URL = `http://${HOST_IP}:5000/api/products/extract-data`;

// ── Helpers ───────────────────────────────────────────────────────────────────
const getMimeType = (uri = '') => {
  const ext = uri.split('.').pop().toLowerCase();
  const map = { jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp' };
  return map[ext] ?? 'image/jpeg';
};

const getFileName = (uri = '') => {
  const parts = uri.split('/');
  return parts[parts.length - 1] || `foto_${Date.now()}.jpg`;
};

// ── Pantalla 0: Login ────────────────────────────────────────────────────────
const LoginScreen = ({ onLoginSuccess }) => {
  const [usuario, setUsuario] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    if (!usuario || !password) {
      return Alert.alert('Campos vacíos', 'Ingresa tu usuario y contraseña.');
    }
    
    setIsLoading(true);
    try {
      const res = await fetch(LOGIN_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ usuario, password })
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.message || 'Error de credenciales');
      }
      
      // Guardar sesión en AsyncStorage
      await AsyncStorage.setItem('userToken', data.token);
      await AsyncStorage.setItem('userName', data.nombre || data.usuario);
      
      onLoginSuccess();
    } catch (error) {
      Alert.alert(
        'Error al iniciar sesión', 
        error.message.includes('Network') ? 'No se pudo conectar al servidor. Verifica la IP.' : error.message
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.flex, { backgroundColor: '#0f172a', justifyContent: 'center' }]}>
      <View style={styles.loginCard}>
        <Ionicons name="person-circle-outline" size={80} color={ACCENT} style={{ alignSelf: 'center', marginBottom: 10 }} />
        <Text style={styles.loginTitle}>Punto de Venta</Text>
        <Text style={styles.loginSubtitle}>App Compañera</Text>
        
        <TextInput 
          style={styles.input} 
          placeholder="Usuario" 
          placeholderTextColor="#64748b"
          autoCapitalize="none"
          value={usuario}
          onChangeText={setUsuario}
        />
        <TextInput 
          style={styles.input} 
          placeholder="Contraseña" 
          placeholderTextColor="#64748b"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />
        
        <TouchableOpacity style={styles.btnLogin} onPress={handleLogin} disabled={isLoading}>
          {isLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnLoginText}>Entrar</Text>}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

// ── Pantalla 1: Home (Menú Principal) ────────────────────────────────────────
const HomeScreen = ({ onSelectMode, onLogout }) => (
  <View style={styles.homeContainer}>
    <SafeAreaView style={styles.logoutHeader}>
      <TouchableOpacity onPress={onLogout} style={styles.logoutBtn}>
        <Ionicons name="log-out-outline" size={20} color="#ef4444" />
        <Text style={styles.logoutText}>Cerrar Sesión</Text>
      </TouchableOpacity>
    </SafeAreaView>

    <View style={styles.homeHeader}>
      <Ionicons name="cube" size={64} color={ACCENT} />
      <Text style={styles.homeTitle}>Companion App</Text>
      <Text style={styles.homeSubtitle}>Sistema de Inventario</Text>
    </View>

    <View style={styles.homeButtons}>
      <TouchableOpacity 
        style={styles.modeCard} 
        onPress={() => onSelectMode('SINGLE')}
        activeOpacity={0.8}
      >
        <View style={[styles.iconBox, { backgroundColor: 'rgba(59, 130, 246, 0.15)' }]}>
          <Ionicons name="image-outline" size={32} color={ACCENT} />
        </View>
        <View style={styles.modeText}>
          <Text style={styles.modeTitle}>Vista del Producto</Text>
          <Text style={styles.modeDesc}>Captura foto y llena el formulario de producto</Text>
        </View>
        <Ionicons name="chevron-forward" size={24} color="#64748b" />
      </TouchableOpacity>

      <TouchableOpacity 
        style={styles.modeCard} 
        onPress={() => onSelectMode('MULTI')}
        activeOpacity={0.8}
      >
        <View style={[styles.iconBox, { backgroundColor: 'rgba(22, 163, 74, 0.15)' }]}>
          <Ionicons name="images-outline" size={32} color={SUCCESS} />
        </View>
        <View style={styles.modeText}>
          <Text style={styles.modeTitle}>Extraer Datos</Text>
          <Text style={styles.modeDesc}>Captura 2+ fotos de cajas o etiquetas</Text>
        </View>
        <Ionicons name="chevron-forward" size={24} color="#64748b" />
      </TouchableOpacity>
    </View>
  </View>
);

// ── Pantalla 1: Cámara ─────────────────────────────────────────
const CameraScreen = ({ mode, onPhotoTaken, onFinishMulti, multiPhotosCount, onBack, scannedBarcode, setScannedBarcode }) => {
  const cameraRef = useRef(null);
  const [ready, setReady] = useState(false);
  const [zoom, setZoom] = useState(0);
  const [enableTorch, setEnableTorch] = useState(false);

  const increaseZoom = () => setZoom(prev => Math.min(prev + 0.05, 1));
  const decreaseZoom = () => setZoom(prev => Math.max(prev - 0.05, 0));
  const toggleTorch = () => setEnableTorch(prev => !prev);

  const handleCapture = useCallback(async () => {
    if (!cameraRef.current || !ready) return;
    try {
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.6 });
      onPhotoTaken(photo);
    } catch {
      Alert.alert('Error', 'No se pudo capturar la foto.');
    }
  }, [ready, onPhotoTaken]);

  return (
    <View style={styles.flex}>
      <SafeAreaView style={styles.camHeader}>
        <TouchableOpacity style={styles.backBtn} onPress={onBack}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.camTitle}>
          {mode === 'SINGLE' ? 'Foto de Producto' : `Fotos Datos (${multiPhotosCount})`}
        </Text>
        <View style={{ width: 24 }} />
      </SafeAreaView>

      <CameraView 
        style={styles.flex} 
        facing="back" 
        ref={cameraRef}
        zoom={zoom}
        enableTorch={enableTorch}
        onCameraReady={() => setReady(true)}
        onBarcodeScanned={({ data }) => {
          if (data && data !== scannedBarcode) {
            setScannedBarcode(data);
          }
        }}
      >
        <View style={styles.scanFrame} pointerEvents="none">
          <View style={[styles.corner, styles.cornerTL]} />
          <View style={[styles.corner, styles.cornerTR]} />
          <View style={[styles.corner, styles.cornerBL]} />
          <View style={[styles.corner, styles.cornerBR]} />
        </View>

        {scannedBarcode && (
          <View style={[styles.barcodeBadge, { position: 'absolute', top: 100, alignSelf: 'center' }]}>
            <Text style={styles.barcodeText}>✓ Código: {scannedBarcode}</Text>
          </View>
        )}

        <View style={styles.sideControls}>
          <TouchableOpacity onPress={toggleTorch} style={styles.sideBtn}>
            <Ionicons name={enableTorch ? "flash" : "flash-off"} size={26} color={enableTorch ? "#fbbf24" : "#fff"} />
          </TouchableOpacity>
        </View>

        <View style={styles.zoomControls}>
          <TouchableOpacity onPress={decreaseZoom} style={styles.zoomBtn}>
            <Ionicons name="remove" size={24} color="#fff" />
          </TouchableOpacity>
          <View style={styles.zoomBadge}>
            <Text style={styles.zoomText}>{(zoom * 10).toFixed(1)}x</Text>
          </View>
          <TouchableOpacity onPress={increaseZoom} style={styles.zoomBtn}>
            <Ionicons name="add" size={24} color="#fff" />
          </TouchableOpacity>
        </View>

        <View style={styles.bottomControls}>
          <View style={styles.shutterRow}>
            <View style={{ flex: 1 }} />
            
            <TouchableOpacity
              style={[styles.shutterBtn, !ready && styles.shutterBtnDisabled]}
              onPress={handleCapture}
              disabled={!ready}
              activeOpacity={0.7}
            >
              <View style={styles.shutterInner} />
            </TouchableOpacity>

            <View style={{ flex: 1, alignItems: 'center' }}>
              {mode === 'MULTI' && multiPhotosCount > 0 && (
                <TouchableOpacity style={styles.finishMultiBtn} onPress={onFinishMulti}>
                  <Text style={styles.finishMultiText}>Continuar</Text>
                  <Ionicons name="checkmark-circle" size={20} color="#fff" />
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
      </CameraView>
    </View>
  );
};

// ── Pantalla 3: Formulario ──────────────────────────────────────
const FormScreen = ({ photo, initialData, onRetry, onUpload, isUploading }) => {
  const [formData, setFormData] = useState({
    codigo_interno: initialData?.codigo_interno || '',
    nombre: initialData?.nombre || '',
    marca: initialData?.marca || '',
    ubicacion_fisica: initialData?.ubicacion_fisica || '',
    precio_publico: initialData?.precio_publico || '',
    stock_actual: initialData?.stock_actual || '',
    stock_minimo: initialData?.stock_minimo || ''
  });

  const handleChange = (name, value) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = () => {
    if (!formData.codigo_interno || !formData.nombre || !formData.precio_publico || !formData.stock_actual) {
      Alert.alert('Datos Incompletos', 'Por favor llena todos los campos marcados con *');
      return;
    }
    onUpload(formData);
  };

  return (
    <SafeAreaView style={[styles.flex, { backgroundColor: '#f8fafc' }]}>
      <View style={styles.formHeader}>
        <TouchableOpacity style={styles.formBackBtn} onPress={onRetry}>
          <Ionicons name="arrow-back" size={24} color="#0f172a" />
        </TouchableOpacity>
        <Text style={styles.formTitle}>Nuevo Producto</Text>
        <View style={{ width: 24 }} />
      </View>

      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView style={styles.flex} contentContainerStyle={styles.formContent}>
          {/* Foto miniatura */}
          <View style={styles.formImageContainer}>
            <Image source={{ uri: photo.uri }} style={styles.formImage} />
            <TouchableOpacity style={styles.retakeBtn} onPress={onRetry}>
              <Ionicons name="camera-reverse" size={18} color="#fff" />
              <Text style={styles.retakeText}>Retomar Foto</Text>
            </TouchableOpacity>
          </View>

          {/* Formulario inspirado en la web */}
          <Text style={styles.sectionTitle}>Datos Generales</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Código Interno / Escáner *</Text>
            <TextInput style={styles.formInput} placeholder="Ej. BAL-001" 
              value={formData.codigo_interno} onChangeText={(v) => handleChange('codigo_interno', v)} />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Descripción del Producto *</Text>
            <TextInput style={styles.formInput} placeholder="Ej. Balatas Delanteras Cerámicas" 
              value={formData.nombre} onChangeText={(v) => handleChange('nombre', v)} />
          </View>

          <View style={styles.row}>
            <View style={[styles.inputGroup, styles.flex]}>
              <Text style={styles.label}>Marca (Opcional)</Text>
              <TextInput style={styles.formInput} placeholder="Ej. TRW, Bosch" 
                value={formData.marca} onChangeText={(v) => handleChange('marca', v)} />
            </View>
            <View style={{ width: 12 }} />
            <View style={[styles.inputGroup, styles.flex]}>
              <Text style={styles.label}>Ubicación Física</Text>
              <TextInput style={styles.formInput} placeholder="Ej. Pasillo 3, Estante B" 
                value={formData.ubicacion_fisica} onChangeText={(v) => handleChange('ubicacion_fisica', v)} />
            </View>
          </View>

          <Text style={styles.sectionTitle}>Inventario y Precio</Text>

          <View style={styles.row}>
            <View style={[styles.inputGroup, styles.flex]}>
              <Text style={styles.label}>Precio Venta ($) *</Text>
              <TextInput style={styles.formInput} placeholder="0.00" keyboardType="numeric"
                value={formData.precio_publico} onChangeText={(v) => handleChange('precio_publico', v)} />
            </View>
            <View style={{ width: 12 }} />
            <View style={[styles.inputGroup, styles.flex]}>
              <Text style={styles.label}>Stock Físico *</Text>
              <TextInput style={styles.formInput} placeholder="0" keyboardType="numeric"
                value={formData.stock_actual} onChangeText={(v) => handleChange('stock_actual', v)} />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Alerta Mínima (Stock Mínimo)</Text>
            <TextInput style={styles.formInput} placeholder="Avisar en..." keyboardType="numeric"
              value={formData.stock_minimo} onChangeText={(v) => handleChange('stock_minimo', v)} />
          </View>

          <TouchableOpacity style={styles.submitBtn} onPress={handleSave} disabled={isUploading}>
            {isUploading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Ionicons name="save-outline" size={20} color="#fff" />
                <Text style={styles.submitBtnText}>Guardar Producto</Text>
              </>
            )}
          </TouchableOpacity>
          <View style={{ height: 40 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

// ── Pantalla 4: Previsualización (Modo MULTI) ────────────────────────────────
const MultiPreviewScreen = ({ photos, onRetry, onUpload, isUploading }) => {
  return (
    <View style={styles.flex}>
      <ScrollView horizontal pagingEnabled style={styles.flex}>
        {photos.map((p, idx) => (
          <View key={idx} style={styles.multiPreviewContainer}>
            <Image source={{ uri: p.uri }} style={styles.previewImage} resizeMode="cover" />
            <View style={styles.photoIndexBadge}>
              <Text style={styles.photoIndexText}>{idx + 1} / {photos.length}</Text>
            </View>
          </View>
        ))}
      </ScrollView>

      <View style={styles.previewOverlay}>
        {isUploading ? (
          <View style={styles.uploadingContainer}>
            <ActivityIndicator size="large" color="#ffffff" />
            <Text style={styles.uploadingText}>Enviando imágenes al servidor...</Text>
          </View>
        ) : (
          <View style={styles.previewActions}>
            <TouchableOpacity style={styles.btnRetry} onPress={onRetry} activeOpacity={0.8}>
              <Ionicons name="refresh-outline" size={22} color="#ffffff" />
              <Text style={styles.btnText}>Descartar Todas</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.btnUpload} onPress={onUpload} activeOpacity={0.8}>
              <Ionicons name="cloud-upload-outline" size={22} color="#ffffff" />
              <Text style={styles.btnText}>Subir ({photos.length})</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
};

// ── Componente Principal (State Machine) ─────────────────────────────────────
export default function App() {
  const [permission, requestPermission] = useCameraPermissions();
  // Estados: 'LOADING' | 'LOGIN' | 'HOME' | 'CAMERA' | 'FORM_SINGLE' | 'PREVIEW_MULTI'
  const [screen, setScreen] = useState('LOADING');
  const [mode, setMode] = useState(null); // 'SINGLE' | 'MULTI'
  const [photos, setPhotos] = useState([]);
  const [extractedData, setExtractedData] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [scannedBarcode, setScannedBarcode] = useState('');

  useEffect(() => {
    checkToken();
    if (permission && !permission.granted) requestPermission();
  }, [permission]);

  const checkToken = async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      setScreen(token ? 'HOME' : 'LOGIN');
    } catch (e) {
      setScreen('LOGIN');
    }
  };

  const handleLogout = async () => {
    await AsyncStorage.removeItem('userToken');
    await AsyncStorage.removeItem('userName');
    setScreen('LOGIN');
  };

  const goToCamera = (selectedMode) => {
    setMode(selectedMode);
    setPhotos([]);
    setExtractedData(null);
    setScannedBarcode('');
    setScreen('CAMERA');
  };

  const handlePhotoTaken = (photo) => {
    if (mode === 'SINGLE') {
      setPhotos([photo]);
      setScreen('FORM_SINGLE');
    } else {
      setPhotos(prev => [...prev, photo]);
    }
  };

  const handleFinishMulti = () => {
    if (photos.length < 2) {
      Alert.alert('Faltan fotos', 'Por favor captura al menos 2 fotos para extraer datos.');
      return;
    }
    setScreen('PREVIEW_MULTI');
  };

  const handleExtractData = async () => {
    if (photos.length === 0 || isUploading) return;
    setIsUploading(true);

    try {
      let token = await AsyncStorage.getItem('userToken');
      if (!token) throw new Error('No autorizado');

      const formData = new FormData();
      photos.forEach((p) => {
        formData.append('imagenes', { uri: p.uri, name: getFileName(p.uri), type: getMimeType(p.uri) });
      });
      formData.append('origen', 'app_movil_datos');
      if (scannedBarcode) {
        formData.append('codigo_escaneado', scannedBarcode);
      }

      const response = await fetch(DATA_EXTRACT_URL, { method: 'POST', headers: { 'Authorization': `Bearer ${token}` }, body: formData });
      const data = await response.json();

      if (!response.ok) throw new Error(data.message || 'Error al extraer datos');

      // IA mock extrajo los datos, pasamos al formulario para que el usuario confirme
      setExtractedData(data.extractedData);
      setScreen('FORM_SINGLE'); 
    } catch (error) {
      Alert.alert('Error', error.message.includes('Network') ? 'Error de red' : error.message);
    } finally {
      setIsUploading(false);
    }
  };

  const handleUpload = async (formValues = null) => {
    if (photos.length === 0 || isUploading) return;

    // Si apretaron "Subir" en la previsualización múltiple, primero extraemos datos
    if (!formValues && mode === 'MULTI') {
      return handleExtractData();
    }

    // Flujo normal de guardado de producto (tanto para SINGLE como tras extraer datos en MULTI)
    setIsUploading(true);

    try {
      let token = await AsyncStorage.getItem('userToken');
      if (!token) {
        Alert.alert('No autorizado', 'Por favor inicia sesión primero.');
        handleLogout();
        setIsUploading(false);
        return;
      }

      const formData = new FormData();
      
      // Siempre mandamos la primera foto (o la única en modo SINGLE)
      const uri = photos[0].uri;
      formData.append('imagen', { uri, name: getFileName(uri), type: getMimeType(uri) });
      
      // Agregar campos del formulario confirmado
      formData.append('codigo_interno', formValues ? formValues.codigo_interno : (scannedBarcode || ''));
      formData.append('nombre', formValues.nombre);
      if (formValues.marca) formData.append('marca', formValues.marca);
      if (formValues.ubicacion_fisica) formData.append('ubicacion_fisica', formValues.ubicacion_fisica);
      formData.append('precio_publico', formValues.precio_publico);
      formData.append('stock_actual', formValues.stock_actual);
      if (formValues.stock_minimo) formData.append('stock_minimo', formValues.stock_minimo);

      // Siempre creamos un producto final en BACKEND_URL
      const response = await fetch(BACKEND_URL, { method: 'POST', headers: { 'Authorization': `Bearer ${token}` }, body: formData });
      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(data?.message || `Error del servidor: ${response.status}`);
      }

      Alert.alert(
        '✅ Guardado Exitoso', 
        'El producto se ha guardado en el inventario correctamente.',
        [{ text: 'Volver al Inicio', onPress: () => setScreen('HOME') }]
      );
    } catch (error) {
      if (error.message.includes('401') || error.message.includes('No autorizado')) {
        Alert.alert('Sesión expirada', 'Tu sesión ha terminado, vuelve a ingresar.');
        handleLogout();
      } else {
        Alert.alert('❌ Error al subir', error.message.includes('Network') ? 'Fallo de red. Verifica IP y WiFi.' : error.message);
      }
    } finally {
      setIsUploading(false);
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────
  if (screen === 'LOADING') {
    return <View style={[styles.flex, { backgroundColor: '#0f172a', justifyContent: 'center' }]}><ActivityIndicator size="large" color={ACCENT} /></View>;
  }

  if (screen === 'LOGIN') {
    return <LoginScreen onLoginSuccess={() => setScreen('HOME')} />;
  }

  if (!permission || !permission.granted) {
    return (
      <SafeAreaView style={[styles.flex, { backgroundColor: '#0f172a', justifyContent: 'center', alignItems: 'center', padding: 20 }]}>
        <Ionicons name="camera-off-outline" size={64} color="#94a3b8" />
        <Text style={{ color: '#fff', fontSize: 20, marginVertical: 15, fontWeight: 'bold' }}>Permiso Requerido</Text>
        <TouchableOpacity style={{ backgroundColor: ACCENT, padding: 15, borderRadius: 10 }} onPress={requestPermission}>
          <Text style={{ color: '#fff', fontWeight: 'bold' }}>Habilitar Cámara</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <View style={[styles.flex, { backgroundColor: '#000' }]}>
      <StatusBar barStyle={screen === 'FORM_SINGLE' ? "dark-content" : "light-content"} backgroundColor={screen === 'FORM_SINGLE' ? "#f8fafc" : "#000"} />
      
      {screen === 'HOME' && <HomeScreen onSelectMode={goToCamera} onLogout={handleLogout} />}
      
      {screen === 'CAMERA' && (
        <CameraScreen 
          mode={mode} 
          onPhotoTaken={handlePhotoTaken} 
          onFinishMulti={handleFinishMulti}
          multiPhotosCount={photos.length}
          onBack={() => setScreen('HOME')}
          scannedBarcode={scannedBarcode}
          setScannedBarcode={setScannedBarcode}
        />
      )}
      
      {screen === 'FORM_SINGLE' && (
        <FormScreen 
          photo={photos[0]} 
          initialData={extractedData}
          onRetry={() => { setPhotos([]); setExtractedData(null); setScreen('CAMERA'); }}
          onUpload={handleUpload}
          isUploading={isUploading}
        />
      )}

      {screen === 'PREVIEW_MULTI' && (
        <MultiPreviewScreen 
          photos={photos} 
          onRetry={() => { setPhotos([]); setScreen('CAMERA'); }}
          onUpload={() => handleUpload(null)}
          isUploading={isUploading}
        />
      )}
    </View>
  );
}

// ── Estilos ───────────────────────────────────────────────────────────────────
const ACCENT = '#3b82f6';
const SUCCESS = '#16a34a';

const styles = StyleSheet.create({
  flex: { flex: 1 },
  row: { flexDirection: 'row', alignItems: 'center' },
  
  // Login
  loginCard: { backgroundColor: '#1e293b', padding: 25, margin: 20, borderRadius: 16, elevation: 5 },
  loginTitle: { color: '#fff', fontSize: 26, fontWeight: 'bold', textAlign: 'center' },
  loginSubtitle: { color: '#94a3b8', fontSize: 16, textAlign: 'center', marginBottom: 25 },
  input: { backgroundColor: '#0f172a', color: '#fff', padding: 15, borderRadius: 10, marginBottom: 15, borderWidth: 1, borderColor: '#334155' },
  btnLogin: { backgroundColor: ACCENT, padding: 16, borderRadius: 10, alignItems: 'center', marginTop: 10 },
  btnLoginText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },

  // Home
  homeContainer: { flex: 1, backgroundColor: '#0f172a', padding: 20, paddingTop: Platform.OS === 'android' ? 40 : 20 },
  logoutHeader: { alignItems: 'flex-end', marginBottom: 20 },
  logoutBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, padding: 8, backgroundColor: 'rgba(239, 68, 68, 0.1)', borderRadius: 8 },
  logoutText: { color: '#ef4444', fontWeight: 'bold' },
  homeHeader: { alignItems: 'center', marginBottom: 50, marginTop: 10 },
  homeTitle: { color: '#fff', fontSize: 28, fontWeight: '800', marginTop: 15 },
  homeSubtitle: { color: '#94a3b8', fontSize: 16, marginTop: 5 },
  homeButtons: { gap: 16 },
  modeCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#1e293b', padding: 20, borderRadius: 16,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)'
  },
  iconBox: { width: 56, height: 56, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginRight: 16 },
  modeText: { flex: 1 },
  modeTitle: { color: '#f1f5f9', fontSize: 18, fontWeight: '700', marginBottom: 4 },
  modeDesc: { color: '#94a3b8', fontSize: 13 },

  // Camara
  camHeader: {
    position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingTop: Platform.OS === 'android' ? 40 : 10,
    paddingBottom: 15, backgroundColor: 'rgba(0,0,0,0.5)'
  },
  backBtn: { padding: 5 },
  camTitle: { color: '#fff', fontSize: 16, fontWeight: '600' },
  
  scanFrame: { position: 'absolute', top: '20%', left: '10%', right: '10%', bottom: '30%' },
  corner: { position: 'absolute', width: 28, height: 28, borderColor: '#ffffff', borderWidth: 3 },
  cornerTL: { top: 0, left: 0, borderRightWidth: 0, borderBottomWidth: 0 },
  cornerTR: { top: 0, right: 0, borderLeftWidth: 0, borderBottomWidth: 0 },
  cornerBL: { bottom: 0, left: 0, borderRightWidth: 0, borderTopWidth: 0 },
  cornerBR: { bottom: 0, right: 0, borderLeftWidth: 0, borderTopWidth: 0 },

  sideControls: { position: 'absolute', top: 100, right: 20, alignItems: 'center', gap: 15 },
  sideBtn: { backgroundColor: 'rgba(0,0,0,0.5)', padding: 12, borderRadius: 30 },

  zoomControls: { position: 'absolute', bottom: 130, left: 0, right: 0, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 20 },
  zoomBtn: { backgroundColor: 'rgba(0,0,0,0.5)', width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  zoomBadge: { backgroundColor: 'rgba(0,0,0,0.7)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, minWidth: 60, alignItems: 'center' },
  zoomText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },

  bottomControls: { position: 'absolute', bottom: 30, left: 0, right: 0 },
  shutterRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 20 },
  shutterBtn: {
    width: 76, height: 76, borderRadius: 38, borderWidth: 4, borderColor: '#ffffff',
    alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.15)'
  },
  shutterBtnDisabled: { opacity: 0.4 },
  shutterInner: { width: 54, height: 54, borderRadius: 27, backgroundColor: '#ffffff' },
  
  finishMultiBtn: {
    backgroundColor: SUCCESS, paddingHorizontal: 16, paddingVertical: 10,
    borderRadius: 20, flexDirection: 'row', alignItems: 'center', gap: 6,
  },
  finishMultiText: { color: '#fff', fontWeight: 'bold' },

  // Preview MULTI
  previewImage: { ...StyleSheet.absoluteFillObject, width: '100%' },
  multiPreviewContainer: { width: 400 },
  photoIndexBadge: {
    position: 'absolute', top: 50, right: 20,
    backgroundColor: 'rgba(0,0,0,0.7)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12
  },
  photoIndexText: { color: '#fff', fontWeight: 'bold' },
  previewOverlay: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: 'rgba(0,0,0,0.65)', paddingVertical: 28, paddingHorizontal: 24,
  },
  barcodeBadge: {
    backgroundColor: SUCCESS, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20,
    borderWidth: 1, borderColor: '#fff'
  },
  barcodeText: {
    color: '#fff', fontSize: 13, fontWeight: 'bold'
  },
  previewActions: { flexDirection: 'row', justifyContent: 'space-between', gap: 14 },
  btnRetry: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    paddingVertical: 14, borderRadius: 12, borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.4)',
    backgroundColor: 'rgba(255,255,255,0.1)'
  },
  btnUpload: {
    flex: 1.4, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    paddingVertical: 14, borderRadius: 12, backgroundColor: SUCCESS,
  },
  btnText: { color: '#ffffff', fontSize: 15, fontWeight: '700' },
  uploadingContainer: { alignItems: 'center', gap: 14, paddingVertical: 8 },
  uploadingText: { color: '#e2e8f0', fontSize: 15, fontWeight: '600' },

  // Formulario
  formHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingTop: Platform.OS === 'android' ? 40 : 20,
    paddingBottom: 15, backgroundColor: '#f8fafc',
    borderBottomWidth: 1, borderBottomColor: '#e2e8f0'
  },
  formBackBtn: { padding: 5 },
  formTitle: { color: '#0f172a', fontSize: 18, fontWeight: 'bold' },
  formContent: { padding: 20 },
  
  formImageContainer: {
    height: 180, borderRadius: 16, overflow: 'hidden', marginBottom: 25,
    backgroundColor: '#cbd5e1', position: 'relative'
  },
  formImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  retakeBtn: {
    position: 'absolute', bottom: 10, right: 10,
    backgroundColor: 'rgba(0,0,0,0.6)', flexDirection: 'row', alignItems: 'center',
    gap: 6, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20
  },
  retakeText: { color: '#fff', fontSize: 12, fontWeight: '600' },

  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#334155', marginBottom: 15, marginTop: 10 },
  inputGroup: { marginBottom: 16 },
  label: { fontSize: 13, fontWeight: '600', color: '#64748b', marginBottom: 6 },
  formInput: {
    backgroundColor: '#fff', borderWidth: 1, borderColor: '#cbd5e1',
    borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12,
    fontSize: 15, color: '#0f172a'
  },

  submitBtn: {
    backgroundColor: '#16a34a', flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, paddingVertical: 16, borderRadius: 12, marginTop: 20, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4
  },
  submitBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' }
});
