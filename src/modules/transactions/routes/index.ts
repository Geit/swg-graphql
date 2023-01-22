import { Router } from 'express';

import captureTransaction from './captureTransaction';

const router = Router();

router.use(captureTransaction);

export default router;
