import { Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import AccessibilityTools from "./components/AccessibilityTools";
import LandingPage from "./pages/LandingPage";
import DemoPage from "./pages/DemoPage";
import LoginPage from "./pages/LoginPage";
import ProfilePage from "./pages/ProfilePage";
import ContactPage from "./pages/ContactPage";

export default function App() {
  return (
    <div className="relative">
      <AccessibilityTools />
      <Navbar />
      <main id="main-content">
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/demo" element={<DemoPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/profil" element={<ProfilePage />} />
          <Route path="/kontak" element={<ContactPage />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}
