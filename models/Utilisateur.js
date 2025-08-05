const mongoose = require("mongoose");

const utilisateurSchema = new mongoose.Schema(
  {
    ID_UTILISATEUR: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    NOM: {
      type: String,
      required: true,
      trim: true,
    },
    ROLE: {
      type: String,
      required: true,
      enum: [
        "Admin",
        "User",
        "Viewer",
        "Manager",
        "Agent d'entretien",
        "Responsabled'entretien",
      ],
      default: "User",
    },
    SERVICES_AUTORISES: [
      {
        type: String,
        ref: "Service",
      },
    ],
    ACTIF: {
      type: Boolean,
      default: true,
      required: true,
    },
    EMAIL: {
      type: String,
      trim: true,
      lowercase: true,
      unique: true,
      sparse: true, // Allow multiple null values
    },
    password: {
      type: String,
      required: true,
      default: "password123",
      minlength: 6,
    },
    FORCE_PASSWORD_CHANGE: {
      type: Boolean,
      default: true,
      required: true,
    },
    DERNIERE_CONNEXION: {
      type: Date,
    },
  },
  {
    timestamps: true,
    collection: "utilisateurs",
  }
);

// Transform function to exclude password when converting to JSON
utilisateurSchema.set("toJSON", {
  transform: function (doc, ret) {
    delete ret.password;
    return ret;
  },
});

// Indexes for better performance
utilisateurSchema.index({ ROLE: 1 });
utilisateurSchema.index({ ACTIF: 1 });
utilisateurSchema.index({ SERVICES_AUTORISES: 1 });
utilisateurSchema.index({ FORCE_PASSWORD_CHANGE: 1 });

// Virtual to check if user has admin role
utilisateurSchema.virtual("isAdmin").get(function () {
  return this.ROLE === "Admin";
});

// Method to check if user has access to a specific service
utilisateurSchema.methods.hasAccessToService = function (serviceId) {
  if (this.ROLE === "Admin") return true;
  return this.SERVICES_AUTORISES.includes(serviceId);
};

// Method to update last login
utilisateurSchema.methods.updateLastLogin = function () {
  this.DERNIERE_CONNEXION = new Date();
  return this.save();
};

// Method to change password and clear force password change flag
utilisateurSchema.methods.changePassword = function (newPassword) {
  this.password = newPassword;
  this.FORCE_PASSWORD_CHANGE = false;
  return this.save();
};

module.exports = mongoose.model("Utilisateur", utilisateurSchema);
