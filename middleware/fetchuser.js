var jwt = require('jsonwebtoken');
require('dotenv').config()

const fetchuser = (req, res, next)=>{
    const jwtToken = req.header('auth-token');
    var secretToken = process.env.JWT_TOKEN;
    if(!jwtToken){
        return res.status(401).json({error: "Please authenticate using a valid token"});
    }
    try {
        const userId = jwt.verify(jwtToken, secretToken);
        req.user = userId;
    
        next();
    } catch (error) {
        return res.status(401).json({error: "Please authenticate using a valid token"});
    }
    
}

module.exports = fetchuser;