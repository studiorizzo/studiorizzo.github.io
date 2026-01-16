import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import styles from './Login.module.css'

function Login() {
  const { login } = useAuth()
  const [isStudioLogin, setIsStudioLogin] = useState(true)

  const handleDemoLogin = (role) => {
    if (role === 'studio') {
      login({
        id: '1',
        name: 'Mario Rossi',
        role: 'studio'
      })
    } else {
      login({
        id: '2',
        name: 'Cliente Demo',
        role: 'cliente',
        clienteId: 'c1'
      })
    }
  }

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h1 className={styles.logo}>studiorizzo</h1>

        <div className={styles.tabs}>
          <button
            className={`${styles.tab} ${isStudioLogin ? styles.active : ''}`}
            onClick={() => setIsStudioLogin(true)}
          >
            Studio
          </button>
          <button
            className={`${styles.tab} ${!isStudioLogin ? styles.active : ''}`}
            onClick={() => setIsStudioLogin(false)}
          >
            Cliente
          </button>
        </div>

        <div className={styles.form}>
          <div className={styles.inputGroup}>
            <label className={styles.label}>Email</label>
            <input type="email" className={styles.input} placeholder="email@esempio.it" />
          </div>

          <div className={styles.inputGroup}>
            <label className={styles.label}>Password</label>
            <input type="password" className={styles.input} placeholder="••••••••" />
          </div>

          <button
            className={styles.submitBtn}
            onClick={() => handleDemoLogin(isStudioLogin ? 'studio' : 'cliente')}
          >
            Accedi
          </button>
        </div>
      </div>
    </div>
  )
}

export default Login
