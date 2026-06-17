import scanAPI from "../services/api";
import { useState } from "react";
import useScan from "../hooks/useScan";
import { useNavigate } from "react-router-dom";

const NewScan = () => {
  const [target, setTarget] = useState("");
  const { loading, setLoading, setSearchResults } = useScan();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if(!target) return;

    try {
      setLoading(true);

      const response = await scanAPI.createScan(target);
      const scanData = response.data;

      setSearchResults((prev) => [scanData, ...prev]);

      navigate(`/scans/${scanData._id}`);
    }

    catch(error) {
      console.error("Scan pipeline error:", error.message);
    }
    finally {
      setLoading(false);
    }
  };

  return (
    <div className="dashboard">
      <h1>New Scan</h1>

      <form onSubmit={handleSubmit}>
        <label htmlFor="input"></label>
        <input
          type="text"
          placeholder="github.com"
          name="input"
          value={target}
          onChange={(e) => setTarget(e.target.value)}
        />

        <button type="submit" disabled={loading}>
          {loading ? "Scanning..." : "Scan"}
        </button>
      </form>
    </div>
  );
};

export default NewScan;
