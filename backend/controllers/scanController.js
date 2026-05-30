const Scan = require('../models/Scan');

newScan = async (req, res) => {
    const {target, targetType, status, riskScore} = req.body;

    try {
        const scan = await Scan.create({target, targetType, status, riskScore})
        res.status(200).json
    }
}

module.exports = { newScan};