import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './store/authStore'

// Admin pages
import Login from './pages/admin/Login'
import Dashboard from './pages/admin/Dashboard'
import Modules from './pages/admin/Modules'
import CreateModule from './pages/admin/CreateModule'
import CreateQuiz from './pages/admin/CreateQuiz'
import Employees from './pages/admin/Employees'
import Reports from './pages/admin/Reports'
import PhishingSimulation from './pages/admin/PhishingSimulation'
import AdminLayout from './components/layout/AdminLayout'

// Employee pages
import EmployeeLogin from './pages/employee/EmployeeLogin'
import MyTraining from './pages/employee/MyTraining'
import VideoPlayer from './pages/employee/VideoPlayer'
import Quiz from './pages/employee/Quiz'
import Result from './pages/employee/Result'
import PhishingInbox from './pages/employee/PhishingInbox'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  return isAuthenticated ? <>{children}</> : <Navigate to="/admin/login" replace />
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/admin/login" replace />} />

        <Route path="/admin/login" element={<Login />} />

        <Route path="/admin" element={
          <ProtectedRoute>
            <AdminLayout />
          </ProtectedRoute>
        }>
          <Route index element={<Dashboard />} />
          <Route path="modules" element={<Modules />} />
          <Route path="modules/new" element={<CreateModule />} />
          <Route path="modules/:id/quiz" element={<CreateQuiz />} />
          <Route path="employees" element={<Employees />} />
          <Route path="reports" element={<Reports />} />
          <Route path="phishing" element={<PhishingSimulation />} />
        </Route>

        <Route path="/employee/login" element={<EmployeeLogin />} />
        <Route path="/employee/training" element={<MyTraining />} />
        <Route path="/employee/training/:token/watch" element={<VideoPlayer />} />
        <Route path="/employee/training/:token/quiz" element={<Quiz />} />
        <Route path="/employee/training/:token/result" element={<Result />} />
        <Route path="/employee/phishing" element={<PhishingInbox />} />
      </Routes>
    </BrowserRouter>
  )
}