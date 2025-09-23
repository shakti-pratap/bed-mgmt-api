const mongoose = require("mongoose");

const litSchema = new mongoose.Schema(
  {
    ID_LIT: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    ID_SERVICE: {
      type: String,
      required: true,
      ref: "Service",
    },
    ID_STATUT: {
      type: Number,
      required: true,
      ref: "Statut",
    },
    SUB_ID_STATUT: {
      type: Number,
      ref: "Statut",
      default: null,
    },
    MAJ_STATUT: {
      type: Date,
      default: Date.now,
    },
    CLEANING_DATE: {
      type: Date,
      default: null,
    },
    MAINTENANCE_DATE: {
      type: Date,
      default: null,
    },
    RESERVED_DATE: {
      type: Date,
      default: null,
    },
    ACTIF: {
      type: Boolean,
      default: true,
      required: true,
    },
    GENDER: {
      type: String,
      default: "",
    },
    isEmergency: {
      type: Boolean,
      default: false,
      required: true,
    },
  },
  {
    timestamps: true,
    collection: "lits",
  }
);

// Indexes for better performance
litSchema.index({ ID_SERVICE: 1 });
litSchema.index({ ID_STATUT: 1 });
litSchema.index({ ACTIF: 1 });
litSchema.index({ isEmergency: 1 });
litSchema.index({ MAJ_STATUT: -1 }); // Most recent first

// Compound indexes for common queries
litSchema.index({ ID_SERVICE: 1, ACTIF: 1 });
litSchema.index({ ID_SERVICE: 1, ID_STATUT: 1 });

// Middleware to update MAJ_STATUT when ID_STATUT changes
litSchema.pre("save", function (next) {
  if (this.isModified("ID_STATUT")) {
    this.MAJ_STATUT = new Date();
  }
  next();
});

module.exports = mongoose.model("Lit", litSchema);
