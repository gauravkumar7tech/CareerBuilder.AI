import mongoose from 'mongoose';
export const db = async () => {
    try{
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Mongo db connected successfully");
    }
    catch(err){
        console.log(err);
    }
}


export default db;