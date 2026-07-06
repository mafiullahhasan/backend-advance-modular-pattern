import type { Request, Response } from "express";
import { createProfilesService } from "./profiles.service";

const createProfiles = async (req: Request, res: Response) => {
    try {
        const result = await createProfilesService(req.body)
        res.status(201).json({
            success: true,
            message: "Profile Created Successfully",
            data: result.rows[0]
        })

    } catch (error: any) {
        res.status(500).json({
            success: false,
            message: error.message,
            error: error
        })
    }
}

export { createProfiles }