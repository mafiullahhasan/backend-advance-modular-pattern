import type { Response } from "express"

type Tresponse<T> = {
    statusCode: number,
    success: boolean,
    message: string,
    data?: T,
    error?: any
}

const sendResponse = <T>(res: Response, data: Tresponse<T>) => {
    res.status(data.statusCode).json({
        success: data.success,
        message: data.message,
        data: data.data,
        error: data.error
    })
}


export default sendResponse