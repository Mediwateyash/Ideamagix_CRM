
const XLSX = require("xlsx");
const mongoose = require("mongoose");

const Lead = require("../models/Lead");
const User = require("../models/user");
const Activity = require("../models/Activity");

const availableFields = {
  name: "Name",
  email: "Email",
  phone: "Phone",
  source: "Source",
  status: "Status",
  assignedAgent: "AssignedAgent",
  tags: "Tags",
  notes: "Notes / Comments",
  createdAt: "CreatedAt",
  updatedAt: "UpdatedAt",
};

// BUILD EXCEL FILTERS
const buildLeadFilter = (req) => {
  const filter = {};

  const {
    search,
    status,
    source,
    assignedTo,
    tag,
    dateFrom,
    dateTo,
  } = req.query;

  // Support agents can only export their own assigned leads
  if (req.user.role === "support_agent") {
    filter.assignedTo = req.user._id;
  } else if (assignedTo === "unassigned") {
    filter.assignedTo = null;
  } else if (
    assignedTo &&
    mongoose.Types.ObjectId.isValid(assignedTo)
  ) {
    filter.assignedTo = assignedTo;
  }

  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: "i" } },
      { email: { $regex: search, $options: "i" } },
      { phone: { $regex: search, $options: "i" } },
    ];
  }

  if (status) {
    filter.status = status;
  }

  if (source) {
    filter.source = { $regex: source, $options: "i" };
  }

  if (tag && mongoose.Types.ObjectId.isValid(tag)) {
    filter.tags = tag;
  }

  if (dateFrom || dateTo) {
    filter.createdAt = {};

    if (dateFrom) {
      filter.createdAt.$gte = new Date(`${dateFrom}T00:00:00.000Z`);
    }

    if (dateTo) {
      filter.createdAt.$lte = new Date(`${dateTo}T23:59:59.999Z`);
    }
  }

  return filter;
};

// IMPORT LEADS
const importLeads = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        message: "Please upload an Excel file.",
      });
    }

    const workbook = XLSX.read(req.file.buffer, {
      type: "buffer",
    });

    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];

    const rows = XLSX.utils.sheet_to_json(worksheet, {
      defval: "",
    });

    if (!rows.length) {
      return res.status(400).json({
        message: "Excel file is empty.",
      });
    }

    const validStatuses = [
      "New",
      "Contacted",
      "Qualified",
      "Lost",
      "Won",
    ];

    const leadsToInsert = [];
    const errors = [];

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];

      const name = String(row.Name || row.name || "").trim();
      const phone = String(row.Phone || row.phone || "").trim();
      const email = String(row.Email || row.email || "").trim();
      const source = String(
        row.Source || row.source || "Excel"
      ).trim();

      const rawStatus = String(
        row.Status || row.status || "New"
      ).trim();

      const status = validStatuses.includes(rawStatus)
        ? rawStatus
        : "New";

      if (!name || !phone) {
        errors.push({
          row: i + 2,
          message: "Name and Phone are required.",
        });
        continue;
      }

      let assignedTo = null;

      const agentId =
        row.AssignedTo ||
        row.assignedTo ||
        row.AssignedAgent ||
        "";

      if (agentId) {
        if (!mongoose.Types.ObjectId.isValid(String(agentId))) {
          errors.push({
            row: i + 2,
            message: "Invalid AssignedTo ID.",
          });
          continue;
        }

        const agent = await User.findOne({
          _id: agentId,
          role: "support_agent",
          isActive: true,
        });

        if (!agent) {
          errors.push({
            row: i + 2,
            message: "Assigned agent not found or inactive.",
          });
          continue;
        }

        assignedTo = agent._id;
      }

      leadsToInsert.push({
        name,
        email,
        phone,
        source,
        status,
        assignedTo,
        createdBy: req.user._id,
      });
    }

    let importedCount = 0;

    if (leadsToInsert.length > 0) {
      const insertedLeads = await Lead.insertMany(leadsToInsert);
      importedCount = insertedLeads.length;

      await Activity.create({
        user: req.user._id,
        action: "IMPORT_LEADS",
        description: `Imported ${importedCount} leads from Excel.`,
      });
    }

    return res.status(200).json({
      message: "Excel import completed.",
      importedCount,
      errorCount: errors.length,
      errors,
    });
  } catch (error) {
    console.error("Excel import error:", error);

    return res.status(500).json({
      message: "Excel import failed.",
      error: error.message,
    });
  }
};

// EXPORT ALL LEADS INCLUDING NOTES
const exportLeads = async (req, res) => {
  try {
    const filter = buildLeadFilter(req);

    const leads = await Lead.find(filter)
      .populate("assignedTo", "name email")
      .populate("tags", "name color")
      .populate("notes.addedBy", "name")
      .sort({ createdAt: -1 })
      .lean();

    const excelData = leads.map((lead) => {
      const notesText = (lead.notes || [])
        .filter((note) => note && note.comment)
        .map((note, index) => {
          const author = note.addedBy?.name || "Unknown User";

          const noteDate = note.createdAt
            ? new Date(note.createdAt).toLocaleString("en-IN")
            : "";

          return (
            `${index + 1}. ${note.comment}\n` +
            `By: ${author}\n` +
            `Date: ${noteDate}`
          );
        })
        .join("\n\n");

      return {
        Name: lead.name || "",
        Email: lead.email || "",
        Phone: lead.phone || "",
        Source: lead.source || "",
        Status: lead.status || "",
        AssignedAgent: lead.assignedTo?.name || "Unassigned",

        Tags: (lead.tags || [])
          .map((tag) => tag.name)
          .join(", "),

        "Notes / Comments": notesText || "No notes",

        CreatedAt: lead.createdAt
          ? new Date(lead.createdAt).toLocaleDateString("en-IN")
          : "",

        UpdatedAt: lead.updatedAt
          ? new Date(lead.updatedAt).toLocaleDateString("en-IN")
          : "",
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(excelData, {
      header: Object.values(availableFields),
    });

    // Column widths
    worksheet["!cols"] = [
      { wch: 22 },
      { wch: 28 },
      { wch: 18 },
      { wch: 18 },
      { wch: 15 },
      { wch: 22 },
      { wch: 22 },
      { wch: 60 },
      { wch: 18 },
      { wch: 18 },
    ];

    // Enable wrapping for notes cells
    for (let row = 1; row <= excelData.length; row++) {
      const cellAddress = XLSX.utils.encode_cell({
        r: row,
        c: 7,
      });

      if (worksheet[cellAddress]) {
        worksheet[cellAddress].s = {
          alignment: {
            wrapText: true,
            vertical: "top",
          },
        };
      }
    }

    const workbook = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(
      workbook,
      worksheet,
      "CRM Leads"
    );

    const buffer = XLSX.write(workbook, {
      type: "buffer",
      bookType: "xlsx",
    });

    res.setHeader(
      "Content-Disposition",
      'attachment; filename="CRM_Leads.xlsx"'
    );

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );

    return res.status(200).send(buffer);
  } catch (error) {
    console.error("Excel export error:", error);

    return res.status(500).json({
      message: "Excel export failed.",
      error: error.message,
    });
  }
};

module.exports = {
  importLeads,
  exportLeads,
};
