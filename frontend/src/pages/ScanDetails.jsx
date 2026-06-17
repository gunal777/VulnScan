import { useParams, useNavigate } from "react-router-dom";
import useScan from "../hooks/useScan"; // Hook into your radio tower

const ScanDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  // 🚀 Pull your single global array out of context
  const { searchResults } = useScan();

  // 🚀 Look inside the array for the item matching the URL ID
  const localReport = searchResults.find((scan) => scan._id === id);

  // Safety Shield: What if it hasn't loaded yet or isn't in the list?
  if (!localReport) {
    return (
      <div style={{ padding: "2rem", textAlign: "center" }}>
        <h3>Report profile not found in active cache.</h3>
        <button onClick={() => navigate("/")}>Go to Dashboard to load history</button>
      </div>
    );
  }

  return (
    <div style={{ padding: "2rem", fontFamily: "sans-serif" }}>
      <button onClick={() => navigate("/")}>&larr; Dashboard</button>
      <h1>Target: {localReport.target}</h1>
      <p>Risk Score: {localReport.riskScore}</p>
      <p>Active Ports Detected: {localReport.ports?.length || 0}</p>
    </div>
  );
};

export default ScanDetails;