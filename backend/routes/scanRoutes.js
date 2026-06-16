const express = require('express');
const Scan = require('../models/Scan');
const router = express.Router();
const scanController = require('../controllers/scanController');

router.get('/recent', scanController.getRecentScans);

router.get('/search', scanController.getScanByTarget);

router.post('/new', scanController.newScan);

router.get('/report/:id', scanController.getScanById);

router.delete('/delete/:id', scanController.deleteScan);

module.exports = router;