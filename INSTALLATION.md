# 🚀 Guía de Instalación - Batch Records System

## 📋 Requisitos Previos

Antes de comenzar, asegúrate de tener instalado:

- **Node.js** >= 16.0.0 ([Descargar](https://nodejs.org/))
- **npm** >= 8.0.0 (viene con Node.js)
- **Git** (opcional, para clonar el repositorio)

Verificar versiones instaladas:
```bash
node --version
npm --version
```

## 🛠️ Instalación Paso a Paso

### 1. Obtener el Código

```bash
# Si tienes Git
git clone <repository-url>
cd batch-records-system

# O descargar y extraer el ZIP
```

### 2. Instalar Dependencias del Proyecto Principal

```bash
npm install
```

### 3. Instalar Dependencias del Backend

```bash
cd backend
npm install
cd ..
```

### 4. Inicializar la Base de Datos

```bash
npm run init
```

Este comando:
- Crea la base de datos SQLite
- Ejecuta el schema completo
- Inserta datos de ejemplo:
  - Usuario admin (admin/admin123)
  - 3 productos precargados
  - 10 materias primas con stock
  - 6 materiales de empaque
  - Formulaciones completas

### 5. (Opcional) Configurar Variables de Entorno

```bash
cp .env.example .env
```

Editar `.env` con tus preferencias (opcional para desarrollo):
```env
PORT=3000
NODE_ENV=development
JWT_SECRET=tu_clave_secreta_jwt
SESSION_SECRET=tu_clave_secreta_sesion
```

### 6. Iniciar el Servidor

**Modo Desarrollo (con auto-reload):**
```bash
npm run dev
```

**Modo Producción:**
```bash
npm start
```

### 7. Acceder al Sistema

Abrir navegador en: **http://localhost:3000**

**Credenciales por defecto:**
- Usuario: `admin`
- Contraseña: `admin123`

⚠️ **IMPORTANTE**: Cambiar la contraseña del administrador inmediatamente después del primer login.

## 🎯 Verificación de Instalación

### Verificar que el servidor está corriendo:

1. Abrir http://localhost:3000
2. Debes ver la pantalla de login
3. Iniciar sesión con admin/admin123
4. Debes ver el dashboard con estadísticas

### Verificar datos de ejemplo:

1. Ir a "Productos" en el menú
2. Debes ver 3 productos:
   - Crema Hidratante Baba de Caracol
   - Shampoo Anticaída
   - Gel Antibacterial

3. Ir a "Materias Primas"
4. Debes ver 10 materias primas con stock

### Verificar funcionalidad de cálculos:

1. Ir a "Nuevo Registro"
2. Seleccionar un producto
3. Ingresar cantidad: 1000
4. Hacer clic en "Calcular Materiales"
5. Debes ver las cantidades teóricas calculadas automáticamente

## 🐛 Solución de Problemas Comunes

### Error: "Cannot find module"

```bash
# Reinstalar dependencias
rm -rf node_modules
npm install
cd backend
rm -rf node_modules
npm install
```

### Error: "EADDRINUSE: address already in use"

El puerto 3000 ya está en uso. Opciones:

1. Cambiar el puerto en `.env` o:
   ```bash
   PORT=3001 npm start
   ```

2. Cerrar la aplicación que usa el puerto 3000

### Error de base de datos

```bash
# Eliminar y reinicializar la base de datos
rm database/batch_records.db
npm run init
```

### No puedo hacer login

1. Verificar que el backend esté corriendo (ver consola)
2. Verificar URL: debe ser http://localhost:3000
3. Verificar credenciales: admin / admin123 (exactamente)
4. Abrir consola del navegador (F12) para ver errores

## 📱 Compatibilidad

### Navegadores Soportados

- ✅ Google Chrome 90+
- ✅ Microsoft Edge 90+
- ✅ Mozilla Firefox 88+
- ✅ Safari 14+

### Sistemas Operativos

- ✅ Windows 10/11
- ✅ macOS 10.15+
- ✅ Linux (Ubuntu, Debian, CentOS, etc.)

## 🔒 Primeros Pasos de Seguridad

Después de la instalación:

1. **Cambiar Contraseña de Admin**
   - Ir a Perfil → Cambiar Contraseña
   - Usar contraseña fuerte (mínimo 8 caracteres)

2. **Crear Usuarios Operadores**
   - Ir a Administración → Gestión de Usuarios
   - Crear usuario con rol "operator"
   - Asignar credenciales seguras

3. **Crear Usuario Verificador**
   - Ir a Administración → Gestión de Usuarios
   - Crear usuario con rol "verificador"

4. **Configurar Variables de Entorno**
   - Editar `.env` con claves secretas únicas
   - No usar las claves por defecto en producción

## 🎓 Siguiente Paso

Una vez instalado correctamente:

1. Leer la [Guía de Usuario](README.md#-uso-del-sistema)
2. Explorar los productos y formulaciones precargadas
3. Crear tu primer batch record de prueba
4. Revisar la documentación de la API

## 📞 Soporte

Si encuentras problemas:

1. Revisar esta guía completa
2. Verificar la consola del servidor y navegador
3. Consultar el [README.md](README.md) principal
4. Reportar issue con:
   - Versión de Node.js
   - Sistema operativo
   - Pasos para reproducir el error
   - Mensajes de error completos

## 🎉 ¡Instalación Completada!

Tu sistema de Batch Records está listo para usar. Disfruta de:

- ✅ Cálculos automáticos de materias primas
- ✅ Control de inventario en tiempo real
- ✅ Firmas digitales y auditoría
- ✅ Gestión completa de producción

---

**¡Éxito con tu gestión de batch records!** 📋✨
