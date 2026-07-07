

   import { createRequire } from 'module';

   const require = createRequire(import.meta.url);

  

// src/app.ts
import express from "express";

// src/modules/user/user.router.ts
import { Router } from "express";

// src/modules/user/user.service.ts
import bcrypt from "bcryptjs";

// src/db/index.ts
import { Pool } from "pg";

// src/config/index.ts
import dotenv from "dotenv";
import path from "path";
dotenv.config({
  path: path.join(process.cwd(), ".env")
});
var config = {
  connectionString: process.env.CONNECTION_STRING,
  port: process.env.PORT,
  accessTokenSecret: process.env.ACCESS_TOKEN_SECRET,
  refreshTokenSectet: process.env.REFRESH_TOKEN_SECRET
};
var config_default = config;

// src/db/index.ts
var pool = new Pool({
  connectionString: config_default.connectionString
});
var initDB = async () => {
  try {
    await pool.query(`
            CREATE TABLE IF NOT EXISTS users(
                id SERIAL PRIMARY KEY,
                name VARCHAR(20),
                email VARCHAR(20) UNIQUE NOT NULL,
                password TEXT NOT NULL,
                age INT,
                is_active BOOLEAN DEFAULT true,
                role VARCHAR(10) DEFAULT 'user',

                created_at TIMESTAMP DEFAULT NOW(),
                updated_at TIMESTAMP DEFAULT NOW()
            )
            `);
    await pool.query(`
                CREATE TABLE IF NOT EXISTS profiles(
                id SERIAL PRIMARY KEY,
                user_id INT UNIQUE REFERENCES users(id) ON DELETE CASCADE,
                bio TEXT,
                address TEXT,
                phone VARCHAR(15),
                gender VARCHAR(10),
                
                created_at TIMESTAMP DEFAULT NOW(),
                updated_at TIMESTAMP DEFAULT NOW()
                )
                `);
    console.log("DATABASE CONNECTED SUCCESSFULLY");
  } catch (error) {
    console.log(error);
  }
};

// src/modules/user/user.service.ts
var createUserService = async (payload) => {
  const { name, email, password, age, role } = payload;
  const hashPassword = await bcrypt.hash(password, 10);
  const result = await pool.query(`
            INSERT INTO users(name,email,password,age,role) VALUES($1,$2,$3,$4,COALESCE($5,'user')) 
            RETURNING *
            `, [name, email, hashPassword, age, role]);
  delete result.rows[0].password;
  delete result.rows[0].is_active;
  return result;
};
var getAllUsersService = async () => {
  const result = await pool.query(`
            SELECT * FROM users
            `);
  result.rows.forEach((user) => {
    delete user.password;
    delete user.is_active;
  });
  return result;
};
var getSingleUserService = async (id) => {
  const result = await pool.query(`
        SELECT * FROM users WHERE id=$1
        `, [id]);
  delete result.rows[0].password;
  delete result.rows[0].is_active;
  return result;
};
var updateUserService = async (payload, id) => {
  const { name, password, age, is_active } = payload;
  const hashPassword = await bcrypt.hash(password, 10);
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
  delete result.rows[0].password;
  delete result.rows[0].is_active;
  return result;
};
var deleteUserService = async (id) => {
  const result = await pool.query(`
            DELETE FROM users WHERE id=$1
            `, [id]);
  return result;
};

// src/utility/sendResponse.ts
var sendResponse = (res, data) => {
  res.status(data.statusCode).json({
    success: data.success,
    message: data.message,
    data: data.data,
    error: data.error
  });
};
var sendResponse_default = sendResponse;

