import { Routes, Route } from 'react-router-dom'
import Layout from './components/layout/Layout'
import Dashboard from './pages/Dashboard'
import Login from './pages/Login'
import CalendarioCSS from './pages/CalendarioCSS'
import CalendarioCanvas from './pages/CalendarioCanvas'
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
        <Route path="/calendario-css" element={<CalendarioCSS />} />
        <Route path="/calendario-canvas" element={<CalendarioCanvas />} />
      </Routes>
    </Layout>
  )
}

export default App
