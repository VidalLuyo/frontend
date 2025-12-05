/**
 * Rutas del módulo Behavior
 * Define todas las rutas relacionadas con comportamiento
 */

import { Route } from 'react-router-dom'
import { BehaviorPage } from '../pages/BehaviorPage'

export const behaviorRoutes = (
  <>
    <Route path="comportamiento" element={<BehaviorPage />} />
  </>
)
