# Hospital Bed Management API

A Node.js API for managing hospital beds, services, sectors, and status tracking using MongoDB and Mongoose.

## 🏗️ Database Schema

The application implements a comprehensive hospital management system with the following entities:

### 1. **Secteur** (Sector)
- Represents different hospital sectors (Medicine, Surgery, etc.)
- Fields: `ID_SECTEUR`, `LIB_SECTEUR`, `ABR_SECTEUR`

### 2. **Service** 
- Individual services within sectors
- Fields: `ID_SERVICE`, `LIB_SERVICE`, `ID_SECTEUR`, `CAPA_ARCHI`, `CAPA_REELLE`, `ROR`

### 3. **Lit** (Bed)
- Individual hospital beds
- Fields: `ID_LIT`, `ID_SERVICE`, `ID_STATUT`, `MAJ_STATUT`, `ACTIF`

### 4. **Statut** (Status)
- Bed statuses (Free, Occupied, To be cleaned, etc.)
- Fields: `ID_STATUT`, `LIB_STATUT`

### 5. **Utilisateur** (User)
- System users with role-based access
- Fields: `ID_UTILISATEUR`, `NOM`, `ROLE`, `SERVICES_AUTORISES`, `EMAIL`

### 6. **HistoriqueStatut** (Status History)
- Tracks bed status changes over time
- Fields: `ID_HIST`, `ID_LIT`, `ID_STATUT`, `DATE_HEURE`, `AUTEUR`, `COMMENTAIRE`

## 🚀 Installation

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Install development dependencies:**
   ```bash
   npm install --save-dev nodemon
   ```

3. **Set up MongoDB:**
   - Install MongoDB locally or use MongoDB Atlas
   - Default connection: `mongodb://localhost:27017/bed_management`
   - Override with environment variable: `MONGODB_URI`

## 🗂️ Project Structure

```
bed-mgmt-api/
├── models/
│   ├── Secteur.js          # Sector schema
│   ├── Service.js          # Service schema
│   ├── Lit.js              # Bed schema
│   ├── Statut.js           # Status schema
│   ├── Utilisateur.js      # User schema
│   ├── HistoriqueStatut.js # Status history schema
│   ├── Migration.js        # Migration tracking schema
│   └── index.js            # Models export
├── migrations/
│   ├── 20250602_164200_create_secteurs.js
│   ├── 20250602_164300_create_statuts.js
│   ├── 20250602_164400_create_services.js
│   ├── 20250602_164500_create_utilisateurs.js
│   ├── 20250602_164600_create_lits.js
│   └── 20250602_164700_create_historique_statuts.js
├── lib/
│   └── migrator.js         # Migration runner
├── config/
│   └── database.js         # Database connection
├── migrate.js              # Migration CLI tool
├── server.js               # Main server file
├── package.json
└── README.md
```

## 🏃‍♂️ Running the Application

### Development Mode
```bash
npm run dev
```

### Production Mode
```bash
npm start
```

### Database Migrations
```bash
# Run pending migrations
npm run migrate

# Check migration status
npm run migrate:status

# Rollback last migration batch
npm run migrate:rollback

# Fresh migration (drop all data and remigrate)
npm run migrate:fresh

# Create new migration
npm run migrate:make create_new_table
```

The server will start on `http://localhost:3000`

## 🗄️ Database Migrations

This project uses a robust migration system to manage database state:

### Migration Commands

| Command | Description |
|---------|-------------|
| `npm run migrate` | Run all pending migrations |
| `npm run migrate:status` | Show current migration status |
| `npm run migrate:rollback` | Rollback the last migration batch |
| `npm run migrate:rollback 2` | Rollback the last 2 migration batches |
| `npm run migrate:fresh` | Drop all data and run all migrations |
| `npm run migrate:make <name>` | Create a new migration file |

### Migration Features

- **Batch Tracking**: Migrations are grouped in batches for easier rollback
- **Automatic Rollback**: Failed migrations automatically rollback applied changes
- **Index Creation**: Database indexes are created during migrations
- **Sample Data**: Initial migrations include sample data for testing
- **Incremental Updates**: Only pending migrations are applied

