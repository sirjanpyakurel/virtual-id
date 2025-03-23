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
    console.log('Getting auth client...');
    const client = await auth.getClient();
    console.log('Auth client obtained successfully');

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
            value: 'Student ID Card'
          }
        },
        logo: {
          sourceUri: {
            uri: 'https://virtual-id-frontend.onrender.com/tiger.png'
          }
        },
        hexBackgroundColor: '#003366',
        heroImage: {
          sourceUri: {
            uri: 'https://virtual-id-frontend.onrender.com/tiger.png'
          }
        }
      }
    };

    console.log('Making request to create pass class:', genericClass.id);
    const response = await client.request({
      url: 'https://walletobjects.googleapis.com/walletobjects/v1/genericClass',
      method: 'POST',
      data: genericClass
    });
    console.log('Pass class created successfully:', response.data.id);
    return response.data;
  } catch (error) {
    console.error('Error creating pass class:', {
      error: error.message,
      response: error.response?.data,
      stack: error.stack
    });
    throw error;
  }
}

// Create a Generic pass object for a specific student
async function createPassObject(student) {
  try {
    console.log('Getting auth client for pass object...');
    const client = await auth.getClient();
    console.log('Auth client obtained for pass object');

    const objectId = `${ISSUER_ID}.student_id_${student.studentId}`;
    console.log('Creating pass object with ID:', objectId);

    const genericObject = {
      id: objectId,
      classId: `${ISSUER_ID}.student_id_class`,
      genericType: 'GENERIC_TYPE_UNSPECIFIED',
      cardTitle: {
        defaultValue: {
          language: 'en-US',
          value: 'Tennessee State University'
        }
      },
      subheader: {
        defaultValue: {
          language: 'en-US',
          value: 'Student ID Card'
        }
      },
      header: {
        defaultValue: {
          language: 'en-US',
          value: student.name
        }
      },
      logo: {
        sourceUri: {
          uri: 'https://virtual-id-frontend.onrender.com/tiger.png'
        }
      },
      heroImage: {
        sourceUri: {
          uri: student.imageUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(student.name)}&background=003366&color=fff&size=400&bold=true`
        }
      },
      barcode: {
        type: 'CODE_128',
        value: student.studentId,
        alternateText: student.studentId
      },
      hexBackgroundColor: '#003366',
      textModulesData: [
        {
          header: 'Student ID',
          body: student.studentId,
          id: 'student_id'
        },
        {
          header: 'Major',
          body: student.major,
          id: 'major'
        },
        {
          header: 'Classification',
          body: student.classification || 'Student',
          id: 'classification'
        }
      ],
      linksModuleData: {
        uris: [
          {
            uri: 'https://www.tnstate.edu',
            description: 'Tennessee State University Website',
            id: 'official_site'
          }
        ]
      },
      validTimeInterval: {
        start: {
          date: '2024-01-01T00:00:00Z'
        },
        end: {
          date: '2025-12-31T23:59:59Z'
        }
      }
    };

    console.log('Making request to create pass object...');
    const response = await client.request({
      url: 'https://walletobjects.googleapis.com/walletobjects/v1/genericObject',
      method: 'POST',
      data: genericObject
    });
    console.log('Pass object created successfully:', response.data.id);
    return response.data;
  } catch (error) {
    console.error('Error creating pass object:', {
      error: error.message,
      response: error.response?.data,
      stack: error.stack
    });
    throw error;
  }
}

// Generate a signed JWT for the pass
function generateSignedJwt(student) {
  try {
    console.log('Generating JWT for student:', student.studentId);
    const serviceAccount = JSON.parse(process.env.GOOGLE_WALLET_SERVICE_ACCOUNT);
    
    const claims = {
      iss: serviceAccount.client_email, // Use client_email from service account
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

    console.log('JWT claims prepared:', {
      issuer: claims.iss,
      objectId: claims.payload.genericObjects[0].id
    });

    const token = jwt.sign(claims, serviceAccount.private_key, { algorithm: 'RS256' });
    console.log('JWT generated successfully');
    return token;
  } catch (error) {
    console.error('Error generating JWT:', {
      error: error.message,
      stack: error.stack
    });
    throw error;
  }
}

// Generate the save URL for Google Wallet
function generateSaveUrl(student) {
  try {
    console.log('Generating save URL for student:', student.studentId);
    const token = generateSignedJwt(student);
    const url = `https://pay.google.com/gp/v/save/${token}`;
    console.log('Save URL generated successfully');
    return url;
  } catch (error) {
    console.error('Error generating save URL:', {
      error: error.message,
      stack: error.stack
    });
    throw error;
  }
}

module.exports = {
  createPassClass,
  createPassObject,
  generateSaveUrl
}; 