/**
 * Script: Generador Automático de Módulos CRUD
 * Uso: node scripts/create-module.js <nombre-modulo>
 * Ejemplo: node scripts/create-module.js academic
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Configuración de módulos disponibles
const modulesConfig = {
     academic: {
          entity: 'Academic',
          route: 'gestion-academica',
          title: 'Gestión Académica',
          description: 'Gestión de programas académicos y currículum',
     },
     events: {
          entity: 'Event',
          route: 'eventos',
          title: 'Eventos',
          description: 'Gestión de eventos y actividades escolares',
     },
     grades: {
          entity: 'Grade',
          route: 'notas',
          title: 'Notas',
          description: 'Gestión de calificaciones y evaluaciones',
     },
     attendance: {
          entity: 'Attendance',
          route: 'asistencias',
          title: 'Asistencias',
          description: 'Control de asistencias de estudiantes',
     },
     behavior: {
          entity: 'Behavior',
          route: 'comportamiento',
          title: 'Comportamiento',
          description: 'Registro de conducta y disciplina',
     },
     teacher: {
          entity: 'Teacher',
          route: 'cursos',
          title: 'Gestión de Profesores',
          description: 'Gestión de profesores y asignaciones',
     },
     psychology: {
          entity: 'Psychology',
          route: 'psicologia',
          title: 'Psicología',
          description: 'Seguimiento psicológico de estudiantes',
     },
     users: {
          entity: 'User',
          route: 'usuarios',
          title: 'Usuarios',
          description: 'Gestión de usuarios del sistema',
     },
     enrollments: {
          entity: 'Enrollment',
          route: 'matriculas',
          title: 'Matrículas',
          description: 'Gestión de matrículas y procesos de inscripción',
     },
}

// Plantillas de código
const templates = {
     model: (config) => `/**
 * Modelo: ${config.entity}
 * Define la estructura de datos para el módulo de ${config.title}
 */

export interface ${config.entity} {
  id: string
  name: string
  description?: string
  status: 'active' | 'inactive'
  createdAt: string
  updatedAt: string
}

export interface Create${config.entity}Dto {
  name: string
  description?: string
}

export interface Update${config.entity}Dto extends Partial<Create${config.entity}Dto> {
  status?: 'active' | 'inactive'
}
`,

     list: (config) => `/**
 * Componente: ${config.entity}List
 * Muestra la lista de ${config.title.toLowerCase()}
 */

import { useNavigate } from 'react-router-dom'
import type { ${config.entity} } from '../models/${config.name}.model'

interface ${config.entity}ListProps {
  readonly items: ${config.entity}[]
  readonly onDelete?: (id: string) => void
}

