
const mongoose = require("mongoose");

const leadSchema = new mongoose.Schema(
    {
        // Customer information
        name: {
            type: String,
            required: true,
            trim: true
        },

        email: {
            type: String,
            lowercase: true,
            trim: true
        },

        phone: {
            type: String,
            required: true,
            trim: true
        },

        // Lead source
        source: {
            type: String,
            default: "Manual",
            trim: true
        },

        // Lead status
        status: {
            type: String,
            enum: ["New", "Contacted", "Qualified", "Lost", "Won"],
            default: "New"
        },

        // Assigned support agent
        assignedTo: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null
        },

        // User who created the lead
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        // Lead tags
        tags: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Tag"
            }
        ],

        // Notes and comments
        notes: [
            {
                comment: {
                    type: String,
                    required: true,
                    trim: true
                },

                addedBy: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: "User"
                },

                createdAt: {
                    type: Date,
                    default: Date.now
                }
            }
        ]
    },
    {
        timestamps: true
    }
);

const Lead = mongoose.model("Lead", leadSchema);

module.exports = Lead;
