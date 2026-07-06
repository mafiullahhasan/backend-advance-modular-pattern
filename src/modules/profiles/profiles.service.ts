import { pool } from "../../db"

const createProfilesService = async (payload: any) => {
    const { user_id, bio, address, phone, gender } = payload

    const user = await pool.query(`
        SELECT * FROM users WHERE id=$1
        `, [user_id])


    if (user.rows.length === 0) {
        throw new Error("USer Not Found!")
    }

    const result = await pool.query(`
        INSERT INTO profiles(user_id, bio, address, phone, gender) VALUES($1,$2,$3,$4,$5)
         RETURNING *
        `, [user_id, bio, address, phone, gender])
    return result
}

export { createProfilesService }