const express = require('express');
const router = express.Router();
const { Utilisateur } = require('../models');
const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'your_secret_key'; // Use env var in production

/**
 * @swagger
 * /utilisateurs/login:
 *   post:
 *     summary: User login
 *     description: Authenticate a user by email and password
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - EMAIL
 *               - password
 *             properties:
 *               EMAIL:
 *                 type: string
 *                 format: email
 *                 description: User email
 *               password:
 *                 type: string
 *                 description: User password
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 user:
 *                   $ref: '#/components/schemas/Utilisateur'
 *       400:
 *         description: Invalid credentials
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/login', async (req, res) => {
  const { EMAIL, password } = req.body;
  if (!EMAIL || !password) {
    return res.status(400).json({ error: 'EMAIL and password are required' });
  }
  try {
    const user = await Utilisateur.findOne({ EMAIL: EMAIL.toLowerCase(), ACTIF: true });
    if (!user || user.password !== password) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }
    await user.updateLastLogin();

    // Generate JWT token with all necessary user data
    const token = jwt.sign(
      { 
        id: user._id, 
        ID_UTILISATEUR: user.ID_UTILISATEUR,
        email: user.EMAIL, 
        ROLE: user.ROLE,  // Use uppercase to match route expectations
        role: user.ROLE,  // Keep lowercase for backward compatibility
        SERVICES_AUTORISES: user.SERVICES_AUTORISES || [],
        NOM: user.NOM
      },
      JWT_SECRET,
      { expiresIn: '1h' }
    );

    // Send token in header and body
    res.setHeader('Authorization', `Bearer ${token}`);
    res.json({ message: 'Login successful', token, user });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /utilisateurs/change-password:
 *   post:
 *     summary: Change user password
 *     description: Change the password for the authenticated user and clear force password change flag
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - EMAIL
 *               - currentPassword
 *               - newPassword
 *             properties:
 *               EMAIL:
 *                 type: string
 *                 format: email
 *                 description: User email
 *               currentPassword:
 *                 type: string
 *                 description: Current password
 *               newPassword:
 *                 type: string
 *                 minLength: 6
 *                 description: New password (minimum 6 characters)
 *     responses:
 *       200:
 *         description: Password changed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 user:
 *                   $ref: '#/components/schemas/Utilisateur'
 *       400:
 *         description: Invalid input or current password
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: User not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/change-password', async (req, res) => {
  const { EMAIL, currentPassword, newPassword } = req.body;
  
  // Validate input
  if (!EMAIL || !currentPassword || !newPassword) {
    return res.status(400).json({ 
      error: 'EMAIL, currentPassword, and newPassword are required' 
    });
  }
  
  if (newPassword.length < 6) {
    return res.status(400).json({ 
      error: 'New password must be at least 6 characters long' 
    });
  }
  
  try {
    // Find the user
    const user = await Utilisateur.findOne({ EMAIL: EMAIL.toLowerCase(), ACTIF: true });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Verify current password
    if (user.password !== currentPassword) {
      return res.status(400).json({ error: 'Current password is incorrect' });
    }
    
    // Change password using the model method
    await user.changePassword(newPassword);
    
    res.json({ 
      message: 'Password changed successfully',
      user: user
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /utilisateurs:
 *   post:
 *     summary: Create a new user
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Utilisateur'
 *     responses:
 *       201:
 *         description: User created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Utilisateur'
 *       400:
 *         description: Invalid input
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/', async (req, res) => {
  try {
    const { ROLE } = req.body;
    if (!ROLE) {
      return res.status(400).json({ error: 'ROLE is required' });
    }
    // Generate prefix: first 4 letters of role, lowercase, padded if needed
    const prefix = (ROLE.toLowerCase() + 'xxxx').slice(0, 4);
    // Find the highest existing ID_UTILISATEUR for this role
    const regex = new RegExp(`^${prefix}\\d{3}$`);
    const lastUser = await Utilisateur.find({ ID_UTILISATEUR: { $regex: regex } })
      .sort({ ID_UTILISATEUR: -1 })
      .limit(1);
    let nextNum = 1;
    if (lastUser.length > 0) {
      const lastId = lastUser[0].ID_UTILISATEUR;
      const num = parseInt(lastId.slice(4), 10);
      nextNum = num + 1;
    }
    const newId = `${prefix}${String(nextNum).padStart(3, '0')}`;
    // Create user, ignoring any ID_UTILISATEUR from client
    const user = new Utilisateur({ ...req.body, ID_UTILISATEUR: newId });
    const savedUser = await user.save();
    res.status(201).json(savedUser);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * @swagger
 * /utilisateurs/{id}:
 *   put:
 *     summary: Update a user by ID_UTILISATEUR
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID_UTILISATEUR
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Utilisateur'
 *     responses:
 *       200:
 *         description: User updated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Utilisateur'
 *       404:
 *         description: User not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.put('/:id', async (req, res) => {
  try {
    const updatedUser = await Utilisateur.findOneAndUpdate(
      { ID_UTILISATEUR: req.params.id },
      req.body,
      { new: true, runValidators: true }
    );
    if (!updatedUser) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(updatedUser);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * @swagger
 * /utilisateurs/{id}:
 *   delete:
 *     summary: Delete a user by ID_UTILISATEUR
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID_UTILISATEUR
 *     responses:
 *       200:
 *         description: User deleted
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       404:
 *         description: User not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.delete('/:id', async (req, res) => {
  try {
    const deletedUser = await Utilisateur.findOneAndDelete({ ID_UTILISATEUR: req.params.id });
    if (!deletedUser) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json({ message: 'User deleted' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * @swagger
 * /utilisateurs:
 *   get:
 *     summary: Get all users with pagination, search, and sorting
 *     tags: [Users]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *         description: Number of items per page
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search term to filter users across all fields
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           default: ID_UTILISATEUR
 *         description: Field to sort by (any user field)
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: asc
 *         description: Sort order (ascending or descending)
 *     responses:
 *       200:
 *         description: Paginated list of users with metadata
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 users:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Utilisateur'
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     currentPage:
 *                       type: integer
 *                     totalPages:
 *                       type: integer
 *                     totalItems:
 *                       type: integer
 *                     itemsPerPage:
 *                       type: integer
 *                     hasNextPage:
 *                       type: boolean
 *                     hasPrevPage:
 *                       type: boolean
 *       400:
 *         description: Invalid query parameters
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/', async (req, res) => {
  try {
    // Extract query parameters with defaults
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || '';
    const sortBy = req.query.sortBy || 'ID_UTILISATEUR';
    const sortOrder = req.query.sortOrder === 'desc' ? -1 : 1;

    // Validate pagination parameters
    if (page < 1) {
      return res.status(400).json({ error: 'Page must be greater than 0' });
    }
    if (limit < 1 || limit > 100) {
      return res.status(400).json({ error: 'Limit must be between 1 and 100' });
    }

    // Build search filter
    let filter = {};
    if (search) {
      // Create regex for case-insensitive search
      const searchRegex = new RegExp(search, 'i');
      
      // Search across all relevant string fields
      filter = {
        $or: [
          { ID_UTILISATEUR: searchRegex },
          { NOM: searchRegex },
          { EMAIL: searchRegex },
          { ROLE: searchRegex },
          { TELEPHONE: searchRegex },
          { SERVICE_PRINCIPAL: searchRegex },
          { SERVICES_AUTORISES: { $in: [searchRegex] } }
        ]
      };
    }

    // Calculate skip value for pagination
    const skip = (page - 1) * limit;

    // Build sort object
    const sortObject = {};
    sortObject[sortBy] = sortOrder;

    // Execute queries in parallel for better performance
    const [users, totalCount] = await Promise.all([
      Utilisateur.find(filter)
        .sort(sortObject)
        .skip(skip)
        .limit(limit),
      Utilisateur.countDocuments(filter)
    ]);

    // Calculate pagination metadata
    const totalPages = Math.ceil(totalCount / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    // Return paginated response
    res.json({
      users,
      pagination: {
        currentPage: page,
        totalPages,
        totalItems: totalCount,
        itemsPerPage: limit,
        hasNextPage,
        hasPrevPage
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;