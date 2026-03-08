/**
 * File Upload Middleware
 * 
 * Configuración segura de multer para uploads de archivos
 * con validación de tipo, tamaño y sanitización de nombres.
 */

import multer from 'multer';
import path from 'path';
import crypto from 'crypto';
import fs from 'fs';

// Asegurar que el directorio de uploads existe
const uploadDir = process.env.UPLOAD_DIR || './uploads';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Almacenamiento seguro
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Generar nombre único seguro (no usar nombre original del archivo)
    const uniqueSuffix = crypto.randomBytes(16).toString('hex');
    const sanitizedExt = path.extname(file.originalname).toLowerCase().replace(/[^.a-z0-9]/g, '');
    const safeExt = sanitizedExt || '.bin'; // Default a binario si no hay extensión válida
    cb(null, `${file.fieldname}-${uniqueSuffix}${safeExt}`);
  }
});

// Filtro de archivos (whitelist de tipos permitidos)
const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  // Tipos MIME permitidos
  const allowedMimes = [
    'audio/webm',
    'audio/mp3',
    'audio/wav',
    'audio/mpeg',
    'audio/ogg',
    'image/jpeg',
    'image/png',
    'image/jpg',
    'application/pdf',
    'text/plain'
  ];
  
  // Extensiones permitidas (doble verificación)
  const allowedExts = ['.webm', '.mp3', '.wav', '.mpeg', '.ogg', '.jpg', '.jpeg', '.png', '.pdf', '.txt'];
  const ext = path.extname(file.originalname).toLowerCase();
  
  if (allowedMimes.includes(file.mimetype) && allowedExts.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error(`Tipo de archivo no permitido: ${file.mimetype} (${ext}). Solo se permiten archivos de audio e imágenes.`));
  }
};

// Configuración de multer con límites de seguridad
export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB máximo
    files: 1, // Solo 1 archivo por request
    fields: 10, // Límite de campos adicionales
    parts: 11 // Límite total de partes (archivo + campos)
  }
});

// Middleware específico para notas de voz (solo audio)
export const uploadAudio = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const allowedMimes = ['audio/webm', 'audio/mp3', 'audio/wav', 'audio/mpeg', 'audio/ogg'];
    const allowedExts = ['.webm', '.mp3', '.wav', '.mpeg', '.ogg'];
    const ext = path.extname(file.originalname).toLowerCase();
    
    if (allowedMimes.includes(file.mimetype) && allowedExts.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Solo se permiten archivos de audio (webm, mp3, wav, ogg)'));
    }
  },
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
    files: 1
  }
});

// Middleware específico para imágenes (tarjetas de presentación)
export const uploadImage = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const allowedMimes = ['image/jpeg', 'image/png', 'image/jpg'];
    const allowedExts = ['.jpg', '.jpeg', '.png'];
    const ext = path.extname(file.originalname).toLowerCase();
    
    if (allowedMimes.includes(file.mimetype) && allowedExts.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Solo se permiten imágenes (jpg, jpeg, png)'));
    }
  },
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB para imágenes
    files: 1
  }
});

// Error handler para multer
export const handleMulterError = (err: any, req: any, res: any, next: any) => {
  if (err instanceof multer.MulterError) {
    // Errores específicos de multer
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({ 
        error: 'Archivo demasiado grande',
        maxSize: '10MB'
      });
    }
    if (err.code === 'LIMIT_FILE_COUNT') {
      return res.status(413).json({ 
        error: 'Demasiados archivos',
        maxFiles: 1
      });
    }
    return res.status(400).json({ error: err.message });
  }
  
  // Otros errores
  if (err) {
    return res.status(400).json({ error: err.message });
  }
  
  next();
};