// src/modules/user/user.controller.ts
var registerUser = async (req, res) => {
  try {
    const result = await createUserService(req.body);
    res.status(201).json({
      success: true,
      message: "User Created Successfully",
      data: result.rows[0]
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
      error
    });
  }
};
var getAllUsers = async (req, res) => {
  try {
    const result = await getAllUsersService();
    sendResponse_default(res, {
      statusCode: 200,
      success: true,
      message: "Users Retrived Successfully",
      data: result.rows
    });
  } catch (error) {
    sendResponse_default(res, {
      statusCode: 500,
      success: false,
      message: error.message,
      error
    });
  }
};
var getSingleUser = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await getSingleUserService(id);
    if (result.rowCount === 0) {
      res.status(404).json({
        success: false,
        message: "User not Found",
        data: {}
      });
    }
    res.status(200).json({
      success: true,
      message: "User Retrived Successfully",
      data: result.rows[0]
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
      error
    });
  }
};
var updateUser = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await updateUserService(req.body, id);
    if (result.rowCount === 0) {
      res.status(404).json({
        success: false,
        message: "User not Found",
        data: {}
      });
    }
    res.status(200).json({
      success: true,
      message: "User Updated Successfully",
      data: result.rows[0]
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
      error
    });
  }
};
var deleteUser = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await deleteUserService(id);
    if (result.rowCount === 0) {
      res.status(404).json({
        success: false,
        message: "User not Found",
        data: {}
      });
    }
    res.status(200).json({
      success: true,
      message: "User Deleted Successfully!"
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
      error
    });
  }
};

// src/middleware/auth.ts
import jwt from "jsonwebtoken";
var auth = (...roles) => {
  return async (req, res, next) => {
    try {
      const token = req.headers.authorization;
      if (!token) {
        res.status(401).json({
          success: false,
          message: "Unauthorized Access!!"
        });
      }
      const decoded = jwt.verify(token, config_default.accessTokenSecret);
      const { email } = decoded;
      const userData = await pool.query(`
             SELECT * FROM users WHERE email=$1
             `, [email]);
      const user = userData.rows[0];
      if (!user) {
        res.status(404).json({
          success: false,
          message: "User not found!!"
        });
      }
      if (roles.length && !roles.includes(user.role)) {
        res.status(409).json({
          success: false,
          message: "Forbidden Access!!"
        });
      }
      req.user = decoded;
      next();
    } catch (error) {
      next(error);
    }
  };
};
var auth_default = auth;

// src/types/index.ts
var USER_ROLE = {
  admin: "admin",
  agent: "agent",
  user: "user"
};

// src/modules/user/user.router.ts
var router = Router();
router.post("/", registerUser);
router.get("/", auth_default(USER_ROLE.admin, USER_ROLE.agent), getAllUsers);
router.get("/:id", getSingleUser);
router.put("/:id", updateUser);
router.delete("/:id", deleteUser);
var userRouter = router;

// src/modules/profiles/profiles.router.ts
import { Router as Router2 } from "express";

// src/modules/profiles/profiles.service.ts
var createProfilesService = async (payload) => {
  const { user_id, bio, address, phone, gender } = payload;
  const user = await pool.query(`
        SELECT * FROM users WHERE id=$1
        `, [user_id]);
  if (user.rows.length === 0) {
    throw new Error("USer Not Found!");
  }
  const result = await pool.query(`
        INSERT INTO profiles(user_id, bio, address, phone, gender) VALUES($1,$2,$3,$4,$5)
         RETURNING *
        `, [user_id, bio, address, phone, gender]);
  return result;
};

// src/modules/profiles/profiles.controller.ts
var createProfiles = async (req, res) => {
  try {
    const result = await createProfilesService(req.body);
    res.status(201).json({
      success: true,
      message: "Profile Created Successfully",
      data: result.rows[0]
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
      error
    });
  }
};

// src/modules/profiles/profiles.router.ts
var router2 = Router2();
router2.post("/", createProfiles);
var profilesRouter = router2;

// src/modules/auth/auth.router.ts
import { Router as Router3 } from "express";

