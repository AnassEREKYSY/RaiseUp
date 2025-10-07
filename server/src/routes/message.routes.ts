import { Router } from 'express';
import { MessageController } from '../controllers/message.controller';
import { authenticateToken } from '../middlewares/auth.middleware';

const controller = new MessageController();
const router = Router();

router.get('bymatch/:matchId',authenticateToken, controller.getByMatch);
router.post('create/',authenticateToken, controller.create);

export default router;
