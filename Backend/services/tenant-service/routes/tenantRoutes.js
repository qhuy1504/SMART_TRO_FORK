import express from 'express';
import tenantController from '../controllers/tenantController.js';
import authMiddleware from '../../shared/middleware/authMiddleware.js';
import landlordMiddleware from '../../shared/middleware/landlordMiddleware.js';

const router = express.Router();

router.post('/', authMiddleware, landlordMiddleware, (req,res)=>tenantController.create(req,res));
router.get('/', authMiddleware, landlordMiddleware, (req,res)=>tenantController.list(req,res));
router.get('/:id', authMiddleware, landlordMiddleware, (req,res)=>tenantController.get(req,res));
router.put('/:id', authMiddleware, landlordMiddleware, (req,res)=>tenantController.update(req,res));
router.post('/:id/payments', authMiddleware, landlordMiddleware, (req,res)=>tenantController.addPayment(req,res));
router.post('/:id/end', authMiddleware, landlordMiddleware, (req,res)=>tenantController.endLease(req,res));
router.delete('/:id', authMiddleware, landlordMiddleware, (req,res)=>tenantController.archive(req,res));

export default router;