export function ${config.entity}List({ items, onDelete }: ${config.entity}ListProps) {
  const navigate = useNavigate()

  const handleView = (id: string) => {
    navigate(\`/${config.route}/\${id}\`)
  }

  const handleEdit = (id: string) => {
    navigate(\`/${config.route}/\${id}/editar\`)
  }

  const handleDelete = (id: string) => {
    if (globalThis.confirm('¿Estás seguro de eliminar este registro?')) {
      onDelete?.(id)
    }
  }

  const getStatusClass = (status: string) => {
    return status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
  }

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Nombre
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Descripción
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Estado
            </th>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              Acciones
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {items.map((item) => (
            <tr key={item.id} className="hover:bg-gray-50">
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm font-medium text-gray-900">{item.name}</div>
              </td>
              <td className="px-6 py-4 text-sm text-gray-500">
                {item.description || 'Sin descripción'}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span
                  className={\`px-2 inline-flex text-xs leading-5 font-semibold rounded-full \${getStatusClass(
                    item.status
                  )}\`}
                >
                  {item.status}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <button
                  onClick={() => handleView(item.id)}
                  className="text-blue-600 hover:text-blue-900 mr-3"
                >
                  Ver
                </button>
                <button
                  onClick={() => handleEdit(item.id)}
                  className="text-indigo-600 hover:text-indigo-900 mr-3"
                >
                  Editar
                </button>
                <button
                  onClick={() => handleDelete(item.id)}
                  className="text-red-600 hover:text-red-900"
                >
                  Eliminar
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
`,

     mainPage: (config) => `/**
 * Página: ${config.entity}Page
 * Página principal del módulo de ${config.title} - Lista todos los registros
 */

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ${config.entity}List } from '../components/${config.entity}List'
import type { ${config.entity} } from '../models/${config.name}.model'

export function ${config.entity}Page() {
  const navigate = useNavigate()
  const [items, setItems] = useState<${config.entity}[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchItems = async () => {
      try {
        // TODO: Implementar servicio
        // const data = await ${config.name}Service.getAll()
        // setItems(data)

        // Datos de ejemplo
        setItems([
          {
            id: '1',
            name: 'Ejemplo 1',
            description: 'Descripción de ejemplo',
            status: 'active',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        ])
      } catch (error) {
        console.error('Error al cargar datos:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchItems()
  }, [])

  const handleDelete = async (id: string) => {
    try {
      // TODO: Implementar servicio
      // await ${config.name}Service.delete(id)
      setItems(items.filter((item) => item.id !== id))
      console.log('Eliminar registro:', id)
    } catch (error) {
      console.error('Error al eliminar:', error)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-gray-600">Cargando...</div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">${config.title}</h1>
          <p className="mt-2 text-sm text-gray-600">
            ${config.description}
          </p>
        </div>
        <button
          onClick={() => navigate('/${config.route}/nuevo')}
          className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
        >
          Nuevo Registro
        </button>
      </div>

      <${config.entity}List items={items} onDelete={handleDelete} />
    </div>
  )
}
`,

     createPage: (config) => `/**
 * Página: ${config.entity}CreatePage
 * Página para crear un nuevo registro de ${config.title}
 */

export function ${config.entity}CreatePage() {
  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Nuevo - ${config.title}</h1>
        <p className="mt-2 text-sm text-gray-600">
          Complete el formulario para crear un nuevo registro
        </p>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <p className="text-gray-500">Formulario de creación en desarrollo...</p>
      </div>
    </div>
  )
}
`,

     detailPage: (config) => `/**
 * Página: ${config.entity}DetailPage
 * Página para ver los detalles de ${config.title}
 */

export function ${config.entity}DetailPage() {
  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Detalle - ${config.title}</h1>
        <p className="text-gray-500">Vista de detalles en desarrollo...</p>
      </div>
    </div>
  )
}
`,

     editPage: (config) => `/**
 * Página: ${config.entity}EditPage
 * Página para editar un registro de ${config.title}
 */

export function ${config.entity}EditPage() {
  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Editar - ${config.title}</h1>
        <p className="mt-2 text-sm text-gray-600">
          Modifique los datos del registro
        </p>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <p className="text-gray-500">Formulario de edición en desarrollo...</p>
      </div>
    </div>
  )
}
`,

     routes: (config) => `/**
 * Rutas del módulo ${config.entity}
 * Define todas las rutas relacionadas con ${config.title.toLowerCase()}
 */

import { Route } from 'react-router-dom'
import { ${config.entity}Page } from '../pages/${config.entity}Page'
import { ${config.entity}CreatePage } from '../pages/${config.entity}CreatePage'
import { ${config.entity}DetailPage } from '../pages/${config.entity}DetailPage'
import { ${config.entity}EditPage } from '../pages/${config.entity}EditPage'

export const ${config.name}Routes = (
  <>
    <Route path="${config.route}" element={<${config.entity}Page />} />
    <Route path="${config.route}/nuevo" element={<${config.entity}CreatePage />} />
    <Route path="${config.route}/:id" element={<${config.entity}DetailPage />} />
    <Route path="${config.route}/:id/editar" element={<${config.entity}EditPage />} />
  </>
)
`,

     service: (config) => `/**
 * Servicio: ${config.entity}Service
 * Maneja las peticiones al API para ${config.title}
 */

import type { ${config.entity}, Create${config.entity}Dto, Update${config.entity}Dto } from '../models/${config.name}.model'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'

export const ${config.name}Service = {
  async getAll(): Promise<${config.entity}[]> {
    const response = await fetch(\`\${API_URL}/${config.route}\`)
    if (!response.ok) throw new Error('Error al obtener datos')
    return response.json()
  },

  async getById(id: string): Promise<${config.entity}> {
    const response = await fetch(\`\${API_URL}/${config.route}/\${id}\`)
    if (!response.ok) throw new Error('Error al obtener el registro')
    return response.json()
  },

  async create(data: Create${config.entity}Dto): Promise<${config.entity}> {
    const response = await fetch(\`\${API_URL}/${config.route}\`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    if (!response.ok) throw new Error('Error al crear el registro')
    return response.json()
  },

  async update(id: string, data: Update${config.entity}Dto): Promise<${config.entity}> {
    const response = await fetch(\`\${API_URL}/${config.route}/\${id}\`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    if (!response.ok) throw new Error('Error al actualizar el registro')
    return response.json()
  },

  async delete(id: string): Promise<void> {
    const response = await fetch(\`\${API_URL}/${config.route}/\${id}\`, {
      method: 'DELETE',
    })
    if (!response.ok) throw new Error('Error al eliminar el registro')
  },
}
`,
}

// Función principal
function createModule(moduleName) {
     const config = modulesConfig[moduleName]

     if (!config) {
          console.error(`❌ Módulo '${moduleName}' no encontrado.`)
          console.log('\n📋 Módulos disponibles:')
          for (const [key, value] of Object.entries(modulesConfig)) {
               console.log(`  - ${key} (${value.title})`)
          }
          process.exit(1)
     }

     config.name = moduleName

     const baseDir = path.join(__dirname, '..', 'src', 'modules', moduleName)

     console.log(`\n🚀 Creando módulo: ${config.title}`)
     console.log(`📁 Ruta: ${baseDir}\n`)

     // Crear estructura de carpetas
     const folders = ['models', 'components', 'pages', 'routes', 'service']
     for (const folder of folders) {
          const folderPath = path.join(baseDir, folder)
          if (!fs.existsSync(folderPath)) {
               fs.mkdirSync(folderPath, { recursive: true })
               console.log(`✅ Creada carpeta: ${folder}/`)
          } else {
               console.log(`⏭️  Ya existe: ${folder}/`)
          }
     }

     // Crear archivos
     const files = [
          { path: path.join(baseDir, 'models', `${moduleName}.model.ts`), content: templates.model(config) },
          { path: path.join(baseDir, 'components', `${config.entity}List.tsx`), content: templates.list(config) },
          { path: path.join(baseDir, 'pages', `${config.entity}Page.tsx`), content: templates.mainPage(config) },
          { path: path.join(baseDir, 'pages', `${config.entity}CreatePage.tsx`), content: templates.createPage(config) },
          { path: path.join(baseDir, 'pages', `${config.entity}DetailPage.tsx`), content: templates.detailPage(config) },
          { path: path.join(baseDir, 'pages', `${config.entity}EditPage.tsx`), content: templates.editPage(config) },
          { path: path.join(baseDir, 'routes', `${moduleName}.routes.tsx`), content: templates.routes(config) },
          { path: path.join(baseDir, 'service', `${config.entity}.service.tsx`), content: templates.service(config) },
     ]

     console.log('')
     for (const file of files) {
          if (!fs.existsSync(file.path)) {
               fs.writeFileSync(file.path, file.content, 'utf8')
               console.log(`✅ Creado: ${path.relative(baseDir, file.path)}`)
          } else {
               console.log(`⏭️  Ya existe: ${path.relative(baseDir, file.path)}`)
          }
     }

     console.log(`\n✨ Módulo '${config.title}' creado exitosamente!`)
     console.log(`\n📝 Próximos pasos:`)
     console.log(`\n1. Importar rutas en AppRouter.tsx:`)
     console.log(`   import { ${moduleName}Routes } from "../../modules/${moduleName}/routes/${moduleName}.routes"`)
     console.log(`\n2. Agregar dentro del DashboardLayout:`)
     console.log(`   {${moduleName}Routes}`)
     console.log(`\n3. Personalizar el modelo en: models/${moduleName}.model.ts`)
     console.log(`\n4. Implementar componentes Create, Edit, Detail según necesidades\n`)
}

// Ejecutar
const moduleName = process.argv[2]

if (!moduleName) {
     console.log('❌ Error: Debes especificar el nombre del módulo')
     console.log('\n📖 Uso: node scripts/create-module.js <nombre-modulo>')
     console.log('\n📋 Módulos disponibles:')
     for (const [key, value] of Object.entries(modulesConfig)) {
          console.log(`  - ${key} (${value.title})`)
     }
     process.exit(1)
}

createModule(moduleName)
