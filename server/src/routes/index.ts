import { Router } from 'express';
import authRoutes from './auth.routes';
import startupRoutes from './startup.routes';
import investorRoutes from './investor.routes';
import projectRoutes from './project.routes';
import matchRoutes from './match.routes';
import messageRoutes from './message.routes';
import notificationRoutes from './notification.routes';

export const router = Router();

router.use('/auth', authRoutes);
router.use('/startups', startupRoutes);
router.use('/investors', investorRoutes);
router.use('/projects', projectRoutes);
router.use('/matches', matchRoutes);
router.use('/messages', messageRoutes);
router.use('/notifications', notificationRoutes);
