import { Router } from 'express';
import { requireAuth } from '../middlewares/auth';
import analytics from './analytics.routes';
import auth from './auth.routes';
import connections from './connections.routes';
import directory from './directory.routes';
import me from './me.routes';
import notifications from './notifications.routes';
import pipeline from './pipeline.routes';

export const router = Router();
router.use('/auth', auth);
router.use('/me', requireAuth, me);
router.use('/connections', requireAuth, connections);
router.use('/notifications', requireAuth, notifications);
router.use('/pipeline', requireAuth, pipeline);
router.use('/analytics', requireAuth, analytics);
router.use('/', requireAuth, directory);