### Example Migration Usage

```bash
# First time setup
npm run migrate

# Check what's been applied
npm run migrate:status

# Create a new migration
npm run migrate:make add_patient_table

# Rollback if needed
npm run migrate:rollback
```

## 📋 API Endpoints

### Base URL
```
GET / - API information and endpoints
```

### Secteurs (Sectors)
```
GET  /api/secteurs       - Get all sectors
POST /api/secteurs       - Create new sector
```

### Services
```
GET /api/services           - Get all services
GET /api/services/:secteurId - Get services by sector
```

### Lits (Beds)
```
GET   /api/lits                    - Get all active beds
GET   /api/lits/service/:serviceId - Get beds by service
PATCH /api/lits/:bedId/status      - Update bed status
GET   /api/lits/:bedId/history     - Get bed status history
```

### Statuts (Status)
```
GET /api/statuts - Get all statuses
```

### Dashboard
```
GET /api/dashboard/bed-summary - Get bed count by status
```

## 📊 Example API Usage

### Update Bed Status
```bash
PATCH /api/lits/MED-01-01/status
Content-Type: application/json

{
  "ID_STATUT": 2,
  "AUTEUR": "inf001",
  "COMMENTAIRE": "Patient admitted"
}
```

### Get Bed History
```bash
GET /api/lits/MED-01-01/history
```

## 🔧 Environment Variables

```env
MONGODB_URI=mongodb://localhost:27017/bed_management
PORT=3000
```

## 🎯 Features

- **Database Migrations**: Version-controlled database changes
- **Real-time Bed Tracking**: Monitor bed status changes
- **Historical Records**: Complete audit trail of status changes
- **Role-based Access**: User permissions by service
- **Service Management**: Capacity tracking and management
- **Dashboard Analytics**: Bed utilization summaries
- **Automatic Timestamps**: Created/updated timestamps for all records
- **Data Validation**: Mongoose schema validation
- **Optimized Queries**: Strategic database indexing

## 🗃️ Sample Data

The initial migrations create:
- 5 hospital sectors (Medicine, Surgery, Emergency, Pediatrics, Maternity)
- 7 services across sectors
- 6 bed statuses (Free, Occupied, To be cleaned, Maintenance, Out of service, Reserved)
- 4 sample users with different roles
- Sample beds for each service (5 per service)

## 🔄 Status Flow

1. **Libre** (Free) → Available for new patients
2. **Occupé** (Occupied) → Patient assigned
3. **À nettoyer** (To be cleaned) → Needs housekeeping
4. **En maintenance** (Maintenance) → Technical issues
5. **Hors service** (Out of service) → Temporarily unavailable
6. **Réservé** (Reserved) → Pre-assigned

## 🛠️ Development

### Key Mongoose Features Used
- **References**: Foreign key relationships between collections
- **Middleware**: Pre-save hooks for automatic updates
- **Virtuals**: Computed properties
- **Static Methods**: Custom query methods
- **Indexes**: Performance optimization
- **Validation**: Data integrity

### Migration System
- **Version Control**: Track database state changes
- **Batch Processing**: Group related migrations
- **Automatic Rollback**: Undo failed migrations
- **Index Management**: Create/drop indexes safely
- **Data Integrity**: Ensure consistent database state

### Performance Optimizations
- Strategic database indexing
- Compound indexes for common queries
- Efficient aggregation pipelines
- Proper MongoDB collection design

## 📝 Next Steps

1. **Authentication & Authorization**: JWT implementation
2. **Real-time Updates**: WebSocket integration
3. **Reporting**: Advanced analytics and reports
4. **Mobile API**: Endpoints for mobile applications
5. **Notifications**: Status change alerts
6. **Data Export**: CSV/Excel export functionality

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Create migrations for database changes: `npm run migrate:make your_change`
4. Commit your changes
5. Push to the branch
6. Create a Pull Request 