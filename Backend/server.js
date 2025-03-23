const express = require("express");
const cors = require("cors");
const sgMail = require("@sendgrid/mail");
const { createPassClass, createPassObject, generateSaveUrl } = require('./googleWallet');
require("dotenv").config();

const app = express();

// Configure CORS
const corsOptions = {
  origin: ['https://virtual-id-frontend.onrender.com', 'http://localhost:3000'],
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type'],
  credentials: true
};

app.use(cors(corsOptions));
app.use(express.json());

// In-memory storage for OTPs (in production, use a database)
const otpStore = new Map();

// Check if SendGrid API key is available
if (!process.env.SENDGRID_API_KEY) {
  console.error("SENDGRID_API_KEY is not set in .env file");
  process.exit(1);
}

// Initialize SendGrid with API key
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

// Log environment variables on server start
console.log('Server Configuration:');
console.log('- SendGrid API Key:', process.env.SENDGRID_API_KEY ? 'Configured' : 'Missing');
console.log('- Wallet Issuer ID:', process.env.GOOGLE_WALLET_ISSUER_ID ? 'Configured' : 'Missing');
console.log('- Service Account:', process.env.GOOGLE_WALLET_SERVICE_ACCOUNT_EMAIL ? 'Configured' : 'Missing');

app.post("/send-otp", async (req, res) => {
  const { email } = req.body;
  
  if (!email) {
    return res.status(400).json({ error: "Email is required" });
  }

  const otp = Math.floor(100000 + Math.random() * 900000);
  
  otpStore.set(email, {
    otp,
    expiresAt: Date.now() + 10 * 60 * 1000
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
    res.status(200).json({ message: "OTP sent successfully!" });
  } catch (error) {
    console.error('Failed to send OTP:', error.response?.body?.errors || error.message);
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
  
  if (!email || !otp) {
    return res.status(400).json({ error: "Email and OTP are required" });
  }

  const storedData = otpStore.get(email);
  
  if (!storedData) {
    return res.status(400).json({ error: "No OTP found. Please request a new OTP." });
  }

  if (Date.now() > storedData.expiresAt) {
    otpStore.delete(email);
    return res.status(400).json({ error: "OTP has expired. Please request a new OTP." });
  }

  if (storedData.otp !== parseInt(otp)) {
    return res.status(400).json({ error: "Invalid OTP. Please try again." });
  }

  otpStore.delete(email);
  res.status(200).json({ message: "OTP verified successfully" });
});

app.post("/send-id-card", async (req, res) => {
  const { email, studentData } = req.body;
  
  if (!email || !studentData) {
    return res.status(400).json({ error: "Email and student data are required" });
  }

  try {
    let walletUrl = null;
    let walletMessage = null;
    
    // Debug log the incoming data
    console.log('Received request to send ID card:', {
      email,
      studentName: studentData.name,
      studentId: studentData.studentId
    });
    
    // Check if the email is a Gmail account
    const isGmail = email.toLowerCase().endsWith('@gmail.com');
    console.log('Is Gmail account:', isGmail);
    
    // Debug log the environment variables
    console.log('Checking Wallet credentials:', {
      hasIssuerId: !!process.env.GOOGLE_WALLET_ISSUER_ID,
      hasServiceAccountEmail: !!process.env.GOOGLE_WALLET_SERVICE_ACCOUNT_EMAIL,
      hasServiceAccount: !!process.env.GOOGLE_WALLET_SERVICE_ACCOUNT,
      issuerIdValue: process.env.GOOGLE_WALLET_ISSUER_ID,
      serviceAccountEmail: process.env.GOOGLE_WALLET_SERVICE_ACCOUNT_EMAIL
    });

    // First critical issue: Check if we have the required Wallet functions
    if (typeof createPassClass !== 'function' || typeof createPassObject !== 'function' || typeof generateSaveUrl !== 'function') {
      console.error('Wallet functions not properly imported:', {
        hasCreatePassClass: typeof createPassClass === 'function',
        hasCreatePassObject: typeof createPassObject === 'function',
        hasGenerateSaveUrl: typeof generateSaveUrl === 'function'
      });
      walletMessage = "Wallet integration is currently unavailable.";
    } else if (process.env.GOOGLE_WALLET_ISSUER_ID && process.env.GOOGLE_WALLET_SERVICE_ACCOUNT_EMAIL && process.env.GOOGLE_WALLET_SERVICE_ACCOUNT) {
      if (isGmail) {
        try {
          console.log('Starting Wallet pass creation...');
          await createPassClass();
          console.log('Pass class created, creating pass object...');
          await createPassObject(studentData);
          console.log('Pass object created, generating save URL...');
          walletUrl = generateSaveUrl(studentData);
          console.log('Wallet URL generated:', walletUrl);
        } catch (walletError) {
          console.error('Wallet integration failed:', {
            error: walletError.message,
            details: walletError.response?.data,
            stack: walletError.stack
          });
          walletMessage = "Unable to generate Wallet pass. Please try again later.";
        }
      } else {
        console.log('Non-Gmail account, skipping Wallet integration');
        walletMessage = "Wallet feature is currently available only for Gmail accounts in demo mode.";
      }
    } else {
      console.log('Missing Wallet credentials');
      walletMessage = "Wallet integration is not configured.";
    }

    // Debug log before creating email
    console.log('Preparing email with Wallet status:', {
      hasWalletUrl: !!walletUrl,
      walletMessage
    });

    const avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(studentData.name)}&background=003366&color=fff&size=200&bold=true&font-size=0.5`;

    const msg = {
      to: email,
      from: process.env.SENDGRID_FROM_EMAIL || 'your-verified-sender@example.com',
      subject: 'Your Tennessee State University ID Card',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #003366; text-align: center;">Tennessee State University</h2>
          <h3 style="color: #003366; text-align: center;">Student ID Card</h3>
          
          <div style="background: #f8f9fa; padding: 20px; border-radius: 10px; margin: 20px 0;">
            <div style="display: flex; gap: 20px; margin-bottom: 20px;">
              <div style="flex: 0 0 120px;">
                <img src="${avatarUrl}" 
                     alt="${studentData.name}" 
                     style="width: 100%; height: 120px; border-radius: 5px; border: 2px solid #003366; object-fit: cover; background-color: #003366;">
              </div>
              <div style="flex: 1;">
                <p><strong>Name:</strong> ${studentData.name}</p>
                <p><strong>ID Number:</strong> ${studentData.studentId}</p>
                <p><strong>Major:</strong> ${studentData.major}</p>
              </div>
            </div>
            
            <div style="text-align: center; margin: 20px 0;">
              <img src="${studentData.barcodeUrl}" 
                   alt="Student ID Barcode" 
                   style="max-width: 60%; height: auto;">
            </div>
            
            <div style="text-align: center; color: #666; font-size: 0.9em;">
              <p>Valid through: 2024-2025</p>
            </div>
          </div>
          
          <div style="text-align: center; margin: 20px 0;">
            ${walletUrl ? `
              <a href="${walletUrl}" 
                 style="display: inline-block; 
                        text-decoration: none;
                        background-color: #4285f4;
                        color: white;
                        padding: 12px 24px;
                        border-radius: 8px;
                        font-weight: 500;
                        font-size: 16px;
                        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                        transition: all 0.3s ease;">
                Add to Wallet
              </a>
            ` : walletMessage ? `
              <p style="color: #666; font-style: italic;">${walletMessage}</p>
            ` : ''}
          </div>
          
          <p style="color: #666; font-size: 0.9em; text-align: center;">
            This is an official document. Please keep it safe and present it when required.
          </p>
        </div>
      `,
    };

    // Debug log before sending email
    console.log('Sending email with configuration:', {
      to: email,
      from: msg.from,
      hasWalletButton: !!walletUrl,
      walletMessage: walletMessage || 'None'
    });

    await sgMail.send(msg);
    console.log('Email sent successfully');
    
    res.status(200).json({ 
      message: "ID card sent successfully!",
      walletUrl: walletUrl,
      walletMessage: walletMessage
    });
  } catch (error) {
    console.error('Failed to send ID card:', {
      error: error.message,
      stack: error.stack,
      sendgridErrors: error.response?.body?.errors
    });
    if (error.response) {
      res.status(500).json({ 
        error: "Failed to send ID card",
        details: error.response.body.errors
      });
    } else {
      res.status(500).json({ 
        error: "Failed to send ID card",
        details: error.message
      });
    }
  }
});

