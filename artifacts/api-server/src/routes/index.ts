import { Router, type IRouter } from "express";
import healthRouter from "./health";
import resetPasswordRouter from "./resetPassword";

const router: IRouter = Router();

router.use(healthRouter);
router.use(resetPasswordRouter);

export default router;
