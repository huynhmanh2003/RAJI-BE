const express = require("express");
const router = express.Router();
const asyncHandler = require("express-async-handler");
const groupController = require("../controllers/group.controller");
const authMiddleware = require("../middleware/auth.middleware");

router.use(authMiddleware);

router.get("/", asyncHandler(groupController.getAllGroups));
router.get("/:id", asyncHandler(groupController.getGroup));
router.post("/", asyncHandler(groupController.createGroup));
router.patch("/:id", asyncHandler(groupController.updateGroup));
router.delete("/:id", asyncHandler(groupController.deleteGroup));
router.post("/:id/members", asyncHandler(groupController.addMembers));

module.exports = router;
