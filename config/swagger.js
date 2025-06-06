const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Hospital Bed Management API',
      version: '1.0.0',
      description: `
# Hospital Bed Management API Documentation

## Overview
This API provides endpoints for managing hospital beds, services, sectors, and their statuses.

## Database Schema

### Sectors (Secteurs)
- ID_SECTEUR (Number, unique): Sector identifier
- LIB_SECTEUR (String): Sector name
- ABR_SECTEUR (String): Sector abbreviation

### Services
- ID_SERVICE (String, unique): Service identifier
- LIB_SERVICE (String): Service name
- ID_SECTEUR (Number): Reference to sector
- CAPA_ARCHI (Number): Architectural capacity
- CAPA_REELLE (Number): Real capacity
- ROR (Boolean): ROR status

### Beds (Lits)
- ID_LIT (String, unique): Bed identifier
- ID_SERVICE (String): Reference to service
- ID_STATUT (Number): Reference to status
- MAJ_STATUT (Date): Last status update
- ACTIF (Boolean): Active status

### Statuses (Statuts)
- ID_STATUT (Number, unique): Status identifier
- LIB_STATUT (String): Status name

### Users (Utilisateurs)
- ID_UTILISATEUR (String, unique): User identifier
- NOM (String): User name
- ROLE (String): User role (Admin/User/Viewer/Manager)
- SERVICES_AUTORISES (Array): Authorized services
- ACTIF (Boolean): Active status
- EMAIL (String, unique): User email

### Status History (HistoriqueStatut)
- ID_HIST (Number, unique): History identifier
- ID_LIT (String): Reference to bed
- ID_STATUT (Number): Reference to status
- DATE_HEURE (Date): Timestamp
- AUTEUR (String): Author
- COMMENTAIRE (String): Comment
- STATUT_PRECEDENT (Number): Previous status

## Setup Instructions

1. Install dependencies:
   \`\`\`bash
   npm install
   \`\`\`

2. Configure MongoDB connection in \`config/database.js\`

3. Run migrations:
   \`\`\`bash
   npm run migrate
   \`\`\`

4. Start the server:
   \`\`\`bash
   npm start
   \`\`\`

## Available Scripts

- \`npm start\`: Start the server
- \`npm run dev\`: Start the server with nodemon
- \`npm run migrate\`: Run migrations
- \`npm run migrate:rollback\`: Rollback migrations
- \`npm run migrate:status\`: Check migration status
- \`npm run migrate:fresh\`: Fresh migration
- \`npm run migrate:make\`: Create new migration
      `,
      contact: {
        name: 'API Support',
        email: 'support@hospital.com'
      }
    },
    servers: [
      {
        url: 'http://localhost:3000/api',
        description: 'Development server'
      }
    ],
    components: {
      schemas: {
        Error: {
          type: 'object',
          properties: {
            error: {
              type: 'string',
              description: 'Error message'
            }
          }
        },
        Secteur: {
          type: 'object',
          properties: {
            ID_SECTEUR: {
              type: 'number',
              description: 'Sector identifier'
            },
            LIB_SECTEUR: {
              type: 'string',
              description: 'Sector name'
            },
            ABR_SECTEUR: {
              type: 'string',
              description: 'Sector abbreviation'
            }
          }
        },
        Service: {
          type: 'object',
          properties: {
            ID_SERVICE: {
              type: 'string',
              description: 'Service identifier'
            },
            LIB_SERVICE: {
              type: 'string',
              description: 'Service name'
            },
            ID_SECTEUR: {
              type: 'number',
              description: 'Reference to sector'
            },
            CAPA_ARCHI: {
              type: 'number',
              description: 'Architectural capacity'
            },
            CAPA_REELLE: {
              type: 'number',
              description: 'Real capacity'
            },
            ROR: {
              type: 'boolean',
              description: 'ROR status'
            }
          }
        },
        Lit: {
          type: 'object',
          properties: {
            ID_LIT: {
              type: 'string',
              description: 'Bed identifier'
            },
            ID_SERVICE: {
              type: 'string',
              description: 'Reference to service'
            },
            ID_STATUT: {
              type: 'number',
              description: 'Reference to status'
            },
            MAJ_STATUT: {
              type: 'string',
              format: 'date-time',
              description: 'Last status update'
            },
            ACTIF: {
              type: 'boolean',
              description: 'Active status'
            }
          }
        },
        Statut: {
          type: 'object',
          properties: {
            ID_STATUT: {
              type: 'number',
              description: 'Status identifier'
            },
            LIB_STATUT: {
              type: 'string',
              description: 'Status name'
            }
          }
        },
        Utilisateur: {
          type: 'object',
          properties: {
            ID_UTILISATEUR: {
              type: 'string',
              description: 'User identifier'
            },
            NOM: {
              type: 'string',
              description: 'User name'
            },
            ROLE: {
              type: 'string',
              enum: ['Admin', 'User', 'Viewer', 'Manager'],
              description: 'User role'
            },
            SERVICES_AUTORISES: {
              type: 'array',
              items: {
                type: 'string'
              },
              description: 'Authorized services'
            },
            ACTIF: {
              type: 'boolean',
              description: 'Active status'
            },
            EMAIL: {
              type: 'string',
              format: 'email',
              description: 'User email'
            }
          }
        },
        HistoriqueStatut: {
          type: 'object',
          properties: {
            ID_HIST: {
              type: 'number',
              description: 'History identifier'
            },
            ID_LIT: {
              type: 'string',
              description: 'Reference to bed'
            },
            ID_STATUT: {
              type: 'number',
              description: 'Reference to status'
            },
            DATE_HEURE: {
              type: 'string',
              format: 'date-time',
              description: 'Timestamp'
            },
            AUTEUR: {
              type: 'string',
              description: 'Author'
            },
            COMMENTAIRE: {
              type: 'string',
              description: 'Comment'
            },
            STATUT_PRECEDENT: {
              type: 'number',
              description: 'Previous status'
            }
          }
        }
      }
    }
  },
  apis: ['./routes/*.js'], // Path to the API docs
};

module.exports = swaggerJsdoc(options); 