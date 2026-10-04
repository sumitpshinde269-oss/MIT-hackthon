const express = require('express');
const router = express.Router();

// Placeholder routes for dashboard metrics
router.get('/', (req, res) => {
  res.json({
    success: true,
    data: {
      totalReceivable: 0,
      totalPayable: 0,
    },
  });
});

module.exports = router;
