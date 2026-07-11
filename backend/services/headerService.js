const axios = require("axios");
const https = require("https");

const WAF_SIGNATURES = [
  { vendor: "Cloudflare", indicators: ["cf-ray", "cf-cache-status", "cf-mitigated"] },
  { vendor: "Akamai", indicators: ["akamai-origin-hop", "x-akamai-transformed", "akamai-cache-status"] },
  { vendor: "Imperva", indicators: ["x-iinfo"] },
  { vendor: "Sucuri", indicators: ["x-sucuri-id", "x-sucuri-cache", "x-sucuri-block"] },
  { vendor: "AWS CloudFront / AWS WAF", indicators: ["x-amz-cf-id", "x-amz-cf-pop"] },
  { vendor: "F5 BIG-IP", indicators: ["x-wa-info", "x-cnection"] },
  { vendor: "Barracuda", indicators: ["x-barracuda-connect", "x-barracuda-start-time"] },
  { vendor: "Azure Front Door", indicators: ["x-azure-ref"] },
  { vendor: "Fastly", indicators: ["x-served-by", "fastly-debug-digest", "x-cache-hits"] },
  { vendor: "Google Cloud Armor", indicators: ["x-cloud-trace-context"] },
];

const detectWAF = (headers) => {
  for (const waf of WAF_SIGNATURES) {
    const matched = waf.indicators.some((indicator) => headers[indicator]);
    if (matched) return { detected: true, vendor: waf.vendor };
  }
  return { detected: false, vendor: null };
};

