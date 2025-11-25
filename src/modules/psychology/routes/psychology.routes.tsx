/**
 * Rutas del módulo Psychology
 * Define todas las rutas relacionadas con psicología
 */

import { Route } from 'react-router-dom'
import { PsychologyPage } from '../pages/PsychologyEvaluation/PsychologyPage'
import { PsychologyCreatePage } from '../pages/PsychologyEvaluation/PsychologyCreatePage'
import { PsychologyDetailPage } from '../pages/PsychologyEvaluation/PsychologyDetailPage'
import { PsychologyEditPage } from '../pages/PsychologyEvaluation/PsychologyEditPage'
import { SpecialNeedsSupportListPage } from '../pages/SpecialNeedsSupport/SpecialNeedsSupportListPage'
import { SpecialNeedsSupportCreatePage } from '../pages/SpecialNeedsSupport/SpecialNeedsSupportCreatePage'
import { SpecialNeedsSupportEditPage } from '../pages/SpecialNeedsSupport/SpecialNeedsSupportEditPage'
import { SpecialNeedsSupportDetailPage } from '../pages/SpecialNeedsSupport/SpecialNeedsSupportDetailPage'

export const psychologyRoutes = (
  <>
    <Route path="psychology" element={<PsychologyPage />} />
    <Route path="psychology/new" element={<PsychologyCreatePage />} />
    <Route path="psychology/:id" element={<PsychologyDetailPage />} />
    <Route path="psychology/:id/edit" element={<PsychologyEditPage />} />
    <Route path="psychology/supports" element={<SpecialNeedsSupportListPage />} />
    <Route path="psychology/supports/create" element={<SpecialNeedsSupportCreatePage />} />
    <Route path="psychology/supports/edit/:id" element={<SpecialNeedsSupportEditPage />} />
    <Route path="psychology/supports/:id" element={<SpecialNeedsSupportDetailPage />} />
  </>
)