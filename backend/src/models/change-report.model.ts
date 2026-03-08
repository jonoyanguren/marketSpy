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
