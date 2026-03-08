import { Schema, model } from "mongoose";

const aiReportSchema = new Schema(
  {
    competitorId: {
      type: Schema.Types.ObjectId,
      ref: "Competitor",
      required: true,
      index: true,
    },
    snapshotId: {
      type: Schema.Types.ObjectId,
      ref: "CrawlSnapshot",
      required: true,
      index: true,
    },
    reportType: {
      type: String,
      enum: ["baseline"],
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ["pending", "completed", "failed"],
      required: true,
      default: "pending",
      index: true,
    },
    model: {
      type: String,
      default: null,
    },
    promptVersion: {
      type: String,
      default: null,
    },
    payload: {
      type: Schema.Types.Mixed,
      default: null,
    },
    error: {
      type: String,
      default: null,
    },
  },
  {
    versionKey: false,
    timestamps: true,
  },
);

aiReportSchema.index({ snapshotId: 1, reportType: 1 }, { unique: true });

export const AiReportModel = model("AiReport", aiReportSchema);
