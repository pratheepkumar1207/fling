const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

/// Every coin movement (buy, gift sent/received, cash-out) gets a row here.
/// Never mutate User.coinBalance without also writing one of these —
/// this table is what you reconcile against if numbers ever look wrong.
const Transaction = sequelize.define('Transaction', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  userId: { type: DataTypes.UUID, allowNull: false },
  type: {
    type: DataTypes.ENUM('buy', 'gift_sent', 'gift_received', 'cashout_requested', 'cashout_paid'),
    allowNull: false,
  },
  coins: { type: DataTypes.DECIMAL(12, 2), allowNull: false },
  rupees: { type: DataTypes.DECIMAL(12, 2) }, // relevant for buy/cashout rows
  relatedRoomId: { type: DataTypes.UUID },
  relatedUserId: { type: DataTypes.UUID }, // counterparty for gifts
  razorpayOrderId: { type: DataTypes.STRING },
  razorpayPaymentId: { type: DataTypes.STRING },
  status: {
    type: DataTypes.ENUM('pending', 'completed', 'failed'),
    defaultValue: 'pending',
  },
});

module.exports = Transaction;
