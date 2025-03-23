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
console.log('Server starting with environment variables:');
console.log('GOOGLE_WALLET_ISSUER_ID:', process.env.GOOGLE_WALLET_ISSUER_ID ? 'Present' : 'Missing');
console.log('GOOGLE_WALLET_SERVICE_ACCOUNT_EMAIL:', process.env.GOOGLE_WALLET_SERVICE_ACCOUNT_EMAIL ? 'Present' : 'Missing');
console.log('GOOGLE_WALLET_SERVICE_ACCOUNT:', process.env.GOOGLE_WALLET_SERVICE_ACCOUNT ? 'Present' : 'Missing');

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

app.post("/send-id-card", async (req, res) => {
  const { email, studentData } = req.body;
  
  if (!email || !studentData) {
    return res.status(400).json({ error: "Email and student data are required" });
  }

  try {
    let walletUrl = null;
    
    // Log the environment variables (without sensitive data)
    console.log('Checking Google Wallet credentials...');
    console.log('GOOGLE_WALLET_ISSUER_ID:', process.env.GOOGLE_WALLET_ISSUER_ID ? 'Present' : 'Missing');
    console.log('GOOGLE_WALLET_SERVICE_ACCOUNT_EMAIL:', process.env.GOOGLE_WALLET_SERVICE_ACCOUNT_EMAIL ? 'Present' : 'Missing');
    console.log('GOOGLE_WALLET_SERVICE_ACCOUNT:', process.env.GOOGLE_WALLET_SERVICE_ACCOUNT ? 'Present' : 'Missing');
    
    // Only try to create Google Wallet pass if credentials are available
    if (process.env.GOOGLE_WALLET_ISSUER_ID && process.env.GOOGLE_WALLET_SERVICE_ACCOUNT_EMAIL && process.env.GOOGLE_WALLET_SERVICE_ACCOUNT) {
      try {
        console.log('Creating Google Wallet pass...');
        await createPassClass();
        await createPassObject(studentData);
        walletUrl = generateSaveUrl(studentData);
        console.log('Google Wallet pass created successfully with URL:', walletUrl);
      } catch (walletError) {
        console.error('Error creating Google Wallet pass:', walletError);
        // Continue without Google Wallet integration
      }
    } else {
      console.log('Google Wallet credentials not found, skipping pass creation');
      console.log('Missing credentials:', {
        issuerId: !process.env.GOOGLE_WALLET_ISSUER_ID,
        serviceAccountEmail: !process.env.GOOGLE_WALLET_SERVICE_ACCOUNT_EMAIL,
        serviceAccount: !process.env.GOOGLE_WALLET_SERVICE_ACCOUNT
      });
    }

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
              <div style="flex: 0 0 150px;">
                <img src="${studentData.imageUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(studentData.name)}&background=003366&color=fff&size=200`}" 
                     alt="${studentData.name}" 
                     style="width: 100%; border-radius: 5px; border: 2px solid #003366;">
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
          
          ${walletUrl ? `
            <div style="text-align: center; margin: 20px 0;">
              <a href="${walletUrl}" 
                 style="display: inline-block; 
                        text-decoration: none;">
                <img src="https://developers.google.com/static/wallet/images/passes/add-to-google-wallet-button.png" 
                     alt="Add to Google Wallet" 
                     style="height: 40px; width: auto;">
              </a>
            </div>
          ` : ''}
          
          <p style="color: #666; font-size: 0.9em; text-align: center;">
            This is an official document. Please keep it safe and present it when required.
          </p>
        </div>
      `,
    };

    await sgMail.send(msg);
    console.log('ID card email sent successfully to:', email);
    res.status(200).json({ 
      message: "ID card sent successfully!"
    });
  } catch (error) {
    console.error('Error sending ID card:', error);
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

const PORT = process.env.PORT || 5002;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
