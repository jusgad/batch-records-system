# Configuración de Sincronización de Base de Datos Externa

Este documento explica cómo configurar y usar el sistema de sincronización de bases de datos externas para importar productos e ingredientes.

## Características

- ✅ Soporte para múltiples tipos de bases de datos: **MySQL**, **PostgreSQL**, **SQLite**, **SQL Server**
- ✅ Sincronización automática de productos y sus ingredientes/formulaciones
- ✅ Actualización automática de tablas de materias primas
- ✅ Mapeo flexible de campos entre BD externa y BD local
- ✅ Historial completo de sincronizaciones
- ✅ Solo accesible por usuarios con rol de **admin**

## Configuración de Conexión

### Estructura de Configuración

```json
{
  "name": "Mi Base de Datos de Productos",
  "db_type": "mysql",
  "host": "localhost",
  "port": 3306,
  "database_name": "productos_db",
  "username": "usuario",
  "password": "contraseña",
  "tables_config": {
    "products": "productos",
    "ingredients": "materias_primas",
    "productFormulation": "producto_ingredientes"
  },
  "field_mappings": {
    "products": {
      "id": "id",
      "code": "codigo",
      "name": "nombre",
      "description": "descripcion",
      "unit": "unidad",
      "active": "activo = 1"
    },
    "formulation": {
      "product_id": "producto_id",
      "ingredient_id": "ingrediente_id",
      "ingredient_name": "ingrediente_nombre",
      "percentage": "porcentaje",
      "unit": "unidad"
    },
    "ingredients": {
      "id": "id",
      "code": "codigo",
      "name": "nombre",
      "unit": "unidad",
      "stock": "stock_actual",
      "price": "precio_unitario",
      "active": "activo = 1"
    }
  }
}
```

### Parámetros de Conexión

#### Campos Obligatorios
- `name`: Nombre descriptivo de la conexión
- `db_type`: Tipo de base de datos (`mysql`, `postgres`, `sqlite`, `mssql`)

#### Para MySQL / PostgreSQL / SQL Server
- `host`: Dirección del servidor
- `port`: Puerto (MySQL: 3306, PostgreSQL: 5432, SQL Server: 1433)
- `database_name`: Nombre de la base de datos
- `username`: Usuario de conexión
- `password`: Contraseña

#### Para SQLite
- `file_path`: Ruta completa al archivo de base de datos

### Configuración de Tablas

El objeto `tables_config` especifica los nombres de las tablas en la base de datos externa:

```json
{
  "products": "nombre_tabla_productos",
  "ingredients": "nombre_tabla_ingredientes",
  "productFormulation": "nombre_tabla_formulacion"
}
```

### Mapeo de Campos

El objeto `field_mappings` mapea los campos de la BD externa a los campos esperados:

#### Para Productos (`products`)
```json
{
  "id": "campo_id_externo",
  "code": "campo_codigo",
  "name": "campo_nombre",
  "description": "campo_descripcion",
  "unit": "campo_unidad",
  "active": "condicion_activo"  // Ej: "estado = 'ACTIVO'" o "activo = 1"
}
```

#### Para Formulación (`formulation`)
```json
{
  "product_id": "campo_producto_id",
  "ingredient_id": "campo_ingrediente_id",
  "ingredient_name": "campo_nombre_ingrediente",
  "percentage": "campo_porcentaje",
  "unit": "campo_unidad"
}
```

#### Para Ingredientes (`ingredients`)
```json
{
  "id": "campo_id",
  "code": "campo_codigo",
  "name": "campo_nombre",
  "unit": "campo_unidad",
  "stock": "campo_stock",
  "price": "campo_precio",
  "active": "condicion_activo"
}
```

## Uso de las APIs

### 1. Crear Conexión

**Endpoint:** `POST /api/external-db/connections`

**Headers:**
```
Authorization: Bearer {token}
Content-Type: application/json
```

**Body:**
```json
{
  "name": "BD Productos Principal",
  "db_type": "mysql",
  "host": "192.168.1.100",
  "port": 3306,
  "database_name": "productos",
  "username": "admin",
  "password": "password123",
  "tables_config": {
    "products": "productos",
    "productFormulation": "producto_ingredientes"
  },
  "field_mappings": {
    "products": {
      "id": "id",
      "code": "codigo",
      "name": "nombre",
      "unit": "unidad_medida"
    },
    "formulation": {
      "product_id": "id_producto",
      "ingredient_name": "nombre_ingrediente",
      "percentage": "porcentaje"
    }
  }
}
```

### 2. Probar Conexión

**Endpoint:** `POST /api/external-db/test-connection`

**Body:**
```json
{
  "db_type": "mysql",
  "host": "192.168.1.100",
  "port": 3306,
  "database_name": "productos",
  "username": "admin",
  "password": "password123"
}
```

**Respuesta exitosa:**
```json
{
  "success": true,
  "message": "Connection successful"
}
```

