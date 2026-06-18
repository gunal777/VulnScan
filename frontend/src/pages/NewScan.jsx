import scanAPI from "../services/api";
import { useState, useEffect } from "react";
import useScan from "../hooks/useScan";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Crosshair, Zap, Shield, Globe, Link, Server } from "lucide-react";

const statusMessages = [
  "Initializing scan engine...",
  "Running port enumeration...",
  "Inspecting security headers...",
  "Validating SSL configuration...",
  "Calculating risk score...",
  "Building report...",
];

const NewScan = () => {
  const [target, setTarget] = useState("");
  const [isCreatingScan, setIsCreatingScan] = useState(false);
  const { addScan } = useScan();
  const navigate = useNavigate();

  const [targetType, setTargetType] = useState("domain");
  const [statusIndex, setStatusIndex] = useState(0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!target) return;

    try {
      setIsCreatingScan(true);

      const response = await scanAPI.createScan(target);
      const scanData = response.data;

      addScan(scanData);

      setTarget("");

      navigate(`/scans/${scanData._id}`);
    } catch (error) {
      console.error("Scan pipeline error:", error.message);
    } finally {
      setIsCreatingScan(false);
    }
  };

  useEffect(() => {
    if (!isCreatingScan) return;

    setStatusIndex(0);

    const interval = setInterval(() => {
      setStatusIndex((prev) => (prev + 1) % statusMessages.length);
    }, 3000);

    return () => clearInterval(interval);
  }, [isCreatingScan]);

  const placeholders = {
    domain: "e.g. example.com",
    url: "e.g. https://example.com/path",
    ip: "e.g. 192.168.1.1",
  };

  const typeIcons = {
    domain: <Globe size={14} />,
    url: <Link size={14} />,
    ip: <Server size={14} />,
  };

  return (
    <div className="newscan-container">
      <motion.div
        className="newscan-card"
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
      >
        {!isCreatingScan ? (
          <>
            <div className="newscan-header">
              <div className="newscan-icon">
                <Crosshair size={28} />
              </div>
              <h1>Launch New Scan</h1>
              <p className="text-muted">
                Enter a target to begin vulnerability analysis
              </p>
            </div>

            <div className="type-pills">
              {["domain", "url", "ip"].map((type) => (
                <button
                  key={type}
                  className={`type-pill${targetType === type ? " active" : ""}`}
                  onClick={() => setTargetType(type)}
                  type="button"
                >
                  {typeIcons[type]}
                  {type === "ip" ? " IP" : " "+type.charAt(0).toUpperCase() + type.slice(1)}
                </button>
              ))}
            </div>

            <form onSubmit={handleSubmit}>
              <input
                className="newscan-input"
                type="text"
                value={target}
                onChange={(e) => setTarget(e.target.value)}
                placeholder={placeholders[targetType]}
              />
              <motion.button
                className="scan-submit-btn"
                type="submit"
                disabled={isCreatingScan || !target}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Zap size={18} />
                Initialize Scan
              </motion.button>
            </form>
          </>
        ) : (
          <div className="scanning-container">
            <div className="scanning-visual">
              <div className="scanning-ring" />
              <div className="scanning-ring" />
              <div className="scanning-ring" />
              <div className="scanning-center-icon">
                <Shield size={32} />
              </div>
            </div>
            <motion.p
              className="scanning-status"
              key={statusIndex}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.4 }}
            >
              {statusMessages[statusIndex]}
            </motion.p>
            <p className="scanning-substatus">This may take a few moments</p>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default NewScan;
