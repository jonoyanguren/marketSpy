import { Schema, model } from "mongoose";

const changeReportSchema = new Schema(
  {
    snapshotAId: {
      type: Schema.Types.ObjectId,
      ref: "CrawlSnapshot",
      required: true,
      index: true,
    },
    snapshotBId: {
      type: Schema.Types.ObjectId,
      ref: "CrawlSnapshot",
      required: true,
      index: true,
    },
    competitorId: {
      type: Schema.Types.ObjectId,
      ref: "Competitor",
      required: true,
      index: true,
    },
    requestedUrl: {
      type: String,
      required: true,
      trim: true,
    },
    htmlChanged: { type: Boolean, required: true },
    visibleTextChanged: { type: Boolean, required: true },
    titleDiff: {
      from: String,
      to: String,
    },
    h1Diff: {
      from: Schema.Types.Mixed,
      to: Schema.Types.Mixed,
    },
    visibleTextDiff: {
      added: [String],
      removed: [String],
    },
    aiStatus: {
      type: String,
      enum: ["pending", "completed", "failed"],
      required: true,
      default: "pending",
      index: true,
    },
    aiModel: {
      type: String,
      default: null,
    },
    aiPromptVersion: {
      type: String,
      default: null,
    },
    aiAnalysis: {
      type: Schema.Types.Mixed,
      default: null,
    },
    aiError: {
      type: String,
      default: null,
    },
    detectedAt: {
      type: Date,
      required: true,
      default: () => new Date(),
    },
  },
  {
    versionKey: false,
    timestamps: true,
  },
);

changeReportSchema.index({ competitorId: 1, detectedAt: -1 });

export const ChangeReportModel = model(
  "ChangeReport",
  changeReportSchema,
);
