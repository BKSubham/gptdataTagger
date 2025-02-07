import mongoose, { Schema, model, models } from "mongoose";

const ThreatSchema = new Schema({
  name: String,
  description: String,
  tags: [String],
  created_at: Date,
});

export const Threat = models.Threat || model("Threat", ThreatSchema);
