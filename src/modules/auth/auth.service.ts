import bcrypt from "bcryptjs";
import { pool } from "../../db"
import jwt, { type JwtPayload } from "jsonwebtoken"
import config from "../../config";

const loginService = async (payload: { email: string, password: string }) => {
    const { email, password } = payload
    // check if user exist or not
    // check password correct
    // generate jwt
    const user = await pool.query(`
        SELECT * FROM users WHERE email=$1
        `, [email])

    if (user.rowCount === 0) {
        throw new Error("User not Found!")
    }


    const comparePassword = await bcrypt.compare(password, user.rows[0].password)

    if (!comparePassword) {
        throw new Error("Invalid User Credentials!")
    }

    const jwtPayload = {
        id: user.rows[0].id,
        name: user.rows[0].name,
        email: user.rows[0].email,
        role: user.rows[0].role,
    }

    const generateAccessToken = jwt.sign(jwtPayload, config.accessTokenSecret, { expiresIn: "15m" })
    const generateRefreshToken = jwt.sign(jwtPayload, config.refreshTokenSectet, { expiresIn: "5d" })

    return { accessTokenSecret: generateAccessToken, refreshTokenSecret: generateRefreshToken }


}

const refreshTokenGenerate = async (token: string) => {
    try {
        if (!token) {
            throw new Error("Unauthorized User!!")
        }

        const decoded = jwt.verify(
            token,
            config.refreshTokenSectet
        ) as JwtPayload

        const { email } = decoded;
        const userData = await pool.query(`
             SELECT * FROM users WHERE email=$1
             `, [email])
        // console.log(userData);
        const user = userData.rows[0]

        if (!user) {
            throw new Error("User Not found!!")
        }

        const jwtPayload = {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
        }

        const generateAccessToken = jwt.sign(jwtPayload, config.accessTokenSecret, { expiresIn: "15m" })

        return { accessTokenSecret: generateAccessToken }

    } catch (error) {
        console.log(error);

    }


}

export const authService = {
    loginService,
    refreshTokenGenerate
}