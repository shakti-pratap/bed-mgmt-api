const express = require('express');
const router = express.Router();
const { Secteur, Service, Lit, Utilisateur } = require('../models');
const auth = require('../middleware/auth');

// Apply auth middleware to all routes
router.use(auth);

/**
 * @swagger
 * /secteurs:
 *   get:
 *     summary: Get all sectors with pagination, search, and sorting
 *     description: Retrieve a paginated, searchable, and sortable list of hospital sectors (filtered by user permissions)
 *     tags: [Sectors]
 *     security:
 *       - bearerAuth: []
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
 *         description: Search term to filter sectors across all fields
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           default: ID_SECTEUR
 *         description: Field to sort by (any sector field)
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: asc
 *         description: Sort order (ascending or descending)
 *     responses:
 *       200:
 *         description: Paginated list of sectors with metadata
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 secteurs:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Secteur'
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
 *       401:
 *         description: Unauthorized
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
    const sortBy = req.query.sortBy || 'ID_SECTEUR';
    const sortOrder = req.query.sortOrder === 'desc' ? -1 : 1;

    // Validate pagination parameters
    if (page < 1) {
      return res.status(400).json({ error: 'Page must be greater than 0' });
    }
    if (limit < 1 || limit > 100) {
      return res.status(400).json({ error: 'Limit must be between 1 and 100' });
    }

    // Build base filter for role-based access
    let baseFilter = {};
    
    if (req.user.role !== 'Admin') {
      // Non-admin users only get sectors that contain their authorized services
      const authorizedServices = req.user.SERVICES_AUTORISES || [];
      
      if (authorizedServices.length === 0) {
        // No authorized services, return empty result with pagination structure
        return res.json({
          secteurs: [],
          pagination: {
            currentPage: page,
            totalPages: 0,
            totalItems: 0,
            itemsPerPage: limit,
            hasNextPage: false,
            hasPrevPage: false
          }
        });
      }
      
      // Find services to get their sector IDs
      const services = await Service.find({ ID_SERVICE: { $in: authorizedServices } });
      const sectorIds = [...new Set(services.map(s => s.ID_SECTEUR))]; // Remove duplicates
      
      baseFilter = { ID_SECTEUR: { $in: sectorIds } };
    }

    // Build search filter
    let searchFilter = {};
    if (search) {
      // Create regex for case-insensitive search
      const searchRegex = new RegExp(search, 'i');
      
      // Search across all relevant fields
      searchFilter = {
        $or: [
          { LIB_SECTEUR: searchRegex },
          { ABR_SECTEUR: searchRegex },
          { ID_SECTEUR: isNaN(search) ? undefined : parseInt(search) }
        ].filter(condition => condition !== undefined)
      };
    }

    // Combine base filter and search filter
    const combinedFilter = search ? { $and: [baseFilter, searchFilter] } : baseFilter;

    // Calculate skip value for pagination
    const skip = (page - 1) * limit;

    // Build sort object
    const sortObject = {};
    sortObject[sortBy] = sortOrder;

    // Execute queries in parallel for better performance
    const [secteurs, totalCount] = await Promise.all([
      Secteur.find(combinedFilter)
        .sort(sortObject)
        .skip(skip)
        .limit(limit),
      Secteur.countDocuments(combinedFilter)
    ]);

    // Calculate pagination metadata
    const totalPages = Math.ceil(totalCount / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    // Return paginated response
    res.json({
      secteurs,
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

/**
 * @swagger
 * /secteurs/with-capacity:
 *   get:
 *     summary: Get all sectors with total capacity and available beds
 *     description: Retrieve all sectors with capacity info (filtered by user permissions)
 *     tags: [Sectors]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of sectors with capacity and available beds
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   ID_SECTEUR:
 *                     type: number
 *                   LIB_SECTEUR:
 *                     type: string
 *                   ABR_SECTEUR:
 *                     type: string
 *                   totalCapacity:
 *                     type: number
 *                   availableBeds:
 *                     type: number
 *       401:
 *         description: Unauthorized
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
router.get('/with-capacity', async (req, res) => {
  try {
    // Aggregate sectors with dynamic capacity calculation
    const secteurs = await Secteur.aggregate([
      {
        $lookup: {
          from: 'services',
          localField: 'ID_SECTEUR',
          foreignField: 'ID_SECTEUR',
          as: 'services'
        }
      },
      {
        $unwind: {
          path: '$services',
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $lookup: {
          from: 'lits',
          localField: 'services.ID_SERVICE',
          foreignField: 'ID_SERVICE',
          as: 'beds'
        }
      },
      {
        $addFields: {
          'services.totalCapacity': {
            $size: {
              $filter: {
                input: '$beds',
                as: 'bed',
                cond: { $eq: ['$$bed.ACTIF', true] }
              }
            }
          },
          'services.realCapacity': {
            $size: {
              $filter: {
                input: '$beds',
                as: 'bed',
                cond: { $and: [{ $eq: ['$$bed.ID_STATUT', 1] }, { $eq: ['$$bed.ACTIF', true] }] }
              }
            }
          },
          'services.availableCapacity': {
            $size: {
              $filter: {
                input: '$beds',
                as: 'bed',
                cond: { $and: [{ $eq: ['$$bed.ID_STATUT', 1] }, { $eq: ['$$bed.ACTIF', true] }] }
              }
            }
          }
        }
      },
      {
        $group: {
          _id: '$_id',
          ID_SECTEUR: { $first: '$ID_SECTEUR' },
          LIB_SECTEUR: { $first: '$LIB_SECTEUR' },
          ABR_SECTEUR: { $first: '$ABR_SECTEUR' },
          totalCapacity: { $sum: '$services.totalCapacity' },
          availableBeds: { $sum: '$services.availableCapacity' },
          realCapacity: { $sum: '$services.realCapacity' }
        }
      },
      { $sort: { ID_SECTEUR: 1 } }
    ]);
    res.json(secteurs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /secteurs:
 *   post:
 *     summary: Create a new sector
 *     description: Create a new hospital sector (Admin only)
 *     tags: [Sectors]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Secteur'
 *     responses:
 *       201:
 *         description: Sector created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Secteur'
 *       400:
 *         description: Invalid input
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Forbidden - Admin role required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/', async (req, res) => {
  try {
    // Only admin can create sectors
    if (req.user.role !== 'Admin') {
      return res.status(403).json({ error: 'Admin role required to create sectors' });
    }
    
    // Find the highest existing ID_SECTEUR
    const lastSecteur = await Secteur.findOne().sort({ ID_SECTEUR: -1 });
    const nextId = lastSecteur ? lastSecteur.ID_SECTEUR + 1 : 1;
    const secteur = new Secteur({ ...req.body, ID_SECTEUR: nextId });
    const savedSecteur = await secteur.save();
    res.status(201).json(savedSecteur);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * @swagger
 * /secteurs/{id}:
 *   delete:
 *     summary: Delete a sector by ID_SECTEUR (cascade delete)
 *     tags: [Sectors]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Sector ID_SECTEUR
 *     responses:
 *       200:
 *         description: Sector and related data deleted
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Forbidden - Admin role required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Sector not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.delete('/:id', async (req, res) => {
  try {
    // Only admin can delete sectors
    if (req.user.role !== 'Admin') {
      return res.status(403).json({ error: 'Admin role required to delete sectors' });
    }
    
    const secteurId = parseInt(req.params.id, 10);
    const secteur = await Secteur.findOneAndDelete({ ID_SECTEUR: secteurId });
    if (!secteur) {
      return res.status(404).json({ error: 'Sector not found' });
    }
    // Find all services in this sector
    const services = await Service.find({ ID_SECTEUR: secteurId });
    const serviceIds = services.map(s => s.ID_SERVICE);
    // Delete all beds in these services
    await Lit.deleteMany({ ID_SERVICE: { $in: serviceIds } });
    // Delete all services in this sector
    await Service.deleteMany({ ID_SECTEUR: secteurId });
    // Remove these service IDs from all users
    await Utilisateur.updateMany(
      {},
      { $pull: { SERVICES_AUTORISES: { $in: serviceIds } } }
    );
    res.json({ message: 'Sector and related data deleted' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * @swagger
 * /secteurs/{id}:
 *   put:
 *     summary: Update a sector by ID_SECTEUR
 *     tags: [Sectors]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Sector ID_SECTEUR
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Secteur'
 *     responses:
 *       200:
 *         description: Sector updated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Secteur'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Forbidden - Admin role required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Sector not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.put('/:id', async (req, res) => {
  try {
    // Only admin can update sectors
    if (req.user.role !== 'Admin') {
      return res.status(403).json({ error: 'Admin role required to update sectors' });
    }
    
    const secteurId = parseInt(req.params.id, 10);
    // Prevent updating ID_SECTEUR
    const updateData = { ...req.body };
    delete updateData.ID_SECTEUR;
    const updatedSecteur = await Secteur.findOneAndUpdate(
      { ID_SECTEUR: secteurId },
      updateData,
      { new: true, runValidators: true }
    );
    if (!updatedSecteur) {
      return res.status(404).json({ error: 'Sector not found' });
    }
    res.json(updatedSecteur);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router; 