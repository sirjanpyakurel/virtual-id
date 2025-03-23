const { GoogleAuth } = require('google-auth-library');
const jwt = require('jsonwebtoken');
const path = require('path');

// Replace these with your actual credentials from Google Cloud Console
const ISSUER_ID = '3388000000022321123'; // Your Google Wallet issuer ID
const SERVICE_ACCOUNT_JSON_PATH = path.resolve(__dirname, '../config/service-account.json');

// Create Generic pass class for student IDs
const createPassClass = async () => {
  const auth = new GoogleAuth({
    keyFile: SERVICE_ACCOUNT_JSON_PATH,
    scopes: ['https://www.googleapis.com/auth/wallet_object.issuer']
  });

  const genericClass = {
    id: `${ISSUER_ID}.tsu_student_id`,
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
          uri: 'https://virtual-id-backend.onrender.com/tsu-logo.png' // Update with actual TSU logo URL
        }
      }
    }
  };

  return genericClass;
};

// Create pass object for a specific student
const createStudentPass = async (student) => {
  const passId = `${ISSUER_ID}.${student.studentId}`;
  const classId = `${ISSUER_ID}.tsu_student_id`;

  const genericObject = {
    id: passId,
    classId: classId,
    genericType: 'GENERIC_TYPE_UNSPECIFIED',
    hexBackgroundColor: '#4a148c',
    logo: {
      sourceUri: {
        uri: 'https://virtual-id-backend.onrender.com/tsu-logo.png' // Update with actual TSU logo URL
      }
    },
    cardTitle: {
      defaultValue: {
        language: 'en-US',
        value: 'Student ID'
      }
    },
    subheader: {
      defaultValue: {
        language: 'en-US',
        value: student.name
      }
    },
    header: {
      defaultValue: {
        language: 'en-US',
        value: student.studentId
      }
    },
    barcode: {
      type: 'CODE_128',
      value: student.studentId
    },
    textModulesData: [
      {
        header: 'Major',
        body: student.major
      },
      {
        header: 'Valid Through',
        body: '2024-2025'
      }
    ]
  };

  return genericObject;
};

// Generate signed JWT for the pass
const generatePassJwt = async (student) => {
  const serviceAccount = require(SERVICE_ACCOUNT_JSON_PATH);
  const passObject = await createStudentPass(student);
  
  const claims = {
    iss: serviceAccount.client_email,
    aud: 'google',
    origins: ['https://virtual-id-backend.onrender.com'], // Update with your backend domain
    typ: 'savetowallet',
    payload: {
      genericObjects: [passObject]
    }
  };

  const token = jwt.sign(claims, serviceAccount.private_key, {
    algorithm: 'RS256',
    expiresIn: '1h'
  });

  return token;
};

// Generate save to wallet URL
const generateSaveUrl = async (student) => {
  const token = await generatePassJwt(student);
  return `https://pay.google.com/gp/v/save/${token}`;
};

module.exports = {
  generateSaveUrl
}; 