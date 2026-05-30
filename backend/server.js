const express = require('express');
const moongoose = require('mongoose');
const dotenv = require('dotenv');
const scanRoutes = require('./routes/scanRoutes');
dotenv.config();

const app = express();

app.use(express.json());

app.use((req, res, next) => {
    console.log(req.path, req.method);
    next();
});

app.use('/api/scans', scanRoutes);

moongoose.connect(process.env.MONGO_URI)
    .then(() => {
        app.listen(process.env.PORT || 3000, () => {
            console.log("listening and connected to the db", process.env.PORT);
        })
    })
    .catch((err) => {
        console.log(err);
    });