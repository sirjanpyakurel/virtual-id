const express = require("express");
const cors = require("cors");
const sgMail = require("@sendgrid/mail");
require("dotenv").config();

const app = express();
app.use(express.json());
app.use(cors());

// In-memory storage for OTPs (in production, use a database)
const otpStore = new Map();

// Check if SendGrid API key is available
if (!process.env.SENDGRID_API_KEY) {
  console.error("SENDGRID_API_KEY is not set in .env file");
  process.exit(1);
}

// Initialize SendGrid with API key
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

app.post("/send-otp", async (req, res) => {
  const { email } = req.body;
  
  if (!email) {
    return res.status(400).json({ error: "Email is required" });
  }

  const otp = Math.floor(100000 + Math.random() * 900000); // Generate 6-digit OTP
  
  // Store OTP with expiration (10 minutes)
  otpStore.set(email, {
    otp,
    expiresAt: Date.now() + 10 * 60 * 1000 // 10 minutes
  });

  const msg = {
    to: email,
    from: process.env.SENDGRID_FROM_EMAIL || 'your-verified-sender@example.com',
    subject: 'Your Virtual ID Card OTP',
    text: `Your OTP code is: ${otp}. This code will expire in 10 minutes.`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #003366;">Virtual ID Card Verification</h2>
        <p>Your OTP code is: <strong style="font-size: 24px; color: #003366;">${otp}</strong></p>
        <p>This code will expire in 10 minutes.</p>
        <p>If you didn't request this code, please ignore this email.</p>
      </div>
    `,
  };

  try {
    await sgMail.send(msg);
    console.log('OTP email sent successfully to:', email);
    res.status(200).json({ 
      message: "OTP sent successfully!"
    });
  } catch (error) {
    console.error('Error sending OTP:', error);
    if (error.response) {
      res.status(500).json({ 
        error: "Failed to send OTP",
        details: error.response.body.errors
      });
    } else {
      res.status(500).json({ 
        error: "Failed to send OTP",
        details: error.message
      });
    }
  }
});

app.post("/verify-otp", (req, res) => {
  const { email, otp } = req.body;
  console.log('Received OTP verification request:', { email, otp });
  
  if (!email || !otp) {
    console.log('Missing email or OTP');
    return res.status(400).json({ error: "Email and OTP are required" });
  }

  const storedData = otpStore.get(email);
  console.log('Stored OTP data:', storedData);
  
  if (!storedData) {
    console.log('No OTP found for email:', email);
    return res.status(400).json({ error: "No OTP found. Please request a new OTP." });
  }

  if (Date.now() > storedData.expiresAt) {
    console.log('OTP expired for email:', email);
    otpStore.delete(email);
    return res.status(400).json({ error: "OTP has expired. Please request a new OTP." });
  }

  if (storedData.otp !== parseInt(otp)) {
    console.log('Invalid OTP for email:', email);
    return res.status(400).json({ error: "Invalid OTP. Please try again." });
  }

  console.log('OTP verified successfully for email:', email);
  // Clear the OTP after successful verification
  otpStore.delete(email);
  res.status(200).json({ message: "OTP verified successfully" });
});

app.get("/test", (req, res) => {
  res.json({ message: "Server is running!" });
});

const PORT = process.env.PORT || 5002;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
