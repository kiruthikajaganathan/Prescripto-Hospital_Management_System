import mongoose from "mongoose";

const connectDB = async () => {

    mongoose.connection.on('connected', () => console.log("Database Connected"))
    const uri = process.env.MONGO_URI || process.env.MONGODB_URI
    if (!uri) {
        throw new Error("MONGO_URI is not set")
    }
    await mongoose.connect(uri)

}

export default connectDB;
