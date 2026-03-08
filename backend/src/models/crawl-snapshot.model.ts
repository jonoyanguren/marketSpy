import { Schema, model } from "mongoose";

const crawlSnapshotSchema = new Schema(
  {
    requestedUrl: {
      type: String,
      required: true,
      trim: true,
    },
    finalUrl: {
      type: String,
      required: true,
      trim: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    h1: {
      type: String,
      default: null,
      trim: true,
    },
    html: {
      type: String,
      required: true,
    },
    visibleText: {
      type: String,
      required: true,
    },
    htmlLength: {
      type: Number,
      required: true,
    },
    visibleTextLength: {
      type: Number,
      required: true,
    },
    htmlHash: {
      type: String,
      required: true,
      index: true,
    },
    visibleTextHash: {
      type: String,
      required: true,
      index: true,
    },
    crawledAt: {
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

export const CrawlSnapshotModel = model(
  "CrawlSnapshot",
  crawlSnapshotSchema,
);
