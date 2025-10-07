import { Router } from 'express';
import { StartupController } from '../controllers/startup.controller';

const controller = new StartupController();
const router = Router();

router.get('all/', controller.getAll);
router.get('one/:id', controller.getById);
router.post('create/', controller.create);
router.put('update/:id', controller.update);
router.delete('delete/:id', controller.delete);

export default router;
