# Guía de Estructura Modular - Sistema SIGEI

## 📁 Estructura de Carpetas por Módulo

Cada módulo debe seguir esta estructura consistente:

```
modules/
  <nombre-modulo>/
    models/
      <nombre-modulo>.model.ts
    components/
      <Nombre>List.tsx
      <Nombre>Create.tsx
      <Nombre>Detail.tsx
      <Nombre>Edit.tsx
    pages/
      <Nombre>Page.tsx           (Lista principal)
      <Nombre>CreatePage.tsx     (Crear)
      <Nombre>DetailPage.tsx     (Ver detalle)
      <Nombre>EditPage.tsx       (Editar)
    routes/
      <nombre-modulo>.routes.tsx
    service/
      <Nombre>.service.tsx
```

## 🎯 Módulos del Sistema

### Módulos Completados ✅

- [x] **student** - Estudiantes

### Módulos Pendientes 🔄

- [ ] **institution** - Institución
- [ ] **academic** - Gestión Académica
- [ ] **events** - Eventos
- [ ] **grades** - Notas
- [ ] **attendance** - Asistencias
- [ ] **behavior** - Comportamiento
- [ ] **TeacherManagement** - Gestión de Profesores
- [ ] **psychology** - Psicología

## 📝 Plantilla para Crear un Módulo

### 1. Modelo de Datos (`models/<module>.model.ts`)

```typescript
export interface <Entity> {
  id: string
  // Campos específicos del módulo
  status: 'active' | 'inactive'
  createdAt: string
  updatedAt: string
}

export interface Create<Entity>Dto {
  // Campos requeridos para crear
}

export interface Update<Entity>Dto extends Partial<Create<Entity>Dto> {
  status?: 'active' | 'inactive'
}
```

### 2. Componentes CRUD

#### Lista (`components/<Entity>List.tsx`)

- Tabla con datos del módulo
- Botones: Ver, Editar, Eliminar
- Navegación a detalle y edición

#### Crear (`components/<Entity>Create.tsx`)

- Formulario para nuevos registros
- Validaciones
- Botones: Guardar, Cancelar

#### Detalle (`components/<Entity>Detail.tsx`)

- Vista de solo lectura de un registro
- Botones: Volver, Editar

#### Editar (`components/<Entity>Edit.tsx`)

- Formulario pre-cargado con datos
- Selector de estado
- Botones: Actualizar, Cancelar

### 3. Páginas

#### Página Principal (`pages/<Entity>Page.tsx`)

```typescript
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { <Entity>List } from '../components/<Entity>List'
import type { <Entity> } from '../models/<module>.model'

export function <Entity>Page() {
  const navigate = useNavigate()
  const [items, setItems] = useState<<Entity>[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Cargar datos
  }, [])

  const handleDelete = async (id: string) => {
    // Implementar eliminación
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Título</h1>
          <p className="mt-2 text-sm text-gray-600">Descripción</p>
        </div>
        <button
          onClick={() => navigate('/<ruta>/nuevo')}
          className="px-4 py-2 bg-indigo-600 text-white rounded-md"
        >
          Nuevo Registro
        </button>
      </div>
      <<Entity>List items={items} onDelete={handleDelete} />
    </div>
  )
}
```

#### Otras Páginas

- `<Entity>CreatePage.tsx` - Wrapper para componente Create
- `<Entity>DetailPage.tsx` - Carga datos y muestra Detail
- `<Entity>EditPage.tsx` - Carga datos y muestra Edit

### 4. Rutas (`routes/<module>.routes.tsx`)

```typescript
import { Route } from 'react-router-dom'
import { <Entity>Page } from '../pages/<Entity>Page'
import { <Entity>CreatePage } from '../pages/<Entity>CreatePage'
import { <Entity>DetailPage } from '../pages/<Entity>DetailPage'
import { <Entity>EditPage } from '../pages/<Entity>EditPage'

export const <module>Routes = (
  <>
    <Route path="<ruta>" element={<<Entity>Page />} />
    <Route path="<ruta>/nuevo" element={<<Entity>CreatePage />} />
    <Route path="<ruta>/:id" element={<<Entity>DetailPage />} />
    <Route path="<ruta>/:id/editar" element={<<Entity>EditPage />} />
  </>
)
```

