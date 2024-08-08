const express = require('express');
const admin = require('firebase-admin');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const cors = require('cors');
const bodyParser = require('body-parser');

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

// Middleware to validate required fields for research
const validateResearchForm = (req, res, next) => {
  const requiredFields = [
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

// Endpoint to handle research form submission
app.post('/api/penelitian', upload.fields([
  { name: 'suratPermohonan', maxCount: 1 },
  { name: 'proposal', maxCount: 1 },
  { name: 'fotocopy', maxCount: 1 },
]), validateResearchForm, async (req, res) => {
  const {
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
    const suratPermohonanUrl = req.files?.suratPermohonan?.[0] ? await uploadFileToFirebase(req.files.suratPermohonan[0]) : null;
    const proposalUrl = req.files?.proposal?.[0] ? await uploadFileToFirebase(req.files.proposal[0]) : null;
    const fotocopyKTPUrl = req.files?.fotocopy?.[0] ? await uploadFileToFirebase(req.files.fotocopy[0]) : null;

    // Save data to Firestore
    await db.collection('pelayanan').doc('penelitian').collection('data').add({
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
      suratPermohonanUrl,
      proposalUrl,
      fotocopyKTPUrl,
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
  { name: 'suratPermohonan', maxCount: 1 },
  { name: 'proposal', maxCount: 1 },
  { name: 'fotocopy', maxCount: 1 },
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
    const suratPermohonanUrl = req.files?.suratPermohonan?.[0] ? await uploadFileToFirebase(req.files.suratPermohonan[0]) : null;
    const proposalUrl = req.files?.proposal?.[0] ? await uploadFileToFirebase(req.files.proposal[0]) : null;
    const fotocopyKTPUrl = req.files?.fotocopy?.[0] ? await uploadFileToFirebase(req.files.fotocopy[0]) : null;

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
      fotocopyKTPUrl,
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
