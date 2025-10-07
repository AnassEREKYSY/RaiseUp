import { Router } from 'express';
import { MatchController } from '../controllers/match.controller';

const controller = new MatchController();
const router = Router();

router.get('all/', controller.getAll);
router.get('one/:id', controller.getById);
router.post('create/', controller.create);
router.patch('update/:id/status', controller.updateStatus);
router.delete('delete/:id', controller.delete);

export default router;