const headerScan = async (target, ports) => {
  let hostname = target;
  let pathname = "/";

  try {
    const urlString = target.includes("://") ? target : `https://${target}`;
    const parsed = new URL(urlString);
    hostname = parsed.hostname;
    pathname = parsed.pathname + parsed.search;
  }
  catch {
    hostname = target;
  }

  const hasHttps = ports.some((p) => p.port === 443 || (p.service || "").toLowerCase() === "https");
  const hasHttp = ports.some((p) => p.port === 80 || (p.service || "").toLowerCase() === "http");

  if (!hasHttp && !hasHttps) return { findings: [] };

  let url;
  if (target.includes("://")) {
    url = target;
  }
  else {
    url = hasHttps ? `https://${hostname}${pathname}` : `http://${hostname}${pathname}`;
  }

  let headers = {};
  let status = null;
  let finalUrl = url;

  try {
    const response = await axios.get(url, {
      timeout: 10000,
      httpsAgent: new https.Agent({ rejectUnauthorized: false }),
      maxRedirects: 5,
      validateStatus: () => true,
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.5"
      }
    });

    status = response.status;
    headers = response.headers;
    finalUrl = response.request?.res?.responseUrl || url;
  }
  catch (error) {
    return {
      findings: [{
        source: "header-scan",
        category: "Infrastructure",
        title: "Connection Failed",
        severity: "Info",
        description: error.message,
        recommendation: "Verify the target is reachable via HTTP/HTTPS.",
      }],
    };
  }

  const findings = [];
  const waf = detectWAF(headers);
  const isAccessRestricted = status === 403 || status === 429 || status === 530;

  if (waf.detected && isAccessRestricted) {
    findings.push({
      source: "header-scan",
      category: "Infrastructure",
      title: "Scan Intercepted by WAF",
      severity: "Info",
      description: `${waf.vendor} Web Application Firewall intercepted the request (HTTP ${status}). Further security header analysis has been suspended to prevent false positives.`,
      recommendation: "Whitelist the scanner IP or sign requests if this target belongs to you."
    });
    return { status, findings };
  }

  if (status === 403) {
    findings.push({
      source: "header-scan",
      category: "Infrastructure",
      title: "Access Restricted",
      severity: "Info",
      description: "Server returned HTTP 403 Forbidden. Target may be protected by a WAF or access control.",
    });
  }

  if (waf.detected) {
    findings.push({
      source: "header-scan",
      category: "Infrastructure",
      title: "WAF Detected",
      severity: "Info",
      description: `${waf.vendor} Web Application Firewall detected.`,
    });
  }

  if (finalUrl !== url) {
    findings.push({
      source: "header-scan",
      category: "Infrastructure",
      title: "HTTP Redirect Followed",
      severity: "Info",
      description: `The target redirected the scanner from ${url} to ${finalUrl}. All security headers in this report reflect the final destination.`,
      recommendation: "Ensure this redirection is intended and that the final endpoint is the correct scope."
    });
  }

  const CSP = headers["content-security-policy"];
  const reportOnlyCSP = headers["content-security-policy-report-only"];

  if (!CSP && !reportOnlyCSP) {
    findings.push({
      source: "header-scan",
      category: "Headers",
      title: "Missing Content-Security-Policy",
      severity: "Medium",
      description: "Content-Security-Policy header is missing.",
      recommendation: "Implement a Content-Security-Policy header.",
    });
  } 
  else if (!CSP && reportOnlyCSP) {
    findings.push({
      source: "header-scan",
      category: "Headers",
      title: "CSP Operating in Report-Only Mode",
      severity: "Low",
      description: "A testing CSP is deployed via Report-Only, but it does not actively block execution payloads.",
      recommendation: "Thoroughly test validation logs and transition directives into enforcement mode.",
    });
  }

  const cspString = ((CSP || "") + (reportOnlyCSP || "")).toLowerCase();
  const hasFrameAncestors = cspString.includes("frame-ancestors");
  const xFrameOptions = headers["x-frame-options"];

  if (!hasFrameAncestors && !xFrameOptions) {
    findings.push({
      source: "header-scan",
      category: "Headers",
      title: "Missing Clickjacking Protection",
      severity: "Medium",
      description: "Neither X-Frame-Options nor a CSP frame-ancestors directive was found.",
      recommendation: "Implement the CSP frame-ancestors directive (preferred) or add an X-Frame-Options header.",
    });
  }

  if (xFrameOptions && xFrameOptions.toUpperCase().startsWith("ALLOW-FROM") && !hasFrameAncestors) {
    findings.push({
      source: "header-scan",
      category: "Headers",
      title: "X-Frame-Options Uses Deprecated ALLOW-FROM",
      severity: "Medium",
      description: "ALLOW-FROM is ignored by all modern browsers, rendering clickjacking protection ineffective.",
      recommendation: "Replace with Content-Security-Policy frame-ancestors directive.",
    });
  }

  if (!headers["x-content-type-options"]) {
    findings.push({
      source: "header-scan",
      category: "Headers",
      title: `Missing x-content-type-options`,
      severity: "Medium",
      description: "X-Content-Type-Options header is missing.",
      recommendation: "Set X-Content-Type-Options to nosniff.",
    });
  }

  if (finalUrl.startsWith("https://") && !headers["strict-transport-security"]) {
    findings.push({
      source: "header-scan",
      category: "Headers",
      title: "Missing strict-transport-security",
      severity: "High",
      description: "Strict-Transport-Security header is missing.",
      recommendation: "Enable HSTS to enforce HTTPS.",
    });
  }

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
    }
    else if (leaksTech) {
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

  if (headers["x-xss-protection"]) {
    const xssValue = headers["x-xss-protection"].replace(/\s/g, "");
    if (xssValue === "1" || xssValue.includes("1;mode=block")) {
      findings.push({
        source: "header-scan",
        category: "Headers",
        title: "Legacy X-XSS-Protection Filter Enabled",
        severity: "Low",
        description: "X-XSS-Protection is active. This legacy browser feature is deprecated and can be weaponized by attackers to disable legitimate scripts.",
        recommendation: "Change the header value to '0' to safely disable the legacy auditor, and rely entirely on your Content-Security-Policy instead.",
      });
    }
  }

  return { status, findings };
};

module.exports = headerScan;