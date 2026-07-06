import bcrypt from "bcryptjs"
import { pool } from "../../db"
import type { IUser } from "./user.interface"

const createUserService = async (payload: IUser) => {
    const { name, email, password, age, role } = payload
    const hashPassword = await bcrypt.hash(password, 10)

    const result = await pool.query(`
            INSERT INTO users(name,email,password,age,role) VALUES($1,$2,$3,$4,COALESCE($5,'user')) 
            RETURNING *
            `, [name, email, hashPassword, age, role])
    delete result.rows[0].password
    delete result.rows[0].is_active
    return result
}

const getAllUsersService = async () => {
    const result = await pool.query(`
            SELECT * FROM users
            `)
    result.rows.forEach(user => {
        delete user.password
        delete user.is_active
    })
    return result
}

const getSingleUserService = async (id: string) => {
    const result = await pool.query(`
        SELECT * FROM users WHERE id=$1
        `, [id])
    delete result.rows[0].password
    delete result.rows[0].is_active
    return result

}

const updateUserService = async (payload: IUser, id: string) => {
    const { name, password, age, is_active } = payload
    const hashPassword = await bcrypt.hash(password, 10)
    const result = await pool.query(
        `
  UPDATE users
  SET
    name = COALESCE($1, name),
    password = COALESCE($2, password),
    age = COALESCE($3, age),
    is_active = COALESCE($4, is_active)
    WHERE id = $5
    RETURNING *
  `,
        [name, hashPassword, age, is_active, id]
    );
    delete result.rows[0].password
    delete result.rows[0].is_active
    return result
}

const deleteUserService = async (id: string) => {
    const result = await pool.query(`
            DELETE FROM users WHERE id=$1
            `, [id])
    return result
}

export { createUserService, getAllUsersService, getSingleUserService, updateUserService, deleteUserService }