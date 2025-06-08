const express = require('express');
const router = express.Router();
const { Lit, HistoriqueStatut, Statut } = require('../models');
const auth = require('../middleware/auth');

// Apply auth middleware to all routes
router.use(auth);

/**
 * @swagger
 * /lits:
 *   get:
 *     summary: Get all active beds
 *     description: Retrieve a list of all active hospital beds (filtered by user permissions)
 *     tags: [Beds]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of active beds
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Lit'
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
    let query = { ACTIF: true };
    
    if (req.user.role !== 'Admin') {
      // Non-admin users only get beds from their authorized services
      const authorizedServices = req.user.SERVICES_AUTORISES || [];
      query.ID_SERVICE = { $in: authorizedServices };
    }
    
    const lits = await Lit.find(query).sort({ ID_LIT: 1 });
    res.json(lits);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /lits/service/{serviceId}:
 *   get:
 *     summary: Get beds by service
 *     description: Retrieve all beds belonging to a specific service (with permission check)
 *     tags: [Beds]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: serviceId
 *         required: true
 *         schema:
 *           type: string
 *         description: Service identifier
 *     responses:
 *       200:
 *         description: List of beds in the service
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Lit'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Forbidden - Access denied to this service
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
router.get('/service/:serviceId', async (req, res) => {
  try {
    // Check if user has access to this service
    if (req.user.role !== 'Admin') {
      if (!req.user.SERVICES_AUTORISES || !req.user.SERVICES_AUTORISES.includes(req.params.serviceId)) {
        return res.status(403).json({ error: 'Access denied to this service' });
      }
    }
    
    const lits = await Lit.aggregate([
      { $match: { ID_SERVICE: req.params.serviceId } },
      { $sort: { ID_LIT: 1 } },
      {
        $lookup: {
          from: 'statuts',
          localField: 'ID_STATUT',
          foreignField: 'ID_STATUT',
          as: 'statut_info'
        }
      },
      {
        $addFields: {
          LIB_STATUT: { $arrayElemAt: ['$statut_info.LIB_STATUT', 0] }
        }
      },
      {
        $project: {
          statut_info: 0
        }
      }
    ]);
    res.json(lits);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /lits/bed/{bedId}/status:
 *   patch:
 *     summary: Update bed status
 *     description: Update the status of a specific bed (with permission check)
 *     tags: [Beds]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: bedId
 *         required: true
 *         schema:
 *           type: string
 *         description: Bed identifier
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - ID_STATUT
 *               - AUTEUR
 *             properties:
 *               ID_STATUT:
 *                 type: number
 *                 description: New status identifier
 *               AUTEUR:
 *                 type: string
 *                 description: Author of the status change
 *               COMMENTAIRE:
 *                 type: string
 *                 description: Optional comment about the status change
 *     responses:
 *       200:
 *         description: Bed status updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Lit'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Forbidden - Access denied to this bed's service
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Bed not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       400:
 *         description: Invalid input
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.patch('/bed/:bedId/status', async (req, res) => {
  try {
    const { ID_STATUT, AUTEUR, COMMENTAIRE } = req.body;
    
    const lit = await Lit.findOne({ ID_LIT: req.params.bedId });
    if (!lit) {
      return res.status(404).json({ error: 'Bed not found' });
    }

    // Check if user has access to this bed's service
    if (req.user.role !== 'Admin') {
      if (!req.user.SERVICES_AUTORISES || !req.user.SERVICES_AUTORISES.includes(lit.ID_SERVICE)) {
        return res.status(403).json({ error: 'Access denied to this bed\'s service' });
      }
    }

    const previousStatus = lit.ID_STATUT;
    
    // Update bed status and ACTIF based on status
    // Only status 1 (Libre) makes bed active, all others make it inactive
    lit.ID_STATUT = ID_STATUT;
    lit.ACTIF = Number(ID_STATUT) === 1;
    await lit.save();

    // Create history record
    const historyRecord = new HistoriqueStatut({
      ID_LIT: lit.ID_LIT,
      ID_STATUT: ID_STATUT,
      AUTEUR: AUTEUR,
      COMMENTAIRE: COMMENTAIRE,
      STATUT_PRECEDENT: previousStatus
    });
    await historyRecord.save();

    const updatedLit = await Lit.findOne({ ID_LIT: req.params.bedId });
    res.json(updatedLit);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * @swagger
 * /lits/bed/{bedId}/history:
 *   get:
 *     summary: Get bed history
 *     description: Retrieve the status history of a specific bed (with permission check)
 *     tags: [Beds]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: bedId
 *         required: true
 *         schema:
 *           type: string
 *         description: Bed identifier
 *     responses:
 *       200:
 *         description: Bed status history
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/HistoriqueStatut'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Forbidden - Access denied to this bed's service
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
router.get('/bed/:bedId/history', async (req, res) => {
  try {
    // First check if bed exists and user has access to its service
    const lit = await Lit.findOne({ ID_LIT: req.params.bedId });
    if (!lit) {
      return res.status(404).json({ error: 'Bed not found' });
    }

    // Check if user has access to this bed's service
    if (req.user.role !== 'Admin') {
      if (!req.user.SERVICES_AUTORISES || !req.user.SERVICES_AUTORISES.includes(lit.ID_SERVICE)) {
        return res.status(403).json({ error: 'Access denied to this bed\'s service' });
      }
    }
    
    const history = await HistoriqueStatut.getBedHistory(req.params.bedId);
    res.json(history);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /lits:
 *   post:
 *     summary: Create a new bed
 *     tags: [Beds]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Lit'
 *     responses:
 *       201:
 *         description: Bed created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Lit'
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
 *         description: Forbidden - Access denied to this service
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/', async (req, res) => {
  try {
    const { ID_SERVICE } = req.body;
    if (!ID_SERVICE) {
      return res.status(400).json({ error: 'ID_SERVICE is required' });
    }

    // Check if user has access to this service
    if (req.user.role !== 'Admin') {
      if (!req.user.SERVICES_AUTORISES || !req.user.SERVICES_AUTORISES.includes(ID_SERVICE)) {
        return res.status(403).json({ error: 'Access denied to this service' });
      }
    }
    
    // Prefix: ID_SERVICE + '-'
    const prefix = ID_SERVICE + '-';
    // Find the highest existing ID_LIT for this service
    const regex = new RegExp(`^${prefix}\\d{2}$`);
    const lastLit = await Lit.find({ ID_LIT: { $regex: regex } })
      .sort({ ID_LIT: -1 })
      .limit(1);
    let nextNum = 1;
    if (lastLit.length > 0) {
      const lastId = lastLit[0].ID_LIT;
      const num = parseInt(lastId.slice(prefix.length), 10);
      nextNum = num + 1;
    }
    const newId = `${prefix}${String(nextNum).padStart(2, '0')}`;
    // Create bed, ignoring any ID_LIT from client
    const lit = new Lit({ ...req.body, ID_LIT: newId });
    const savedLit = await lit.save();
    res.status(201).json(savedLit);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * @swagger
 * /lits/{id}:
 *   put:
 *     summary: Update a bed by ID_LIT
 *     tags: [Beds]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Bed ID_LIT
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Lit'
 *     responses:
 *       200:
 *         description: Bed updated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Lit'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Forbidden - Access denied to this bed's service
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Bed not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.put('/:id', async (req, res) => {
  try {
    // First check if bed exists and user has access to its service
    const existingLit = await Lit.findOne({ ID_LIT: req.params.id });
    if (!existingLit) {
      return res.status(404).json({ error: 'Bed not found' });
    }

    // Check if user has access to this bed's service
    if (req.user.role !== 'Admin') {
      if (!req.user.SERVICES_AUTORISES || !req.user.SERVICES_AUTORISES.includes(existingLit.ID_SERVICE)) {
        return res.status(403).json({ error: 'Access denied to this bed\'s service' });
      }
    }
    
    // Prevent updating ID_LIT
    const updateData = { ...req.body };
    delete updateData.ID_LIT;
    
    // If ID_STATUT is being updated, set ACTIF accordingly
    // Only status 1 (Libre) makes bed active, all others make it inactive
    if (updateData.ID_STATUT) {
      updateData.ACTIF = Number(updateData.ID_STATUT) === 1;
    }
    
    const updatedLit = await Lit.findOneAndUpdate(
      { ID_LIT: req.params.id },
      updateData,
      { new: true, runValidators: true }
    );
    res.json(updatedLit);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * @swagger
 * /lits/{id}:
 *   delete:
 *     summary: Delete a bed by ID_LIT
 *     tags: [Beds]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Bed ID_LIT
 *     responses:
 *       200:
 *         description: Bed deleted
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
 *         description: Bed not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.delete('/:id', async (req, res) => {
  try {
    // Only admin can delete beds
    if (req.user.role !== 'Admin') {
      return res.status(403).json({ error: 'Admin role required to delete beds' });
    }
    
    const deletedLit = await Lit.findOneAndDelete({ ID_LIT: req.params.id });
    if (!deletedLit) {
      return res.status(404).json({ error: 'Bed not found' });
    }
    res.json({ message: 'Bed deleted' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * @swagger
 * /lits/all:
 *   get:
 *     summary: Get all beds with optional filters and pagination
 *     tags: [Beds]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: secteur
 *         schema:
 *           type: number
 *         description: Filter by sector ID_SECTEUR
 *       - in: query
 *         name: status
 *         schema:
 *           type: number
 *         description: Filter by status ID_STATUT
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of items per page
 *     responses:
 *       200:
 *         description: List of beds
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 total:
 *                   type: integer
 *                 beds:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Lit'
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
router.get('/all', async (req, res) => {
  try {
    const { secteur, status, page = 1, limit = 10 } = req.query;
    const query = {};
    if (status) query.ID_STATUT = Number(status);
    
    let serviceIds = null;
    if (secteur) {
      // Find all services in this sector
      const services = await require('../models').Service.find({ ID_SECTEUR: Number(secteur) });
      serviceIds = services.map(s => s.ID_SERVICE);
      
      if (req.user.role !== 'Admin') {
        // Filter services by user's authorized services
        const authorizedServices = req.user.SERVICES_AUTORISES || [];
        serviceIds = serviceIds.filter(id => authorizedServices.includes(id));
      }
      
      query.ID_SERVICE = { $in: serviceIds };
    } else if (req.user.role !== 'Admin') {
      // If no sector filter and not admin, filter by authorized services
      const authorizedServices = req.user.SERVICES_AUTORISES || [];
      query.ID_SERVICE = { $in: authorizedServices };
    }
    
    const total = await Lit.countDocuments(query);
    const beds = await Lit.find(query)
      .sort({ ID_LIT: 1 })
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit));
    res.json({ total, beds });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router; 