
const Tag = require("../models/Tag");
const Activity = require("../models/Activity");

// CREATE TAG
const createTag = async (req, res) => {
    try {
        const { name, color } = req.body;

        if (!name || !name.trim()) {
            return res.status(400).json({
                message: "Tag name is required"
            });
        }

        const existingTag = await Tag.findOne({
            name: name.trim()
        });

        if (existingTag) {
            return res.status(409).json({
                message: "Tag already exists"
            });
        }

        const tag = await Tag.create({
            name: name.trim(),
            color: color || "#3B82F6",
            createdBy: req.user._id
        });

        await Activity.create({
            user: req.user._id,
            action: "CREATE_TAG",
            description: `Created tag: ${tag.name}`
        });

        res.status(201).json({
            message: "Tag created successfully",
            tag
        });

    } catch (error) {
        res.status(500).json({
            message: "Server error",
            error: error.message
        });
    }
};

// GET ALL TAGS
const getTags = async (req, res) => {
    try {
        const tags = await Tag.find().sort({ name: 1 });

        res.status(200).json({
            count: tags.length,
            tags
        });

    } catch (error) {
        res.status(500).json({
            message: "Server error",
            error: error.message
        });
    }
};

module.exports = { createTag, getTags };
