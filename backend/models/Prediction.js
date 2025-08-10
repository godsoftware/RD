const mongoose = require('mongoose');

const predictionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  inputData: {
    type: mongoose.Schema.Types.Mixed,
    required: [true, 'Input data is required']
  },
  result: {
    prediction: {
      type: Number,
      required: true
    },
    confidence: {
      type: Number,
      required: true,
      min: 0,
      max: 1
    },
    category: {
      type: String,
      required: false
    }
  },
  modelVersion: {
    type: String,
    required: true,
    default: '1.0'
  },
  processingTime: {
    type: Number, // in milliseconds
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed'],
    default: 'pending'
  },
  errorMessage: {
    type: String,
    required: false
  },
  metadata: {
    ipAddress: String,
    userAgent: String,
    fileSize: Number,
    fileName: String
  }
}, {
  timestamps: true
});

// Index for better query performance
predictionSchema.index({ user: 1, createdAt: -1 });
predictionSchema.index({ status: 1 });
predictionSchema.index({ createdAt: -1 });

// Virtual for formatted date
predictionSchema.virtual('formattedDate').get(function() {
  return this.createdAt.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
});

// Static method to get user predictions with pagination
predictionSchema.statics.getUserPredictions = function(userId, page = 1, limit = 10) {
  const skip = (page - 1) * limit;
  return this.find({ user: userId })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .populate('user', 'username email');
};

// Static method to get prediction statistics
predictionSchema.statics.getStats = function(userId) {
  return this.aggregate([
    { $match: { user: mongoose.Types.ObjectId(userId) } },
    {
      $group: {
        _id: null,
        totalPredictions: { $sum: 1 },
        avgConfidence: { $avg: '$result.confidence' },
        successfulPredictions: {
          $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
        }
      }
    }
  ]);
};

// Instance method to mark as completed
predictionSchema.methods.markCompleted = function(result, processingTime) {
  this.result = result;
  this.processingTime = processingTime;
  this.status = 'completed';
  return this.save();
};

// Instance method to mark as failed
predictionSchema.methods.markFailed = function(errorMessage) {
  this.status = 'failed';
  this.errorMessage = errorMessage;
  return this.save();
};

module.exports = mongoose.model('Prediction', predictionSchema);
