import { useEffect } from "react";
import scanAPI from "../services/api";
import useScan from "../hooks/useScan";

const Dashboard = () => {
  const { loading, setLoading, setSearchResults } = useScan();

  useEffect(() => {
    async function getRecents() {
      try {
        setLoading(true);
        const response = await scanAPI.getRecentScans();
        setSearchResults(response.data);
      }
      catch(error) {
        console.error("Scan pipeline error:", error.message);
      }
      finally {
        setLoading(false);
      }
    }
    getRecents();
  }, [])

  return (
    <div className="dashboard">
      
    </div>
  );
}

export default Dashboard;