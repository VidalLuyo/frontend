# 🚀 Guía Rápida - Creación de Módulos CRUD

## ✅ Ya Implementados

- ✅ **student** - Estudiantes (`/estudiantes`) - COMPLETO con todos los componentes
- ✅ **institution** - Institución (`/institucion`) - Estructura base
- ✅ **events** - Eventos (`/eventos`) - Generado automáticamente

## 📦 Creación Automática de Módulos

### Paso 1: Generar el módulo

```powershell
# En la raíz del proyecto ejecuta:
node .\scripts\create-module.js <nombre-modulo>
```

**Módulos disponibles:**

```powershell
node .\scripts\create-module.js academic      # Gestión Académica
node .\scripts\create-module.js grades        # Notas
node .\scripts\create-module.js attendance    # Asistencias
node .\scripts\create-module.js behavior      # Comportamiento
node .\scripts\create-module.js teacher       # Gestión de Profesores
node .\scripts\create-module.js psychology    # Psicología
```

### Paso 2: Integrar en AppRouter

Después de generar un módulo, agrega sus rutas en `src/app/router/AppRouter.tsx`:

```typescript
// 1. Importar las rutas (agregar al inicio del archivo)
import { academicRoutes } from "../../modules/academic/routes/academic.routes";

// 2. Agregar dentro del DashboardLayout (línea ~28)
<Route path="/" element={<DashboardLayout />}>
     {studentRoutes}
     {institutionRoutes}
     {eventsRoutes}
     {academicRoutes}  // ⬅️ Agregar aquí

     {/* Otras rutas... */}
</Route>
```

### Paso 3: Personalizar (opcional)

1. **Modelo de datos** → `src/modules/<modulo>/models/<modulo>.model.ts`
   - Agrega campos específicos según necesidades

2. **Componentes** → `src/modules/<modulo>/components/`
   - Implementa los formularios de Create y Edit
   - Personaliza la vista de Detail

3. **Servicio** → `src/modules/<modulo>/service/`
   - Conecta con la API real
   - Reemplaza datos de ejemplo

## 📋 Estructura Generada

Cada módulo incluye automáticamente:

```
src/modules/<nombre-modulo>/
├── models/
│   └── <modulo>.model.ts          # Interfaces TypeScript
├── components/
│   └── <Entity>List.tsx           # Tabla con datos
├── pages/
│   ├── <Entity>Page.tsx           # Lista principal ✅
│   ├── <Entity>CreatePage.tsx    # Crear nuevo ⚠️
│   ├── <Entity>DetailPage.tsx    # Ver detalles ⚠️
│   └── <Entity>EditPage.tsx      # Editar registro ⚠️
├── routes/
│   └── <modulo>.routes.tsx        # Rutas React Router
└── service/
    └── <Entity>.service.tsx       # Métodos API
```

**Leyenda:**

- ✅ = Funcional con datos de ejemplo
- ⚠️ = Esqueleto para implementar

## 🎯 Ejemplo Completo

### Crear módulo de Notas (Grades)

```powershell
# 1. Generar estructura
node .\scripts\create-module.js grades

# 2. El script creará todo automáticamente
# ✅ Carpetas y archivos
# ✅ Código base funcional
# ✅ Componentes React
# ✅ Rutas configuradas
```

### Integrar en el Router

Edita `src/app/router/AppRouter.tsx`:

```typescript
// Agregar import
import { gradesRoutes } from "../../modules/grades/routes/grades.routes";

// Agregar en el DashboardLayout
{gradesRoutes}
```

### Personalizar el Modelo

Edita `src/modules/grades/models/grades.model.ts`:

```typescript
export interface Grade {
  id: string
  studentId: string        // ⬅️ Agregar
  subjectId: string        // ⬅️ Agregar
  score: number            // ⬅️ Agregar
  period: string           // ⬅️ Agregar
  name: string
  description?: string
  status: 'active' | 'inactive'
  createdAt: string
  updatedAt: string
}
```

### Probar

1. Inicia el proyecto: `npm run dev`
2. Navega a `/notas`
3. Verás la lista con datos de ejemplo
4. Las rutas `/notas/nuevo`, `/notas/:id`, `/notas/:id/editar` están listas

## 🔄 Flujo de Trabajo Recomendado

### Para Desarrollo Rápido

```powershell
# 1. Generar todos los módulos pendientes
node .\scripts\create-module.js academic
node .\scripts\create-module.js grades
node .\scripts\create-module.js attendance
node .\scripts\create-module.js behavior
node .\scripts\create-module.js teacher
node .\scripts\create-module.js psychology

# 2. Integrar rutas en AppRouter.tsx

# 3. Personalizar modelos según necesidades

# 4. Implementar formularios y servicios gradualmente
```

### Para Desarrollo Controlado

1. Genera un módulo a la vez
2. Completa su implementación (formularios, servicio)
3. Prueba exhaustivamente
4. Continúa con el siguiente

## 💡 Tips Importantes

### ✅ DO (Hacer)

- Usa el script para generar la estructura base
- Personaliza los modelos según tus necesidades específicas
- Implementa validaciones en los formularios
- Conecta los servicios con tu API real
- Usa el módulo `student` como referencia completa

### ❌ DON'T (No Hacer)

- No modifiques la estructura de carpetas generada
- No olvides agregar las rutas en AppRouter
- No elimines los archivos .tsx generados (son plantillas)
- No copies/pegues código sin adaptar nombres

## 🐛 Solución de Problemas

### "Cannot find module"

```powershell
# Verifica que estás en la raíz del proyecto
pwd  # Debe mostrar: ...\vg-web-sigei-develop

# Si no estás en la raíz:
cd C:\Users\javie\Downloads\vg-web-sigei-develop
```

### "El módulo no aparece en la navegación"

1. Verifica que agregaste las rutas en `AppRouter.tsx`
2. Revisa que el import es correcto
3. Asegúrate de que está dentro del `<Route path="/" element={<DashboardLayout />}>`

### "Errores de TypeScript"

Los archivos generados pueden tener algunos TODOs y warnings de ESLint que debes resolver al implementar:

- Importaciones de tipos
- Labels para formularios
- TODOs en servicios

## 📚 Recursos

- **Módulo Completo:** `src/modules/student/` - Referencia completa
- **Guía Detallada:** `MODULAR_STRUCTURE_GUIDE.md` - Patrones y convenciones
- **Resumen:** `IMPLEMENTATION_SUMMARY.md` - Estado actual del proyecto
- **Scripts:** `scripts/README.md` - Documentación de scripts

## 🎉 ¡Listo

Ahora puedes crear todos los módulos CRUD de forma rápida y consistente. El script hace el trabajo pesado, tú solo personalizas según tus necesidades.

**Próximo paso:** Genera los módulos restantes y comienza a implementar la lógica específica de cada uno.
