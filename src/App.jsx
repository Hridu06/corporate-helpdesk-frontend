import { Provider } from 'react-redux'
import { Toaster } from 'react-hot-toast'
import { store } from './app/store'
import { AppRoutes } from './routes/AppRoutes'

function App() {
  return (
    <Provider store={store}>
      <AppRoutes />
      <Toaster position="top-right" />
    </Provider>
  )
}

export default App
