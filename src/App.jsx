import { Routes, Route } from 'react-router-dom'
import Layout from './components/layout/Layout'
import Dashboard from './pages/Dashboard'
import Login from './pages/Login'
import CalendarioCSS from './pages/CalendarioCSS'
import CalendarioCanvas from './pages/CalendarioCanvas'
import CalendarioCanvasLight from './pages/CalendarioCanvasLight'
import CalendarioVariante1 from './pages/CalendarioVariante1'
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
        <Route path="/variante-1" element={<CalendarioVariante1 />} />
        <Route path="/calendario-canvas" element={<CalendarioCanvas />} />
        <Route path="/calendario-canvas-light" element={<CalendarioCanvasLight />} />
        <Route path="/calendario-css" element={<CalendarioCSS />} />
      </Routes>
    </Layout>
  )
}

export default App
