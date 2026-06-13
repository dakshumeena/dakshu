const express = require("express");
const router = express.Router();
const protect = require("../middleware/authMiddleware");
const sendEmail = require("../utils/sendEmail");

// GET /api/test/email?to=someone@gmail.com
// Use this route to verify your email config is working
router.get("/email", protect, async (req, res) => {
  const to = req.query.to || req.user?.email;
  if (!to) {
    return res.status(400).json({ success: false, message: "Provide ?to=email in query" });
  }
  try {
    await sendEmail({
      to,
      subject: "ProjectFlow — Email Test ✅",
      html: `
        <h2>Email is working!</h2>
        <p>Your ProjectFlow email configuration is set up correctly.</p>
        <p>You can now send invitations.</p>
      `,
    });
    res.json({ success: true, message: `Test email sent to ${to}` });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;