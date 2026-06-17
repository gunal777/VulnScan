import { useEffect } from "react";
import scanAPI from "../services/api";
import { Link } from "react-router-dom";
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
      catch (error) {
        console.error("Scan pipeline error:", error.message);
      }
      finally {
        setLoading(false);
      }
    }
    getRecents();
  }, [setLoading, setSearchResults])

  return (
    <div className="dashboard">
      <h1> Welcome</h1>

      {loading ?
        <h2>Loading...</h2>
        :
        <div>
          <h2>New Scan??</h2>
          <Link to="/scan/new"><button>New Scan+</button></Link>

          <h2>Recent Scans</h2>
          <Link to="/scans/recent"><button>Recent Scans</button></Link>
        </div>

      }
    </div>
  );
}

export default Dashboard;