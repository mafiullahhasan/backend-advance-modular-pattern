import type { Request, Response } from "express"
import { createUserService, deleteUserService, getAllUsersService, getSingleUserService, updateUserService } from "./user.service"
import sendResponse from "../../utility/sendResponse"

const registerUser = async (req: Request, res: Response) => {
    // const { name, email, password, age } = req.body
    try {

        const result = await createUserService(req.body)

        res.status(201).json({
            success: true,
            message: "User Created Successfully",
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

const getAllUsers = async (req: Request, res: Response) => {
    try {
        const result = await getAllUsersService()
        // res.status(200).json({
        //     success: true,
        //     message: "Users Retrived Successfully",
        //     data: result.rows
        // })
        sendResponse(res, {
            statusCode: 200,
            success: true,
            message: "Users Retrived Successfully",
            data: result.rows
        })

    } catch (error: any) {
        sendResponse(res, {
            statusCode: 500,
            success: false,
            message: error.message,
            error: error
        })
    }
}

const getSingleUser = async (req: Request, res: Response) => {
    const { id } = req.params

    try {
        const result = await getSingleUserService(id as string)

        if (result.rowCount === 0) {
            res.status(404).json({
                success: false,
                message: "User not Found",
                data: {}
            })
        }

        res.status(200).json({
            success: true,
            message: "User Retrived Successfully",
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

const updateUser = async (req: Request, res: Response) => {
    const { id } = req.params
    // const { name, password, age, is_active } = req.body
    try {

        const result = await updateUserService(req.body, id as string)
        if (result.rowCount === 0) {
            res.status(404).json({
                success: false,
                message: "User not Found",
                data: {}
            })
        }

        res.status(200).json({
            success: true,
            message: "User Updated Successfully",
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

const deleteUser = async (req: Request, res: Response) => {
    const { id } = req.params

    try {
        const result = await deleteUserService(id as string)
        if (result.rowCount === 0) {
            res.status(404).json({
                success: false,
                message: "User not Found",
                data: {}
            })
        }

        res.status(200).json({
            success: true,
            message: "User Deleted Successfully!",
        })

    } catch (error: any) {
        res.status(500).json({
            success: false,
            message: error.message,
            error: error
        })
    }

}

export { registerUser, getAllUsers, getSingleUser, updateUser, deleteUser }