import { Suspense, lazy } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { useAuth } from './lib/auth'
import Layout from './components/Layout'
import { PageLoader } from './components/ui'
import type { Role } from './lib/types'

const Login = lazy(() => import('./pages/Login'))
const Dashboard = lazy(() => import('./pages/Dashboard'))
const AyamMonitoring = lazy(() => import('./pages/AyamMonitoring'))
const KambingKesehatan = lazy(() => import('./pages/KambingKesehatan'))
const Penjualan = lazy(() => import('./pages/Penjualan'))
const Pengeluaran = lazy(() => import('./pages/Pengeluaran'))
const Laporan = lazy(() => import('./pages/Laporan'))
const Users = lazy(() => import('./pages/Users'))

function Protected({ children, roles }: { children: React.ReactNode; roles?: Role[] }) {
  const { profile, loading } = useAuth()
  if (loading) return <PageLoader />
  if (!profile) return <Navigate to="/login" replace />
  if (roles && !roles.includes(profile.role)) return <Navigate to="/" replace />
  return <>{children}</>
}

function LoginGate() {
  const { profile, loading } = useAuth()
  if (loading) return <PageLoader />
  if (profile) return <Navigate to="/" replace />
  return <Login />
}

export default function App() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route path="/login" element={<LoginGate />} />
        <Route
          element={
            <Protected>
              <Layout />
            </Protected>
          }
        >
          <Route index element={<Dashboard />} />
          <Route path="ayam" element={<AyamMonitoring />} />
          <Route path="kambing" element={<KambingKesehatan />} />
          <Route path="penjualan" element={<Penjualan />} />
          <Route path="pengeluaran" element={<Pengeluaran />} />
          <Route path="laporan" element={<Laporan />} />
          <Route
            path="users"
            element={
              <Protected roles={['admin']}>
                <Users />
              </Protected>
            }
          />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  )
}
