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
 *     summary: Get all sectors
 *     description: Retrieve a list of all hospital sectors (filtered by user permissions)
 *     tags: [Sectors]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of sectors
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Secteur'
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
    if (req.user.role === 'Admin') {
      // Admin gets all sectors
      const secteurs = await Secteur.find().sort({ ID_SECTEUR: 1 });
      res.json(secteurs);
    } else {
      // Non-admin users only get sectors that contain their authorized services
      const authorizedServices = req.user.SERVICES_AUTORISES || [];
      
      if (authorizedServices.length === 0) {
        return res.json([]); // No authorized services, no sectors
      }
      
      // Find services to get their sector IDs
      const services = await Service.find({ ID_SERVICE: { $in: authorizedServices } });
      const sectorIds = [...new Set(services.map(s => s.ID_SECTEUR))]; // Remove duplicates
      
      // Get sectors that contain authorized services
      const secteurs = await Secteur.find({ ID_SECTEUR: { $in: sectorIds } }).sort({ ID_SECTEUR: 1 });
      res.json(secteurs);
    }
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