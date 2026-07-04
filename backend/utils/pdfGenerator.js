const PDFDocument = require("pdfkit");

const COLORS = {
  blue: "#2563EB",
  green: "#22C55E",
  orange: "#F59E0B",
  red: "#EF4444",
  gray: "#6B7280",
  black: "#111827",
  white: "#FFFFFF",
  lightGray: "#F9FAFB",
  borderGray: "#E5E7EB",
};

const FONT = {
  title: 24,
  section: 18,
  subtitle: 13,
  body: 11,
  caption: 9,
};

const MARGIN = 50;
const PAGE_WIDTH = 595.28;
const PAGE_HEIGHT = 841.89;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;
const HEADER_HEIGHT = 25;
const FOOTER_RESERVED = 35;
const CONTENT_TOP = MARGIN + HEADER_HEIGHT;
const CONTENT_BOTTOM = PAGE_HEIGHT - FOOTER_RESERVED;

// helper functions
const severityColor = (severity) => {
  switch (severity) {
    case "Critical": return COLORS.red;
    case "High": return COLORS.red;
    case "Medium": return COLORS.orange;
    case "Low": return COLORS.green;
    default: return COLORS.gray;
  }
};

const riskColor = (score) => {
  if (score >= 80) return COLORS.red;
  if (score >= 50) return COLORS.orange;
  if (score >= 21) return COLORS.orange;
  return COLORS.green;
};

const riskLabel = (score) => {
  if (score >= 80) return "Critical";
  if (score >= 50) return "High";
  if (score >= 21) return "Medium";
  return "Low";
};

