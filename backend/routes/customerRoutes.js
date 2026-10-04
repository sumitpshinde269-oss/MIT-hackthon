const express = require('express');
const router = express.Router();
const Customer = require('../models/Customer');

// Get all customers
router.get('/', async (req, res, next) => {
  try {
    const customers = await Customer.find({});
    res.json({ success: true, data: customers });
  } catch (error) {
    next(error);
  }
});

// Get customer by ID (tests CastError if invalid ObjectId is provided)
router.get('/:id', async (req, res, next) => {
  try {
    const customer = await Customer.findById(req.params.id);
    if (!customer) {
      res.status(404);
      throw new Error('Customer not found');
    }
    res.json({ success: true, data: customer });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
