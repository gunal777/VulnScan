import { useParams, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import scanAPI from "../services/api";
import useScan from "../hooks/useScan";
import { motion } from "framer-motion";
import {
  AlertCircle,
  ArrowLeft,
  Network,
  Lock,
  FileWarning,
  ShieldCheck,
  ShieldAlert,
  CheckCircle,
  Server,
} from "lucide-react";

const CIRCUMFERENCE = 2 * Math.PI * 65;

const getScoreColor = (score) => {
  if (score <= 20) return "#22C55E";
  if (score <= 50) return "#F59E0B";
  if (score <= 80) return "#F97316";
  return "#EF4444";
};

const getRiskLabel = (score) => {
  if (score <= 20) return "Low";
  if (score <= 50) return "Medium";
  if (score <= 80) return "High";
  return "Critical";
};

const getRiskClass = (score) => {
  if (score <= 20) return "low";
  if (score <= 50) return "medium";
  if (score <= 80) return "high";
  return "critical";
};

const formatDate = (dateStr) => {
  if (!dateStr) return "N/A";
  return new Date(dateStr).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const ScanDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const { searchResults, setSearchResults } = useScan();

  const cachedReport = searchResults.find(
    (scan) => scan._id === id
  );

  const [localReport, setLocalReport] = useState(
    cachedReport || null
  );

  const [loading, setLoading] = useState(
    !cachedReport
  );

  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (cachedReport) {
      setLocalReport(cachedReport);
      setLoading(false);
      return;
    }

    const fetchScan = async () => {
      try {
        setLoading(true);

        const response = await scanAPI.getScanById(id);

        setLocalReport(response.data);

        setSearchResults((prev) => {
          const exists = prev.some(
            (scan) => scan._id === response.data._id
          );

          if (exists) return prev;

          return [response.data, ...prev];
        });
      } catch (error) {
        console.error(error);
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    };

    fetchScan();
  }, [id, cachedReport, setSearchResults]);

  if (loading) {
    return (
      <div className="empty-state">
        <h3>Loading Report...</h3>
        <p>Fetching scan details from the server.</p>
      </div>
    );
  }

  if (notFound || !localReport) {
    return (
      <div className="not-found-container">
        <div className="not-found-icon">
          <AlertCircle size={28} />
        </div>

        <h3>Scan Report Not Found</h3>

        <p>
          The requested scan does not exist or may have been deleted.
        </p>

        <button
          className="not-found-btn"
          onClick={() => navigate("/")}
        >
          <ArrowLeft size={16} />
          Back to Dashboard
        </button>
      </div>
    );
  }

  const score = localReport.riskScore ?? 0;
  const scoreColor = getScoreColor(score);
  const riskLabel = getRiskLabel(score);
  const riskClass = getRiskClass(score);
  const dashOffset = CIRCUMFERENCE - (score / 100) * CIRCUMFERENCE;

  const portsCount = localReport.ports?.length || 0;
  const openPorts =
    localReport.ports?.filter((p) => p.state === "open").length || 0;
  const findingsCount = localReport.findings?.length || 0;

  // SSL days remaining calculation
  const ssl = localReport.ssl;
  let sslDaysRemaining = null;
  // eslint-disable-next-line no-useless-assignment
  let sslTotalDays = null;
  let sslHealthPercent = 0;
  if (ssl?.validTo) {
    const now = new Date();
    const validTo = new Date(ssl.validTo);
    const validFrom = ssl.validFrom ? new Date(ssl.validFrom) : now;
    sslDaysRemaining = Math.max(
      0,
      Math.ceil((validTo - now) / (1000 * 60 * 60 * 24))
    );
    sslTotalDays = Math.max(
      1,
      Math.ceil((validTo - validFrom) / (1000 * 60 * 60 * 24))
    );
    sslHealthPercent = Math.min(
      100,
      Math.max(0, (sslDaysRemaining / sslTotalDays) * 100)
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
    >
      {/* Section A — Back Button + Summary Banner */}
      <button className="details-back-btn" onClick={() => navigate("/")}>
        <ArrowLeft size={16} />
        Dashboard
      </button>

      <div className="details-summary">
        <div className="details-summary-main">
          <h1>{localReport.target}</h1>
        </div>
        <div className="details-summary-meta">
          <div className="details-meta-item">
            <span className="details-meta-label">Scan Date</span>
            <span className="details-meta-value">
              {formatDate(localReport.createdAt)}
            </span>
          </div>
          <div className="details-meta-item">
            <span className="details-meta-label">Status</span>
            <span className="details-meta-value">
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                }}
              >
                <CheckCircle size={14} style={{ color: "var(--success)" }} />
                Completed
              </span>
            </span>
          </div>
          <div className="details-meta-item">
            <span className="details-meta-label">Risk Score</span>
            <span className="details-meta-value">
              <span className={`risk-badge ${riskClass}`}>
                <span className="risk-dot" />
                {score}/100
              </span>
            </span>
          </div>
          <div className="details-meta-item">
            <span className="details-meta-label">Findings</span>
            <span className="details-meta-value">{findingsCount}</span>
          </div>
        </div>
      </div>

      {/* Section B — Risk Score Visualization */}
      <div className="risk-score-section">
        <div className="score-circle-card">
          <h3>Risk Score</h3>
          <div className="score-circle">
            <svg viewBox="0 0 160 160">
              <circle
                className="score-circle-bg"
                cx="80"
                cy="80"
                r="65"
              />
              <circle
                className="score-circle-progress"
                cx="80"
                cy="80"
                r="65"
                stroke={scoreColor}
                strokeDasharray={CIRCUMFERENCE}
                strokeDashoffset={dashOffset}
              />
            </svg>
            <div className="score-circle-value">
              <span className="score-number" style={{ color: scoreColor }}>
                {score}
              </span>
              <span className="score-label-text">{riskLabel} Risk</span>
            </div>
          </div>
        </div>

        <div className="score-stats-card">
          <h3>Scan Summary</h3>
          <div className="score-stat-row">
            <span className="score-stat-label">
              <span
                className="score-stat-dot"
                style={{ background: "var(--accent)" }}
              />
              Ports Detected
            </span>
            <span className="score-stat-value">{portsCount}</span>
          </div>
          <div className="score-stat-row">
            <span className="score-stat-label">
              <span
                className="score-stat-dot"
                style={{ background: "var(--success)" }}
              />
              Open Ports
            </span>
            <span className="score-stat-value">{openPorts}</span>
          </div>
          <div className="score-stat-row">
            <span className="score-stat-label">
              <span
                className="score-stat-dot"
                style={{ background: "var(--warning)" }}
              />
              Findings
            </span>
            <span className="score-stat-value">{findingsCount}</span>
          </div>
          <div className="score-stat-row">
            <span className="score-stat-label">
              <span
                className="score-stat-dot"
                style={{ background: ssl ? "var(--success)" : "var(--text-muted)" }}
              />
              SSL Status
            </span>
            <span className="score-stat-value">
              {ssl ? "Valid" : "Not Available"}
            </span>
          </div>
        </div>
      </div>

      {/* Section C — Port Analysis */}
      <div className="details-section">
        <h2 className="details-section-title">
          <Network size={20} className="section-icon" />
          Port Analysis
        </h2>
        {portsCount > 0 ? (
          <table className="port-table">
            <thead>
              <tr>
                <th>Port</th>
                <th>State</th>
                <th>Service</th>
              </tr>
            </thead>
            <tbody>
              {localReport.ports.map((port, i) => (
                <tr key={i}>
                  <td>
                    <span className="port-number">{port.port}</span>
                  </td>
                  <td>
                    <span
                      className={`port-state-badge ${port.state === "open"
                          ? "open"
                          : port.state === "filtered"
                            ? "filtered"
                            : "closed"
                        }`}
                    >
                      {port.state}
                    </span>
                  </td>
                  <td>{port.service || "Unknown"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="empty-state">
            <Server size={40} className="empty-state-icon" />
            <h3>No ports detected</h3>
            <p>No open ports were found during this scan.</p>
          </div>
        )}
      </div>

      {/* Section D — SSL Certificate */}
      <div className="details-section">
        <h2 className="details-section-title">
          <Lock size={20} className="section-icon" />
          SSL Certificate
        </h2>
        {ssl ? (
          <div className="ssl-card">
            <div className="ssl-grid">
              <div className="ssl-item">
                <span className="ssl-label">Issuer</span>
                <span className="ssl-value">
                  {ssl.issuer || "N/A"}
                </span>
              </div>
              <div className="ssl-item">
                <span className="ssl-label">Subject</span>
                <span className="ssl-value">
                  {ssl.subject || "N/A"}
                </span>
              </div>
              <div className="ssl-item">
                <span className="ssl-label">Valid From</span>
                <span className="ssl-value">
                  {ssl.validFrom ? formatDate(ssl.validFrom) : "N/A"}
                </span>
              </div>
              <div className="ssl-item">
                <span className="ssl-label">Valid To</span>
                <span className="ssl-value">
                  {ssl.validTo ? formatDate(ssl.validTo) : "N/A"}
                </span>
              </div>
            </div>
            {sslDaysRemaining !== null && (
              <div className="ssl-health">
                <span className="ssl-label">
                  Certificate Health — {sslDaysRemaining} days remaining
                </span>
                <div className="ssl-health-bar">
                  <div
                    className="ssl-health-fill"
                    style={{
                      width: `${sslHealthPercent}%`,
                      background:
                        sslHealthPercent > 50
                          ? "var(--success)"
                          : sslHealthPercent > 20
                            ? "var(--warning)"
                            : "var(--danger)",
                    }}
                  />
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="empty-state">
            <ShieldAlert size={40} className="empty-state-icon" />
            <h3>No SSL data available</h3>
            <p>SSL certificate information was not detected for this target.</p>
          </div>
        )}
      </div>

      {/* Section E — Security Findings */}
      <div className="details-section">
        <h2 className="details-section-title">
          <FileWarning size={20} className="section-icon" />
          Security Findings
        </h2>
        {findingsCount > 0 ? (
          localReport.findings.map((finding, i) => (
            <div className="finding-card" key={i}>
              <div className="finding-header">
                <span className="finding-title">
                  {finding.title || finding.name || "Untitled Finding"}
                </span>
                <span
                  className={`severity-badge ${finding.severity?.toLowerCase() || "info"
                    }`}
                >
                  {finding.severity || "Info"}
                </span>
              </div>
              {finding.category && (
                <div className="finding-category">{finding.category}</div>
              )}
              {finding.description && (
                <p className="finding-description">{finding.description}</p>
              )}
              {finding.recommendation && (
                <div className="finding-remediation">
                  <div className="remediation-label">Recommendation</div>
                  <div className="remediation-text">{finding.recommendation}</div>
                </div>
              )}
            </div>
          ))
        ) : (
          <div className="empty-state">
            <ShieldCheck size={40} className="empty-state-icon" />
            <h3>No findings detected</h3>
            <p>No security vulnerabilities were identified in this scan.</p>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default ScanDetails;