// src/modules/auth/auth.service.ts
import bcrypt2 from "bcryptjs";
import jwt2 from "jsonwebtoken";
var loginService = async (payload) => {
  const { email, password } = payload;
  const user = await pool.query(`
        SELECT * FROM users WHERE email=$1
        `, [email]);
  if (user.rowCount === 0) {
    throw new Error("User not Found!");
  }
  const comparePassword = await bcrypt2.compare(password, user.rows[0].password);
  if (!comparePassword) {
    throw new Error("Invalid User Credentials!");
  }
  const jwtPayload = {
    id: user.rows[0].id,
    name: user.rows[0].name,
    email: user.rows[0].email,
    role: user.rows[0].role
  };
  const generateAccessToken = jwt2.sign(jwtPayload, config_default.accessTokenSecret, { expiresIn: "15m" });
  const generateRefreshToken = jwt2.sign(jwtPayload, config_default.refreshTokenSectet, { expiresIn: "5d" });
  return { accessTokenSecret: generateAccessToken, refreshTokenSecret: generateRefreshToken };
};
var refreshTokenGenerate = async (token) => {
  try {
    if (!token) {
      throw new Error("Unauthorized User!!");
    }
    const decoded = jwt2.verify(
      token,
      config_default.refreshTokenSectet
    );
    const { email } = decoded;
    const userData = await pool.query(`
             SELECT * FROM users WHERE email=$1
             `, [email]);
    const user = userData.rows[0];
    if (!user) {
      throw new Error("User Not found!!");
    }
    const jwtPayload = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role
    };
    const generateAccessToken = jwt2.sign(jwtPayload, config_default.accessTokenSecret, { expiresIn: "15m" });
    return { accessTokenSecret: generateAccessToken };
  } catch (error) {
    console.log(error);
  }
};
var authService = {
  loginService,
  refreshTokenGenerate
};

// src/modules/auth/auth.controller.ts
var login = async (req, res) => {
  try {
    const result = await authService.loginService(req.body);
    const { refreshTokenSecret } = result;
    res.cookie("refreshToken", refreshTokenSecret, {
      secure: false,
      httpOnly: true,
      sameSite: "lax"
    });
    res.status(200).json({
      success: true,
      message: "User Logged in Successfully",
      data: result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
      error
    });
  }
};
var refreshToken = async (req, res) => {
  const { refreshToken: refreshToken2 } = req.cookies;
  try {
    const result = await authService.refreshTokenGenerate(refreshToken2);
    console.log(result);
    res.status(200).json({
      success: true,
      message: "Access Token Generated",
      data: result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
      error
    });
  }
};
var authController = {
  login,
  refreshToken
};

// src/modules/auth/auth.router.ts
var router3 = Router3();
router3.post("/login", authController.login);
router3.post("/refresh-token", authController.refreshToken);
var authRouter = router3;

// src/middleware/logger.ts
import fs from "fs";
var logger = (req, res, next) => {
  const log = `
================================
Time   : ${(/* @__PURE__ */ new Date()).toLocaleString()}
Method : ${req.method}
URL    : ${req.originalUrl}
================================
`;
  fs.appendFile("logger.txt", log, (err) => {
    if (err) console.log(err);
  });
  next();
};
var logger_default = logger;

// src/app.ts
import CookieParser from "cookie-parser";

// src/utility/globalErrorHandler.ts
var globalErrorHandler = (err, req, res, next) => {
  res.status(500).json({
    success: false,
    message: err.message || "Internal Server Error"
  });
};
var globalErrorHandler_default = globalErrorHandler;

// src/app.ts
var app = express();
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.text());
app.use(CookieParser());
app.use(logger_default);
app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    "message": "Mama Server Ready",
    "author": "MR.Joint"
  });
});
app.use("/api/users", userRouter);
app.use("/api/profiles", profilesRouter);
app.use("/api/auth", authRouter);
app.use(globalErrorHandler_default);
var app_default = app;

// src/server.ts
var main = () => {
  app_default.listen(config_default.port, () => {
    initDB();
    console.log(`Example app listening on port ${config_default.port}`);
  });
};
main();
//# sourceMappingURL=server.js.map