const moongoose = require("mongoose");

const schema = moongoose.Schema;

const findingSchema = new schema(
  {
    _id: false,
    source: {
      type: String,
    },
    category: {
      type: String,
    },
    title: {
      type: String,
    },
    severity: {
      type: String,
      enum: ["Info", "Low", "Medium", "High", "Critical"],
    },
    description: {
      type: String,
    },
    recommendation: {
      type: String,
    },
  },
);

const scanSchema = new schema(
  {
    // user: {
    //     type: moongoose.Types.ObjectId,
    //     ref: 'User',
    //     required: true
    // },

    target: {
      type: String,
      required: true,
    },

    targetType: {
      type: String,
      enum: ["domain", "ip", "url"],
      required: true,
    },

    status: {
      type: String,
      enum: ["pending", "completed", "failed", "ongoing"],
      default: "pending",
    },

    ports: [
      {
        _id: false,
        port: Number,
        state: String,
        service: String,
      },
    ],

    ssl: {
      // issuer: String,
      // validFrom: Date,
      // validTo: Date,
      // expiresInDays: Number
    },

    findings: [findingSchema],

    riskScore: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true },
);

module.exports = moongoose.model("Scan", scanSchema);
