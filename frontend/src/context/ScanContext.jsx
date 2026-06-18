import { createContext, useState, useEffect } from "react";
import scanAPI from "../services/api";

const ScanContext = createContext();

export const ScanProvider = ({ children }) => {
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);

  // Fetch scans from backend
  const fetchScans = async () => {
    try {
      setLoading(true);

      const response = await scanAPI.getRecentScans();

      setSearchResults(response.data);
    } catch (error) {
      console.error("Failed to fetch scans:", error.message);
    } finally {
      setLoading(false);
    }
  };

  // Add newly created scan
  const addScan = (scan) => {
    setSearchResults((prev) => [scan, ...prev]);
  };

  // Delete scan from local state
  const removeScan = (id) => {
    setSearchResults((prev) =>
      prev.filter((scan) => scan._id !== id)
    );
  };

  // Update an existing scan
  const updateScan = (updatedScan) => {
    setSearchResults((prev) =>
      prev.map((scan) =>
        scan._id === updatedScan._id
          ? updatedScan
          : scan
      )
    );
  };

  // Initial load
  useEffect(() => {
    fetchScans();
  }, []);

  return (
    <ScanContext.Provider
      value={{
        searchResults,
        loading,

        fetchScans,
        addScan,
        removeScan,
        updateScan,

        setSearchResults,
        setLoading,
      }}
    >
      {children}
    </ScanContext.Provider>
  );
};

export default ScanContext;