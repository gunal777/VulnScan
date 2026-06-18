import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useState } from "react";
import NewScan from "./pages/NewScan";
import Dashboard from "./pages/Dashboard";
import ScanDetails from "./pages/ScanDetails";
import RecentScans from "./pages/RecentScans";
import Header from "./components/Header";
import Sidebar from "./components/Sidebar";
import "./App.css";

function AppRoutes() {
  return (
    <div className="app-page-content">
      <Routes>
        <Route path="/" element={<Dashboard />} />

        <Route path="/scan/new" element={<NewScan />} />

        <Route path="/scans/:id" element={<ScanDetails />} />

        <Route path="/scans/recent" element={<RecentScans />} />
      </Routes>
    </div>
  );
}

function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="app-layout">
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />
      <div className="app-main-wrapper">
        <Header onMobileMenuToggle={() => setSidebarOpen((prev) => !prev)} />
        <AppRoutes />
      </div>
    </div>
  );
}

function App() {
  return (
    <>
      <BrowserRouter>
        <AppLayout />
      </BrowserRouter>
    </>
  );
}

export default App;
