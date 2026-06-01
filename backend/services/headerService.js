const axios = require("axios");
const https = require("https");

const headerScan = async (target, ports) => {
  const hasHttps = ports.some(
    (port) => port.port === 443 || (port.service || "").toLowerCase() === "https"
  );

  const hasHttp = ports.some(
    (port) => port.port === 80 || (port.service || "").toLowerCase() === "http"
  );

  if (!hasHttp && !hasHttps) {
    return { findings: [] };
  }

  const url = hasHttps ? `https://${target}` : `http://${target}`;

  let headers = {};
  let status = null;

  try {
    const response = await axios.get(url, {
      timeout: 10000,
      httpsAgent: new https.Agent({ rejectUnauthorized: false }),
      maxRedirects: 5,
    });

    status = response.status;
    headers = response.headers;

  }

  catch (error) {
    if (error.response) {
      status = error.response.status;
      headers = error.response.headers;

    }
    else {
      return {
        findings: [
          {
            source: "header-scan",
            category: "Infrastructure",
            title: "Connection Failed",
            severity: "Info",
            description: error.message,
            recommendation: "Verify the target is reachable via HTTP/HTTPS.",
          },
        ],
      };
    }
  }

  const findings = [];
  let wafBlocked = false;

  // --- Infrastructure findings ---

  if (headers["cf-mitigated"]) {
    wafBlocked = true;
    findings.push({
      source: "header-scan",
      category: "Infrastructure",
      title: "WAF Detected",
      severity: "Info",
      description: "Cloudflare challenge protection detected.",
      recommendation: "Target appears to be protected by a Web Application Firewall.",
    });
  }

  if (status === 403) {
    findings.push({
      source: "header-scan",
      category: "Infrastructure",
      title: "Access Restricted",
      severity: "Info",
      description: "Server returned HTTP 403 Forbidden, Target may be protected by a WAF or access control mechanism.",
    });
  }

  // If WAF intercepted the request, header analysis would be against the
  // challenge page — not the real app. Mark as partial and bail early.
  if (wafBlocked) {
    findings.push({
      source: "header-scan",
      category: "Infrastructure",
      title: "Partial Scan",
      severity: "Info",
      description:
        "WAF challenge page detected. Security header analysis skipped — " +
        "results would reflect Cloudflare's response, not the actual application.",
    });

    return { findings };
  }

  // --- Security headers (only reached if no WAF block) ---

  const securityChecklist = {
    "content-security-policy": {
      severity: "High",
      description: "Content-Security-Policy header is missing.",
      recommendation: "Implement a Content-Security-Policy header.",
    },
    "strict-transport-security": {
      severity: "High",
      description: "Strict-Transport-Security header is missing.",
      recommendation: "Enable HSTS to enforce HTTPS.",
    },
    "x-frame-options": {
      severity: "Medium",
      description: "X-Frame-Options header is missing.",
      recommendation: "Add X-Frame-Options to prevent clickjacking.",
    },
    "x-content-type-options": {
      severity: "Medium",
      description: "X-Content-Type-Options header is missing.",
      recommendation: "Set X-Content-Type-Options to nosniff.",
    },
  };

  for (const [header, details] of Object.entries(securityChecklist)) {
    if (!headers[header]) {
      findings.push({
        source: "header-scan",
        category: "Headers",
        title: `Missing ${header}`,
        severity: details.severity,
        description: details.description,
        recommendation: details.recommendation,
      });
    }
  }

  // --- Information disclosure ---

  if (headers["server"] && !headers["server"].toLowerCase().includes("cloudflare")) {
    findings.push({
      source: "header-scan",
      category: "Headers",
      title: "Server Header Disclosure",
      severity: "Low",
      description: `Server header reveals backend technology: ${headers["server"]}`,
      recommendation: "Remove or obfuscate the Server header.",
    });
  }

  if (headers["x-powered-by"]) {
    findings.push({
      source: "header-scan",
      category: "Headers",
      title: "X-Powered-By Disclosure",
      severity: "Low",
      description: `X-Powered-By reveals framework information: ${headers["x-powered-by"]}`,
      recommendation: "Remove the X-Powered-By header.",
    });
  }

  // Deprecated ALLOW-FROM in X-Frame-Options
  if (headers["x-frame-options"] && headers["x-frame-options"].toUpperCase().startsWith("ALLOW-FROM")) {
    findings.push({
      source: "header-scan",
      category: "Headers",
      title: "X-Frame-Options Uses Deprecated ALLOW-FROM",
      severity: "Medium",
      description:
        "ALLOW-FROM is ignored by all modern browsers, rendering clickjacking protection ineffective.",
      recommendation:
        "Replace with Content-Security-Policy frame-ancestors directive.",
    });
  }

  // Deprecated X-XSS-Protection
  if (headers["x-xss-protection"]) {
    const xssValue = headers["x-xss-protection"].replace(/\s/g, ""); // Strip spaces for safety

    // ONLY flag it if it's explicitly turned on using legacy parameters
    if (xssValue === "1" || xssValue.includes("1;mode=block")) {
      findings.push({
        source: "header-scan",
        category: "Headers",
        title: "Legacy X-XSS-Protection Filter Enabled",
        severity: "Low",
        description: "X-XSS-Protection is active. This legacy browser feature is deprecated and can be weaponized by attackers to disable legitimate scripts.",
        recommendation: "Change the header value to '0' to safely disable the legacy auditor, and rely entirely on your Content-Security-Policy instead."
      });
    }
  }

  return { status, findings };
};

const ports = [
  { port: 80, state: "open", service: "http" },
  { port: 443, state: "open", service: "https" },
];

// (async () => {
//   const result = await headerScan("github.com", ports);
//   console.log("\nFINAL RESULT:");
//   console.dir(result, { depth: null });
// })();

module.exports = headerScan;