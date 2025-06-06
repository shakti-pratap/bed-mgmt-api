const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Menu = require('../models/Menu');

/**
 * @swagger
 * /menus:
 *   get:
 *     summary: Get menus for a user role
 *     description: Returns menu items allowed for the user's role (from JWT)
 *     tags: [Menus]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of menu items for the role
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Menu'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/', auth, async (req, res) => {
  const role = req.user.role;
  if (!role) {
    return res.status(400).json({ error: 'User role not found in token' });
  }
  try {
    const menus = await Menu.find({ permission: role }).sort({ sortOrder: 1 });
    res.json(menus);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router; 