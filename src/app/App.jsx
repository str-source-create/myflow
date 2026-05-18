/**
 * App.jsx
 * Top-level router for admin and worker application shells.
 * Includes:
 *  - /admin/accept-invite/:token — public route for new admins accepting an invite
 *  - /admin/invite — protected route for sending manager invites
 */
import { Navigate, Route, Routes } from 'react-router-dom'
import AdminLayout from '../components/AdminLayout'
import { AdminProvider } from '../context/AdminContext'
import AcceptInvitePage from '../pages/AcceptInvitePage'
import AddPropertyPage from '../pages/AddPropertyPage'
import AddWorkerPage from '../pages/AddWorkerPage'
import CreateTaskPage from '../pages/CreateTaskPage'
import DashboardPage from '../pages/DashboardPage'
import EditPropertyPage from '../pages/EditPropertyPage'
import InviteManagerPage from '../pages/InviteManagerPage'
import LoginPage from '../pages/LoginPage'
import CalendarPage from '../pages/CalendarPage'
import AttendancePage from '../pages/AttendancePage'
import PropertiesPage from '../pages/PropertiesPage'
import PropertyDetailPage from '../pages/PropertyDetailPage'
import PropertyStandardsPage from '../pages/PropertyStandardsPage'
import SettingsPage from '../pages/SettingsPage'
import SubmissionReviewPage from '../pages/SubmissionReviewPage'
import SubmissionsPage from '../pages/SubmissionsPage'
import TaskDetailPage from '../pages/TaskDetailPage'
import TasksPage from '../pages/TasksPage'
import WorkersPage from '../pages/WorkersPage'
import WorkerApp from '../worker/WorkerApp'

function PrivateRoute({ children }) {
  const stored = localStorage.getItem('cf_admin_user')
  return stored ? children : <Navigate to="/admin/login" replace />
}

export default function App() {
  return (
    <AdminProvider>
      <Routes>
        {/* Public routes — no authentication required */}
        <Route path="/admin/login" element={<LoginPage />} />
        <Route path="/admin/accept-invite/:token" element={<AcceptInvitePage />} />

        {/* Protected admin routes */}
        <Route
          path="/admin"
          element={
            <PrivateRoute>
              <AdminLayout />
            </PrivateRoute>
          }
        >
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="calendar" element={<CalendarPage />} />
          <Route path="attendance" element={<AttendancePage />} />
          <Route path="properties" element={<PropertiesPage />} />
          <Route path="properties/add" element={<AddPropertyPage />} />
          <Route path="properties/:id" element={<PropertyDetailPage />} />
          <Route path="properties/:id/edit" element={<EditPropertyPage />} />
          <Route path="properties/:id/standards" element={<PropertyStandardsPage />} />
          <Route path="tasks" element={<TasksPage />} />
          <Route path="tasks/create" element={<CreateTaskPage />} />
          <Route path="tasks/:id" element={<TaskDetailPage />} />
          <Route path="workers" element={<WorkersPage />} />
          <Route path="workers/add" element={<AddWorkerPage />} />
          <Route path="submissions" element={<SubmissionsPage />} />
          <Route path="submissions/:id" element={<SubmissionReviewPage />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="invite" element={<InviteManagerPage />} />
        </Route>

        <Route path="/worker/*" element={<WorkerApp />} />
        <Route path="*" element={<Navigate to="/admin/login" replace />} />
      </Routes>
    </AdminProvider>
  )
}
