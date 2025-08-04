const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI, {
            useUnifiedTopology: true,
            useNewUrlParser: true,
        });
        console.log("MongoDB connection successfully!");
    } catch (error) {
        console.log("MongoDB connection failed!" + error);
        process.exit(1);
    }
};


module.exports = connectDB;