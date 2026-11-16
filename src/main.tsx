import { Component, lazy, Suspense, ReactNode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import './styles.css'
const Admin = lazy(() => import('./Admin'))
const isAdmin = location.pathname.replace(/\/+$/, '') === '/admin'

class Boundary extends Component<{ children: ReactNode }, { bad: boolean }> {
  state = { bad: false }
  static getDerivedStateFromError() { return { bad: true } }
  render() { return this.state.bad ? <p style={{ padding: '2rem' }}>Đã có lỗi xảy ra. Vui lòng tải lại trang.</p> : this.props.children }
}
createRoot(document.getElementById('root')!).render(
  <Boundary>{isAdmin ? <Suspense fallback={null}><Admin /></Suspense> : <App />}</Boundary>,
)
