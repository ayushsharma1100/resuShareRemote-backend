const connectToMongo = require('./db.js')
const express = require('express')
const app = express()
let cors = require('cors');
require('dotenv').config();
const port = process.env.PORT || 5500


connectToMongo();
app.use(express.json())
app.use(cors());
// Available Routes

app.use('/api/auth', require('./routes/auth.js'))
app.use('/api/notes', require('./routes/notes.js'))
  
app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})
