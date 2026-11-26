
const mongoose = require("mongoose");

const leadSchema = new mongoose.Schema(
    {
      
        name: {
            type: String,
            required: true,
            trim: true
        },

        email: {
            type: String,
            trim: true,
            lowercase: true
        },

        phone: {
            type: String,
            required: true,
            trim: true
        },

    
        source: {
            type: String,
            default: "Manual"
        },

        status: {
            type: String,
            enum: ["New", "Contacted", "Qualified", "Lost", "Won"],
            default: "New"
        },

        assignedTo: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null
        },

        tags: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Tag"
            }
        ],

        notes: [
            {
                comment: {
                    type: String,
                    required: true
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
