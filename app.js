const express = require('express')
const {open} = require('sqlite')
const sqlite3 = require('sqlite3')
const path = require('path')
const bcrypt = require('bcrypt')
const app = express()
app.use(express.json())
const dbPath = path.join(__dirname, 'userData.db')

let db = null
const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    })
    app.listen(3000, () => {
      console.log('Server is Running at http://localhost:3000/')
    })
  } catch (e) {
    console.log(`DB Error: ${e.message}`)
    process.exit(1)
  }
}
initializeDBAndServer()

//get data
// app.get('/users/', async (request, response) => {
//   const userQuery = `
//         SELECT * FROM user;
//     `
//   const userArray = await db.all(userQuery)
//   response.send(userArray)
// })

//register
app.post('/register', async (request, response) => {
  const {username, name, password, gender, location} = request.body

  const hashPassword = await bcrypt.hash(password, 10)
  const findUserQuery = `
      SELECT 
        * 
      FROM 
        user 
      WHERE 
        username = "${username}";
  `
  const userData = await db.get(findUserQuery)
  if (userData === undefined) {
    const postUserQuery = `
      INSERT INTO 
        user (username, name, password, gender, location)
      VALUES (
        "${username}","${name}", "${hashPassword}", "${gender}", "${location}"
      );
    `
    if (password.length < 5) {
      response.status(400)
      response.send('Password is too short')
    } else {
      let newUserDetails = await db.run(postUserQuery)
      response.status(200)
      response.send('User created successfully')
    }
  } else {
    response.status(400)
    response.send('User already exists')
  }
})

//login
app.post('/login', async (request, response) => {
  const {username, password} = request.body
  const loginUserQuery = `
      SELECT 
        * 
      FROM 
        user
      WHERE 
        username = "${username}"; 
  `
  const userData = await db.get(loginUserQuery)
  if (userData === undefined) {
    response.status(400)
    response.send('Invalid user')
  } else {
    const checkPassword = await bcrypt.compare(password, userData.password)
    if (checkPassword === true) {
      response.status(200)
      response.send('Login success!')
    } else {
      response.status(400)
      response.send('Invalid password')
    }
  }
})

//change password
app.put('/change-password', async (request, response) => {
  
  const {username, oldPassword, newPassword} = request.body
  const userData = `
      SELECT 
        * 
      FROM 
        user 
      WHERE 
        username = "${username}";
  `
  const checkUser = await db.get(userData)
  if (checkUser === undefined) {
    response.status(400)
    response.send('User not registered')
  } else {
    const checkOldPassword = await bcrypt.compare(
      oldPassword,
      checkUser.password,
    )
    if (checkOldPassword === true) {
      const lengthOfTHePassword = newPassword.length
      if (lengthOfTHePassword < 5) {
        response.status(400)
        response.send('Password is too short')
      } else {
        const newhashedPassword = await bcrypt.hash(newPassword, 10)
        const changePasswordQuery = `
          UPDATE user
          SET 
           password = "${newhashedPassword}"
          WHERE 
            username = "${username}";
      `
        await db.run(changePasswordQuery)
        response.send('Password updated')
      }
    } else {
      response.status(400)
      response.send('Invalid current password')
    }
  }
})

module.exports = app
