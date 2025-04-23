import { Router } from 'express';
import authRoutes from './auth';
import chatRoutes from './chat';
import paymentRoutes from './payment';

const router = Router();

router.use('/auth', authRoutes);
router.use('/chat', chatRoutes);
router.use('/payment', paymentRoutes);

export default router; 