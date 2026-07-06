import { Router } from "express";
import { deleteUser, getAllUsers, getSingleUser, registerUser, updateUser } from "./user.controller";
import auth from "../../middleware/auth";
import { USER_ROLE } from "../../types";

const router = Router()



router.post("/", registerUser)
router.get("/", auth(USER_ROLE.admin, USER_ROLE.agent), getAllUsers)
router.get("/:id", getSingleUser)
router.put("/:id", updateUser)
router.delete("/:id", deleteUser)

export const userRouter = router