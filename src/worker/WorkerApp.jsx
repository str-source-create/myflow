/**
 * WorkerApp.jsx
 * Source file for the cleanflow application.
 */

import { Navigate, Route, Routes } from 'react-router-dom'
import WorkerLayout from './components/WorkerLayout'
import { WorkerProvider, useWorker } from './context/WorkerContext'
import WorkerChecklistPage from './pages/WorkerChecklistPage'
import WorkerHistoryPage from './pages/WorkerHistoryPage'
import WorkerHomeScreen from './pages/WorkerHomeScreen'
import WorkerLoginPage from './pages/WorkerLoginPage'
import WorkerProfilePage from './pages/WorkerProfilePage'
import WorkerStandardsPage from './pages/WorkerStandardsPage'
import WorkerSubmitPage from './pages/WorkerSubmitPage'
import WorkerTaskDetailPage from './pages/WorkerTaskDetailPage'
import WorkerTimeClockPage from './pages/WorkerTimeClockPage'
import WorkerUploadPhotosPage from './pages/WorkerUploadPhotosPage'

function RequireWorkerAuth({ children }) {
  const { currentUser } = useWorker()

  if (!currentUser) {
    return <Navigate to="/worker/login" replace />
  }

  return children
}

function RedirectLoggedInWorker() {
  const { currentUser } = useWorker()
  return <Navigate to={currentUser ? '/worker/home' : '/worker/login'} replace />
}

export default function WorkerApp() {
  return (
    <WorkerProvider>
      <Routes>
        <Route path="login" element={<WorkerLoginPage />} />

        <Route
          path="/"
          element={
            <RequireWorkerAuth>
              <WorkerLayout />
            </RequireWorkerAuth>
          }
        >
          <Route index element={<WorkerHomeScreen />} />
          <Route path="home" element={<WorkerHomeScreen />} />
          <Route path="time-clock" element={<WorkerTimeClockPage />} />
          <Route path="tasks/:id" element={<WorkerTaskDetailPage />} />
          <Route path="tasks/:id/standards" element={<WorkerStandardsPage />} />
          <Route path="tasks/:id/checklist" element={<WorkerChecklistPage />} />
          <Route path="tasks/:id/photos" element={<WorkerUploadPhotosPage />} />
          <Route path="tasks/:id/submit" element={<WorkerSubmitPage />} />
          <Route path="history" element={<WorkerHistoryPage />} />
          <Route path="profile" element={<WorkerProfilePage />} />
        </Route>

        <Route path="*" element={<RedirectLoggedInWorker />} />
      </Routes>
    </WorkerProvider>
  )
}

