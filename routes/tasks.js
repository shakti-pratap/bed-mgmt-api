const express = require("express");
const router = express.Router();
const { Task, Statut } = require("../models");
const auth = require("../middleware/auth");

// Apply auth middleware to all routes
router.use(auth);

/**
 * @swagger
 * /tasks:
 *   get:
 *     summary: Get all tasks with optional filters, pagination, and searching
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: taskType
 *         schema:
 *           type: string
 *         description: Filter by task type (status ID). Can be a single value (e.g., "3") or multiple comma-separated values (e.g., "3,4")
 *       - in: query
 *         name: isDone
 *         schema:
 *           type: boolean
 *         description: Filter by completion status
 *       - in: query
 *         name: isUrgent
 *         schema:
 *           type: boolean
 *         description: Filter by urgent status
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search term for bed ID, service name, status name, or task category name
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
 *           default: creationDate
 *         description: Field to sort by
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *         description: Sort order (ascending or descending)
 *     responses:
 *       200:
 *         description: Paginated list of tasks with metadata
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 total:
 *                   type: integer
 *                   description: Total number of tasks matching the filters
 *                 tasks:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Task'
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
router.get("/", async (req, res) => {
  try {
    const {
      taskType,
      isDone,
      isUrgent,
      search,
      page = 1,
      limit = 10,
      sortBy = "creationDate",
      sortOrder = "desc",
    } = req.query;

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

    if (taskType) {
      // Handle multiple task types (comma-separated)
      if (taskType.includes(',')) {
        const taskTypes = taskType.split(',').map(t => Number(t.trim()));
        matchConditions.taskType = { $in: taskTypes };
      } else {
        matchConditions.taskType = Number(taskType);
      }
    }

    if (isDone !== undefined) {
      matchConditions.isDone = isDone === "true";
    }

    if (isUrgent !== undefined) {
      matchConditions.isUrgent = isUrgent === "true";
    }

    if (search) {
      // Search in bed ID, service name, or status name
      matchConditions.$or = [
        { bedId: { $regex: search, $options: "i" } },
        { serviceName: { $regex: search, $options: "i" } },
      ];
    }

    // First, get total count for pagination
    const total = await Task.aggregate([
      { $match: matchConditions },
      {
        $lookup: {
          from: "statuts",
          localField: "taskType",
          foreignField: "ID_STATUT",
          as: "status_info",
        },
      },
      {
        $lookup: {
          from: "statuts",
          localField: "taskCategory",
          foreignField: "ID_STATUT",
          as: "category_info",
        },
      },
      {
        $addFields: {
          statusName: { $arrayElemAt: ["$status_info.LIB_STATUT", 0] },
          taskCategoryName: { $arrayElemAt: ["$category_info.LIB_STATUT", 0] },
        },
      },
      ...(search
        ? [
            {
              $match: {
                $or: [
                  { bedId: { $regex: search, $options: "i" } },
                  { serviceName: { $regex: search, $options: "i" } },
                  { statusName: { $regex: search, $options: "i" } },
                  { taskCategoryName: { $regex: search, $options: "i" } },
                ],
              },
            },
          ]
        : []),
      { $count: "total" },
    ]);

    const totalCount = total.length > 0 ? total[0].total : 0;

    // Get tasks with pagination and search
    const tasks = await Task.aggregate([
      { $match: matchConditions },
      {
        $lookup: {
          from: "statuts",
          localField: "taskType",
          foreignField: "ID_STATUT",
          as: "status_info",
        },
      },
      {
        $lookup: {
          from: "statuts",
          localField: "taskCategory",
          foreignField: "ID_STATUT",
          as: "category_info",
        },
      },
      {
        $addFields: {
          statusName: { $arrayElemAt: ["$status_info.LIB_STATUT", 0] },
          taskCategoryName: { $arrayElemAt: ["$category_info.LIB_STATUT", 0] },
        },
      },
      ...(search
        ? [
            {
              $match: {
                $or: [
                  { bedId: { $regex: search, $options: "i" } },
                  { serviceName: { $regex: search, $options: "i" } },
                  { statusName: { $regex: search, $options: "i" } },
                  { taskCategoryName: { $regex: search, $options: "i" } },
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
          status_info: 0,
          category_info: 0,
        },
      },
    ]);

    res.json({
      total: totalCount,
      tasks,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(totalCount / limitNum),
    });
  } catch (error) {
    console.error("Error fetching tasks:", error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /tasks/{id}:
 *   patch:
 *     summary: Update task status
 *     description: Update the completion status and other properties of a task
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Task ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               isDone:
 *                 type: boolean
 *                 description: Task completion status
 *               isUrgent:
 *                 type: boolean
 *                 description: Task urgency status
 *               bedFor:
 *                 type: string
 *                 description: Bed assignment information
 *               taskCompletionDateTime:
 *                 type: string
 *                 format: date-time
 *                 description: Task completion date and time
 *               taskCategory:
 *                 type: number
 *                 description: Task category (SUB_ID_STATUT), mainly for status 3 tasks
 *     responses:
 *       200:
 *         description: Task updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Task'
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
 *       404:
 *         description: Task not found
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
router.patch("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { isDone, isUrgent, bedFor, taskCompletionDateTime, taskCategory } = req.body;

    // Check if task exists
    const existingTask = await Task.findById(id);
    if (!existingTask) {
      return res.status(404).json({ error: "Task not found" });
    }

    // Build update object with only provided fields
    const updateData = {};
    
    if (isDone !== undefined) {
      updateData.isDone = isDone;
    }
    
    if (isUrgent !== undefined) {
      updateData.isUrgent = isUrgent;
    }
    
    if (bedFor !== undefined) {
      updateData.bedFor = bedFor;
    }
    
    if (taskCompletionDateTime !== undefined) {
      updateData.taskCompletionDateTime = taskCompletionDateTime;
    }
    
    if (taskCategory !== undefined) {
      updateData.taskCategory = taskCategory;
    }

    // Update the task
    const updatedTask = await Task.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );

    console.log(`✅ Task ${id} updated successfully`);
    res.json(updatedTask);
  } catch (error) {
    console.error("❌ Error updating task:", error);
    
    // Handle validation errors
    if (error.name === "ValidationError") {
      return res.status(400).json({ error: error.message });
    }
    
    // Handle invalid ObjectId
    if (error.name === "CastError") {
      return res.status(400).json({ error: "Invalid task ID format" });
    }
    
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
