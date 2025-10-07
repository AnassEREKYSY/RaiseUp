import { Router } from 'express';
import { StartupController } from '../controllers/startup.controller';
import { authenticateToken } from '../middlewares/auth.middleware';
import { authorizeRoles } from '../middlewares/role.middleware';
import { Role } from '../models/enums';

const controller = new StartupController();
const router = Router();

router.get('/all/',authenticateToken, controller.getAll);
router.get('/one/:id',authenticateToken, controller.getById);
router.post('/create',authenticateToken,authorizeRoles(Role.STARTUP), controller.create);
router.put('/update/:id',authenticateToken,authorizeRoles(Role.STARTUP), controller.update);
router.delete('/delete/:id',authenticateToken,authorizeRoles(Role.STARTUP), controller.delete);
router.get('/search', authenticateToken, controller.search);

export default router;
