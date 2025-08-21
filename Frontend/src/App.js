import "./App.css"
import Pages from "./components/pages/Pages"
import { ThemeProvider } from "./contexts/ThemeContext"
import { AuthProvider } from "./contexts/AuthContext"
import "./styles/themes.css"

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Pages />
      </AuthProvider>
    </ThemeProvider>
  )
}

export default App
