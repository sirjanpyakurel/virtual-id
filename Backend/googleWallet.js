const { GoogleAuth } = require('google-auth-library');
const jwt = require('jsonwebtoken');

// Your Google Wallet issuer ID (get this from Google Cloud Console)
const ISSUER_ID = process.env.GOOGLE_WALLET_ISSUER_ID;
const SERVICE_ACCOUNT_EMAIL = process.env.GOOGLE_WALLET_SERVICE_ACCOUNT_EMAIL;

// Log configuration (without sensitive data)
console.log('Google Wallet Configuration:');
console.log('ISSUER_ID:', ISSUER_ID);
console.log('SERVICE_ACCOUNT_EMAIL:', SERVICE_ACCOUNT_EMAIL);

// Initialize Google Auth client with service account credentials
const auth = new GoogleAuth({
  credentials: JSON.parse(process.env.GOOGLE_WALLET_SERVICE_ACCOUNT),
  scopes: ['https://www.googleapis.com/auth/wallet_object.issuer']
});

// Create a Generic pass class for student ID
async function createPassClass() {
  const client = await auth.getClient();
  const genericClass = {
    id: `${ISSUER_ID}.student_id_class`,
    classTemplate: {
      cardTitle: {
        defaultValue: {
          language: 'en-US',
          value: 'Tennessee State University'
        }
      },
      subheader: {
        defaultValue: {
          language: 'en-US',
          value: 'Student ID'
        }
      },
      logo: {
        sourceUri: {
          uri: 'https://virtual-id-frontend.onrender.com/tiger.png'
        }
      },
      hexBackgroundColor: '#003366',
    }
  };

  try {
    console.log('Creating pass class with ID:', genericClass.id);
    const response = await client.request({
      url: 'https://walletobjects.googleapis.com/walletobjects/v1/genericClass',
      method: 'POST',
      data: genericClass
    });
    console.log('Pass class created successfully');
    return response.data;
  } catch (error) {
    console.error('Error creating pass class:', error.response?.data || error.message);
    throw error;
  }
}

// Create a Generic pass object for a specific student
async function createPassObject(student) {
  const client = await auth.getClient();
  const objectId = `${ISSUER_ID}.student_id_${student.studentId}`;
  const genericObject = {
    id: objectId,
    classId: `${ISSUER_ID}.student_id_class`,
    genericType: 'GENERIC_TYPE_UNSPECIFIED',
    hexBackgroundColor: '#003366',
    logo: {
      sourceUri: {
        uri: 'https://virtual-id-frontend.onrender.com/tiger.png'
      }
    },
    cardTitle: {
      defaultValue: {
        language: 'en-US',
        value: 'Tennessee State University'
      }
    },
    subheader: {
      defaultValue: {
        language: 'en-US',
        value: 'Student ID'
      }
    },
    header: {
      defaultValue: {
        language: 'en-US',
        value: student.name
      }
    },
    barcode: {
      type: 'CODE_128',
      value: student.studentId,
      alternateText: student.studentId
    },
    textModulesData: [
      {
        header: 'ID Number',
        body: student.studentId
      },
      {
        header: 'Major',
        body: student.major
      },
      {
        header: 'Classification',
        body: student.classification || 'Student'
      }
    ],
    validTimeInterval: {
      start: {
        date: '2024-01-01T00:00:00Z'
      },
      end: {
        date: '2025-12-31T23:59:59Z'
      }
    }
  };

  try {
    console.log('Creating pass object with ID:', objectId);
    const response = await client.request({
      url: 'https://walletobjects.googleapis.com/walletobjects/v1/genericObject',
      method: 'POST',
      data: genericObject
    });
    console.log('Pass object created successfully');
    return response.data;
  } catch (error) {
    console.error('Error creating pass object:', error.response?.data || error.message);
    throw error;
  }
}

// Generate a signed JWT for the pass
function generateSignedJwt(student) {
  const serviceAccount = JSON.parse(process.env.GOOGLE_WALLET_SERVICE_ACCOUNT);
  const claims = {
    iss: SERVICE_ACCOUNT_EMAIL,
    aud: 'google',
    origins: [
      'https://virtual-id-frontend.onrender.com',
      'http://localhost:5173',
      'http://localhost:3000',
      'https://virtual-id.vercel.app'
    ],
    typ: 'savetowallet',
    payload: {
      genericObjects: [{
        id: `${ISSUER_ID}.student_id_${student.studentId}`,
        classId: `${ISSUER_ID}.student_id_class`
      }]
    }
  };

  try {
    const token = jwt.sign(claims, serviceAccount.private_key, { algorithm: 'RS256' });
    console.log('JWT generated successfully');
    return token;
  } catch (error) {
    console.error('Error generating JWT:', error.message);
    throw error;
  }
}

// Generate the save URL for Google Wallet
function generateSaveUrl(student) {
  try {
    const token = generateSignedJwt(student);
    const url = `https://pay.google.com/gp/v/save/${token}`;
    console.log('Generated save URL');
    return url;
  } catch (error) {
    console.error('Error generating save URL:', error.message);
    throw error;
  }
}

module.exports = {
  createPassClass,
  createPassObject,
  generateSaveUrl
}; 