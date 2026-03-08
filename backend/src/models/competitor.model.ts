import { Schema, model } from "mongoose";

const competitorSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    domain: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      index: true,
    },
    active: {
      type: Boolean,
      required: true,
      default: true,
    },
    urls: {
      type: [String],
      default: () => [],
    },
  },
  {
    versionKey: false,
    timestamps: true,
  },
);

competitorSchema.index({ domain: 1 }, { unique: true });

export const CompetitorModel = model("Competitor", competitorSchema);