app.get("/test", (req, res) => {
  res.json({ message: "Server is running!" });
});

app.get("/test-wallet", async (req, res) => {
  try {
    if (process.env.GOOGLE_WALLET_ISSUER_ID && process.env.GOOGLE_WALLET_SERVICE_ACCOUNT_EMAIL && process.env.GOOGLE_WALLET_SERVICE_ACCOUNT) {
      await createPassClass();
      res.json({ 
        status: 'success',
        message: 'Wallet credentials are properly configured',
        issuerId: process.env.GOOGLE_WALLET_ISSUER_ID,
        serviceAccountEmail: process.env.GOOGLE_WALLET_SERVICE_ACCOUNT_EMAIL
      });
    } else {
      res.status(400).json({
        status: 'error',
        message: 'Missing Wallet credentials',
        missing: {
          issuerId: !process.env.GOOGLE_WALLET_ISSUER_ID,
          serviceAccountEmail: !process.env.GOOGLE_WALLET_SERVICE_ACCOUNT_EMAIL,
          serviceAccount: !process.env.GOOGLE_WALLET_SERVICE_ACCOUNT
        }
      });
    }
  } catch (error) {
    console.error('Wallet test failed:', error.response?.data || error.message);
    res.status(500).json({
      status: 'error',
      message: 'Error testing Wallet integration',
      error: error.message
    });
  }
});

const PORT = process.env.PORT || 5002;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
