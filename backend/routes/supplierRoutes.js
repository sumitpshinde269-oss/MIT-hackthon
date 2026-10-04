const express = require('express');
const router = express.Router();

// Placeholder routes for suppliers
router.get('/', (req, res) => {
  res.json({ success: true, data: [] });
});

module.exports = router;
