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
let auth;
try {
  const serviceAccount = JSON.parse(process.env.GOOGLE_WALLET_SERVICE_ACCOUNT);
  console.log('Service account email from credentials:', serviceAccount.client_email);
  console.log('Project ID from credentials:', serviceAccount.project_id);
  
  auth = new GoogleAuth({
    credentials: serviceAccount,
    scopes: ['https://www.googleapis.com/auth/wallet_object.issuer']
  });
} catch (error) {
  console.error('Error initializing Google Auth:', error.message);
  throw error;
}

// Create a Generic pass class for student ID
async function createPassClass() {
  try {
    const client = await auth.getClient();
    const classId = `${ISSUER_ID}.student_id_class`;
    
    console.log('Creating/Updating pass class...');
    
    // Define the class template according to Google Wallet guidelines
    const classTemplate = {
      id: classId,
      issuerName: 'Tennessee State University',
      reviewStatus: 'UNDER_REVIEW',
      classTemplateInfo: {
        cardTitle: {
          defaultValue: {
            language: 'en',
            value: 'Tennessee State University'
          }
        },
        subheader: {
          defaultValue: {
            language: 'en',
            value: 'Student ID Card'
          }
        },
        logo: {
          sourceUri: {
            uri: 'https://www.tnstate.edu/images/header-logo.png'
          },
          contentDescription: {
            defaultValue: {
              language: 'en',
              value: 'TSU Logo'
            }
          }
        },
        hexBackgroundColor: '#4051B5',
        textModulesData: [
          {
            id: 'STUDENT_STATUS',
            header: 'Status',
            body: 'Active Student'
          },
          {
            id: 'ACADEMIC_YEAR',
            header: 'Academic Year',
            body: '2024/2025'
          }
        ]
      }
    };

    try {
      // Try to update existing class first
      await client.request({
        url: `https://walletobjects.googleapis.com/walletobjects/v1/genericClass/${classId}`,
        method: 'PUT',
        data: classTemplate
      });
      console.log('Pass class updated successfully');
    } catch (error) {
      if (error.response?.status === 404) {
        // If class doesn't exist, create it
        await client.request({
          url: 'https://walletobjects.googleapis.com/walletobjects/v1/genericClass',
          method: 'POST',
          data: classTemplate
        });
        console.log('Pass class created successfully');
      } else {
        throw error;
      }
    }
    
    return classTemplate;
  } catch (error) {
    console.error('Error creating/updating pass class:', error.response?.data || error.message);
    throw error;
  }
}

// Create a Generic pass object for a specific student
async function createPassObject(studentData) {
  try {
    const client = await auth.getClient();
    console.log('Creating pass object...');

    const objectId = `${ISSUER_ID}.student_id_${studentData.studentId}`;
    const classId = `${ISSUER_ID}.student_id_class`;

    const objectTemplate = {
      id: objectId,
      classId: classId,
      state: 'ACTIVE',
      cardTitle: {
        kind: 'walletobjects#localizedString',
        defaultValue: {
          kind: 'walletobjects#translatedString',
          language: 'en',
          value: 'Tennessee State University'
        }
      },
      subheader: {
        kind: 'walletobjects#localizedString',
        defaultValue: {
          kind: 'walletobjects#translatedString',
          language: 'en',
          value: studentData.name.toUpperCase()
        }
      },
      header: {
        kind: 'walletobjects#localizedString',
        defaultValue: {
          kind: 'walletobjects#translatedString',
          language: 'en',
          value: 'Student ID'
        }
      },
      textModulesData: [
        {
          id: 'STUDENT_INFO',
          header: 'Student Information',
          body: `Name: ${studentData.name.toUpperCase()}\nStudent N°: ${studentData.studentId}\nMajor: ${studentData.major}\nClassification: ${studentData.classification}`
        },
        {
          id: 'STUDENT_STATUS',
          header: 'Status',
          body: 'Active Student'
        }
      ],
      barcode: {
        type: 'CODE_128',
        value: studentData.studentId,
        alternateText: studentData.studentId
      },
      hexBackgroundColor: '#4051B5',
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
      // Try to update existing object first
      await client.request({
        url: `https://walletobjects.googleapis.com/walletobjects/v1/genericObject/${objectId}`,
        method: 'PUT',
        data: objectTemplate
      });
      console.log('Pass object updated successfully');
    } catch (error) {
      if (error.response?.status === 404) {
        // If object doesn't exist, create it
        await client.request({
          url: 'https://walletobjects.googleapis.com/walletobjects/v1/genericObject',
          method: 'POST',
          data: objectTemplate
        });
        console.log('Pass object created successfully');
      } else {
        throw error;
      }
    }

    return objectTemplate;
  } catch (error) {
    console.error('Error creating/updating pass object:', error.response?.data || error.message);
    throw error;
  }
}

// Generate a signed JWT for the pass
function generateSignedJwt(student) {
  try {
    const serviceAccount = JSON.parse(process.env.GOOGLE_WALLET_SERVICE_ACCOUNT);
    
    const claims = {
      iss: serviceAccount.client_email,
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

    const token = jwt.sign(claims, serviceAccount.private_key, { algorithm: 'RS256' });
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