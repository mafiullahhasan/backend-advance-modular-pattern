import dotenv from "dotenv"
import path from "path"

dotenv.config({
    path: path.join(process.cwd(), ".env")
})

const config = {
    connectionString: process.env.CONNECTION_STRING as string,
    port: process.env.PORT,
    accessTokenSecret: process.env.ACCESS_TOKEN_SECRET as string,
    refreshTokenSectet: process.env.REFRESH_TOKEN_SECRET as string
}

export default config