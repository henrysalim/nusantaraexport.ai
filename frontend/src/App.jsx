import { Routes, Route, useLocation } from "react-router-dom";
import { useEffect, useRef } from "react";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import AccessibilityTools from "./components/AccessibilityTools";
import LandingPage from "./pages/LandingPage";
import DemoPage from "./pages/DemoPage";
import LoginPage from "./pages/LoginPage";
import ProfilePage from "./pages/ProfilePage";
import ContactPage from "./pages/ContactPage";
import CommunityPage from "./pages/CommunityPage";
import PostDetailPage from "./pages/PostDetailPage";

function AppContent() {
  const location = useLocation();
  const lastPathname = useRef(location.pathname);

  useEffect(() => {
    // Hanya scroll jika pathname BENAR-BENAR berubah (Navigasi)
    // Agar saat refresh browser bisa mengembalikan posisi scroll asli
    if (lastPathname.current !== location.pathname) {
      window.scrollTo(0, 0);
      lastPathname.current = location.pathname;
    }
  }, [location.pathname]);

  return (
    <div className="relative">
      <AccessibilityTools />
      <Navbar />
      <main id="main-content">
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/demo" element={
            <ProtectedRoute>
              <DemoPage />
            </ProtectedRoute>
          } />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/profil" element={
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          } />
          <Route path="/kontak" element={<ContactPage />} />
          <Route path="/komunitas" element={<CommunityPage />} />
          <Route path="/komunitas/diskusi/:postId" element={<PostDetailPage />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

