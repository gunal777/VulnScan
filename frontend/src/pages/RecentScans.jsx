import { Link } from "react-router-dom";
import useScan from "../hooks/useScan";
import scanAPI from "../services/api";

const RecentScans = () => {
  const { searchResults, setSearchResults } = useScan();

  const handleDelete = async (e, id) => {
    e.preventDefault();
    
    if (!window.confirm("Are you sure you want to delete this scan record?")) return;

    try {
      await scanAPI.deleteScan(id);

      setSearchResults((prevResults) => prevResults.filter((scan) => scan._id !== id));

      console.log(`Scan instance ${id} wiped successfully.`);
    }
    catch(error){
      console.error("Failed to execute delete sequence:", error.message);
    }
  };

  return (
    <div className="recent-scans-container" style={{ padding: "1rem" }}>
      <h2>Recent System Scans</h2>
      
      {searchResults.map((element) => (
        <div 
          key={element._id} 
          className="scan-card" 
          style={{ border: "1px solid #ccc", padding: "1rem", marginBottom: "0.5rem", borderRadius: "6px" }}
        >
          <Link to={`/scans/${element._id}`} style={{ textDecoration: "none", color: "inherit", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <h3>{element.target}</h3>
              <p style={{ margin: 0, color: "#666" }}>Type: {element.targetType}</p>
            </div>

            <button 
              onClick={(e) => handleDelete(e, element._id)}
              style={{
                background: "#ff4d4f",
                color: "white",
                border: "none",
                padding: "0.5rem 1rem",
                borderRadius: "4px",
                cursor: "pointer",
                fontWeight: "bold"
              }}
            >
              Delete
            </button>
          </Link>
        </div>
      ))}
    </div>
  );
};

export default RecentScans;