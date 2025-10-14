import { Router } from 'express';
import { MatchController } from '../controllers/match.controller';
import { authenticateToken } from '../middlewares/auth.middleware';

const controller = new MatchController();
const router = Router();

router.get('/all/',authenticateToken, controller.getAll);
router.get('/one/:id',authenticateToken, controller.getById);
router.post('/create',authenticateToken, controller.create);
router.patch('/update/:id/status',authenticateToken, controller.updateStatus);
router.delete('/delete/:id',authenticateToken, controller.delete);
router.post('/get-or-create', authenticateToken, controller.getOrCreate);
router.post('/request', authenticateToken, controller.request);
router.patch('/:id/accept', authenticateToken, controller.accept);
router.patch('/:id/reject', authenticateToken, controller.reject);

export default router;
