const tls = require("tls");

const createTLSConnection = (target) => {
  return new Promise((resolve, reject) => {
    const options = {
      host: target,
      port: 443,
      servername: target,
      rejectUnauthorized: false,
    };

    const socket = tls.connect(options, () => {
      const cert = socket.getPeerCertificate();
      socket.destroy();
      resolve(cert);
    });

    socket.setTimeout(10000, () => {
      socket.destroy();
      reject(new Error("Connection timed out."));
    });

    socket.on("error", (error) => {
      socket.destroy();
      reject(error);
    });
  });
};

const sslScan = async (target) => {
   try {
    const parsed = new URL(target.includes("://") ? target : `https://${target}`);
    target = parsed.hostname;
  } 
  catch {}

  let cert;

  try {
    cert = await createTLSConnection(target);
  } 
  
  catch (error) {

    const isTimeout = error.message === "Connection timed out.";
    return {
      ssl: null,
      findings: [{
        category: "SSL/TLS",
        title: isTimeout ? "SSL Connection Timeout" : "SSL Handshake Failed",
        severity: "Info",
        description: error.message,
        recommendation: "Verify port 443 is open and serving TLS traffic.",
      },
      ],
    };
  }

  if (!cert || Object.keys(cert).length === 0) {
    return {
      ssl: null,
      findings: [{
        category: "SSL/TLS",
        title: "No SSL Certificate Found",
        severity: "High",
        description: "The target port 443 did not return a valid SSL/TLS certificate.",
      },
      ],
    };
  }

  const validFrom = new Date(cert.valid_from).toISOString().split("T")[0];
  const validTo = new Date(cert.valid_to).toISOString().split("T")[0];

  const expiresInDays = Math.ceil(
    (new Date(cert.valid_to).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  );

  const issuer = cert.issuer?.O || cert.issuer?.CN || "Unknown Issuer";
  const subject = cert.subject?.CN || "Unknown Subject";

  const hostnameValid = tls.checkServerIdentity(target, cert) === undefined;

  const isSelfSigned = (cert.issuer?.CN === cert.subject?.CN && cert.issuer?.O === cert.subject?.O) ? true : false;

  const findings = [];

  if (expiresInDays < 0) {
    findings.push({
      category: "SSL/TLS",
      title: "SSL Certificate Expired",
      severity: "Critical",
      description: `Certificate expired on ${validTo}. Browsers are actively blocking traffic.`,
      recommendation: "Renew the SSL certificate immediately.",
    });
  } else if (expiresInDays <= 14) {
    findings.push({
      category: "SSL/TLS",
      title: "SSL Certificate Expiring Soon",
      severity: "High",
      description: `Certificate expires in ${expiresInDays} days on ${validTo}.`,
      recommendation: "Renew the certificate immediately.",
    });
  } else if (expiresInDays <= 30) {
    findings.push({
      category: "SSL/TLS",
      title: "SSL Certificate Expiring Soon",
      severity: "Medium",
      description: `Certificate expires in ${expiresInDays} days on ${validTo}.`,
      recommendation: "Schedule a renewal before the expiration window lapses.",
    });
  }

  if (isSelfSigned) {
    findings.push({
      category: "SSL/TLS",
      title: "Self-Signed Certificate Detected",
      severity: "High",
      description: "Certificate is self-signed and not issued by a trusted CA. Browsers will throw security warnings.",
      recommendation: "Replace with a certificate from a trusted CA like Let's Encrypt.",
    });
  }

  if (!hostnameValid) {
    findings.push({
      category: "SSL/TLS",
      title: "Hostname Mismatch",
      severity: "High",
      description: `Certificate is not valid for hostname: ${target}`,
      recommendation: "Ensure the certificate SANs cover the correct domain.",
    });
  }

  return {
    ssl: {
      valid: expiresInDays > 0 && !isSelfSigned && hostnameValid,
      issuer,
      subject,
      validFrom,
      validTo,
      expiresInDays,
    },
    findings,
  };
};

module.exports = sslScan;