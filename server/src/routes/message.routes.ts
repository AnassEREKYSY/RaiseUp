import { Router } from 'express';
import { MessageController } from '../controllers/message.controller';

const controller = new MessageController();
const router = Router();

router.get('bymatch/:matchId', controller.getByMatch);
router.post('create/', controller.create);

export default router;
