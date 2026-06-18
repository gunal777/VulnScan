import { useEffect, useMemo } from "react";
import scanAPI from "../services/api";
import { Link } from "react-router-dom";
import useScan from "../hooks/useScan";
import { motion } from "framer-motion";
import {
  BarChart3,
  TrendingUp,
  AlertTriangle,
  ShieldCheck,
  Calendar,
  ArrowRight,
  Activity,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

const Dashboard = () => {
  const { loading, setLoading, setSearchResults, searchResults } = useScan();

  useEffect(() => {
    async function getRecents() {
      try {
        if(searchResults.length > 0) return;

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
  }, [])

  // ── Derived KPI computations ──────────────────────────────────
  const totalScans = searchResults.length;

  const avgRiskScore = useMemo(() => {
    if (searchResults.length === 0) return 0;
    const sum = searchResults.reduce((acc, s) => acc + (s.riskScore || 0), 0);
    return Math.round(sum / searchResults.length);
  }, [searchResults]);

  const criticalFindings = useMemo(() => {
    return searchResults.reduce((count, scan) => {
      if (!scan.findings) return count;
      return (
        count +
        scan.findings.filter(
          (f) => f.severity === "Critical" || f.severity === "High"
        ).length
      );
    }, 0);
  }, [searchResults]);

  const secureTargets = useMemo(() => {
    return searchResults.filter((s) => (s.riskScore || 0) < 21).length;
  }, [searchResults]);

  const latestScanDate = useMemo(() => {
    if (searchResults.length === 0) return "—";
    const sorted = [...searchResults].sort(
      (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
    );
    return new Date(sorted[0].createdAt).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }, [searchResults]);

  // ── Chart data ────────────────────────────────────────────────
  const riskTrendData = useMemo(() => {
    return [...searchResults]
      .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
      .map((scan) => ({
        date: new Date(scan.createdAt).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        }),
        riskScore: scan.riskScore || 0,
        target: scan.target,
      }));
  }, [searchResults]);

  const severityData = useMemo(() => {
    const counts = { Critical: 0, High: 0, Medium: 0, Low: 0, Info: 0 };
    searchResults.forEach((scan) => {
      if (!scan.findings) return;
      scan.findings.forEach((f) => {
        const key =
          f.severity?.charAt(0).toUpperCase() + f.severity?.slice(1);
        if (counts[key] !== undefined) counts[key]++;
      });
    });
    return Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
      .filter((d) => d.value > 0);
  }, [searchResults]);

  const SEVERITY_COLORS = {
    Critical: "var(--danger)",
    High: "#F97316",
    Medium: "var(--warning)",
    Low: "var(--success)",
    Info: "#8B5CF6",
  };

  const recentFive = useMemo(() => {
    return [...searchResults]
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 5);
  }, [searchResults]);

  // ── Helpers ───────────────────────────────────────────────────
  const getRiskLevel = (score) => {
    if (score >= 80) return "critical";
    if (score >= 50) return "high";
    if (score >= 21) return "medium";
    return "low";
  };

  const getRiskLabel = (score) => {
    if (score >= 80) return "Critical";
    if (score >= 50) return "High";
    if (score >= 21) return "Medium";
    return "Low";
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div
          style={{
            background: "var(--bg-secondary)",
            border: "1px solid var(--border)",
            borderRadius: "8px",
            padding: "12px 16px",
            fontSize: "0.82rem",
          }}
        >
          <p style={{ color: "var(--text-primary)", fontWeight: 600, margin: 0 }}>
            {label}
          </p>
          <p style={{ color: "var(--accent)", margin: "4px 0 0" }}>
            Risk Score: {payload[0].value}
          </p>
          {payload[0].payload.target && (
            <p style={{ color: "var(--text-muted)", margin: "2px 0 0" }}>
              {payload[0].payload.target}
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  // ── Loading skeleton ──────────────────────────────────────────
  if (loading) {
    return (
      <div>
        <div className="page-header">
          <h1>Security Dashboard</h1>
          <p>Loading threat intelligence data…</p>
        </div>
        <div className="metrics-grid">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="skeleton skeleton-card" />
          ))}
        </div>
        <div className="charts-row">
          <div className="skeleton skeleton-chart" />
          <div className="skeleton skeleton-chart" />
        </div>
      </div>
    );
  }

  // ── Main render ───────────────────────────────────────────────
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
    >
      {/* Page Header */}
      <div className="page-header">
        <h1>Security Dashboard</h1>
        <p>Real-time vulnerability intelligence &amp; threat overview</p>
      </div>

      {/* KPI Metric Cards */}
      <div className="metrics-grid">
        <div className="metric-card accent">
          <div className="metric-icon accent">
            <BarChart3 size={20} />
          </div>
          <div className="metric-label">Total Scans</div>
          <div className="metric-value">{totalScans}</div>
          <div className="metric-sub">all time</div>
        </div>

        <div className="metric-card warning">
          <div className="metric-icon warning">
            <TrendingUp size={20} />
          </div>
          <div className="metric-label">Avg Risk Score</div>
          <div className="metric-value">{avgRiskScore}</div>
          <div className="metric-sub">across targets</div>
        </div>

        <div className="metric-card danger">
          <div className="metric-icon danger">
            <AlertTriangle size={20} />
          </div>
          <div className="metric-label">Critical Findings</div>
          <div className="metric-value">{criticalFindings}</div>
          <div className="metric-sub">high &amp; critical</div>
        </div>

        <div className="metric-card success">
          <div className="metric-icon success">
            <ShieldCheck size={20} />
          </div>
          <div className="metric-label">Secure Targets</div>
          <div className="metric-value">{secureTargets}</div>
          <div className="metric-sub">risk &lt; 21</div>
        </div>

        <div className="metric-card info">
          <div className="metric-icon info">
            <Calendar size={20} />
          </div>
          <div className="metric-label">Latest Scan</div>
          <div className="metric-value" style={{ fontSize: "1.15rem" }}>
            {latestScanDate}
          </div>
          <div className="metric-sub">most recent</div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="charts-row">
        {/* Risk Trend Area Chart */}
        <div className="chart-card">
          <div className="chart-card-header">
            <div>
              <div className="chart-card-title">Risk Score Trend</div>
              <div className="chart-card-subtitle">
                Score evolution across scans
              </div>
            </div>
            <Activity size={18} style={{ color: "var(--text-muted)" }} />
          </div>
          {riskTrendData.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={riskTrendData}>
                <defs>
                  <linearGradient id="riskGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--accent)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="var(--accent)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="var(--border)"
                  vertical={false}
                />
                <XAxis
                  dataKey="date"
                  tick={{ fill: "var(--text-muted)", fontSize: 12 }}
                  axisLine={{ stroke: "var(--border)" }}
                  tickLine={false}
                />
                <YAxis
                  domain={[0, 100]}
                  tick={{ fill: "var(--text-muted)", fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                  width={35}
                />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey="riskScore"
                  stroke="var(--accent)"
                  strokeWidth={2}
                  fill="url(#riskGradient)"
                  dot={{
                    r: 4,
                    fill: "var(--bg-card)",
                    stroke: "var(--accent)",
                    strokeWidth: 2,
                  }}
                  activeDot={{
                    r: 6,
                    fill: "var(--accent)",
                    stroke: "var(--bg-card)",
                    strokeWidth: 2,
                  }}
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="empty-state" style={{ padding: "40px 20px" }}>
              <p>No scan data available yet</p>
            </div>
          )}
        </div>

        {/* Severity Distribution Donut */}
        <div className="chart-card">
          <div className="chart-card-header">
            <div>
              <div className="chart-card-title">Severity Breakdown</div>
              <div className="chart-card-subtitle">Finding distribution</div>
            </div>
          </div>
          {severityData.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={severityData}
                  cx="50%"
                  cy="45%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={3}
                  dataKey="value"
                  stroke="none"
                >
                  {severityData.map((entry) => (
                    <Cell
                      key={entry.name}
                      fill={SEVERITY_COLORS[entry.name] || "var(--text-muted)"}
                    />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    background: "var(--bg-secondary)",
                    border: "1px solid var(--border)",
                    borderRadius: "8px",
                    fontSize: "0.82rem",
                  }}
                />
                <Legend
                  verticalAlign="bottom"
                  iconType="circle"
                  iconSize={8}
                  formatter={(value) => (
                    <span style={{ color: "var(--text-secondary)", fontSize: "0.78rem" }}>
                      {value}
                    </span>
                  )}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="empty-state" style={{ padding: "40px 20px" }}>
              <p>No findings recorded</p>
            </div>
          )}
        </div>
      </div>

      {/* Recent Scans Preview */}
      <div className="section-card">
        <div className="section-card-header">
          <span className="section-card-title">Recent Scans</span>
          <Link to="/scans/recent" className="section-card-link">
            View all <ArrowRight size={14} style={{ verticalAlign: "middle" }} />
          </Link>
        </div>

        {recentFive.length > 0 ? (
          recentFive.map((scan) => (
            <Link
              key={scan._id}
              to={`/scans/${scan._id}`}
              className="preview-scan-item"
            >
              <div className="preview-scan-info">
                <span className="preview-scan-target">{scan.target}</span>
                <span className="preview-scan-date">
                  {new Date(scan.createdAt).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>
              <span
                className={`risk-badge ${getRiskLevel(scan.riskScore || 0)}`}
              >
                <span className="risk-dot" />
                {getRiskLabel(scan.riskScore || 0)}
              </span>
            </Link>
          ))
        ) : (
          <div className="empty-state">
            <p>No scans yet. Start your first scan to see results here.</p>
          </div>
        )}
      </div>
    </motion.div>
  );
}

export default Dashboard;