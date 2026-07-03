const Scan = require("../models/Scan");
const mongoose = require("mongoose");
const validator = require("../services/validatorService");
const scanService = require("../services/scanService");
const generatePDFReport = require("../utils/pdfGenerator");

//get all scans
const getRecentScans = async (req, res) => {
  try {
    const scans = await Scan.find({}).limit(10).sort({ createdAt: -1 });

    res.status(200).json(scans);
  }
  catch (error) {
    res.status(500).json({ error: error.message });
  }
};


//add a new scan
const newScan = async (req, res) => {
  const { target } = req.body;

  const targetType = validator.detectTargetType(target);
  const dangerousChars = validator.containsDangerousChars(target);

  if (!targetType || dangerousChars) {
    return res.status(400).json({ error: "not a valid target" });
  }

  try {
    const { status, ports, ssl, findings, riskScore } = await scanService(target);

    const scan = await Scan.create({
      target,
      targetType,
      status,
      ports,
      ssl,
      findings,
      riskScore,
    });

    res.status(200).json(scan);
  }

  catch (error) {
    res.status(500).json({ error: error.message });
  }
};


//delete a scan
const deleteScan = async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(404).json({ error: "no such document" });
  }

  try {
    const scan = await Scan.findOneAndDelete({ _id: id });

    if (!scan) {
      return res.status(404).json({ error: "no such document" });
    }
    res.status(200).json(scan);
  }

  catch (error) {
    res.status(500).json({ error: error.message });
  }
};


//get a single scan
const getScanById = async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(404).json({ error: "no such document" });
  }

  try {
    const scan = await Scan.findById(id);

    if (!scan) {
      return res.status(404).json({ error: "no such document" });
    }
    res.status(200).json(scan);
  }

  catch (error) {
    res.status(500).json({ error: error.message });
  }
};


//get scan by target name 
const getScanByTarget = async (req, res) => {
  try {
    const searchTarget = req.query.q;
    if (!searchTarget) return res.status(400).json({ error: "Search query is required" });

    const result = await Scan.find({ target: { $regex: q, $options: "i" } })
      .select("_id target targetType riskScore createdAt").limit(10);

    res.json(results);
  }

  catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getReport = async (req, res) => {
  const id = req.params.id;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(404).json({ error: "no such document" });
  }

  try {
    const scan = await Scan.findById(id);

    if (!scan) {
      return res.status(404).json({ error: "no such document" });
    }

    res.setHeader(
      "Content-Type",
      "application/pdf"
    );

    res.setHeader(
      "Content-Disposition",
      `attachment; filename=vulnscan-report-${scan.target}.pdf`
    );
    
    generatePDFReport(scan, res);
  }
  catch (error) {
    res.status(500).json({ error: error.message })
  }
};

module.exports = {
  getRecentScans,
  deleteScan,
  newScan,
  getScanById,
  getScanByTarget,
  getReport
};
