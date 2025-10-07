import { Router } from 'express';
import { InvestorController } from '../controllers/investor.controller';

const controller = new InvestorController();
const router = Router();

router.get('all/', controller.getAll);
router.get('one/:id', controller.getById);
router.post('create/', controller.create);
router.put('update/:id', controller.update);
router.delete('delete/:id', controller.delete);

export default router;
