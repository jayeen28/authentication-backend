require('dotenv').config();
const formData = require('express-form-data');
const express = require('express');
const cors = require('cors');
const path = require('path');
const protocol = require(process.env.NODE_ENV === 'production' ? 'https' : 'http');
const cookieParser = require('cookie-parser');
const fs = require('fs');

const { socketCtrl, searchCtrl } = require('./controllers');
const routers = require('./routes');
const { PORT, origin } = require('./data/brain');
const { connect } = require('./db');

const app = express();
app.use(cors({
    origin,
    credentials: true
}));
const server = protocol.createServer({
    key: fs.readFileSync(path.resolve() + '/ssl/key.key'),
    cert: fs.readFileSync(path.resolve() + '/ssl/cert.crt'),
}, app);
socketCtrl(server);
app.use(cookieParser());
app.use(express.json());
app.use(formData.parse());
app.use(routers);

/**
 * This is the root function of the server.
 * Everything will be executed after the database is connected.
 */
const main = async () => {
    try {
        console.log(await searchCtrl.start());
        console.log(await connect());
        server.listen(PORT, () => console.log('Server is running on port =>', PORT));
    }
    catch (e) { console.error(e) };
};

main();