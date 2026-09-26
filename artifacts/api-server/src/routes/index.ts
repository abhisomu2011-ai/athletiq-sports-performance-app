import { Router, type IRouter } from "express";
import healthRouter from "./health";
import rahulRouter from "./rahul";

const router: IRouter = Router();

router.use(healthRouter);
router.use(rahulRouter);

export default router;
