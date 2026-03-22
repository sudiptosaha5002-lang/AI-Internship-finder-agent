import mongoose from 'mongoose';

const interviewSchema = new mongoose.Schema({
  role: { type: String, required: true },
  skills: [{ type: String }],
  questions: [{
    text: String,
    type: { type: String, enum: ['Technical', 'Behavioral', 'Project'] },
    userResponse: String,
    evaluation: {
      score: Number,
      feedback: String,
      accuracy: Number,
      clarity: Number
    }
  }],
  overallScore: Number,
  strengths: [String],
  weaknesses: [String],
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model('Interview', interviewSchema);
