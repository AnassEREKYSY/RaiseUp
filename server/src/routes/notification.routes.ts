import { Router } from 'express';
import { NotificationController } from '../controllers/notification.controller';

const controller = new NotificationController();
const router = Router();

router.get('one/:userId', controller.getByUser);
router.post('create/', controller.create);
router.patch('read/:id', controller.markAsRead);
router.delete('delete/:id', controller.delete);

export default router;
