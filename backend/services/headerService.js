const axios = require("axios");
const https = require("https");

const WAF_SIGNATURES = [
  {
    vendor: "Cloudflare",
    indicators: ["cf-ray", "cf-mitigated", "cf-cache-status"],
  },
  {
    vendor: "Akamai",
    indicators: ["akamai-origin-hop", "x-akamai-transformed", "x-check-cacheable"],
  },
  {
    vendor: "Imperva",
    indicators: ["x-iinfo", "x-cdn"],
  },
  {
    vendor: "Sucuri",
    indicators: ["x-sucuri-id", "x-sucuri-cache"],
  },
  {
    vendor: "AWS CloudFront",
    indicators: ["x-amz-cf-id", "x-amz-cf-pop"],
  },
  {
    vendor: "F5 BIG-IP",
    indicators: ["x-wa-info", "x-cnection"],
  },
  {
    vendor: "Barracuda",
    indicators: ["x-barracuda-connect", "x-barracuda-start-time"],
  },
];

const detectWAF = (headers) => {
  for (const waf of WAF_SIGNATURES) {
    const matched = waf.indicators.some((indicator) => headers[indicator]);
    if (matched) {
      return {
        detected: true,
        vendor: waf.vendor,
      };
    }
  }

  return { detected: false, vendor: null };
};

const headerScan = async (target, ports) => {
  const hasHttps = ports.some(
    (port) => port.port === 443 || (port.service || "").toLowerCase() === "https");

  const hasHttp = ports.some(
    (port) => port.port === 80 || (port.service || "").toLowerCase() === "http");

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
  } catch (error) {
    if (error.response) {
      status = error.response.status;
      headers = error.response.headers;
    } else {
      return {
        findings: [{
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

  // --- WAF ---
  const waf = detectWAF(headers);

  if (waf.detected) {
    findings.push({
      source: "header-scan",
      category: "Infrastructure",
      title: "WAF Detected",
      severity: "Info",
      description: `${waf.vendor} Web Application Firewall detected.`,
    });
  }

  if (status === 403) {
    findings.push({
      source: "header-scan",
      category: "Infrastructure",
      title: "Access Restricted",
      severity: "Info",
      description:
        "Server returned HTTP 403 Forbidden. Target may be protected by a WAF or access control.",
    });
  }

  // Security Headers 

  const securityChecklist = {
    "content-security-policy": {
      severity: "Medium",
      description: "Content-Security-Policy header is missing.",
      recommendation: "Implement a Content-Security-Policy header.",
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

  // HSTS only makes sense over HTTPS
  if (url.startsWith("https://") && !headers["strict-transport-security"]) {
    findings.push({
      source: "header-scan",
      category: "Headers",
      title: "Missing strict-transport-security",
      severity: "High",
      description: "Strict-Transport-Security header is missing.",
      recommendation: "Enable HSTS to enforce HTTPS.",
    });
  }

  // --- Information Disclosure ---

  if (headers["server"]) {
    const knownTechnologies = ["apache", "nginx", "iis", "tomcat", "jetty", "express"];
    const server = headers["server"].toLowerCase();
    const leaksTech = knownTechnologies.some((tech) => server.includes(tech));
    const leaksVersion = /[0-9]/.test(headers["server"]);

    if (leaksTech && leaksVersion) {
      findings.push({
        source: "header-scan",
        category: "Headers",
        title: "Server Technology & Version Disclosure",
        severity: "Low",
        description: `Server header exposes backend technology and version: ${headers["server"]}`,
        recommendation: "Remove or obfuscate the Server header to hide version details.",
      });
    } else if (leaksTech) {
      findings.push({
        source: "header-scan",
        category: "Headers",
        title: "Server Technology Disclosure",
        severity: "Info",
        description: `Server header exposes backend technology: ${headers["server"]}`,
        recommendation: "Remove or obfuscate the Server header.",
      });
    }
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

  if (headers["x-frame-options"] && headers["x-frame-options"].toUpperCase().startsWith("ALLOW-FROM")) {
    findings.push({
      source: "header-scan",
      category: "Headers",
      title: "X-Frame-Options Uses Deprecated ALLOW-FROM",
      severity: "Medium",
      description:
        "ALLOW-FROM is ignored by all modern browsers, rendering clickjacking protection ineffective.",
      recommendation: "Replace with Content-Security-Policy frame-ancestors directive.",
    });
  }

  if (headers["x-xss-protection"]) {
    const xssValue = headers["x-xss-protection"].replace(/\s/g, "");
    if (xssValue === "1" || xssValue.includes("1;mode=block")) {
      findings.push({
        source: "header-scan",
        category: "Headers",
        title: "Legacy X-XSS-Protection Filter Enabled",
        severity: "Low",
        description:
          "X-XSS-Protection is active. This legacy browser feature is deprecated and can be weaponized by attackers to disable legitimate scripts.",
        recommendation:
          "Change the header value to '0' to safely disable the legacy auditor, and rely entirely on your Content-Security-Policy instead.",
      });
    }
  }

  return { status, findings };
};

module.exports = headerScan;