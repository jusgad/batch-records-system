# 📋 Sistema de Gestión de Batch Records v2.0

## 🎯 Descripción

Sistema completo de gestión de registros de batch para manufactura farmacéutica y cosmética, con cálculos automáticos, control de stock, firmas digitales, y auditoría completa.

Desarrollado basándose en el repositorio [jusgad/batch](https://github.com/jusgad/batch) para implementar funcionalidades profesionales de gestión de producción.

## ✨ Características Principales

- ✅ **Gestión Completa de Productos y Formulaciones**
  - Productos con formulaciones predefinidas
  - Cálculo automático de materias primas
  - Validación de porcentajes (100%)
  - Alertas de stock insuficiente

- ✅ **Sistema de Batch Records**
  - Formularios dinámicos basados en producto
  - Cálculos automáticos de cantidades teóricas
  - Registro de cantidades reales dispensadas
  - Seguimiento de lotes de materias primas

- ✅ **Control de Inventario**
  - Gestión de materias primas
  - Materiales de empaque
  - Movimientos de stock automáticos
  - Alertas de stock mínimo

- ✅ **Seguridad y Roles**
  - **Admin**: Gestión completa del sistema
  - **Operator**: Creación y firma de batch records
  - **Verificador**: Verificación y aprobación de records
  - Autenticación JWT
  - Firmas digitales RSA

- ✅ **Auditoría Completa**
  - Registro de todas las acciones
  - Trazabilidad completa
  - Historial de cambios
  - IP y User Agent tracking

- ✅ **Cálculos Automáticos**
  - Materias primas según formulación
  - Materiales de empaque
  - Tiempos de producción
  - Totales y validaciones

## 🏗️ Arquitectura del Sistema

```
batch-records-system/
├── backend/                    # Servidor Node.js + Express
│   ├── server.js              # Servidor principal
│   └── package.json           # Dependencias del backend
├── frontend/                   # Frontend HTML/CSS/JS
│   ├── index.html             # Página principal
│   ├── styles/                # Archivos CSS
│   │   ├── main.css          # Estilos base y utilidades
│   │   ├── auth.css          # Estilos de autenticación
│   │   ├── dashboard.css     # Estilos del dashboard
│   │   ├── form.css          # Estilos de formularios
│   │   └── admin.css         # Estilos del panel admin
│   └── js/                    # Archivos JavaScript
│       ├── app.js            # Controlador principal
│       ├── api.js            # Cliente API
│       ├── auth.js           # Gestión de autenticación
│       ├── utils.js          # Utilidades
│       ├── records.js        # Gestión de registros
│       ├── admin.js          # Panel de administración
│       └── form-handler.js   # Manejo de formularios
└── database/                   # Base de datos
    └── schema.sql             # Esquema de la base de datos
```

## 📋 Roles y Permisos

### 🛡️ Administrador
- ✅ Gestión completa de usuarios (crear, editar, eliminar, asignar roles)
- ✅ Acceso a todos los registros (ver, editar, borrar)
- ✅ Control sobre generación y revocación de firmas digitales
- ✅ Acceso completo al rastro de auditoría
- ✅ Configuración del sistema

### 👨‍🔬 Operador
- ✅ Crear y editar registros de batch
- ✅ Acceso solo a sus propios registros
- ✅ Firmar digitalmente sus registros
- ❌ No puede modificar registros una vez firmados
- ❌ No puede ver registros de otros operadores

### 🔍 Verificador
- ✅ Acceso de solo lectura a todos los registros firmados
- ✅ Aprobar o rechazar registros
- ✅ Firmar digitalmente la verificación
- ❌ No puede modificar o crear registros
- ❌ No puede acceder a registros en borrador

## 🗄️ Base de Datos

### Tablas Principales

1. **users** - Información de usuarios y autenticación
2. **records** - Registros de batch con datos del formulario
3. **digital_signatures** - Claves públicas/privadas para firmas
4. **record_signatures** - Firmas digitales de los registros
5. **audit_trail** - Rastro de auditoría de todas las acciones
6. **user_sessions** - Gestión de sesiones de usuario

### Características de Seguridad

- Hashing de contraseñas con bcrypt (12 rounds)
- Tokens JWT con expiración de 8 horas
- Bloqueo de cuenta tras 5 intentos fallidos
- Rate limiting en endpoints críticos
- Validación de integridad con hash SHA-256

## 🚀 Instalación y Configuración

### Prerrequisitos

- Node.js 14+ 
- npm o yarn

### 1. Instalar Dependencias

```bash
cd backend
npm install
```

### 2. Configurar Base de Datos

La base de datos SQLite se inicializará automáticamente con el esquema incluido.

### 3. Variables de Entorno (Opcional)

Crear un archivo `.env` en el directorio `backend`:

```env
PORT=3000
NODE_ENV=development
JWT_SECRET=tu_clave_secreta_jwt
SESSION_SECRET=tu_clave_secreta_sesion
FRONTEND_URL=http://localhost:3000
```

### 4. Iniciar el Servidor

```bash
cd backend
npm start
```

Para desarrollo con auto-reload:

```bash
npm run dev
```

### 5. Acceder al Sistema

Abrir navegador en: `http://localhost:3000`

**Usuario por defecto:**
- Usuario: `admin`
- Contraseña: `admin123` (cambiar inmediatamente)

## 🎯 Uso del Sistema

### Para Operadores

1. **Crear Nuevo Registro**
   - Ir a "Nuevo Registro"
   - Completar información básica (Lote, Producto, Cantidad)
   - Navegar por las pestañas completando cada sección
   - Guardar como borrador o enviar directamente

2. **Completar Formulario**
   - **Control de Producción**: Lista de verificación y control de agua
   - **Fabricación**: Ingredientes, materias primas y protocolo
   - **Envasado**: Materiales y proceso de envasado
   - **Control de Calidad**: Parámetros y liberación de producto
   - **Rótulos**: Documentación de etiquetas usadas

3. **Firmar Registro**
   - Una vez completo, firmar digitalmente
   - El registro queda bloqueado para edición

### Para Verificadores

1. **Verificar Registros**
   - Acceder a "Verificaciones Pendientes"
   - Revisar registros firmados por operadores
   - Aprobar o rechazar con comentarios

### Para Administradores

1. **Gestión de Usuarios**
   - Crear usuarios con roles específicos
   - Editar información y permisos
   - Desactivar/activar cuentas
   - Restablecer contraseñas

2. **Auditoría**
   - Revisar historial completo de acciones
   - Filtrar por usuario, fecha o tipo de acción
   - Exportar reportes

## 🔧 Funcionalidades Avanzadas

### Firmas Digitales

- Generación automática de pares de claves RSA-2048
- Firma SHA-256 de datos del formulario
- Verificación de integridad automática
- Almacenamiento seguro de claves

### Sistema de Auditoría

- Registro automático de todas las acciones
- Información de IP y User-Agent
- Detalles en formato JSON
- Retención configurable

### Auto-guardado

- Guardado automático cada 30 segundos
- Recuperación de borradores
- Indicador visual de cambios sin guardar

### Exportación

- Exportación de registros en CSV/PDF
- Impresión optimizada de formularios
- Reportes de auditoría

## 📱 Compatibilidad

### Navegadores Soportados

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+

### Dispositivos

- ✅ Escritorio (1024px+)
- ✅ Tablet (768px - 1024px)
- ✅ Móvil (320px - 768px)

## 🔒 Seguridad

### Medidas Implementadas

- Autenticación JWT con expiración
- Rate limiting en API
- Validación de entrada
- Headers de seguridad (Helmet.js)
- Protección CSRF
- Sesiones seguras

### Mejores Prácticas

- Cambiar credenciales por defecto
- Usar HTTPS en producción
- Configurar firewall apropiado
- Realizar backups regulares
- Monitorear logs de auditoría

## 🐛 Solución de Problemas

### Problemas Comunes

**Error de conexión a la base de datos:**
```bash
# Verificar permisos del directorio
chmod 755 database/
```

**Sesión expirada constantemente:**
- Verificar sincronización de fecha/hora del servidor
- Revisar configuración de JWT_SECRET

**Problemas de CORS:**
- Configurar FRONTEND_URL correctamente
- Verificar configuración de proxy

### Logs

Los logs se almacenan en:
- Consola del servidor para desarrollo
- Archivos de log en producción (configurar según necesidad)

## 🚀 Despliegue en Producción

### 1. Configuración de Entorno

```env
NODE_ENV=production
PORT=80
JWT_SECRET=clave_secreta_muy_fuerte
SESSION_SECRET=otra_clave_muy_fuerte
```

### 2. Proxy Reverso (Nginx)

```nginx
server {
    listen 80;
    server_name tu-dominio.com;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

### 3. Proceso Manager (PM2)

```bash
npm install -g pm2
pm2 start server.js --name batch-records
pm2 startup
pm2 save
```

## 🤝 Contribuir

1. Fork el proyecto
2. Crear rama feature (`git checkout -b feature/AmazingFeature`)
3. Commit cambios (`git commit -m 'Add AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abrir Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT - ver [LICENSE](LICENSE) para detalles.

## 📞 Soporte

Para soporte técnico o reportar bugs:

- 🐛 **Issues**: [GitHub Issues](https://github.com/usuario/batch-records-system/issues)
- 📧 **Email**: soporte@empresa.com
- 📖 **Documentación**: [Wiki del proyecto](https://github.com/usuario/batch-records-system/wiki)

## 🎉 Créditos

Desarrollado basándose en el repositorio [jusgad/batchrecord](https://github.com/jusgad/batchrecord) como base para el sistema de formularios MARIPOSA.

## 🔄 Changelog

### v1.0.0 (2025-01-XX)
- ✨ Implementación inicial completa
- 🔐 Sistema de autenticación y autorización
- 📝 Formularios multi-página con auto-guardado
- 🔏 Firmas digitales y auditoría
- 📱 Diseño responsivo completo
- 👥 Gestión de usuarios y roles

---

**¡Gracias por usar el Sistema de Batch Records!** 🎯