//main export
const exportScanReport = (scan, res) => {
  const doc = new PDFDocument({
    size: "A4",
    margin: MARGIN,
    bufferPages: true,
    info: {
      Title: `VulnScan Report — ${scan.target}`,
      Author: "VulnScan",
      Subject: "Security Vulnerability Assessment Report",
    },
  });

  doc.pipe(res);

  // Track current page index 
  let currentPageIndex = 0;

  const ensureSpace = (requiredHeight) => {
    if (doc.y + requiredHeight >= CONTENT_BOTTOM) {
      doc.addPage();
      return true;
    }
    return false;
  };

  const drawHeader = () => {
    if (currentPageIndex === 0) return; // skip cover page

    const savedY = doc.y;
    const savedX = doc.x;
    
    const oldTopMargin = doc.page.margins.top;
    doc.page.margins.top = 0;

    doc
      .font("Helvetica-Bold")
      .fontSize(FONT.caption)
      .fillColor(COLORS.blue)
      .text("VulnScan", MARGIN, MARGIN - 10, { continued: true })
      .font("Helvetica")
      .fillColor(COLORS.gray)
      .text("  |  Vulnerability Assessment Report");

    doc
      .moveTo(MARGIN, MARGIN + 8)
      .lineTo(PAGE_WIDTH - MARGIN, MARGIN + 8)
      .strokeColor(COLORS.borderGray)
      .lineWidth(0.5)
      .stroke();

    doc.lineWidth(1); // reset
    doc.page.margins.top = oldTopMargin;

    doc.x = savedX;
    doc.y = savedY;
  };

  const setCursorToContentTop = () => {
    doc.x = MARGIN;
    doc.y = CONTENT_TOP;
  };

  doc.on("pageAdded", () => {
    currentPageIndex++;
    drawHeader();
    setCursorToContentTop();
  });

  const drawSectionTitle = (title) => {
    doc
      .font("Helvetica-Bold")
      .fontSize(FONT.section)
      .fillColor(COLORS.black)
      .text(title, MARGIN, doc.y);

    // Accent underline
    const lineY = doc.y + 4;
    doc
      .moveTo(MARGIN, lineY)
      .lineTo(MARGIN + 80, lineY)
      .strokeColor(COLORS.blue)
      .lineWidth(2)
      .stroke();

    doc.lineWidth(1);
    doc.y = lineY + 10;
  };

  const SECTION_TITLE_HEIGHT = FONT.section + 18;


  // 1. COVER PAGE
  const drawCoverPage = () => {
    const startY = 220;

    doc
      .font("Helvetica-Bold")
      .fontSize(36)
      .fillColor(COLORS.blue)
      .text("VULNSCAN", MARGIN, startY, {
        align: "center",
        width: CONTENT_WIDTH,
      });

    doc.moveDown(0.4);

    doc
      .font("Helvetica")
      .fontSize(14)
      .fillColor(COLORS.gray)
      .text("Security Vulnerability Assessment Report", {
        align: "center",
        width: CONTENT_WIDTH,
      });

    const dividerY = doc.y + 20;
    doc
      .moveTo(PAGE_WIDTH / 2 - 80, dividerY)
      .lineTo(PAGE_WIDTH / 2 + 80, dividerY)
      .strokeColor(COLORS.borderGray)
      .lineWidth(1)
      .stroke();

    doc.y = dividerY + 30;

    const metaX = PAGE_WIDTH / 2 - 130;
    const metaValX = PAGE_WIDTH / 2 + 10;
    const lineHeight = 22;
    let my = doc.y;

    const coverMeta = [
      ["Target", scan.target],
      ["Target Type", scan.targetType],
      ["Scan Date", new Date(scan.createdAt).toLocaleString()],
      ["Report Generated", new Date().toLocaleString()],
      ["Scan Status", scan.status],
    ];

    coverMeta.forEach(([label, value]) => {
      doc
        .font("Helvetica-Bold")
        .fontSize(FONT.body)
        .fillColor(COLORS.gray)
        .text(label, metaX, my, { width: 120, align: "right" });

      doc
        .font("Helvetica")
        .fillColor(COLORS.black)
        .text(value || "N/A", metaValX, my, { width: 200, align: "left" });

      my += lineHeight;
    });

    doc
      .font("Helvetica-Bold")
      .fontSize(FONT.body)
      .fillColor(COLORS.gray)
      .text("Risk Score", metaX, my, { width: 120, align: "right" });

    doc
      .font("Helvetica-Bold")
      .fillColor(riskColor(scan.riskScore))
      .text(`${scan.riskScore}/100 (${riskLabel(scan.riskScore)})`, metaValX, my, { width: 200, align: "left" });

    my += lineHeight + 40;

    doc
      .font("Helvetica")
      .fontSize(FONT.body)
      .fillColor(COLORS.gray)
      .text("Prepared By: VulnScan", MARGIN, my, {
        align: "center",
        width: CONTENT_WIDTH,
      });
  };

  drawCoverPage();
  doc.addPage();

  // 2. EXECUTIVE SUMMARY
  const findingsCount = scan.findings?.length || 0;
  const portsCount = scan.ports?.length || 0;
  const overallRisk = riskLabel(scan.riskScore);

  const sslStatus = scan.ssl
    ? scan.ssl.valid ? "Valid" : "Invalid"
    : "Unavailable";

  const sslStatusColor = scan.ssl
    ? scan.ssl.valid ? COLORS.green : COLORS.red
    : COLORS.gray;

  drawSectionTitle("Executive Summary");

  doc
    .font("Helvetica")
    .fontSize(FONT.body)
    .fillColor(COLORS.black)
    .text(
      `This vulnerability assessment evaluates the security posture of the target `
      + `"${scan.target}" by performing network port discovery, SSL/TLS certificate `
      + `validation, HTTP security header analysis, and basic vulnerability checks. `
      + `The findings presented in this report should be reviewed and remediated `
      + `according to their severity to reduce the overall attack surface.`,
      { width: CONTENT_WIDTH }
    );

  doc.moveDown(1.0);

  const cardCount = 4;
  const cardGap = 12;
  const cardW = (CONTENT_WIDTH - cardGap * (cardCount - 1)) / cardCount;
  const cardH = 72;
  const cardY = doc.y;

  const dashboardCards = [
    { label: "Risk Score", value: `${scan.riskScore} / 100`, sub: overallRisk, color: riskColor(scan.riskScore) },
    { label: "Open Ports", value: `${portsCount}`, sub: null, color: COLORS.blue },
    { label: "Findings", value: `${findingsCount}`, sub: null, color: findingsCount > 0 ? COLORS.orange : COLORS.green },
    { label: "SSL", value: sslStatus, sub: null, color: sslStatusColor },
  ];

  dashboardCards.forEach((card, i) => {
    const cx = MARGIN + i * (cardW + cardGap);

    doc
      .roundedRect(cx, cardY, cardW, cardH, 4)
      .fillAndStroke(COLORS.lightGray, COLORS.borderGray);

    doc.rect(cx, cardY, cardW, 3).fill(card.color);

    doc
      .font("Helvetica-Bold")
      .fontSize(14)
      .fillColor(card.color)
      .text(card.value, cx, cardY + 16, { width: cardW, align: "center" });

    if (card.sub) {
      doc
        .font("Helvetica")
        .fontSize(FONT.caption)
        .fillColor(card.color)
        .text(card.sub, cx, cardY + 34, { width: cardW, align: "center" });
    }

    doc
      .font("Helvetica")
      .fontSize(FONT.caption)
      .fillColor(COLORS.gray)
      .text(card.label, cx, cardY + cardH - 18, { width: cardW, align: "center" });
  });

  doc.y = cardY + cardH + 20;

  // 3. PORT ANALYSIS
  const portTableMinHeight = SECTION_TITLE_HEIGHT + 24 + 24;
  ensureSpace(portTableMinHeight);
  drawSectionTitle("Port Analysis");

  const colPositions = [MARGIN, MARGIN + 100, MARGIN + 240];
  const colWidths = [100, 140, CONTENT_WIDTH - 340];
  const rowHeight = 24;
  const tableWidth = CONTENT_WIDTH;

  const drawPortTableHeader = () => {
    const y = doc.y;
    doc.rect(MARGIN, y, tableWidth, rowHeight).fill(COLORS.blue);
    doc.font("Helvetica-Bold").fontSize(FONT.body).fillColor(COLORS.white);
    doc.text("Port", colPositions[0] + 8, y + 5, { width: colWidths[0] });
    doc.text("State", colPositions[1] + 8, y + 5, { width: colWidths[1] });
    doc.text("Service", colPositions[2] + 8, y + 5, { width: colWidths[2] });
    doc.y = y + rowHeight;
  };

  const drawPortRow = (port, index) => {
    const y = doc.y;
    if (index % 2 === 1) {
      doc.rect(MARGIN, y, tableWidth, rowHeight).fill(COLORS.lightGray);
    }

    doc
      .moveTo(MARGIN, y + rowHeight)
      .lineTo(MARGIN + tableWidth, y + rowHeight)
      .strokeColor(COLORS.borderGray)
      .lineWidth(0.5)
      .stroke();

    doc.lineWidth(1);

    doc
      .font("Helvetica")
      .fontSize(FONT.body)
      .fillColor(COLORS.black)
      .text(String(port.port), colPositions[0] + 8, y + 5, { width: colWidths[0] });

    let stateColor = COLORS.red;
    if (port.state === "open") stateColor = COLORS.green;
    else if (port.state === "filtered") stateColor = COLORS.orange;

    doc
      .font("Helvetica-Bold")
      .fillColor(stateColor)
      .text(port.state, colPositions[1] + 8, y + 5, { width: colWidths[1] });

    doc
      .font("Helvetica")
      .fillColor(COLORS.black)
      .text(port.service || "Unknown", colPositions[2] + 8, y + 5, { width: colWidths[2] });

    doc.y = y + rowHeight;
  };

  if (!scan.ports || scan.ports.length === 0) {
    doc.font("Helvetica").fontSize(FONT.body).fillColor(COLORS.gray).text("No ports were detected during this scan.");
  } else {
    drawPortTableHeader();
    scan.ports.forEach((port, index) => {
      if (ensureSpace(rowHeight + 5)) {
        drawPortTableHeader();
      }
      drawPortRow(port, index);
    });
  }

  doc.moveDown(1.2);

  // 4. SSL / TLS CERTIFICATE
  const sslContentHeight = !scan.ssl ? 50 : (16 + 28 + 22 * 5 + 16 + 10);
  ensureSpace(SECTION_TITLE_HEIGHT + sslContentHeight);
  drawSectionTitle("SSL/TLS Certificate");

  if (!scan.ssl) {
    const warnH = 40;
    ensureSpace(warnH + 10);
    const wy = doc.y;
    doc.roundedRect(MARGIN, wy, CONTENT_WIDTH, warnH, 4).fillAndStroke("#FEF2F2", COLORS.red);
    doc.font("Helvetica-Bold").fontSize(FONT.body).fillColor(COLORS.red).text("No SSL/TLS certificate information available.", MARGIN + 14, wy + 13);
    doc.y = wy + warnH + 10;
  } else {
    const ssl = scan.ssl;
    const sslFields = [
      ["Issuer", ssl.issuer || "N/A"],
      ["Subject", ssl.subject || "N/A"],
      ["Valid From", ssl.validFrom ? new Date(ssl.validFrom).toLocaleDateString() : "N/A"],
      ["Valid Until", ssl.validTo ? new Date(ssl.validTo).toLocaleDateString() : "N/A"],
      ["Days Remaining", ssl.expiresInDays != null ? `${ssl.expiresInDays} days` : "N/A"],
    ];

    const sslLineH = 22;
    const sslCardPadding = 16;
    const badgeRowH = 28;
    const sslCardH = sslCardPadding + badgeRowH + sslLineH * sslFields.length + sslCardPadding;

    const sslY = doc.y;
    doc.roundedRect(MARGIN, sslY, CONTENT_WIDTH, sslCardH, 4).strokeColor(COLORS.borderGray).lineWidth(1).stroke();

    const badgeText = ssl.valid ? "VALID" : "INVALID";
    const badgeColor = ssl.valid ? COLORS.green : COLORS.red;
    const badgeW = 80;
    const badgeH = 20;
    const badgeX = MARGIN + CONTENT_WIDTH - badgeW - sslCardPadding;
    const badgeY = sslY + sslCardPadding;

    doc.roundedRect(badgeX, badgeY, badgeW, badgeH, 10).fill(badgeColor);
    doc.font("Helvetica-Bold").fontSize(FONT.caption).fillColor(COLORS.white).text(badgeText, badgeX, badgeY + 5, { width: badgeW, align: "center" });
    doc.font("Helvetica-Bold").fontSize(FONT.subtitle).fillColor(COLORS.black).text("Certificate Status", MARGIN + sslCardPadding, sslY + sslCardPadding + 2);

    let fieldY = sslY + sslCardPadding + badgeRowH;
    const labelX = MARGIN + sslCardPadding;
    const valueX = MARGIN + sslCardPadding + 120;
    const valueW = CONTENT_WIDTH - sslCardPadding * 2 - 120;

    sslFields.forEach(([label, value]) => {
      doc.font("Helvetica-Bold").fontSize(FONT.body).fillColor(COLORS.gray).text(label, labelX, fieldY + 3, { width: 110 });
      let valColor = COLORS.black;
      if (label === "Days Remaining" && ssl.expiresInDays != null) {
        if (ssl.expiresInDays < 15) valColor = COLORS.red;
        else if (ssl.expiresInDays < 30) valColor = COLORS.orange;
        else valColor = COLORS.green;
      }
      doc.font("Helvetica").fontSize(FONT.body).fillColor(valColor).text(value, valueX, fieldY + 3, { width: valueW });
      fieldY += sslLineH;
    });

    doc.y = sslY + sslCardH + 10;
  }

  doc.moveDown(0.8);

  // 5. SECURITY FINDINGS
  const firstFindingEstimate = (!scan.findings || scan.findings.length === 0) ? 20 : 80;
  ensureSpace(SECTION_TITLE_HEIGHT + firstFindingEstimate);
  drawSectionTitle("Security Findings");

  if (!scan.findings || scan.findings.length === 0) {
    doc.font("Helvetica").fontSize(FONT.body).fillColor(COLORS.green).text("No vulnerabilities were detected during this scan.");
  } else {
    scan.findings.forEach((finding, index) => {
      const innerWidth = CONTENT_WIDTH - 24;
      const titleText = `${index + 1}. ${finding.title}`;
      const titleH = doc.heightOfString(titleText, { font: "Helvetica-Bold", fontSize: 12, width: innerWidth - 90 });
      const categoryH = 14;
      const descH = doc.heightOfString(finding.description || "N/A", { font: "Helvetica", fontSize: 10, width: innerWidth });
      const recText = finding.recommendation || "N/A";
      const recH = doc.heightOfString("Recommendation: " + recText, { font: "Helvetica", fontSize: 10, width: innerWidth });

      const cardPadding = 12;
      const innerSpacing = 8;
      const cardH = cardPadding + titleH + innerSpacing + categoryH + innerSpacing + descH + innerSpacing + recH + cardPadding;

      ensureSpace(cardH + 12);
      const startY = doc.y;

      doc.roundedRect(MARGIN, startY, CONTENT_WIDTH, cardH, 4).strokeColor(COLORS.borderGray).lineWidth(1).stroke();
      doc.rect(MARGIN, startY, 4, cardH).fill(severityColor(finding.severity));

      let cy = startY + cardPadding;
      const textX = MARGIN + 14;

      doc.font("Helvetica-Bold")
         .fontSize(12)
         .fillColor(COLORS.black)
         .text(titleText, textX, cy, { width: innerWidth - 90 });

      const badgeW = 72;
      const badgeH = 18;
      const badgeX = MARGIN + CONTENT_WIDTH - badgeW - 12;

      doc.roundedRect(badgeX, startY + cardPadding, badgeW, badgeH, 9).fill(severityColor(finding.severity));
      doc.font("Helvetica-Bold")
         .fontSize(FONT.caption)
         .fillColor(COLORS.white)
         .text((finding.severity || "Info").toUpperCase(), badgeX, startY + cardPadding + 4, { width: badgeW, align: "center" });

      cy += titleH + innerSpacing;

      doc.font("Helvetica").fontSize(10).fillColor(COLORS.blue).text(`Category: ${finding.category}`, textX, cy, { width: innerWidth });
      cy += categoryH + innerSpacing;

      doc.font("Helvetica").fontSize(10).fillColor(COLORS.black).text(finding.description || "N/A", textX, cy, { width: innerWidth });
      cy += descH + innerSpacing;

      doc.font("Helvetica-Bold").fontSize(10).fillColor(COLORS.black).text("Recommendation: ", textX, cy, { width: innerWidth, continued: true });
      doc.font("Helvetica").text(recText);

      doc.y = startY + cardH + 8;
    });
  }

  doc.moveDown(0.6);

  // 6. OVERALL RECOMMENDATIONS
  const recommendations = [];
  if (scan.findings?.length) {
    scan.findings.forEach((finding) => {
      if (finding.recommendation && !recommendations.includes(finding.recommendation)) {
        recommendations.push(finding.recommendation);
      }
    });
  }

  const openPorts = scan.ports?.filter((p) => p.state === "open") || [];
  if (openPorts.length > 5) {
    recommendations.push("Review all exposed ports and close any unnecessary services.");
  }
  if (scan.ssl && scan.ssl.expiresInDays < 30) {
    recommendations.push("Renew the SSL/TLS certificate before expiration.");
  }
  if (!scan.ssl) {
    recommendations.push("Enable HTTPS and deploy a valid SSL/TLS certificate.");
  }
  if (recommendations.length === 0) {
    recommendations.push("No major security issues were detected. Continue performing periodic vulnerability assessments.");
  }

  const estimatedRecHeight = recommendations.length * 22;
  ensureSpace(SECTION_TITLE_HEIGHT + estimatedRecHeight + 20);
  drawSectionTitle("Overall Recommendations");

  recommendations.forEach((recommendation) => {
    const recHeight = doc.heightOfString(recommendation, { font: "Helvetica", fontSize: FONT.body, width: CONTENT_WIDTH - 30 });
    ensureSpace(recHeight + 12);

    doc.circle(MARGIN + 6, doc.y + 6, 2.5).fill(COLORS.blue);
    doc.font("Helvetica").fontSize(FONT.body).fillColor(COLORS.black).text(recommendation, MARGIN + 18, doc.y, { width: CONTENT_WIDTH - 30 });
    doc.moveDown(0.4);
  });

  doc.moveDown(1.2);

  // 7. FINAL ASSESSMENT
  let assessment = "";
  if (scan.riskScore >= 80) assessment = "The scanned target presents a critical security posture and requires immediate remediation.";
  else if (scan.riskScore >= 50) assessment = "The scanned target contains several high-risk issues that should be addressed as soon as possible.";
  else if (scan.riskScore >= 21) assessment = "The scanned target contains moderate security issues. Recommended improvements should be implemented.";
  else assessment = "The scanned target demonstrates a strong security posture with only minor observations recorded.";

  const assessH = doc.heightOfString(assessment, { font: "Helvetica", fontSize: FONT.body, width: CONTENT_WIDTH });
  ensureSpace(SECTION_TITLE_HEIGHT + assessH + 60);
  drawSectionTitle("Final Assessment");

  doc.font("Helvetica").fontSize(FONT.body).fillColor(COLORS.black).text(assessment, { width: CONTENT_WIDTH, align: "justify" });
  
  ensureSpace(45);
  doc.moveDown(1);
  const eorDivY = doc.y;
  doc.moveTo(PAGE_WIDTH / 2 - 60, eorDivY).lineTo(PAGE_WIDTH / 2 + 60, eorDivY).strokeColor(COLORS.borderGray).lineWidth(1).stroke();

  doc.y = eorDivY + 14;
  doc.font("Helvetica").fontSize(FONT.body).fillColor(COLORS.gray).text("— End of Report —", { align: "center", width: CONTENT_WIDTH });
  
  doc.moveDown(1);
  doc.font("Helvetica").fontSize(FONT.caption).fillColor(COLORS.gray).text("Generated by VulnScan", { align: "center", width: CONTENT_WIDTH });
  doc.fontSize(FONT.caption).text("Version: 1.0", { align: "center", width: CONTENT_WIDTH });
  doc.fontSize(FONT.caption).text("https://github.com/vulnscan", { align: "center", width: CONTENT_WIDTH });

  //8. FOOTER MANAGER
  const range = doc.bufferedPageRange();
  for (let i = 0; i < range.count; i++) {
    doc.switchToPage(i);
    if (i === 0) continue; // Skip cover page

    const savedY = doc.y;
    const savedX = doc.x;

    //Temporarily disablling bottom margin calculation rules 
    // to stop PDFKit from auto-generating extra blank pages at page ends.
    const oldBottomMargin = doc.page.margins.bottom;
    doc.page.margins.bottom = 0;

    const footerY = PAGE_HEIGHT - 38;

    doc.moveTo(MARGIN, footerY).lineTo(PAGE_WIDTH - MARGIN, footerY).strokeColor(COLORS.borderGray).lineWidth(0.5).stroke();
    doc.lineWidth(1);

    doc.font("Helvetica")
       .fontSize(FONT.caption)
       .fillColor(COLORS.gray)
       .text("Generated by VulnScan", MARGIN, footerY + 6, { width: CONTENT_WIDTH, align: "center" });

    doc.moveTo(MARGIN, footerY + 20).lineTo(PAGE_WIDTH - MARGIN, footerY + 20).strokeColor(COLORS.borderGray).lineWidth(0.5).stroke();
    doc.lineWidth(1);

    // Restore boundary safety states
    doc.page.margins.bottom = oldBottomMargin;
    doc.x = savedX;
    doc.y = savedY;
  }

  doc.end();
};

module.exports = exportScanReport;