import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { ToastProvider } from "./shared/context/ToastProvider";
import { AuthProvider } from "./modules/auth/context/AuthProvider";

createRoot(document.getElementById('root')!).render(
  <ToastProvider>
    <AuthProvider>
      <App />
    </AuthProvider>
  </ToastProvider>
)
