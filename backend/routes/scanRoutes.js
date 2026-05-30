const express = require('express');
const Scan = require('../models/Scan');
const router = express.Router();
const scanController = require('../controllers/scanController');

router.get('/', scanController.getScans);

router.post('/new', scanController.newScan);

router.get('/:id', scanController.getScan);

router.delete('/:id', scanController.deleteScan);

module.exports = router;