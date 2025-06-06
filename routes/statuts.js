const express = require('express');
const router = express.Router();
const { Statut } = require('../models');

/**
 * @swagger
 * /statuts:
 *   get:
 *     summary: Get all statuses
 *     description: Retrieve a list of all bed statuses
 *     tags: [Statuses]
 *     responses:
 *       200:
 *         description: List of statuses
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Statut'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/', async (req, res) => {
  try {
    const statuts = await Statut.find().sort({ ID_STATUT: 1 });
    res.json(statuts);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router; 