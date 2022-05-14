import express, { Express, Request, Response } from 'express';
import parser from 'body-parser'
import dotenv from 'dotenv';
import sqlite3 from 'sqlite3';
import fs from 'fs';
dotenv.config();

const app = express();
const port = process.env.PORT;
const raw = parser.raw({ limit: '5mb', type: 'application/octet-stream' });
const json = parser.json();

const db = new sqlite3.Database(`./db/db_v${process.env.DB_VERSION}.sqlite`, err => {
  if (err) return console.error('Error opening database', err);
  console.log("Database connection established.");

  db.serialize(() => {
    let readingsTableExits = false;
    db.each(`SELECT name FROM sqlite_master WHERE type='table' AND name='readings';`, (err, row) => {
      readingsTableExits = true;
    }, err => {
      if (!readingsTableExits) db.run("CREATE TABLE readings (humidity REAL, temp REAL, sensor_id INTEGER, read_at TEXT, created_at TEXT)")
    });

    let imagesTableExits = false;
    db.each(`SELECT name FROM sqlite_master WHERE type='table' AND name='images';`, (err, row) => {
      imagesTableExits = true;
    }, err => {
      if (!imagesTableExits) db.run("CREATE TABLE images (filename TEXT, created_at TEXT)")
    });
  });
});

app.get('/', (req, res) => {
  res.send('Express + TypeScript Server');
});

app.post('/images', raw, (req, res) => {
  const filename = `${new Date().getTime()}.jpg`

  db.exec(`
    INSERT INTO images (filename, created_at) 
    VALUES (
      "${filename}",
      "${new Date().toISOString()}
    ");
  `)

  fs.writeFile(`./data/${filename}`, req.body, (err) => {
    if (err) {
      return console.log(err);
    }
    res.send("ok!")
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
  `)
  res.send("ok")
});

app.get('/readings', (req, res) => {
  const results = db.exec(`
    SELECT * FROM readings;
  `)
  res.send(results);
});

app.listen(port, () => {
  console.log(`[server]: Server is running at https://localhost:${port}`);
});