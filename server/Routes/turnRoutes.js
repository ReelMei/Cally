import express from 'express';
import { protect } from '../Middleware/auth.js';
import { getTurnCredentials } from '../Controllers/turnController.js';

const turnRouter = express.Router();

turnRouter.get('/credentials', protect, getTurnCredentials);

export default turnRouter;
