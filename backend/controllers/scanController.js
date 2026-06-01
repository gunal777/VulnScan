const Scan = require('../models/Scan');
const mongoose = require('mongoose');
const nmapScan = require('../services/nmapService');
const validator = require('../services/validatorService');

//get all scans
const getScans = async (req, res) => {
    const scans = await Scan.find({}).sort({ createdAt: -1 });

    res.status(200).json(scans);
}

//add a new scan
const newScan = async (req, res) => {
    const { target } = req.body;

    const targetType = validator.detectTargetType(target);
    const dangerousChars = validator.containsDangerousChars(target);

    if(!targetType || dangerousChars) {
        return res.json(400).json({error: 'not a valid target'});
    }

    try {
        const ports = await nmapScan(target);

        const scan = await Scan.create({ target, targetType, ports });
        
        res.status(200).json(scan);
    }
    catch (error) {
        res.status(400).json({ error: error.message });
    }
}

//delete a scan 
const deleteScan = async (req, res) => {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(404).json({ error: "no such document" });
    }

    const scan = await Scan.findOneAndDelete({ _id: id });

    if (!scan) {
        return res.status(404).json({ error: "no such document" });
    }

    res.status(200).json(scan);
}

//get a single scan 
const getScan = async (req, res) => {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(404).json({ error: "no such document" });
    }

    const scan = await Scan.findById(id);

    if (!scan) {
        return res.status(404).json({ error: "no such document" });
    }

    res.status(200).json(scan);
}


module.exports = {
    getScans,
    deleteScan,
    newScan,
    getScan
};