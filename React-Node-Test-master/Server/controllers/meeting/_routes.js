const express = require("express");
const meeting = require("./meeting");
const router = express.Router();
const auth = require("../../middelwares/auth");

// Get all meeting history records (with some filtering)
router.get("/", auth, meeting.index);

// View specific meeting history
router.get("/:id", auth, meeting.view);

// Delete single meeting history
router.delete("/:id", auth, meeting.deleteData);

// Delete many meeting history records
router.get("/all/:id", auth, meeting.deleteMany);

// Add new meeting history
router.post("/", auth, meeting.add);

module.exports = router;
