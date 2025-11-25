/**
 * Rutas del módulo Behavior
 * Define todas las rutas relacionadas con comportamiento
 */

import { Route } from 'react-router-dom'
import { BehaviorPage } from '../pages/BehaviorPage'
import { BehaviorCreatePage } from '../pages/BehaviorCreatePage'
import { BehaviorDetailPage } from '../pages/BehaviorDetailPage'
import { BehaviorEditPage } from '../pages/BehaviorEditPage'

export const behaviorRoutes = (
  <>
    <Route path="comportamiento" element={<BehaviorPage />} />
    <Route path="comportamiento/nuevo" element={<BehaviorCreatePage />} />
    <Route path="comportamiento/:id" element={<BehaviorDetailPage />} />
    <Route path="comportamiento/:id/editar" element={<BehaviorEditPage />} />
  </>
)
