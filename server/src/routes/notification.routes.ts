import { Router } from 'express';
import { NotificationController } from '../controllers/notification.controller';
import { authenticateToken } from '../middlewares/auth.middleware';

const controller = new NotificationController();
const router = Router();

router.get('/one/:userId',authenticateToken, controller.getByUser);
router.post('/create',authenticateToken, controller.create);
router.patch('/read/:id',authenticateToken, controller.markAsRead);
router.delete('/delete/:id',authenticateToken, controller.delete);

export default router;
