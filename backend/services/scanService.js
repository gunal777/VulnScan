const nmapScan = require("./nmapService");
const headerScan = require("./headerService");
const sslScan = require("./sslService");
const calculateRiskScore = require("./scoringService");

const scanService = async (target) => {

  const ports = await nmapScan(target);
  const headerReport = await headerScan(target, ports);

  const hasHttps = ports.some((port) => port.port === 443 || (port.service || "").toLowerCase() === "https");

  let sslReport = { ssl: null, findings: [] };

  if (hasHttps) {
    sslReport = await sslScan(target);
  }

  const findings = [...headerReport.findings, ...(sslReport.findings || [])];

  const riskScore = calculateRiskScore(findings);

  return {
    status: "completed",
    ports,
    ssl: sslReport.ssl,
    findings,
    riskScore,
  };
};

module.exports = scanService;