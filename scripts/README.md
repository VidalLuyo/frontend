# Scripts del Proyecto

## 🚀 create-module.js

Script para **generar automáticamente** la estructura completa de un módulo CRUD.

### Uso

```bash
# PowerShell
node .\scripts\create-module.js <nombre-modulo>

# Ejemplos:
node .\scripts\create-module.js academic
node .\scripts\create-module.js events
node .\scripts\create-module.js grades
```

### Módulos Disponibles

| Comando | Módulo | Ruta |
|---------|--------|------|
| `academic` | Gestión Académica | `/gestion-academica` |
| `events` | Eventos | `/eventos` |
| `grades` | Notas | `/notas` |
| `attendance` | Asistencias | `/asistencias` |
| `behavior` | Comportamiento | `/comportamiento` |
| `teacher` | Gestión de Profesores | `/cursos` |
| `psychology` | Psicología | `/psicologia` |

### ¿Qué hace el script?

1. **Crea la estructura de carpetas:**
   - `models/`
   - `components/`
   - `pages/`
   - `routes/`
   - `service/`

2. **Genera los archivos:**
   - Modelo de datos con TypeScript
   - Componente de lista
   - 4 páginas (Lista, Crear, Detalle, Editar)
   - Archivo de rutas
   - Servicio con métodos CRUD

3. **Incluye código base:**
   - Interfaces TypeScript
   - Componentes funcionales React
   - Navegación con React Router
   - Estilos con Tailwind CSS
   - Estructura lista para usar

### Después de generar un módulo

1. **Importar las rutas en `AppRouter.tsx`:**

   ```typescript
   import { academicRoutes } from "../../modules/academic/routes/academic.routes"

   // Dentro del DashboardLayout:
   {academicRoutes}
   ```

2. **Personalizar el modelo** según las necesidades específicas

3. **Implementar los componentes Create, Edit, Detail** con sus formularios

4. **Conectar el servicio** con la API real

### Ejemplo Completo

```bash
# 1. Generar el módulo
node .\scripts\create-module.js events

# 2. El script crea:
# src/modules/events/
#   ├── models/events.model.ts
#   ├── components/EventList.tsx
#   ├── pages/
#   │   ├── EventPage.tsx
#   │   ├── EventCreatePage.tsx
#   │   ├── EventDetailPage.tsx
#   │   └── EventEditPage.tsx
#   ├── routes/events.routes.tsx
#   └── service/Event.service.tsx

# 3. Agregar al AppRouter
# 4. Personalizar según necesidades
# 5. ¡Listo para usar!
```

## 📖 module-generator.js

Script **informativo** que muestra la configuración y estructura de todos los módulos. No genera archivos automáticamente.

### Uso

```bash
node .\scripts\module-generator.js
```

Muestra:

- Lista de módulos configurados
- Estructura de carpetas requerida
- Archivos que deben crearse
- Pasos de integración

## 💡 Tips

- Ejecuta `create-module.js` para crear rápidamente nuevos módulos
- Usa el módulo `student` como referencia para funcionalidad completa
- Los archivos generados incluyen TODOs donde debes implementar lógica
- Personaliza las plantillas en `create-module.js` según tus necesidades

## 🐛 Troubleshooting

**Error: "Cannot find module"**

- Asegúrate de estar en la raíz del proyecto
- Verifica que tienes Node.js instalado

**El módulo no aparece**

- Verifica que agregaste las rutas en `AppRouter.tsx`
- Revisa que importaste correctamente

**Errores de compilación**

- El código generado puede necesitar ajustes según tu configuración ESLint
- Revisa las importaciones de tipos
