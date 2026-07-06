import type { NextFunction, Request, Response } from "express";
import fs from "fs"

const logger = (req: Request, res: Response, next: NextFunction) => {
    const log = `
================================
Time   : ${new Date().toLocaleString()}
Method : ${req.method}
URL    : ${req.originalUrl}
================================
`;

    fs.appendFile("logger.txt", log, (err) => {
        if (err) console.log(err);
    });

    next();
}

export default logger