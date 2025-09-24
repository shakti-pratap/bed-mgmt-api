const express = require('express');
const router = express.Router();
const { Settings } = require('../models');
const auth = require('../middleware/auth');

// Apply auth middleware to all routes
router.use(auth);

/**
 * @swagger
 * /settings:
 *   get:
 *     summary: Get application settings
 *     description: Retrieve the current application settings including cleaning and maintenance time configurations
 *     tags: [Settings]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Application settings retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 cleaningStartTime:
 *                   type: number
 *                   minimum: 0
 *                   maximum: 23
 *                   description: Cleaning start time in 24-hour format
 *                 cleaningEndTime:
 *                   type: number
 *                   minimum: 0
 *                   maximum: 23
 *                   description: Cleaning end time in 24-hour format
 *                 cleaningTimeInterval:
 *                   type: number
 *                   enum: [15, 30, 45, 60]
 *                   description: Cleaning time interval in minutes
 *                 maintenanceStartTime:
 *                   type: number
 *                   minimum: 0
 *                   maximum: 23
 *                   description: Maintenance start time in 24-hour format
 *                 maintenanceEndTime:
 *                   type: number
 *                   minimum: 0
 *                   maximum: 23
 *                   description: Maintenance end time in 24-hour format
 *                 maintenanceTimeInterval:
 *                   type: number
 *                   enum: [15, 30, 45, 60]
 *                   description: Maintenance time interval in minutes
 *                 createdAt:
 *                   type: string
 *                   format: date-time
 *                 updatedAt:
 *                   type: string
 *                   format: date-time
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/', async (req, res) => {
  try {
    const settings = await Settings.getCurrentSettings();
    res.json(settings);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /settings:
 *   put:
 *     summary: Update application settings
 *     description: Update the application settings including cleaning and maintenance time configurations
 *     tags: [Settings]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               cleaningStartTime:
 *                 type: number
 *                 minimum: 0
 *                 maximum: 23
 *                 description: Cleaning start time in 24-hour format
 *               cleaningEndTime:
 *                 type: number
 *                 minimum: 0
 *                 maximum: 23
 *                 description: Cleaning end time in 24-hour format
 *               cleaningTimeInterval:
 *                 type: number
 *                 enum: [15, 30, 45, 60]
 *                 description: Cleaning time interval in minutes
 *               maintenanceStartTime:
 *                 type: number
 *                 minimum: 0
 *                 maximum: 23
 *                 description: Maintenance start time in 24-hour format
 *               maintenanceEndTime:
 *                 type: number
 *                 minimum: 0
 *                 maximum: 23
 *                 description: Maintenance end time in 24-hour format
 *               maintenanceTimeInterval:
 *                 type: number
 *                 enum: [15, 30, 45, 60]
 *                 description: Maintenance time interval in minutes
 *     responses:
 *       200:
 *         description: Settings updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Settings updated successfully
 *                 settings:
 *                   type: object
 *                   description: Updated settings object
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.put('/', async (req, res) => {
  try {
    const updateData = req.body;
    
    // Validate the update data
    const allowedFields = [
      'cleaningStartTime',
      'cleaningEndTime', 
      'cleaningTimeInterval',
      'maintenanceStartTime',
      'maintenanceEndTime',
      'maintenanceTimeInterval'
    ];
    
    // Filter only allowed fields
    const filteredData = {};
    Object.keys(updateData).forEach(key => {
      if (allowedFields.includes(key)) {
        filteredData[key] = updateData[key];
      }
    });
    
    if (Object.keys(filteredData).length === 0) {
      return res.status(400).json({ 
        error: 'No valid fields provided for update' 
      });
    }
    
    const updatedSettings = await Settings.updateSettings(filteredData);
    
    res.json({
      message: 'Settings updated successfully',
      settings: updatedSettings
    });
  } catch (error) {
    if (error.message.includes('start time must be before end time')) {
      res.status(400).json({ error: error.message });
    } else {
      res.status(500).json({ error: error.message });
    }
  }
});

module.exports = router;
