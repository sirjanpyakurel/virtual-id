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
    console.log('Checking if pass class exists...');

    // First try to get the existing class
    try {
      const response = await client.request({
        url: `https://walletobjects.googleapis.com/walletobjects/v1/genericClass/${ISSUER_ID}.student_id_class`,
        method: 'GET'
      });
      console.log('Pass class already exists');
      return response.data;
    } catch (error) {
      // If class doesn't exist (404), create it
      if (error.response?.status === 404) {
        console.log('Pass class not found, creating new class...');
        
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
              },
              contentDescription: {
                defaultValue: {
                  language: 'en-US',
                  value: 'TSU Logo'
                }
              }
            },
            hexBackgroundColor: '#003366'
          }
        };

        const response = await client.request({
          url: 'https://walletobjects.googleapis.com/walletobjects/v1/genericClass',
          method: 'POST',
          data: genericClass
        });
        console.log('Pass class created successfully');
        return response.data;
      } else {
        // If it's not a 404 error, throw the error
        throw error;
      }
    }
  } catch (error) {
    console.error('Error with pass class:', error.response?.data || error.message);
    throw error;
  }
}

// Create a Generic pass object for a specific student
async function createPassObject(student) {
  try {
    const client = await auth.getClient();
    console.log('Creating pass object...');

    const objectId = `${ISSUER_ID}.student_id_${student.studentId}`;
    
    // First check if the object already exists
    try {
      const existingObject = await client.request({
        url: `https://walletobjects.googleapis.com/walletobjects/v1/genericObject/${objectId}`,
        method: 'GET'
      });
      console.log('Pass object already exists');
      return existingObject.data;
    } catch (error) {
      // If object doesn't exist (404), create it
      if (error.response?.status === 404) {
        // Generate a PNG avatar URL using UI Avatars
        const avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(student.name)}&background=003366&color=fff&size=400&bold=true&format=png`;

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
              value: 'Student ID'
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
              uri: avatarUrl
            },
            contentDescription: {
              defaultValue: {
                language: 'en-US',
                value: 'Student Photo'
              }
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
              header: 'Campus ID',
              body: student.studentId,
              id: 'student_id'
            },
            {
              header: 'Name',
              body: student.name,
              id: 'name'
            },
            {
              header: 'Major',
              body: student.major,
              id: 'major'
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

        const response = await client.request({
          url: 'https://walletobjects.googleapis.com/walletobjects/v1/genericObject',
          method: 'POST',
          data: genericObject
        });
        console.log('Pass object created successfully');
        return response.data;
      } else {
        // If it's not a 404 error, throw the error
        throw error;
      }
    }
  } catch (error) {
    console.error('Error creating pass object:', error.response?.data || error.message);
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