const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('cloudinary').v2;

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Cloudinary storage configuration
const storage = new CloudinaryStorage({
  cloudinary,
  params: async (_req, file) => {
    const isPdf = file.mimetype === 'application/pdf';
    return {
      folder: 'careerforge/resumes',
      resource_type: 'raw',
      format: isPdf ? 'pdf' : 'docx',
      public_id: `resume_${Date.now()}_${file.originalname.replace(/\.[^/.]+$/, '')}`,
    };
  },
});

// File filter — accept PDF and DOCX only
const fileFilter = (_req, file, cb) => {
  const allowedMimeTypes = [
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/msword',
  ];

  const allowedExtensions = ['.pdf', '.docx', '.doc'];
  const ext = file.originalname.toLowerCase().slice(file.originalname.lastIndexOf('.'));

  if (allowedMimeTypes.includes(file.mimetype) || allowedExtensions.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error('Only PDF and DOCX files are allowed.'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
});

// Export upload middleware and cloudinary for deletion
module.exports = { upload, cloudinary };
