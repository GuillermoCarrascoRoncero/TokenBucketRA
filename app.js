const express = require("express");
const bodyParser = require("body-parser");
const axios = require("axios");
const fs = require('fs');
const path = require("path");
const IPManager = require("./IPManager"); 
const TokenBucket = require("./TokenBucket");

const app = express();

const tokenBucket = new TokenBucket(100, 10 / 60);
const wadlPath = path.join(__dirname,'docs','api-description.xml');
const ipTracker = new IPManager(100, 30000); 

ipTracker.setWhiteList('::1');
ipTracker.setWhiteList('::ffff:127.0.0.1');
ipTracker.setWhiteList('::ffff:10.0.3.26');

var filter = false;

app.use(bodyParser.json());

app.use((req, res, next) => {
  const clientIp = req.ip;
  
  console.log("Dirección IP del cliente:", clientIp);

  filter = ipTracker.trackRequest(clientIp);

  if (!ipTracker.getWhiteList(clientIp)) {
    return res.status(403).send('Acceso no autorizado');
  }

  if (ipTracker.getBlockedIPs(clientIp)) {
    return res.status(403).send('Acceso bloqueado. IP bloqueada');
  }

  if (!tokenBucket.tryConsume(1)) {
    return res.status(429).send("Demasiadas solicitudes. Intente nuevamente más tarde.");
  }
  next();
});

app.get("/record", async (req, res) => {
  try {
    const response = await axios.get("http://localhost:3001/record", {
      params: req.query, 
    });
    res.send(response.data);
  } catch (error) {
    console.error(error);
    res.status(500).send("Error en el servidor");
  }
});

app.post("/record", async (req, res) => {
  try {
    const response = await axios.post("http://localhost:3001/record", req.body);
    res.send(response.data);
  } catch (error) {
    console.error(error);
    res.status(500).send("Error en el servidor");
  }
});

app.get('/wadl',(req,res)=>{
  fs.readFile(wadlPath, 'utf8',(err,data) =>{
    if (err) {
      console.error('Error al leer el archivo WADL:', err);
      return res.status(500).send('Error servidor');
    }
    res.set('Content-Type', 'application/xml');
    res.send(data);
  });
});

app.listen(4000, () => {
  console.log("Servidor Express escuchando en el puerto 4000");
});
