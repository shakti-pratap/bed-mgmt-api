const express = require("express");
const router = express.Router();
const { Lit, HistoriqueStatut, Statut } = require("../models");
const auth = require("../middleware/auth");

// Apply auth middleware to all routes
router.use(auth);

/**
 * @swagger
 * /lits:
 *   get:
 *     summary: Get all active beds
 *     description: Retrieve a list of all active hospital beds
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
router.get("/", async (req, res) => {
  try {
    let query = {};

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
 *     description: Retrieve all beds belonging to a specific service with pagination and search
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
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search term for bed ID or status
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
 *         description: List of beds in the service
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
 *                 page:
 *                   type: integer
 *                 limit:
 *                   type: integer
 *                 totalPages:
 *                   type: integer
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
router.get("/service/:serviceId", async (req, res) => {
  try {
    const {
      search,
      status,
      page = 1,
      limit = 10,
      sortBy = "ID_LIT",
      sortOrder = "asc",
    } = req.query;

    // Build match conditions
    const matchConditions = { ID_SERVICE: req.params.serviceId, ACTIF: true };

    if (status) {
      matchConditions.ID_STATUT = Number(status);
    }

    if (search) {
      // Search in bed ID or status name
      matchConditions.$or = [{ ID_LIT: { $regex: search, $options: "i" } }];
    }
    const sortObject = {};
    sortObject[sortBy] = sortOrder === "desc" ? -1 : 1;
    // First, get total count for pagination
    const total = await Lit.aggregate([
      { $match: matchConditions },
      {
        $lookup: {
          from: "statuts",
          localField: "ID_STATUT",
          foreignField: "ID_STATUT",
          as: "statut_info",
        },
      },
      {
        $addFields: {
          LIB_STATUT: { $arrayElemAt: ["$statut_info.LIB_STATUT", 0] },
        },
      },
      ...(search
        ? [
            {
              $match: {
                $or: [
                  { ID_LIT: { $regex: search, $options: "i" } },
                  { LIB_STATUT: { $regex: search, $options: "i" } },
                ],
              },
            },
          ]
        : []),
      { $count: "total" },
    ]);

    const totalCount = total.length > 0 ? total[0].total : 0;

    // Get beds with pagination
    const beds = await Lit.aggregate([
      { $match: matchConditions },
      {
        $lookup: {
          from: "statuts",
          localField: "ID_STATUT",
          foreignField: "ID_STATUT",
          as: "statut_info",
        },
      },
      {
        $addFields: {
          LIB_STATUT: { $arrayElemAt: ["$statut_info.LIB_STATUT", 0] },
        },
      },
      ...(search
        ? [
            {
              $match: {
                $or: [
                  { ID_LIT: { $regex: search, $options: "i" } },
                  { LIB_STATUT: { $regex: search, $options: "i" } },
                ],
              },
            },
          ]
        : []),
      { $sort: sortObject },
      { $skip: (Number(page) - 1) * Number(limit) },
      { $limit: Number(limit) },
      {
        $project: {
          statut_info: 0,
        },
      },
    ]);

    res.json({
      total: totalCount,
      beds,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(totalCount / Number(limit)),
    });
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
router.patch("/bed/:bedId/status", async (req, res) => {
  try {
    const {
      ID_STATUT,
      SUB_ID_STATUT,
      MAJ_STATUT,
      CLEANING_TIME,
      MAINTENANCE_TIME,
    } = req.body;
    console.log("Status update body ", req.body, ID_STATUT);
    const lit = await Lit.findOne({ ID_LIT: req.params.bedId });
    if (!lit) {
      return res.status(404).json({ error: "Bed not found" });
    }

    // Check if bed is active
    if (!lit.ACTIF) {
      return res
        .status(400)
        .json({ error: "Cannot update status of inactive bed" });
    }

    const previousStatus = lit.ID_STATUT;

    // Update bed status and ACTIF based on status
    // Only status 1 (Libre) makes bed active, all others make it inactive
    lit.ID_STATUT = ID_STATUT;
    lit.MAJ_STATUT = MAJ_STATUT;
    if (ID_STATUT === 3) {
      lit.SUB_ID_STATUT = SUB_ID_STATUT;
      lit.CLEANING_DATE = CLEANING_TIME;
    } else {
      lit.SUB_ID_STATUT = null;
      lit.CLEANING_DATE = null;
    }

    if (ID_STATUT === 4) {
      lit.MAINTENANCE_DATE = MAINTENANCE_TIME;
    } else {
      lit.MAINTENANCE_DATE = null;
    }
    await lit.save();

    // Remove: Update the service's available bed count (CAPA_REELLE)
    // No need to update service, as capacity is now dynamic

    // Create history record using the static method
    await HistoriqueStatut.createHistory({
      ID_LIT: lit.ID_LIT,
      ID_SERVICE: lit.ID_SERVICE,
      ID_STATUT: ID_STATUT,
      SUB_ID_STATUT: SUB_ID_STATUT,
      AUTEUR: req.user.NOM,
      STATUT_PRECEDENT: previousStatus,
    });

    const updatedLit = await Lit.findOne({ ID_LIT: req.params.bedId });
    res.json(updatedLit);
  } catch (error) {
    console.error("❌ Error updating bed status:", error);
    res.status(400).json({ error: error.message });
  }
});

/**
 * @swagger
 * /lits/bed/{bedId}/history:
 *   get:
 *     summary: Get bed history
 *     description: Retrieve the status history of a specific bed
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
 *       404:
 *         description: Bed not found
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
router.get("/bed/:bedId/history", async (req, res) => {
  try {
    // Check if bed exists
    const lit = await Lit.findOne({ ID_LIT: req.params.bedId });
    if (!lit) {
      return res.status(404).json({ error: "Bed not found" });
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
router.post("/", async (req, res) => {
  try {
    const { ID_SERVICE, GENDER } = req.body;
    console.log("ID SERVICE", req.body);
    if (ID_SERVICE === "") {
      return res.status(400).json({ error: "ID_SERVICE is required" });
    }

    // Prefix: ID_SERVICE + '-'
    const prefix = ID_SERVICE + "-";
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
    const newId = `${prefix}${String(nextNum).padStart(2, "0")}`;
    // Create bed, ignoring any ID_LIT from client
    const lit = new Lit({ ...req.body, ID_LIT: newId, GENDER, ID_STATUT: 1 });
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
router.put("/:id", async (req, res) => {
  try {
    // First check if bed exists and user has access to its service
    const existingLit = await Lit.findOne({ ID_LIT: req.params.id });
    if (!existingLit) {
      return res.status(404).json({ error: "Bed not found" });
    }

    // Prevent updating ID_LIT
    const updateData = { ...req.body };
    delete updateData.ID_LIT;

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
router.delete("/:id", async (req, res) => {
  try {
    // Only admin can delete beds
    if (req.user.role !== "Admin") {
      return res
        .status(403)
        .json({ error: "Admin role required to delete beds" });
    }

    const deletedLit = await Lit.findOneAndDelete({ ID_LIT: req.params.id });
    if (!deletedLit) {
      return res.status(404).json({ error: "Bed not found" });
    }
    res.json({ message: "Bed deleted" });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * @swagger
 * /lits/all:
 *   get:
 *     summary: Get all beds with optional filters, pagination, and sorting
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
 *         name: search
 *         schema:
 *           type: string
 *         description: Search term for bed ID, service name, or status name
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
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           default: ID_LIT
 *         description: Field to sort by (ID_LIT, ID_SERVICE, ID_STATUT, LIB_SERVICE, LIB_STATUT, etc.)
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: asc
 *         description: Sort order (ascending or descending)
 *     responses:
 *       200:
 *         description: Paginated list of beds with metadata
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 total:
 *                   type: integer
 *                   description: Total number of beds matching the filters
 *                 beds:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Lit'
 *                 page:
 *                   type: integer
 *                   description: Current page number
 *                 limit:
 *                   type: integer
 *                   description: Number of items per page
 *                 totalPages:
 *                   type: integer
 *                   description: Total number of pages
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
router.get("/all", async (req, res) => {
  try {
    const {
      secteur,
      status,
      search,
      page = 1,
      limit = 10,
      sortBy = "ID_LIT",
      sortOrder = "asc",
    } = req.query;
    const role = req.user?.role;
    // Validate pagination parameters
    const pageNum = Number(page);
    const limitNum = Number(limit);

    if (pageNum < 1) {
      return res.status(400).json({ error: "Page must be greater than 0" });
    }
    if (limitNum < 1 || limitNum > 100) {
      return res.status(400).json({ error: "Limit must be between 1 and 100" });
    }

    // Build sort object
    const sortObject = {};
    sortObject[sortBy] = sortOrder === "desc" ? -1 : 1;

    // Build match conditions
    const matchConditions = {};
    if (role === "Agent d'entretien" || role === "Responsabled'entretien") {
      matchConditions.ID_STATUT = 3;
    } else if (role === "Agent technique" || role === "Responsable technique") {
      matchConditions.ID_STATUT = 4;
    } else if (status) {
      matchConditions.ID_STATUT = Number(status);
    }

    if (secteur) {
      // Find all services in this sector
      const services = await require("../models").Service.find({
        ID_SECTEUR: Number(secteur),
      });
      const serviceIds = services.map((s) => s.ID_SERVICE);
      matchConditions.ID_SERVICE = { $in: serviceIds };
    }

    if (search) {
      // Search in bed ID, service name, or status name
      matchConditions.$or = [{ ID_LIT: { $regex: search, $options: "i" } }];
    }

    // First, get total count for pagination
    const total = await Lit.aggregate([
      { $match: matchConditions },
      {
        $lookup: {
          from: "services",
          localField: "ID_SERVICE",
          foreignField: "ID_SERVICE",
          as: "service_info",
        },
      },
      {
        $lookup: {
          from: "statuts",
          localField: "ID_STATUT",
          foreignField: "ID_STATUT",
          as: "statut_info",
        },
      },
      {
        $addFields: {
          LIB_SERVICE: { $arrayElemAt: ["$service_info.LIB_SERVICE", 0] },
          LIB_STATUT: { $arrayElemAt: ["$statut_info.LIB_STATUT", 0] },
        },
      },
      ...(search
        ? [
            {
              $match: {
                $or: [
                  { ID_LIT: { $regex: search, $options: "i" } },
                  { LIB_SERVICE: { $regex: search, $options: "i" } },
                  { LIB_STATUT: { $regex: search, $options: "i" } },
                ],
              },
            },
          ]
        : []),
      { $count: "total" },
    ]);

    const totalCount = total.length > 0 ? total[0].total : 0;

    // Get beds with pagination and search
    const beds = await Lit.aggregate([
      { $match: matchConditions },
      {
        $lookup: {
          from: "services",
          localField: "ID_SERVICE",
          foreignField: "ID_SERVICE",
          as: "service_info",
        },
      },
      {
        $lookup: {
          from: "statuts",
          localField: "ID_STATUT",
          foreignField: "ID_STATUT",
          as: "statut_info",
        },
      },
      {
        $addFields: {
          LIB_SERVICE: { $arrayElemAt: ["$service_info.LIB_SERVICE", 0] },
          LIB_STATUT: { $arrayElemAt: ["$statut_info.LIB_STATUT", 0] },
        },
      },
      ...(search
        ? [
            {
              $match: {
                $or: [
                  { ID_LIT: { $regex: search, $options: "i" } },
                  { LIB_SERVICE: { $regex: search, $options: "i" } },
                  { LIB_STATUT: { $regex: search, $options: "i" } },
                ],
              },
            },
          ]
        : []),
      { $sort: sortObject },
      { $skip: (pageNum - 1) * limitNum },
      { $limit: limitNum },
      {
        $project: {
          service_info: 0,
          statut_info: 0,
        },
      },
    ]);

    res.json({
      total: totalCount,
      beds,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(totalCount / limitNum),
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /lits/history:
 *   get:
 *     summary: Get bed status history with filters and pagination
 *     tags: [Beds]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: bedId
 *         schema:
 *           type: string
 *         description: Filter by bed ID
 *       - in: query
 *         name: serviceId
 *         schema:
 *           type: string
 *         description: Filter by service ID
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Filter by start date (ISO format)
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Filter by end date (ISO format)
 *       - in: query
 *         name: status
 *         schema:
 *           type: number
 *         description: Filter by status ID
 *       - in: query
 *         name: author
 *         schema:
 *           type: string
 *         description: Filter by author name
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
 *         description: List of history records
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 total:
 *                   type: integer
 *                 history:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       ID_HIST:
 *                         type: number
 *                       ID_LIT:
 *                         type: string
 *                       ID_SERVICE:
 *                         type: string
 *                       service:
 *                         type: string
 *                       status:
 *                         type: object
 *                         properties:
 *                           ID_STATUT:
 *                             type: number
 *                           LIB_STATUT:
 *                             type: string
 *                       previousStatus:
 *                         type: object
 *                         properties:
 *                           ID_STATUT:
 *                             type: number
 *                           LIB_STATUT:
 *                             type: string
 *                       DATE_HEURE:
 *                         type: string
 *                         format: date-time
 *                       AUTEUR:
 *                         type: string
 */
