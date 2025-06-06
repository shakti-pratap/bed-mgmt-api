const express = require('express');
const router = express.Router();
const { Lit } = require('../models');

/**
 * @swagger
 * /dashboard/bed-summary:
 *   get:
 *     summary: Get bed summary by status
 *     description: Retrieve a summary of beds grouped by their status
 *     tags: [Dashboard]
 *     responses:
 *       200:
 *         description: Bed summary by status
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   _id:
 *                     type: number
 *                     description: Status identifier
 *                   LIB_STATUT:
 *                     type: string
 *                     description: Status name
 *                   count:
 *                     type: number
 *                     description: Number of beds with this status
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/bed-summary', async (req, res) => {
  try {
    const summary = await Lit.aggregate([
      { $match: { ACTIF: true } },
      {
        $lookup: {
          from: 'statuts',
          localField: 'ID_STATUT',
          foreignField: 'ID_STATUT',
          as: 'statut_info'
        }
      },
      { $unwind: '$statut_info' },
      {
        $group: {
          _id: '$ID_STATUT',
          LIB_STATUT: { $first: '$statut_info.LIB_STATUT' },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    res.json(summary);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router; 