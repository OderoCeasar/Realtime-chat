const user = require('../models/userModel');
const bcrypt = require('bcryptjs');
const { OAuth2Client } = require('google-auth-library');


const register = async (req, res) => {
    const { firstname, lastname, email, password } = req.body;
    try {
        const existingUser = await user.findOne({ email });
        if (existingUser)
            return res.status(400).json({ error: 'User already exists' });
        const fullname = firstname + ' ' + lastname;
        const newuser = new user({ email, password, name: fullname });
        const token = await newuser.generateAuthToken();
        await newuser.save();
        res.json({ message: 'success', token: token });
    } catch (error) {
        console.log("Error in register " + error);
        res.status(500).send(error);
    }
};


const login = async (req, res) => {
    const { email, password } = req.body;
    try {
        const valid = await user.findOne({ email });
        if (!valid) res.status(200).json({ message: "User don't exist" });
        const validPassword = await bcrypt.compare(password, valid.password);
        if (!validPassword) {
            res.status(200).json({ message: "Invalid Credentials" });
        } else {
            const token = await valid.generateAuthToken();
            await valid.save();
            res.cookie('userToken', token, {
                httpOnly: true,
                maxAge: 24 * 60 * 60 * 1000,
            });
            res.status(200).json({ token: token, status: 200});
        }
    } catch (error) {
        res.status(500).json({ error: error });
    }
};


const validUser = async (req, res) => {
    try {
        const validUser = await user
            .findOne({ _id: req.rootUserId })
            .select('-password');
        if (!validUser) res.json({ message: 'user is not valid' });
        res.status(201).json({
            user: validUser,
            token: req.token,
        });    
    } catch (error) {
        res.status(500).json({ error: error });
        console.log(error);
    }
};


const googleAuth = async (req, res) => {
    try {
        const { tokenId } = req.body;
        const client = new OAuth2Client(process.env.CLIENT_ID);
        const verify = await client.verifyIdToken({
            idToken: tokenId,
            audience: process.env.CLIENT_ID,
        });
        const { email_verified, email, name, picture } = verify.getPayload();
        if (!email_verified) res.json({ message: "Email not verified" });
        const userExist = await user.findOne({ email }).select('-password');
        if (userExist) {
            res.cookie('userToken', tokenId, {
                httpOnly: true,
                maxAge: 24 * 60 * 60 * 1000,
            });
            res.status(200).json({ token: tokenId, user: userExist });
        } else {
            const password = email + process.env.CLIENT_ID;
            const newuser = await user({
                name: name,
                profilePic: picture,
                password,
                email,
            });
            await newuser.save();
            res.cookie('userToken', tokenId, {
                httpOnly: true,
                maxAge: 24 * 60 * 60 * 1000,
            });
            res.status(200).json({ message: 'User registered Successfully', token: tokenId });
        }
    } catch (error) {
        res.status(500).json({ error: error });
        console.log('error in googleAuth backend' + error);
    }
};


const logout = async (req, res) => {
    req.rootUser.tokens = req.rootUser.tokens.filter((e) => e.token != req.token);
    await req.rootUser.save();
    res.clearCookie('userToken');
    res.status(200).json({ message: 'Logout successful' });
};


const searchUsers = async (req, res) => {
    const search = req.query.search
      ? {
            $or: [
                { name: { $regex: req.query.search, $options: 'i'}},
                { email: { $regex: req.query.search, $options: 'i'}},
            ],
      }
      : {};

    const users = await user.find({
        ...search,
        _id: { $ne: req.rootUserId },
    }).select('-password');
    res.status(200).json(users);  
};


const getUserById = async (req, res) => {
    const { id } = req.params;
    try {
        const selectedUser = await user.findOne({ _id: id }).select('-password');
        res.status(200).json(selectedUser);
    } catch (error) {
        res.status(500).json({ error: error });
    }
};


const updateInfo = async (req, res) => {
    const { id } = req.params;
    const { bio, name } = req.body;
    const updateUser = await user.findByIdAndUpdate(id, {name, bio} );
    return updateUser;
};

module.exports = { register, login, validUser, googleAuth, logout, searchUsers, getUserById, updateInfo };