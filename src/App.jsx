import { Routes, Route } from 'react-router-dom'
import Layout from './components/layout/Layout'
import Dashboard from './pages/Dashboard'
import Login from './pages/Login'
import Calendario3D from './pages/Calendario3D'
import Calendario2D from './pages/Calendario2D'
import CalendarioCSS from './pages/CalendarioCSS'
import CalendarioCanvas from './pages/CalendarioCanvas'
import CalendarioCanvasLight from './pages/CalendarioCanvasLight'
import CalendarioVariante1 from './pages/CalendarioVariante1'
import CalendarioVariante2 from './pages/CalendarioVariante2'
import { useAuth } from './context/AuthContext'

function App() {
  const { user } = useAuth()

  if (!user) {
    return <Login />
  }

  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/calendario-3d" element={<Calendario3D />} />
        <Route path="/calendario-2d" element={<Calendario2D />} />
        <Route path="/variante-1" element={<CalendarioVariante1 />} />
        <Route path="/variante-2" element={<CalendarioVariante2 />} />
        <Route path="/calendario-canvas" element={<CalendarioCanvas />} />
        <Route path="/calendario-canvas-light" element={<CalendarioCanvasLight />} />
        <Route path="/calendario-css" element={<CalendarioCSS />} />
      </Routes>
    </Layout>
  )
}

export default App
