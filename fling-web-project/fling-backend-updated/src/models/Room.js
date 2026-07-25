const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Room = sequelize.define('Room', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  hostId: { type: DataTypes.UUID, allowNull: false },
  title: { type: DataTypes.STRING, allowNull: false },
  sourceType: { type: DataTypes.ENUM('youtube', 'drive'), allowNull: false },
  videoUrl: { type: DataTypes.STRING, allowNull: false },
  isCallActive: { type: DataTypes.BOOLEAN, defaultValue: false },
});

module.exports = Room;
