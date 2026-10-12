import { BrowserRouter, Route, Routes } from "react-router-dom";
import Index from "./pages/Index.tsx";
import NotFound from "./pages/NotFound.tsx";
import CloudAutosync from "./components/auth/CloudAutosync.tsx";
import LoginPage from "./components/auth/LoginPage.tsx";
import { AuthProvider, useAuth } from "./context/AuthContext.tsx";

function AuthGate() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="app-shell">
        <div className="app-bg" />
        <div className="app-layer flex min-h-screen items-center justify-center text-sm text-muted-foreground">
          Chargement...
        </div>
      </div>
    );
  }

  if (!user) return <LoginPage />;

  return (
    <>
      <CloudAutosync />
      <Index />
    </>
  );
}

const App = () => (
  <AuthProvider>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<AuthGate />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  </AuthProvider>
);

export default App;
