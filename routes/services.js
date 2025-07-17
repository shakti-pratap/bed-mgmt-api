const express = require('express');
const router = express.Router();
const { Service } = require('../models');
const swagger = require('../config/swagger');
const auth = require('../middleware/auth');

// Apply auth middleware to all routes
router.use(auth);

/**
 * @swagger
 * /services:
 *   get:
 *     summary: Get all services
 *     description: Retrieve a list of all hospital services (filtered by user permissions)
 *     tags: [Services]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of services
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   ID_SERVICE:
 *                     type: string
 *                     description: Service identifier
 *                   LIB_SERVICE:
 *                     type: string
 *                     description: Service name
 *                   ID_SECTEUR:
 *                     type: number
 *                     description: Sector identifier
 *                   ROR:
 *                     type: boolean
 *                     description: ROR status
 *                   CAPA_ARCHI:
 *                     type: number
 *                     description: Total beds in the service (calculated dynamically)
 *                   CAPA_REELLE:
 *                     type: number
 *                     description: Active beds in the service (calculated dynamically)
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search term for service ID or service name
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
    const { id, search } = req.query;
    let services;
    
    if (id) {
      services = await Service.findOne({ ID_SERVICE: id });
      if (services) {
        const beds = await require('../models').Lit.find({ ID_SERVICE: services.ID_SERVICE });
        services = services.toObject();
        services.CAPA_ARCHI = beds.filter(b => b.ACTIF === true).length;
        services.CAPA_REELLE = beds.filter(b => b.ID_STATUT === 1 && b.ACTIF === true).length;
      }
    } else {
      // Build query for search
      let query = {};
      if (search) {
        query.$or = [
          { ID_SERVICE: { $regex: search, $options: 'i' } },
          { LIB_SERVICE: { $regex: search, $options: 'i' } }
        ];
      }
      
      // Get services and calculate capacities
      const allServices = await Service.find(query).sort({ ID_SERVICE: 1 });
      const Lit = require('../models').Lit;
      services = await Promise.all(allServices.map(async (service) => {
        const beds = await Lit.find({ ID_SERVICE: service.ID_SERVICE });
        return {
          ...service.toObject(),
          CAPA_ARCHI: beds.filter(b => b.ACTIF === true).length,
          CAPA_REELLE: beds.filter(b => b.ID_STATUT === 1 && b.ACTIF === true).length
        };
      }));
    }
    res.json(services);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /services/secteur/{secteurId}:
 *   get:
 *     summary: Get services by sector
 *     description: Retrieve all services belonging to a specific sector (filtered by user permissions)
 *     tags: [Services]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: secteurId
 *         required: true
 *         schema:
 *           type: number
 *         description: Sector identifier
 *     responses:
 *       200:
 *         description: List of services in the sector
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   ID_SERVICE:
 *                     type: string
 *                     description: Service identifier
 *                   LIB_SERVICE:
 *                     type: string
 *                     description: Service name
 *                   ID_SECTEUR:
 *                     type: number
 *                     description: Sector identifier
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
router.get('/secteur/:secteurId', async (req, res) => {
  try {
    let query = { ID_SECTEUR: req.params.secteurId };
    
    const services = await Service.find(query);
    const servicesWithCapacity = await Service.getCapacityForServices(services);
    res.json(servicesWithCapacity);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /services:
 *   post:
 *     summary: Create a new service
 *     tags: [Services]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Service'
 *     responses:
 *       201:
 *         description: Service created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Service'
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
    // Only admin can create services
    if (req.user.role !== 'Admin') {
      return res.status(403).json({ error: 'Admin role required to create services' });
    }
    
    const { LIB_SERVICE } = req.body;
    if (!LIB_SERVICE) {
      return res.status(400).json({ error: 'LIB_SERVICE is required' });
    }
    // Prefix: first 4 uppercase letters of LIB_SERVICE, padded if needed
    const prefix = (LIB_SERVICE.replace(/\s+/g, '').toUpperCase() + 'XXXX').slice(0, 4);
    // Find the highest existing ID_SERVICE for this prefix
    const regex = new RegExp(`^${prefix}-\\d{2}$`);
    const lastService = await Service.find({ ID_SERVICE: { $regex: regex } })
      .sort({ ID_SERVICE: -1 })
      .limit(1);
    let nextNum = 1;
    if (lastService.length > 0) {
      const lastId = lastService[0].ID_SERVICE;
      const num = parseInt(lastId.slice(5), 10);
      nextNum = num + 1;
    }
    const newId = `${prefix}-${String(nextNum).padStart(2, '0')}`;
    // Create service, ignoring any ID_SERVICE from client
    const service = new Service({ ...req.body, ID_SERVICE: newId });
    const savedService = await service.save();
    res.status(201).json(savedService);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * @swagger
 * /services/{id}:
 *   put:
 *     summary: Update a service by ID_SERVICE
 *     tags: [Services]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Service ID_SERVICE
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Service'
 *     responses:
 *       200:
 *         description: Service updated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Service'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Forbidden - Admin role required or access denied
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Service not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.put('/:id', async (req, res) => {
  try {
    // Check if user has access to this service
    if (req.user.role !== 'Admin') {
      if (!req.user.SERVICES_AUTORISES || !req.user.SERVICES_AUTORISES.includes(req.params.id)) {
        return res.status(403).json({ error: 'Access denied to this service' });
      }
    }
    
    // Prevent updating ID_SERVICE
    const updateData = { ...req.body };
    delete updateData.ID_SERVICE;
    const updatedService = await Service.findOneAndUpdate(
      { ID_SERVICE: req.params.id },
      updateData,
      { new: true, runValidators: true }
    );
    if (!updatedService) {
      return res.status(404).json({ error: 'Service not found' });
    }
    res.json(updatedService);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * @swagger
 * /services/{id}:
 *   delete:
 *     summary: Delete a service by ID_SERVICE (cascade delete)
 *     tags: [Services]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Service ID_SERVICE
 *     responses:
 *       200:
 *         description: Service and related data deleted
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
 *         description: Service not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
const { Lit, Utilisateur } = require('../models');
router.delete('/:id', async (req, res) => {
  try {
    // Only admin can delete services
    if (req.user.role !== 'Admin') {
      return res.status(403).json({ error: 'Admin role required to delete services' });
    }
    
    const service = await Service.findOneAndDelete({ ID_SERVICE: req.params.id });
    if (!service) {
      return res.status(404).json({ error: 'Service not found' });
    }
    // Delete all beds in this service
    await Lit.deleteMany({ ID_SERVICE: req.params.id });
    // Remove this service from all users
    await Utilisateur.updateMany(
      {},
      { $pull: { SERVICES_AUTORISES: req.params.id } }
    );
    res.json({ message: 'Service and related data deleted' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router; 