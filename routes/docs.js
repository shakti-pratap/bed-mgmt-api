const express = require('express');
const router = express.Router();

// API Documentation route
router.get('/', (req, res) => {
  res.json({
    message: 'Hospital Bed Management API Documentation',
    version: '1.0.0',
    baseUrl: '/api',
    endpoints: {
      sectors: {
        path: '/secteurs',
        methods: ['GET'],
        description: 'Manage hospital sectors'
      },
      services: {
        path: '/services',
        methods: ['GET'],
        description: 'Manage hospital services',
        subEndpoints: {
          bySector: {
            path: '/services/secteur/:secteurId',
            methods: ['GET'],
            description: 'Get services by sector'
          }
        }
      },
      beds: {
        path: '/lits',
        methods: ['GET'],
        description: 'Manage hospital beds',
        subEndpoints: {
          byService: {
            path: '/lits/service/:serviceId',
            methods: ['GET'],
            description: 'Get beds by service'
          },
          updateStatus: {
            path: '/lits/bed/:bedId/status',
            methods: ['PATCH'],
            description: 'Update bed status',
            body: {
              ID_STATUT: 'Number (required)',
              AUTEUR: 'String (required)',
              COMMENTAIRE: 'String (optional)'
            }
          },
          history: {
            path: '/lits/bed/:bedId/history',
            methods: ['GET'],
            description: 'Get bed status history'
          }
        }
      },
      statuses: {
        path: '/statuts',
        methods: ['GET'],
        description: 'Get all bed statuses'
      },
      dashboard: {
        path: '/dashboard',
        methods: ['GET'],
        description: 'Get dashboard statistics',
        subEndpoints: {
          bedSummary: {
            path: '/dashboard/bed-summary',
            methods: ['GET'],
            description: 'Get bed summary by status'
          }
        }
      }
    }
  });
});

module.exports = router; 