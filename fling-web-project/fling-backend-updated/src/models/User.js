const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const User = sequelize.define('User', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  name: { type: DataTypes.STRING, allowNull: false },
  phone: { type: DataTypes.STRING, allowNull: false, unique: true },
  passwordHash: { type: DataTypes.STRING },
  avatarUrl: { type: DataTypes.STRING },
  // Denormalized balance for fast reads. The Transaction table is the
  // source of truth / audit trail — this column must only ever be
  // mutated inside a DB transaction alongside a Transaction row.
  coinBalance: { type: DataTypes.DECIMAL(12, 2), defaultValue: 0 },

  // KYC — required before cash-out is allowed. Store bank details encrypted
  // at rest in production (e.g. pgcrypto or an app-level encryption layer);
  // plain columns here are for scaffold clarity only.
  kycStatus: {
    type: DataTypes.ENUM('none', 'pending', 'verified', 'rejected'),
    defaultValue: 'none',
  },
  kycVerified: { type: DataTypes.BOOLEAN, defaultValue: false },
  panNumber: { type: DataTypes.STRING },
  bankAccountNumber: { type: DataTypes.STRING },
  ifsc: { type: DataTypes.STRING },
  accountHolderName: { type: DataTypes.STRING },

  // Push notifications
  fcmToken: { type: DataTypes.STRING },
});

module.exports = User;
