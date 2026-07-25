import { model, models, Schema, type InferSchemaType, type Model } from "mongoose";

const faqSchema = new Schema(
  {
    question: {
      type: String,
      required: true,
      trim: true,
    },
    answer: {
      type: String,
      required: true,
      trim: true,
    },
    active: {
      type: Boolean,
      required: true,
      default: true,
    },
    order: {
      type: Number,
      required: true,
      min: 1,
    },
    seedKey: {
      type: String,
      required: false,
      trim: true,
    },
    createdBy: {
      type: String,
      required: true,
      trim: true,
    },
    updatedBy: {
      type: String,
      required: true,
      trim: true,
    },
  },
  {
    collection: "faqs",
    timestamps: true,
  },
);

faqSchema.index({ order: 1, updatedAt: -1 });
faqSchema.index(
  { seedKey: 1 },
  {
    unique: true,
    partialFilterExpression: {
      seedKey: { $type: "string" },
    },
  },
);

export type FaqDocument = InferSchemaType<typeof faqSchema>;

function createFaqModel(): Model<FaqDocument> {
  if (process.env.NODE_ENV === "production") {
    return (models.Faq as Model<FaqDocument> | undefined) ?? model<FaqDocument>("Faq", faqSchema);
  }

  delete models.Faq;

  return model<FaqDocument>("Faq", faqSchema);
}

export const FaqModel = createFaqModel();
