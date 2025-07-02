const mongoose = require('mongoose');

const jobApplicationSchema = new mongoose.Schema({
  name: String,
  email: String,
  experience: String,
  message: String,
  resumeFilePath: String,
  status: {
    type: String,
    default: 'Pending' // can be 'Pending', 'Approved', or 'Rejected'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('JobApplication', jobApplicationSchema);