### 5. Servicio (`service/<Entity>.service.tsx`)

```typescript
import type { <Entity>, Create<Entity>Dto, Update<Entity>Dto } from '../models/<module>.model'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'

export const <module>Service = {
  async getAll(): Promise<<Entity>[]> {
    const response = await fetch(`${API_URL}/<endpoint>`)
    return response.json()
  },

  async getById(id: string): Promise<<Entity>> {
    const response = await fetch(`${API_URL}/<endpoint>/${id}`)
    return response.json()
  },

  async create(data: Create<Entity>Dto): Promise<<Entity>> {
    const response = await fetch(`${API_URL}/<endpoint>`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    return response.json()
  },

  async update(id: string, data: Update<Entity>Dto): Promise<<Entity>> {
    const response = await fetch(`${API_URL}/<endpoint>/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    return response.json()
  },

  async delete(id: string): Promise<void> {
    await fetch(`${API_URL}/<endpoint>/${id}`, {
      method: 'DELETE',
    })
  },
}
```

## 🔗 Integración en AppRouter

En `src/app/router/AppRouter.tsx`:

```typescript
import { <module>Routes } from "../../modules/<module>/routes/<module>.routes"

// Dentro del Routes:
<Route path="/" element={<DashboardLayout />}>
  {<module>Routes}
  {/* otros módulos */}
</Route>
```

## 🗺️ Mapeo de Rutas por Módulo

| Módulo | Ruta Base | Entidad |
|--------|-----------|---------|
| student | `/estudiantes` | Student |
| institution | `/institucion` | Institution |
| academic | `/gestion-academica` | Academic |
| events | `/eventos` | Event |
| grades | `/notas` | Grade |
| attendance | `/asistencias` | Attendance |
| behavior | `/comportamiento` | Behavior |
| TeacherManagement | `/cursos` | Teacher |
| psychology | `/psicologia` | Psychology |

## 🎨 Estilos Consistentes

### Botones

- **Primario**: `bg-indigo-600 hover:bg-indigo-700 text-white`
- **Secundario**: `border border-gray-300 bg-white hover:bg-gray-50 text-gray-700`
- **Ver**: `text-blue-600 hover:text-blue-900`
- **Editar**: `text-indigo-600 hover:text-indigo-900`
- **Eliminar**: `text-red-600 hover:text-red-900`

### Estados (Badges)

- **active**: `bg-green-100 text-green-800`
- **inactive**: `bg-gray-100 text-gray-800`
- **suspended**: `bg-red-100 text-red-800`

## 📋 Checklist para Cada Módulo

- [ ] Crear `models/<module>.model.ts`
- [ ] Crear componentes CRUD (List, Create, Detail, Edit)
- [ ] Crear páginas (Page, CreatePage, DetailPage, EditPage)
- [ ] Crear `routes/<module>.routes.tsx`
- [ ] Actualizar `service/<Entity>.service.tsx`
- [ ] Importar rutas en `AppRouter.tsx`
- [ ] Probar navegación completa
- [ ] Implementar integración con API

## 🚀 Próximos Pasos

1. Revisar el módulo **student** como referencia
2. Replicar estructura para cada módulo pendiente
3. Implementar servicios con endpoints reales
4. Agregar validaciones y manejo de errores
5. Implementar loading states y feedback visual

## 💡 Tips

- Los componentes son reutilizables y componentizados
- Cada módulo es independiente y mantenible
- Fácil de escalar y agregar nuevas funcionalidades
- Los datos de ejemplo deben reemplazarse con llamadas al servicio
- Mantén la consistencia en nombres y estructura
