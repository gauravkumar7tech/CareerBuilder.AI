import express from 'express';
import { loginUser, registerUser, getMe, logout } from '../controllers/auth.controllers';
const router = express.Router();


router.post('./login',loginUser);
router.post('./register', registerUser);
router.get('./me', getMe);
router.post('./logout', logout);

export default router;