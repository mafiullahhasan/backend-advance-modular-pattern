import type { NextFunction, Request, Response } from "express"
import jwt, { type JwtPayload } from "jsonwebtoken"
import config from "../config"
import { pool } from "../db"
import type { Roles } from "../types"

const auth = (...roles: Roles[]) => {
    return async (req: Request, res: Response, next: NextFunction) => {

        try {
            const token = req.headers.authorization
            if (!token) {
                res.status(401).json({
                    success: false,
                    message: "Unauthorized Access!!",
                })
            }
            // console.log(token);

            const decoded = jwt.verify(token as string, config.accessTokenSecret) as JwtPayload
            const { email } = decoded;
            // console.log(email);
            const userData = await pool.query(`
             SELECT * FROM users WHERE email=$1
             `, [email])
            // console.log(userData);
            const user = userData.rows[0]

            if (!user) {
                res.status(404).json({
                    success: false,
                    message: "User not found!!",
                })
            }

            if (roles.length && !roles.includes(user.role)) {
                res.status(409).json({
                    success: false,
                    message: "Forbidden Access!!",
                })
            }

            req.user = decoded
            next()
        } catch (error) {
            next(error)
        }
    }
}

export default auth