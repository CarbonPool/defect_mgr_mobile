import { useEffect } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import RequireAuth from './components/RequireAuth'
import MainLayout from './layout/MainLayout'
import DefectList from './pages/DefectList'
import Home from './pages/Home'
import Login from './pages/Login'
import Register from './pages/Register'
import Machines from './pages/Machines'
import Profile from './pages/Profile'
import { useAuthStore } from './stores/authStore'

export default function App() {
  useEffect(() => {
    useAuthStore.getState().refreshUser()
  }, [])

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route
        element={
          <RequireAuth>
            <MainLayout />
          </RequireAuth>
        }
      >
        <Route index element={<Home />} />
        <Route path="defects" element={<DefectList />} />
        <Route path="machines" element={<Machines />} />
        <Route path="mine" element={<Profile />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
