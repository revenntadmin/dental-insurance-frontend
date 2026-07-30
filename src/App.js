import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { MfaProvider } from './context/MfaContext';
import AppRoutes from './routes/AppRoutes';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <MfaProvider>
          <AppRoutes />
        </MfaProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
