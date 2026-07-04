import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Search, ArrowDownWideNarrow, ShieldAlert, Trash2, FileSearch } from "lucide-react";
import useScan from "../hooks/useScan";
import scanAPI from "../services/api";

const getRiskClass = (score) => {
  if (score <= 20) return "low";
  if (score <= 50) return "medium";
  if (score <= 80) return "high";
  return "critical";
};

const getRiskLabel = (score) => {
  if (score <= 20) return "Low";
  if (score <= 50) return "Medium";
  if (score <= 80) return "High";
  return "Critical";
};

const formatDate = (dateStr) => {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

const RecentScans = () => {
  const { searchResults, removeScan } = useScan();
  const [deletingId, setDeletingId] = useState(null);
  const [displayedScans, setDisplayedScans] = useState(searchResults);

  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('date');

  useEffect(() => {
    setDisplayedScans(searchResults);
  }, [searchResults]);

  useEffect(() => {
    const timer = setTimeout(() => {
      const query = searchQuery.trim();

      if (query === "") {
        setDisplayedScans(searchResults);
        return;
      }

      handleSearch(query);
    }, 400);

    return () => clearTimeout(timer);
  }, [searchQuery, searchResults]);

  const handleDelete = async (e, id) => {
    e.preventDefault();

    if (!window.confirm("Are you sure you want to delete this scan record?")) return;

    setDeletingId(id);
    try {
      await scanAPI.deleteScan(id);
      removeScan(id);
      setDisplayedScans(prev => prev.filter(scan => scan._id !== id));
      console.log(`Scan instance ${id} wiped successfully.`);
    }
    catch (error) {
      console.error("Failed to execute delete sequence:", error.message);
    }
    finally {
      setDeletingId(null);
    }
  };

  const handleSearch = async (query) => {
    try {
      const response = await scanAPI.searchScan(query);
      setDisplayedScans(response.data);

    }
    catch (error) {
      console.error("Search Failed: ", error);
      setDisplayedScans([]);
    }
  };

  const filtered = [...displayedScans || []].sort((a, b) => {
    if (sortBy === "risk") {
      return (b.riskScore ?? 0) - (a.riskScore ?? 0);
    }
    return new Date(b.createdAt) - new Date(a.createdAt);
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
    >
      <div className="page-header">
        <h1>Recent Scans</h1>
        <p>Browse and manage all vulnerability scan records</p>
      </div>

      <div className="scans-controls">
        <div className="search-input-wrapper">
          <Search className="search-icon" />
          <input
            className="search-input"
            type="text"
            placeholder="Search targets…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <button
          className={`sort-btn${sortBy === "date" ? " active" : ""}`}
          onClick={() => setSortBy("date")}
        >
          <ArrowDownWideNarrow size={16} />
          Sort by Date
        </button>

        <button
          className={`sort-btn${sortBy === "risk" ? " active" : ""}`}
          onClick={() => setSortBy("risk")}
        >
          <ShieldAlert size={16} />
          Sort by Risk
        </button>
      </div>

      {filtered.length === 0 ? (
        <div className="empty-state">
          <FileSearch className="empty-state-icon" />
          <h3>No scans found</h3>
          <p>
            {searchQuery
              ? "No results match your search. Try a different query."
              : "You haven't run any scans yet. Start a new scan to see results here."}
          </p>
        </div>
      ) : (
        <div className="scans-table">
          <div className="scans-table-header">
            <span>Target</span>
            <span>Type</span>
            <span>Scan Date</span>
            <span>Risk Score</span>
            <span>Findings</span>
            <span>Actions</span>
          </div>

          {filtered.map((element) => (
            <Link
              key={element._id}
              to={`/scans/${element._id}`}
              className="scan-table-row"
            >
              <div className="scan-target-cell">
                <span className="scan-target-name">{element.target}</span>
                <span className="scan-target-type">{element.targetType}</span>
              </div>

              <span className="scan-cell" style={{ textTransform: 'uppercase', fontSize: '0.72rem', letterSpacing: '0.5px', fontWeight: '500' }}>
                {element.targetType}
              </span>

              <span className="scan-cell">{formatDate(element.createdAt)}</span>

              <span className="scan-cell">
                <span className={`risk-badge ${getRiskClass(element.riskScore ?? 0)}`}>
                  <span className="risk-dot"></span>
                  {getRiskLabel(element.riskScore ?? 0)} ({element.riskScore ?? 0})
                </span>
              </span>

              <span className="scan-cell findings-count">
                {element.findings ? element.findings.length : 0}
              </span>

              <button
                className="delete-btn"
                disabled={deletingId === element._id}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleDelete(e, element._id);
                }}
                title="Delete scan"
              >
                {deletingId === element._id ? (
                  <>
                    <span className="delete-spinner"></span>
                    Deleting...
                  </>
                ) : (
                  <Trash2 size={16} />
                )}
              </button>
            </Link>
          ))}
        </div>
      )}
    </motion.div>
  );
};

export default RecentScans;