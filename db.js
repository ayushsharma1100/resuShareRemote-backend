require('dotenv').config();
const mongoose = require('mongoose')
const mongoURI = process.env.DATABASE

const connectToMongo = ()=>{
    mongoose.connect(mongoURI).then(()=>{console.log("connected to db successfully");}).catch(error=>console.log(error));
}

module.exports = connectToMongo;