router.get("/history", auth, async (req, res) => {
  try {
    const {
      bedId,
      serviceId,
      startDate,
      endDate,
      status,
      author,
      page = 1,
      limit = 10,
    } = req.query;

    // Build query
    const query = {};

    if (bedId) {
      query.ID_LIT = bedId;
    }

    if (serviceId) {
      query.ID_SERVICE = serviceId;
    }

    if (status) {
      query.ID_STATUT = Number(status);
    }

    if (author) {
      query.AUTEUR = author;
    }

    // Improved date handling
    if (startDate || endDate) {
      query.DATE_HEURE = {};
      if (startDate) {
        // Set time to start of day
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        query.DATE_HEURE.$gte = start;
      }
      if (endDate) {
        // Set time to end of day
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        query.DATE_HEURE.$lte = end;
      }
    }

    // Role-based access control for history
    // Admin and Manager can see all history
    // User and Viewer can only see history for their authorized services
    if (req.user.ROLE === "User" || req.user.ROLE === "Viewer") {
      // Filter by user's authorized services
      if (
        req.user.SERVICES_AUTORISES &&
        req.user.SERVICES_AUTORISES.length > 0
      ) {
        query.ID_SERVICE = { $in: req.user.SERVICES_AUTORISES };
      } else {
        // If user has no authorized services, return empty result
        return res.json({
          total: 0,
          history: [],
          page: Number(page),
          limit: Number(limit),
          totalPages: 0,
        });
      }
    } else if (
      req.user.ROLE === "Agent d'entretien" ||
      req.user.ROLE === "Responsabled'entretien"
    ) {
      // Filter to only entries where current or previous status is 3 (À nettoyer)
      query.$or = [{ ID_STATUT: 3 }, { STATUT_PRECEDENT: 3 }];
    }
    else if (
      req.user.ROLE === "Agent technique" ||
      req.user.ROLE === "Responsable technique"
    ) {
      // Filter to only entries where current or previous status is 4 (À entretenir)
      query.$or = [{ ID_STATUT: 4 }, { STATUT_PRECEDENT: 4 }];
    }
    // For Admin and Manager roles, no additional filtering needed - they can see all

    // Get total count with role-based filtering
    const total = await HistoriqueStatut.countDocuments(query);

    const history = await HistoriqueStatut.aggregate([
      { $match: query },
      {
        $lookup: {
          from: "statuts",
          let: { statusId: { $toInt: "$ID_STATUT" } },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ["$ID_STATUT", "$$statusId"] },
              },
            },
          ],
          as: "status",
        },
      },
      {
        $lookup: {
          from: "statuts",
          let: { prevStatusId: { $toInt: "$STATUT_PRECEDENT" } },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ["$ID_STATUT", "$$prevStatusId"] },
              },
            },
          ],
          as: "previousStatus",
        },
      },
      {
        $lookup: {
          from: "services",
          localField: "ID_SERVICE",
          foreignField: "ID_SERVICE",
          as: "service",
        },
      },
      {
        $addFields: {
          status: { $arrayElemAt: ["$status.LIB_STATUT", 0] },
          previousStatus: { $arrayElemAt: ["$previousStatus.LIB_STATUT", 0] },
          service: { $arrayElemAt: ["$service.LIB_SERVICE", 0] },
        },
      },
      {
        $project: {
          ID_HIST: 1,
          ID_LIT: 1,
          ID_SERVICE: 1,
          service: 1,
          status: 1,
          previousStatus: 1,
          DATE_HEURE: 1,
          AUTEUR: 1,
          SUB_ID_STATUT: 1,
        },
      },
      { $sort: { DATE_HEURE: -1 } },
      { $skip: (Number(page) - 1) * Number(limit) },
      { $limit: Number(limit) },
    ]);

    res.json({
      total,
      history,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(total / Number(limit)),
    });
  } catch (error) {
    console.error("Error fetching history:", error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
