import { Router } from 'express';
import { StartupController } from '../controllers/startup.controller';
import { authenticateToken } from '../middlewares/auth.middleware';

const controller = new StartupController();
const router = Router();

router.get('all/',authenticateToken, controller.getAll);
router.get('one/:id',authenticateToken, controller.getById);
router.post('create/',authenticateToken, controller.create);
router.put('update/:id',authenticateToken, controller.update);
router.delete('delete/:id',authenticateToken, controller.delete);
router.get('/search', authenticateToken, controller.search);

export default router;
