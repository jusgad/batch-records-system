# Batch Records System - Mockup Funcional

Mockup completamente funcional del Sistema de Gestión de Batch Records para la industria farmacéutica y cosmética.

## 🚀 Cómo Usar

### Opción 1: Abrir directamente en el navegador

1. Navega a la carpeta `batch-records-system-mockup`
2. Abre el archivo `index.html` en tu navegador web
3. ¡Listo! El mockup está funcionando

### Opción 2: Usar un servidor local (recomendado)

```bash
# Desde la carpeta del mockup
python -m http.server 8080
# o si tienes Python 2
python -m SimpleHTTPServer 8080

# Luego abre en tu navegador:
# http://localhost:8080
```

## 🔐 Credenciales de Acceso

### Administrador
- **Usuario:** admin
- **Contraseña:** admin123
- **Permisos:** Acceso completo al sistema

### Operador
- **Usuario:** operator1
- **Contraseña:** operator123
- **Permisos:** Crear y firmar batch records

### Verificador
- **Usuario:** verificator1
- **Contraseña:** verif123
- **Permisos:** Revisar y aprobar batch records

## ✨ Funcionalidades Implementadas

### 1. Autenticación
- ✅ Login con validación de usuario/contraseña
- ✅ Sesión persistente (sessionStorage)
- ✅ Logout
- ✅ Roles de usuario

### 2. Dashboard
- ✅ Estadísticas en tiempo real (total, aprobados, pendientes, alertas)
- ✅ Tabla de producción reciente
- ✅ Alertas de stock bajo
- ✅ Cards con iconos y colores

### 3. Nuevo Batch Record
- ✅ Formulario completo de creación
- ✅ Selección de producto
- ✅ **Cálculo automático de materias primas** (inspirado en jusgad/batch)
- ✅ Tabla dinámica de formulación con porcentajes
- ✅ Cálculo de materiales de empaque
- ✅ Cálculo de horas trabajadas
- ✅ Validación de totales
- ✅ Campos para lote y dispensador

### 4. Registros
- ✅ Lista de todos los batch records
- ✅ Filtrado por estado
- ✅ Vista detallada en modal
- ✅ Badges de estado (aprobado, pendiente, en proceso)
- ✅ Acciones (ver, editar, imprimir)

### 5. Productos
- ✅ Grid de productos con cards
- ✅ Vista de formulación completa
- ✅ Modal con tabla de ingredientes y porcentajes
- ✅ 3 productos precargados

### 6. Materias Primas
- ✅ Tabla completa de inventario
- ✅ Stock actual y mínimo
- ✅ Alertas de stock bajo
- ✅ Precios y proveedores
- ✅ 10 materias primas precargadas

### 7. Reportes
- ✅ Cards de reportes disponibles
- ✅ Opciones de exportación (preparado para implementar)

### 8. Auditoría
- ✅ Tabla de log de acciones
- ✅ Estructura lista para datos reales

### 9. Administración
- ✅ Gestión de usuarios
- ✅ Tabla de usuarios con roles y estados

## 📊 Datos Precargados

### Productos (3)
1. **Crema Hidratante Baba de Caracol** - 8 ingredientes
2. **Shampoo Anticaída** - 9 ingredientes
3. **Gel Antibacterial** - 6 ingredientes

### Materias Primas (10)
- MP-001: Extracto de baba de caracol
- MP-002: Glicerina USP
- MP-003: Agua desionizada
- MP-004: Conservador Germall
- MP-005: Fragancia natural
- MP-006: Colorante natural
- MP-007: Espesante Carbopol
- MP-008: Emulsificante Polawax
- MP-009: Lauril Sulfato de Sodio
- MP-010: Alcohol Etílico 70%

### Batch Records (5)
- 2 aprobados
- 2 pendientes
- 1 en proceso

### Usuarios (4)
- 1 administrador
- 2 operadores
- 1 verificador

## 🧮 Cálculos Automáticos

### Ejemplo Real:

**Producto:** Crema Hidratante Baba de Caracol
**Cantidad a producir:** 1000 KG

