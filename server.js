const express = require('express');
const admin = require('firebase-admin');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const cors = require('cors');
const bodyParser = require('body-parser');
const swaggerJsDoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

require('dotenv').config();

const app = express();
const port = 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Firebase Initialization
const serviceAccount = {
  type: "service_account",
  project_id: process.env.FIREBASE_PROJECT_ID,
  private_key: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
  client_email: process.env.FIREBASE_CLIENT_EMAIL,
};

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: 'gs://govservice-2024.appspot.com'
});

const db = admin.firestore();
const bucket = admin.storage().bucket();

// Setup Multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // Max file size 10MB
  },
});

// Swagger Configuration
const swaggerOptions = {
  swaggerDefinition: {
    openapi: '3.0.0',
    info: {
      title: 'API Documentation',
      description: 'API Information',
      version: '1.0.0',
      contact: {
        name: 'Mikey',
      },
    },
    servers: [
        { url: 'http://localhost:3000' },
        { url: 'https://api-user-delta.vercel.app' }
      ],
  },
  apis: ['server.js'], // Path to the API docs
};

const swaggerDocs = swaggerJsDoc(swaggerOptions);

// Use the latest Swagger UI bundle from a CDN
const customCssUrl = 'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/4.15.5/swagger-ui.min.css';
const customJs = [
  'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/4.15.5/swagger-ui-bundle.js',
  'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/4.15.5/swagger-ui-standalone-preset.js',
];

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs, {
  customCssUrl,
  customJs,
}));

// Middleware to validate required fields for research
const validateResearchForm = (req, res, next) => {
  const requiredFields = [
    'letterNumber',
    'name', 
    'researcherName', 
    'address', 
    'inputValue', 
    'institution', 
    'occupation', 
    'judulPenelitian', 
    'researchField', 
    'tujuanPenelitian', 
    'supervisorName',
    'teamMembers',
    'statusPenelitian',
    'researchPeriod',
    'researchLocation'
  ];

  for (const field of requiredFields) {
    if (!req.body[field]) {
      return res.status(400).json({ message: `${field} is required` });
    }
  }

  next();
};

// Middleware to validate required fields for internship
const validateInternshipForm = (req, res, next) => {
  const requiredFields = [
    'letterNumber',
    'name',
    'address',
    'inputValue',
    'institution',
    'occupation',
    'judul',
    'supervisorName',
    'tujuanPermohonan',
    'teamMembers',
    'statusPermohonan',
    'period',
    'location'
  ];

  for (const field of requiredFields) {
    if (!req.body[field]) {
      return res.status(400).json({ message: `${field} is required` });
    }
  }

  next();
};

// Helper function to upload files to Firebase
const uploadFileToFirebase = async (file) => {
  const blob = bucket.file(`${uuidv4()}_${file.originalname}`);
  const blobStream = blob.createWriteStream({
    metadata: {
      contentType: file.mimetype,
    },
  });

  return new Promise((resolve, reject) => {
    blobStream.on('error', (err) => {
      reject(err);
    });

    blobStream.on('finish', async () => {
      const publicUrl = `https://storage.googleapis.com/${bucket.name}/${blob.name}`;
      resolve(publicUrl);
    });

    blobStream.end(file.buffer);
  });
};

/**
 * @swagger
 * components:
 *   schemas:
 *     Penelitian:
 *       type: object
 *       required:
 *         - letterNumber
 *         - name
 *         - researcherName
 *         - address
 *         - inputValue
 *         - institution
 *         - occupation
 *         - judulPenelitian
 *         - researchField
 *         - tujuanPenelitian
 *         - supervisorName
 *         - teamMembers
 *         - statusPenelitian
 *         - researchPeriod
 *         - researchLocation
 *       properties:
 *         letterNumber:
 *           type: string
 *         name:
 *           type: string
 *         researcherName:
 *           type: string
 *         address:
 *           type: string
 *         inputValue:
 *           type: string
 *         institution:
 *           type: string
 *         occupation:
 *           type: string
 *         judulPenelitian:
 *           type: string
 *         researchField:
 *           type: string
 *         tujuanPenelitian:
 *           type: string
 *         supervisorName:
 *           type: string
 *         teamMembers:
 *           type: string
 *         statusPenelitian:
 *           type: string
 *         researchPeriod:
 *           type: string
 *         researchLocation:
 *           type: string
 */

/**
 * @swagger
 * /api/penelitian:
 *   post:
 *     summary: Submit a research form
 *     tags: [Penelitian]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               letterNumber:
 *                 type: string
 *               name:
 *                 type: string
 *               researcherName:
 *                 type: string
 *               address:
 *                 type: string
 *               inputValue:
 *                 type: string
 *               institution:
 *                 type: string
 *               occupation:
 *                 type: string
 *               judulPenelitian:
 *                 type: string
 *               researchField:
 *                 type: string
 *               tujuanPenelitian:
 *                 type: string
 *               supervisorName:
 *                 type: string
 *               teamMembers:
 *                 type: string
 *               statusPenelitian:
 *                 type: string
 *               researchPeriod:
 *                 type: string
 *               researchLocation:
 *                 type: string
 *               suratPengantarFile:
 *                 type: string
 *                 format: binary
 *               proposalFile:
 *                 type: string
 *                 format: binary
 *               ktpFile:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Data berhasil disimpan
 *       500:
 *         description: Terjadi kesalahan saat menyimpan data
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Magang:
 *       type: object
 *       required:
 *         - letterNumber
 *         - name
 *         - address
 *         - inputValue
 *         - institution
 *         - occupation
 *         - judul
 *         - supervisorName
 *         - tujuanPermohonan
 *         - teamMembers
 *         - statusPermohonan
 *         - period
 *         - location
 *       properties:
 *         letterNumber:
 *           type: string
 *         name:
 *           type: string
 *         address:
 *           type: string
 *         inputValue:
 *           type: string
 *         institution:
 *           type: string
 *         occupation:
 *           type: string
 *         judul:
 *           type: string
 *         supervisorName:
 *           type: string
 *         tujuanPermohonan:
 *           type: string
 *         teamMembers:
 *           type: string
 *         statusPermohonan:
 *           type: string
 *         period:
 *           type: string
 *         location:
 *           type: string
 */

