const jwt = require('jsonwebtoken');
const user = require('../models/userModel');


const Auth = async (req, res, next) => {
    try {

        const bearerHeader = req.headers.authorization;
        if (!bearerHeader || !bearerHeader.startsWith("Bearer ")) {
            return res.status(401).json({ error: "NO token provided" });
        }


        let token = bearerHeader.split(' ')[1];

        if  (token.length < 500) {
            const verifiedUser = jwt.verify(token, process.env.SECRET);
            const rootUser = await user 
               .findOne({ _id: verifiedUser.id })
               .select('-password');

            if (!rootUser) return res.status(401).json({ error: "User not found" });   

            req.token = token;
            req.rootUser = rootUser;
            req.rootUserId = rootUser._id;   
        } else {
            const data = jwt.decode(token);
            const googleUser = await user 
               .findOne({ email: data.email })
               .select('-password');

            if (!googleUser) return res.status(401).json({ error: "Google user not found" });

            
            req.token = token;
            req.rootUser = googleUser;
            req.rootUserId = googleUser._id;
            
            
        }
        next();
    } catch (error) {
        console.error("Auth middleware error:", error.message);
        res.status(401).json({ error: "Invalid Token" });
        
    }
};

module.exports = { Auth };