El sistema calcula automáticamente:
- Extracto de caracol (10%): **100 KG**
- Glicerina (15%): **150 KG**
- Agua (60%): **600 KG**
- Y todos los demás ingredientes...

**Total de porcentajes:** 100%
**Total teórico:** 1000 KG

## 🎨 Características de UI/UX

- ✅ Diseño responsive (funciona en móviles y tablets)
- ✅ Sidebar colapsable
- ✅ Menú de usuario con dropdown
- ✅ Modal para detalles
- ✅ Badges de estado con colores
- ✅ Iconos Font Awesome
- ✅ Animaciones suaves
- ✅ Scrollbar personalizado
- ✅ Colores profesionales
- ✅ Cards con hover effects

## 🔧 Estructura de Archivos

```
batch-records-system-mockup/
├── index.html          # Página principal con todas las vistas
├── css/
│   └── styles.css      # Estilos completos del sistema
├── js/
│   ├── data.js         # Datos mock y helpers
│   └── app.js          # Lógica principal de la aplicación
└── README.md           # Este archivo
```

## 💡 Flujo de Uso Recomendado

### 1. Login
- Ingresa con `admin / admin123`

### 2. Explorar Dashboard
- Ve las estadísticas
- Revisa los registros recientes
- Observa las alertas de stock

### 3. Crear un Batch Record
- Ve a "Nuevo Registro"
- Selecciona "Crema Hidratante Baba de Caracol"
- Ingresa cantidad: `1000`
- Haz click en "Calcular Materiales"
- **Observa cómo se calculan automáticamente todos los ingredientes**
- Completa los campos de cantidad real, lote y dispensador
- Guarda el registro

### 4. Ver Productos
- Ve a "Productos"
- Haz click en "Formulación" de cualquier producto
- Observa la tabla completa de ingredientes

### 5. Ver Inventario
- Ve a "Materias Primas"
- Observa el stock actual de cada materia prima
- Ve cuáles tienen stock bajo (badge amarillo)

## 🎯 Diferencias con el Sistema Real

Este es un **mockup funcional** que simula el comportamiento del sistema real:

| Aspecto | Mockup | Sistema Real |
|---------|--------|--------------|
| Base de datos | JavaScript (memoria) | SQLite |
| Autenticación | sessionStorage | JWT + Backend |
| Persistencia | Solo en sesión | Permanente |
| Firmas digitales | Simuladas | RSA-2048 real |
| API | No hay | Express REST API |
| Validación | Frontend | Frontend + Backend |

## 🚀 Próximos Pasos

Para convertir este mockup en el sistema real:

1. Conectar con el backend (`/backend/server.js`)
2. Reemplazar `mockData` con llamadas a la API
3. Implementar firmas digitales reales
4. Agregar validaciones del backend
5. Implementar exportación a PDF/Excel
6. Agregar gráficos con Chart.js

## 📱 Responsive Design

El mockup funciona perfectamente en:
- ✅ Desktop (1920x1080+)
- ✅ Laptop (1366x768+)
- ✅ Tablet (768x1024)
- ✅ Mobile (375x667+)

En móviles, el sidebar se oculta y puede desplegarse con el botón hamburguesa.

## 🎨 Paleta de Colores

- **Primary:** #4F46E5 (Indigo)
- **Success:** #10B981 (Green)
- **Warning:** #F59E0B (Amber)
- **Danger:** #EF4444 (Red)
- **Info:** #3B82F6 (Blue)

## ⚡ Rendimiento

- Carga instantánea (sin dependencias externas excepto Font Awesome)
- Navegación fluida entre páginas
- Animaciones suaves con CSS
- Código optimizado y comentado

## 📝 Notas

- Todos los datos son simulados y se reinician al recargar la página
- Las funcionalidades de editar, eliminar e imprimir están preparadas pero no implementadas
- Los botones de exportación están listos para conectar con bibliotecas reales
- El sistema está listo para ser integrado con el backend real

---

**Desarrollado como mockup funcional del Batch Records System v2.0**

¡Disfruta explorando el mockup! 🎉
