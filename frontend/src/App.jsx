import { BrowserRouter, Routes, Route } from "react-router-dom";
import NewScan from "./pages/NewScan";
import Dashboard from "./pages/Dashboard";
import ScanDetails from "./pages/ScanDetails";
import RecentScans from "./pages/RecentScans";
import "./App.css";

function App() {
  return (
    <>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Dashboard />} />

          <Route path="/scan/new" element={<NewScan />} />

          <Route path="/scans/:id" element={<ScanDetails />} />

          <Route path="/scans/recent" element={<RecentScans />} />
        </Routes>
      </BrowserRouter>
    </>
  );
}

export default App;
