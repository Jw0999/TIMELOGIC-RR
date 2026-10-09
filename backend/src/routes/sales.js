const router = require('express').Router();
const multer = require('multer');
const { authenticate } = require('../middleware/auth');
const { isAdmin } = require('../middleware/roleGuard');
const { checkSubscription } = require('../middleware/subscriptionGuard');
const ctrl = require('../controllers/salesController');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB file limit
});

// Enforce active subscription and Admin authorization
router.use(authenticate, isAdmin, checkSubscription);

// Dashboard Analytics & Periods
router.get('/dashboard', ctrl.getDashboard);
router.get('/periods', ctrl.getPeriods);

// Ingestion Pipeline
router.post('/preview', upload.single('file'), ctrl.previewUpload);
router.post('/import', upload.any(), ctrl.importUpload);

// Raw Data & History
router.get('/transactions', ctrl.getRawData);
router.get('/imports', ctrl.getImports);
router.delete('/imports/:batchId', ctrl.deleteBatch);

// Exports & Templates
router.get('/export/excel', ctrl.exportExcel);
router.get('/export/csv', ctrl.exportCsv);
router.get('/template', ctrl.downloadSampleTemplate);

module.exports = router;
