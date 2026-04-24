import AppRoutes from './routes'
import SplashScreen from '../shared/components/SplashScreen'

function App() {
  return (
    <SplashScreen>
      <AppRoutes />
    </SplashScreen>
  )
}

export default App