const express = require('express');

const router = express.Router();

router.get('/', (req, res) => {
    res.json({msg: "scans"})
});

router.post('/new', (req, res) => {
    const {target, targetType, status, riskScore} = req.body;

    try {
        const scan = await Scan.create({target, targetType, status, riskScore})
        res.status(200).json
    }
});

router.get('/:id', (req, res) => {
    res.json({msg: "ok"})
});

router.delete('/:id', (req, res) => {
    res.json({msg: "deleetyd"})
});

module.exports = router;