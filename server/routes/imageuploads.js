import express from "express";
import multer from "multer";
import path from 'path';
import { fileURLToPath } from 'url';
import fs from "fs";

const router = express.Router();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadsDir = path.join(__dirname, '..', 'uploadedimages');
    cb(null, uploadsDir);
  },
});

const uploadStorage = multer({ storage: storage });

router.post("/upload/single", uploadStorage.single("file"), (req, res) => {
  const file = req.file;
  console.log(file);
  if (!file) {
    return res.status(400).send({ status: "err", error: "No file uploaded" });
  }

  const uid = req.body.uid; // Access the uid from the parsed req.body
  console.log(uid);
  const extension = path.extname(file.originalname);
  console.log(extension);
  const pid=req.body.pid;
  const newFilename = `${uid}_${pid}${extension}`;
  console.log(newFilename);
  const newFilePath = path.join(__dirname, '..', 'uploadedimages', newFilename);

  // Rename the uploaded file with the new filename
  fs.rename(file.path, newFilePath, (err) => {
    if (err) {
      console.error(err);
      return res.status(500).send({ status: "err", error: "Error renaming file" });
    }

    res.send({ status: "success", message: `${file.originalname} uploaded!` });
  });
});


router.get('/download/:uid', (req, res) => {
  const uid = req.params.uid;
  const uploadsDir = path.join(__dirname, '..', 'uploadedimages');

  // Read the uploads directory and find the file with the matching uid
  fs.readdir(uploadsDir, (err, files) => {
    if (err) {
      console.error('Error reading uploads directory:', err);
      return res.status(500).send('Internal Server Error');
    }

    const fileToDownload = files.find(file => file.startsWith(`${uid}_`));

    if (!fileToDownload) {
      return res.status(404).send('File not found');
    }

    const filePath = path.join(uploadsDir, fileToDownload);
    const fileStream = fs.createReadStream(filePath);
    res.setHeader('Content-Type', 'application/octet-stream'); // Set the appropriate Content-Type header
    res.setHeader('Content-Disposition', `attachment; filename="${fileToDownload}"`);
    fileStream.pipe(res);
  });
});

router.get('/check-file/:uid', (req, res) => {
  // console.log(req);
  const uid = req.params.uid;
  const uploadsDir = path.join(__dirname, '..', 'uploadedimages');

  // Read the uploads directory and find the file with the matching uid
  fs.readdir(uploadsDir, (err, files) => {
    if (err) {
      console.error('Error reading uploads directory:', err);
      return res.status(500).send('Internal Server Error');
    }

    const fileWithUid = files.find(file => file.startsWith(`${uid}_`));

    if (!fileWithUid) {
      return res.json({ fileExists: false, file: null });
    }

    const filePath = path.join(uploadsDir, fileWithUid);
    const file = {
      name: fileWithUid,
      path: filePath,
    };

    res.json({ fileExists: true, file });
  });
});

router.get('/check-file/:uid/:pid', (req, res) => {
  const uid = req.params.uid;
  const pid = req.params.pid; // Get the product ID from the URL
  const uploadsDir = path.join(__dirname, '..', 'uploadedimages');

  // Read the uploads directory and find the file with the matching uid and pid
  fs.readdir(uploadsDir, (err, files) => {
    if (err) {
      console.error('Error reading uploads directory:', err);
      return res.status(500).send('Internal Server Error');
    }

    const fileWithUidAndPid = files.find(file => file === `${uid}_${pid}.png`); // Assuming the file extension is .jpg

    if (!fileWithUidAndPid) {
      return res.json({ fileExists: false, fileUrl: null });
    }

    const filePath = path.join(uploadsDir, fileWithUidAndPid);
    const fileUrl = `http://localhost:9000/file/image/${fileWithUidAndPid}`; // Construct the file URL

    res.json({ fileExists: true, fileUrl });
  });
});

router.get('/image/:uid/:pid', (req, res) => {
  const uid = req.params.uid;
  const pid = req.params.pid;
  const uploadsDir = path.join(__dirname, '..', 'uploadedimages');
  const filename = `${uid}_${pid}.png`; // Assuming the file extension is .jpg
  const filePath = path.join(uploadsDir, filename);

  res.sendFile(filePath, (err) => {
    if (err) {
      console.error('Error sending file:', err);
      res.status(500).send('Internal Server Error');
    }
  });
});
export default router;
