const moongoose = require('mongoose');

const schema = moongoose.Schema;

const findingSchema = new schema({
    title: String,
    description: String,
    severity: {
        type: String,
        enum: ["Low", "Medium", "High", "Critical"]
    },
    recommendation: String
});

const scanSchema = new schema({
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
        enum: ['domain', 'ip', 'url'],
        required: true,
    },

    status: {
        type: String,
        enum: ['pending', 'completed', 'failed', 'ongoing'],
        default: "pending"
    },

    ports: {
        // port: Number,
        // service: String,
        // state: String
    },

    ssl: {
        // issuer: String,
        // validFrom: Date,
        // validTo: Date,
        // expiresInDays: Number
    },

    findings: [],

    riskScore: {
        type: Number,
        default: 0
    },

}, { timestamps: true });

module.exports = moongoose.model( 'Scan', scanSchema);  