/**
 * @swagger
 * /api/magang:
 *   post:
 *     summary: Submit an internship form
 *     tags: [Magang]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               letterNumber:
 *                 type: string
 *               name:
 *                 type: string
 *               address:
 *                 type: string
 *               inputValue:
 *                 type: string
 *               institution:
 *                 type: string
 *               occupation:
 *                 type: string
 *               judul:
 *                 type: string
 *               supervisorName:
 *                 type: string
 *               tujuanPermohonan:
 *                 type: string
 *               teamMembers:
 *                 type: string
 *               statusPermohonan:
 *                 type: string
 *               period:
 *                 type: string
 *               location:
 *                 type: string
 *               suratPermohonanFile:
 *                 type: string
 *                 format: binary
 *               proposalFile:
 *                 type: string
 *                 format: binary
 *               ktpFile:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Data berhasil disimpan
 *       500:
 *         description: Terjadi kesalahan saat menyimpan data
 */

// Endpoint to handle research form submission

app.post('/api/penelitian', upload.fields([
  { name: 'suratPengantarFile', maxCount: 1 },
  { name: 'proposalFile', maxCount: 1 },
  { name: 'ktpFile', maxCount: 1 },
]), validateResearchForm, async (req, res) => {
  const {
    letterNumber,
    name,
    researcherName,
    address,
    inputValue,
    institution,
    occupation,
    judulPenelitian,
    researchField,
    tujuanPenelitian,
    supervisorName,
    teamMembers,
    statusPenelitian,
    researchPeriod,
    researchLocation
  } = req.body;

  try {
    // Log data received in the request
    console.log("Request Body:", req.body);
    console.log("Request Files:", req.files);

    // Upload files to Firebase Storage
    const suratPengantarUrl = req.files?.suratPengantarFile?.[0] ? await uploadFileToFirebase(req.files.suratPengantarFile[0]) : null;
    const proposalUrl = req.files?.proposalFile?.[0] ? await uploadFileToFirebase(req.files.proposalFile[0]) : null;
    const ktpUrl = req.files?.ktpFile?.[0] ? await uploadFileToFirebase(req.files.ktpFile[0]) : null;

    // Save data to Firestore
    await db.collection('pelayanan').doc('penelitian').collection('data').add({
      letterNumber,
      name,
      researcherName,
      address,
      inputValue,
      institution,
      occupation,
      judulPenelitian,
      researchField,
      tujuanPenelitian,
      supervisorName,
      teamMembers,
      statusPenelitian,
      researchPeriod,
      researchLocation,
      suratPengantarUrl,
      proposalUrl,
      ktpUrl,
      timestamp: admin.firestore.FieldValue.serverTimestamp()
    });

    res.json({ message: 'Data berhasil disimpan' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Terjadi kesalahan saat menyimpan data' });
  }
});

// Endpoint to handle internship form submission
app.post('/api/magang', upload.fields([
  { name: 'suratPermohonanFile', maxCount: 1 },
  { name: 'proposalFile', maxCount: 1 },
  { name: 'ktpFile', maxCount: 1 },
]), validateInternshipForm, async (req, res) => {
  const {
    letterNumber,
    name,
    address,
    inputValue,
    institution,
    occupation,
    judul,
    supervisorName,
    tujuanPermohonan,
    teamMembers,
    statusPermohonan,
    period,
    location
  } = req.body;

  try {
    // Log data received in the request
    console.log("Request Body:", req.body);
    console.log("Request Files:", req.files);

    // Upload files to Firebase Storage
    const suratPermohonanUrl = req.files?.suratPermohonanFile?.[0] ? await uploadFileToFirebase(req.files.suratPermohonanFile[0]) : null;
    const proposalUrl = req.files?.proposalFile?.[0] ? await uploadFileToFirebase(req.files.proposalFile[0]) : null;
    const ktpUrl = req.files?.ktpFile?.[0] ? await uploadFileToFirebase(req.files.ktpFile[0]) : null;

    // Save data to Firestore
    await db.collection('pelayanan').doc('magang').collection('magang').add({
      letterNumber,
      name,
      address,
      inputValue,
      institution,
      occupation,
      judul,
      supervisorName,
      tujuanPermohonan,
      teamMembers,
      statusPermohonan,
      period,
      location,
      suratPermohonanUrl,
      proposalUrl,
      ktpUrl,
      timestamp: admin.firestore.FieldValue.serverTimestamp()
    });

    res.json({ message: 'Data berhasil disimpan' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Terjadi kesalahan saat menyimpan data' });
  }
});

app.get('/', (req, res) => {
  res.send('Hey this is my API running')
});

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
