const express = require('express');
const admin = require('firebase-admin');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();

const serviceAccount = {
  type: "service_account",
  project_id: process.env.FIREBASE_PROJECT_ID,
  private_key: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
  client_email: process.env.FIREBASE_CLIENT_EMAIL,
};

const app = express();
const port = 3000;

// Konfigurasi Firebase
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: 'gs://govservice-2024.appspot.com'
});

const db = admin.firestore();
const bucket = admin.storage().bucket();

// Middleware untuk parsing JSON dan mengunggah file
app.use(express.json());

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // Maksimum file size 10MB
  },
});

// Middleware untuk memeriksa apakah input wajib diisi
const validateForm = (req, res, next) => {
  const {
    researcherName,
    address,
    inputValue,
    institution,
    occupation,
    judulPenelitian,
    researchField,
    tujuanPenelitian,
    supervisorName,
  } = req.body;

  const requiredFields = [
    'researcherName', 
    'address', 
    'inputValue', 
    'institution', 
    'occupation', 
    'judulPenelitian', 
    'researchField', 
    'tujuanPenelitian', 
    'supervisorName'
  ];

  for (const field of requiredFields) {
    if (!req.body[field]) {
      return res.status(400).json({ message: `${field} is required` });
    }
  }

  next();
};

// Endpoint untuk menerima data dari form
app.post('/api/submit-form', upload.fields([
  { name: 'suratPengantarFile', maxCount: 1 },
  { name: 'proposalFile', maxCount: 1 },
  { name: 'ktpFile', maxCount: 1 },
]), validateForm, async (req, res) => {
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

    const suratPermohonanUrl = req.files?.suratPengantarFile?.[0] ? await uploadFileToFirebase(req.files.suratPengantarFile[0]) : null;
    const proposalUrl = req.files?.proposalFile?.[0] ? await uploadFileToFirebase(req.files.proposalFile[0]) : null;
    const fotocopyKTPUrl = req.files?.ktpFile?.[0] ? await uploadFileToFirebase(req.files.ktpFile[0]) : null;

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
      fotocopyKTPUrl
    });

    res.json({ message: 'Data berhasil disimpan' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Terjadi kesalahan saat menyimpan data' });
  }
});

app.get('/', (req, res) => {
  res.send('Hey this is my API running')
})

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
