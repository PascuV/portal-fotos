const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// Crear carpeta uploads si no existe
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}

// Configuración de almacenamiento con multer
const storage = multer.diskStorage({
  destination: uploadsDir,
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB máximo
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|gif|webp/;
    const extOk = allowed.test(path.extname(file.originalname).toLowerCase());
    const mimeOk = allowed.test(file.mimetype);
    if (extOk && mimeOk) {
      cb(null, true);
    } else {
      cb(new Error('Solo se permiten imágenes (jpg, png, gif, webp)'));
    }
  }
});

// Servir archivos estáticos
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(uploadsDir));

// API: subir foto
app.post('/api/upload', upload.single('photo'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No se recibió ninguna imagen' });
  }

  res.json({
    success: true,
    filename: req.file.filename,
    url: `/uploads/${req.file.filename}`
  });
});

// API: listar fotos
app.get('/api/photos', (req, res) => {
  if (!fs.existsSync(uploadsDir)) {
    return res.json([]);
  }

  const files = fs.readdirSync(uploadsDir)
    .filter(f => /\.(jpg|jpeg|png|gif|webp)$/i.test(f))
    .map(f => ({
      filename: f,
      url: `/uploads/${f}`,
      uploaded: fs.statSync(path.join(uploadsDir, f)).mtime
    }))
    .sort((a, b) => new Date(b.uploaded) - new Date(a.uploaded));

  res.json(files);
});

app.listen(PORT, () => {
  console.log(`Portal de fotos en http://localhost:${PORT}`);
});

// API: eliminar foto (administración)
// Ej: DELETE /api/photos/1234-foto.jpg?key=escalon2026
app.delete('/api/photos/:filename', (req, res) => {
  const adminKey = process.env.ADMIN_KEY || 'escalon2026';
  const providedKey = req.query.key;

  if (!providedKey || providedKey !== adminKey) {
    return res.status(401).json({ error: 'No autorizado' });
  }

  const filename = req.params.filename;

  // Evitar rutas tipo ../
  if (filename.includes('..')) {
    return res.status(400).json({ error: 'Nombre de archivo no válido' });
  }

  const filePath = path.join(uploadsDir, filename);

  fs.access(filePath, fs.constants.F_OK, (err) => {
    if (err) {
      return res.status(404).json({ error: 'Archivo no encontrado' });
    }

    fs.unlink(filePath, (err2) => {
      if (err2) {
        console.error(err2);
        return res.status(500).json({ error: 'Error borrando el archivo' });
      }

      return res.json({ success: true });
    });
  });
});

