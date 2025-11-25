/**
 * Script: Generador de Estructura Modular
 * Este script ayuda a generar rápidamente la estructura de carpetas para nuevos módulos
 */

// Configuración de módulos
const modules = [
     {
          name: 'academic',
          entity: 'Academic',
          route: 'gestion-academica',
          title: 'Gestión Académica'
     },
     {
          name: 'events',
          entity: 'Event',
          route: 'eventos',
          title: 'Eventos'
     },
     {
          name: 'grades',
          entity: 'Grade',
          route: 'notas',
          title: 'Notas'
     },
     {
          name: 'attendance',
          entity: 'Attendance',
          route: 'asistencias',
          title: 'Asistencias'
     },
     {
          name: 'behavior',
          entity: 'Behavior',
          route: 'comportamiento',
          title: 'Comportamiento'
     },
     {
          name: 'teacher',
          entity: 'Teacher',
          route: 'cursos',
          title: 'Gestión de Profesores'
     },
     {
          name: 'psychology',
          entity: 'Psychology',
          route: 'psicologia',
          title: 'Psicología'
     }
]

// Estructura de carpetas a crear por módulo
const folderStructure = [
     'models',
     'components',
     'pages',
     'routes',
     'service'
]

// Archivos a crear
const files = {
     model: (module) => `models/${module.name}.model.ts`,
     list: (module) => `components/${module.entity}List.tsx`,
     create: (module) => `components/${module.entity}Create.tsx`,
     detail: (module) => `components/${module.entity}Detail.tsx`,
     edit: (module) => `components/${module.entity}Edit.tsx`,
     listPage: (module) => `pages/${module.entity}Page.tsx`,
     createPage: (module) => `pages/${module.entity}CreatePage.tsx`,
     detailPage: (module) => `pages/${module.entity}DetailPage.tsx`,
     editPage: (module) => `pages/${module.entity}EditPage.tsx`,
     routes: (module) => `routes/${module.name}.routes.tsx`,
     service: (module) => `service/${module.entity}.service.tsx`
}

console.log('='.repeat(60))
console.log('GUÍA DE CREACIÓN DE MÓDULOS')
console.log('='.repeat(60))

modules.forEach((module) => {
     console.log(`\n📁 Módulo: ${module.title} (${module.name})`)
     console.log('-'.repeat(60))
     console.log(`\n1. Crear carpetas en: src/modules/${module.name}/`)
     folderStructure.forEach(folder => {
          console.log(`   - ${folder}/`)
     })

     console.log(`\n2. Crear archivos:`)
     Object.entries(files).forEach(([key, fn]) => {
          console.log(`   - ${fn(module)}`)
     })

     console.log(`\n3. Agregar rutas en AppRouter.tsx:`)
     console.log(`   import { ${module.name}Routes } from "../../modules/${module.name}/routes/${module.name}.routes"`)
     console.log(`   // Dentro del DashboardLayout:`)
     console.log(`   {${module.name}Routes}`)
     console.log('\n')
})

console.log('='.repeat(60))
console.log('PASOS GENERALES')
console.log('='.repeat(60))
console.log(`
1. Usa el módulo 'student' como plantilla de referencia
2. Para cada módulo, copia la estructura y adapta:
   - Nombres de entidades
   - Campos del modelo
   - Rutas
   - Títulos y descripciones

3. Actualiza AppRouter.tsx importando las rutas modulares

4. Implementa los servicios cuando el backend esté listo

5. Prueba cada módulo:
   - Lista
   - Crear
   - Ver detalle
   - Editar
   - Eliminar
`)

// Exportar configuración para uso en otros scripts
export { modules, folderStructure, files }