### 3. Ejecutar Sincronización

**Endpoint:** `POST /api/external-db/sync/{connection_id}`

**Respuesta:**
```json
{
  "success": true,
  "productsImported": 15,
  "ingredientsImported": 45,
  "errors": [],
  "details": [
    {
      "action": "created",
      "product": "Crema Hidratante",
      "code": "PROD-001"
    },
    {
      "action": "updated",
      "product": "Shampoo Anticaída",
      "code": "PROD-002"
    }
  ]
}
```

### 4. Ver Historial de Sincronización

**Endpoint:** `GET /api/external-db/sync-history?connection_id={id}`

**Respuesta:**
```json
[
  {
    "id": 1,
    "connection_name": "BD Productos Principal",
    "sync_type": "FULL",
    "status": "SUCCESS",
    "records_imported": 15,
    "records_updated": 3,
    "errors_count": 0,
    "started_at": "2025-10-07T10:30:00",
    "completed_at": "2025-10-07T10:31:45",
    "executed_by_name": "Admin User"
  }
]
```

### 5. Listar Conexiones

**Endpoint:** `GET /api/external-db/connections`

### 6. Obtener Conexión Específica

**Endpoint:** `GET /api/external-db/connections/{id}`

### 7. Actualizar Conexión

**Endpoint:** `PUT /api/external-db/connections/{id}`

### 8. Eliminar Conexión

**Endpoint:** `DELETE /api/external-db/connections/{id}`

## Ejemplos de Configuración

### MySQL - Sistema de Producción

```json
{
  "name": "MySQL - Producción",
  "db_type": "mysql",
  "host": "prod-server.empresa.com",
  "port": 3306,
  "database_name": "fabricacion",
  "username": "sync_user",
  "password": "SecurePass123!",
  "tables_config": {
    "products": "tbl_productos",
    "productFormulation": "tbl_formulas",
    "ingredients": "tbl_materias_primas"
  },
  "field_mappings": {
    "products": {
      "id": "producto_id",
      "code": "sku",
      "name": "producto_nombre",
      "description": "descripcion",
      "unit": "unidad",
      "active": "estado = 'ACTIVO'"
    },
    "formulation": {
      "product_id": "producto_id",
      "ingredient_id": "materia_prima_id",
      "ingredient_name": "mp_nombre",
      "percentage": "porcentaje_formula"
    }
  }
}
```

### PostgreSQL - Base de Datos Corporativa

```json
{
  "name": "PostgreSQL - Corporativo",
  "db_type": "postgres",
  "host": "postgres.empresa.local",
  "port": 5432,
  "database_name": "erp_produccion",
  "username": "readonly_user",
  "password": "ReadOnly2024",
  "tables_config": {
    "products": "inventory.products",
    "productFormulation": "production.formulations"
  },
  "field_mappings": {
    "products": {
      "id": "product_id",
      "code": "product_code",
      "name": "product_name",
      "unit": "measurement_unit"
    }
  }
}
```

### SQLite - Base de Datos Local

```json
{
  "name": "SQLite - Local",
  "db_type": "sqlite",
  "file_path": "/var/data/productos.db",
  "tables_config": {
    "products": "productos",
    "ingredients": "ingredientes"
  },
  "field_mappings": {
    "products": {
      "id": "id",
      "code": "codigo",
      "name": "nombre"
    }
  }
}
```

## Proceso de Sincronización

1. **Conexión**: El sistema se conecta a la BD externa con las credenciales configuradas
2. **Extracción**: Obtiene los productos y sus ingredientes según el mapeo configurado
3. **Validación**: Verifica si los productos ya existen en el sistema local (por código)
4. **Actualización**:
   - Si el producto existe: actualiza sus datos
   - Si no existe: crea un nuevo registro
5. **Formulación**: Sincroniza los ingredientes/materias primas de cada producto
6. **Registro**: Guarda el historial de la sincronización con estadísticas

## Notas Importantes

- ⚠️ Solo usuarios con rol **admin** pueden configurar y ejecutar sincronizaciones
- ⚠️ Las contraseñas se almacenan con hash SHA-256 (en producción se recomienda encriptación más robusta)
- ⚠️ La sincronización elimina la formulación anterior del producto antes de insertar la nueva
- ⚠️ Los ingredientes que no existen se crean automáticamente con código `EXT-{id}`
- ✅ Todas las operaciones se registran en el audit trail
- ✅ El historial de sincronización se mantiene para auditoría

## Instalación de Dependencias

Después de actualizar el código, instalar las nuevas dependencias:

```bash
cd backend
npm install mysql2 pg mssql
```

## Estructura de Base de Datos

El schema incluye dos nuevas tablas:

- `external_db_connections`: Almacena las configuraciones de conexión
- `sync_history`: Registra el historial de todas las sincronizaciones

Estas tablas se crean automáticamente al inicializar la base de datos con el schema actualizado.
