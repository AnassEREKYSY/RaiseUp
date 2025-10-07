import { Router } from 'express';
import { ProjectController } from '../controllers/project.controller';
import { authenticateToken } from '../middlewares/auth.middleware';

const controller = new ProjectController();
const router = Router();

router.get('/all/',authenticateToken, controller.getAll);
router.get('/one/:id',authenticateToken, controller.getById);
router.post('/create',authenticateToken, controller.create);
router.put('/update/:id',authenticateToken, controller.update);
router.delete('/delete/:id',authenticateToken, controller.delete);

export default router;
