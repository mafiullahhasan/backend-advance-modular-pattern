import type { Request, Response } from "express"
import { authService } from "./auth.service"

const login = async (req: Request, res: Response) => {
    try {
        const result = await authService.loginService(req.body)
        const { refreshTokenSecret } = result

        res.cookie("refreshToken", refreshTokenSecret, {
            secure: false,
            httpOnly: true,
            sameSite: "lax"
        })
        res.status(200).json({
            success: true,
            message: "User Logged in Successfully",
            data: result
        })
    } catch (error: any) {
        res.status(500).json({
            success: false,
            message: error.message,
            error: error
        })
    }
}

const refreshToken = async (req: Request, res: Response) => {
    const { refreshToken } = req.cookies
    try {
        const result = await authService.refreshTokenGenerate(refreshToken)
        console.log(result);
        
        res.status(200).json({
            success: true,
            message: "Access Token Generated",
            data: result
        })
    } catch (error: any) {
        res.status(500).json({
            success: false,
            message: error.message,
            error: error
        })
    }

}

export const authController = {
    login,
    refreshToken
}