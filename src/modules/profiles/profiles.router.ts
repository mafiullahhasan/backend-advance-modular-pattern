import { Router } from "express";
import { createProfiles } from "./profiles.controller";

const router = Router()


router.post("/", createProfiles)


export const profilesRouter = router