const { GoogleAuth } = require('google-auth-library');
const jwt = require('jsonwebtoken');

// Your Google Wallet issuer ID (get this from Google Cloud Console)
const ISSUER_ID = process.env.GOOGLE_WALLET_ISSUER_ID;

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
          uri: 'https://raw.githubusercontent.com/sirjanpyakurel/virtual-id/main/Code-a-Thon/src/assets/tiger.png'
        }
      },
      hexBackgroundColor: '#4a148c',
    }
  };

  try {
    const response = await client.request({
      url: 'https://walletobjects.googleapis.com/walletobjects/v1/genericClass',
      method: 'POST',
      data: genericClass
    });
    return response.data;
  } catch (error) {
    console.error('Error creating pass class:', error);
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
    hexBackgroundColor: '#4a148c',
    logo: {
      sourceUri: {
        uri: 'https://raw.githubusercontent.com/sirjanpyakurel/virtual-id/main/Code-a-Thon/src/assets/tiger.png'
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
        body: student.classification
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
    const response = await client.request({
      url: 'https://walletobjects.googleapis.com/walletobjects/v1/genericObject',
      method: 'POST',
      data: genericObject
    });
    return response.data;
  } catch (error) {
    console.error('Error creating pass object:', error);
    throw error;
  }
}

// Generate a signed JWT for the pass
function generateSignedJwt(student) {
  const serviceAccount = JSON.parse(process.env.GOOGLE_WALLET_SERVICE_ACCOUNT);
  const claims = {
    iss: process.env.GOOGLE_WALLET_SERVICE_ACCOUNT_EMAIL,
    aud: 'google',
    origins: ['https://virtual-id-frontend.onrender.com'],
    typ: 'savetowallet',
    payload: {
      genericObjects: [{
        id: `${ISSUER_ID}.student_id_${student.studentId}`,
        classId: `${ISSUER_ID}.student_id_class`
      }]
    }
  };

  return jwt.sign(claims, serviceAccount.private_key, { algorithm: 'RS256' });
}

// Generate the save URL for Google Wallet
function generateSaveUrl(student) {
  const token = generateSignedJwt(student);
  return `https://pay.google.com/gp/v/save/${token}`;
}

module.exports = {
  createPassClass,
  createPassObject,
  generateSaveUrl
}; 