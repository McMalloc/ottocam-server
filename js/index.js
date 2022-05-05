"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const body_parser_1 = __importDefault(require("body-parser"));
const dotenv_1 = __importDefault(require("dotenv"));
const sqlite3_1 = __importDefault(require("sqlite3"));
const fs_1 = __importDefault(require("fs"));
dotenv_1.default.config();
const app = (0, express_1.default)();
const port = process.env.PORT;
const raw = body_parser_1.default.raw({ limit: '5mb', type: 'application/octet-stream' });
const json = body_parser_1.default.json();
const db = new sqlite3_1.default.Database(`./db/db_v${process.env.DB_VERSION}.sqlite`, err => {
    if (err)
        return console.error('Error opening database', err);
    console.log("Database connection established.");
    db.serialize(() => {
        let readingsTableExits = false;
        db.each(`SELECT name FROM sqlite_master WHERE type='table' AND name='readings';`, (err, row) => {
            readingsTableExits = true;
        }, err => {
            if (!readingsTableExits)
                db.run("CREATE TABLE readings (humidity REAL, temp REAL, sensor_id INTEGER, read_at TEXT, created_at TEXT)");
        });
        let imagesTableExits = false;
        db.each(`SELECT name FROM sqlite_master WHERE type='table' AND name='images';`, (err, row) => {
            imagesTableExits = true;
        }, err => {
            if (!imagesTableExits)
                db.run("CREATE TABLE images (filename TEXT, created_at TEXT)");
        });
    });
});
app.get('/', (req, res) => {
    res.send('Express + TypeScript Server');
});
app.post('/images', raw, (req, res) => {
    const filename = `${new Date().getTime()}.jpg`;
    db.exec(`
    INSERT INTO images (filename, created_at) 
    VALUES (
      "${filename}",
      "${new Date().toISOString()}
    ");
  `);
    fs_1.default.writeFile(`./data/${filename}`, req.body, (err) => {
        if (err) {
            return console.log(err);
        }
        res.send("ok!");
    });
});
app.post('/readings', json, (req, res) => {
    db.exec(`
    INSERT INTO readings (humidity, temp, sensor_id, read_at, created_at) 
    VALUES (
      ${req.body.humidity}, 
      ${req.body.temp}, 
      ${req.body.sensor_id}, 
      "${req.body.read_at}", 
      "${new Date().toISOString()}");
  `);
    res.send("ok");
});
app.listen(port, () => {
    console.log(`[server]: Server is running at https://localhost:${port}`);
});
//# sourceMappingURL=index.js.map