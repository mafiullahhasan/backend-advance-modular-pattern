import express, { type Application, type Request, type Response } from "express"
import { userRouter } from "./modules/user/user.router"
import { profilesRouter } from "./modules/profiles/profiles.router"
import { authRouter } from "./modules/auth/auth.router"
import logger from "./middleware/logger"
import CookieParser from "cookie-parser"
import globalErrorHandler from "./utility/globalErrorHandler"


const app: Application = express()

app.use(express.urlencoded({ extended: true }))
app.use(express.json())
app.use(express.text())
app.use(CookieParser())

app.use(logger);


app.get('/', (req: Request, res: Response) => {
    res.status(200).json({
        success: true,
        'message': "Mama Server Ready",
        "author": "MR.Joint"
    })
})

app.use("/api/users", userRouter)
app.use("/api/profiles", profilesRouter)
app.use("/api/auth", authRouter)


// Global Error Handling Middleware
app.use(globalErrorHandler);


export default app