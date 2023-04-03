const mongoose = require('mongoose');
mongoose.set('strictQuery', true);

module.exports = () => new Promise((resolve, reject) => {
    mongoose.connect(process.env.MONGODB_URL, {
        useNewUrlParser: true,
        useUnifiedTopology: true
    }, err => {
        if (err) reject(err.message);
        resolve('Connected to MongoDB!!!');
    });
});