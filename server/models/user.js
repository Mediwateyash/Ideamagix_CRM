const mongoose = require("mongoose")

const userSchema = new mongoose.Schema(
    {
        name:{
            type:String,
            require:true,
            trim:true
        },
        email:{
            type:String,
            require:true,
            unique:true,
            trim:true
        }, 
        password: {
            type: String,
            required: true,
            select: false
        },

        role: {
            type: String,
            enum: ["super_admin", "sub_admin", "support_agent"],
            default: "support_agent"
        },

        isActive: {
            type: Boolean,
            default: true
        }
    },
    {
        timestamps: true
    }
);

const User = mongoose.model("User", userSchema);

module.exports = User;

    