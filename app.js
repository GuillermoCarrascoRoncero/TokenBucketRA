const express = require("express");
const TokenBucket = require("./TokenBucket");
const app = express();
const axios = require("axios");
const bodyParser = require("body-parser");
var fs = require('fs');
const path = require("path");

const tokenBucket = new TokenBucket(100, 10 / 60);
const wadlPath = path.join(__dirname,'docs','api-description.xml');

const whitelist = ['::1', '::ffff:127.0.0.1'];
const blacklist = ['1.2.3.4', '5.6.7.8'];

app.use(bodyParser.json());

app.use((req, res, next) => {
  const clientIp = req.ip;
  
  //console.log("Dirección IP del cliente:", clientIp);

  if (!whitelist.includes(clientIp)) {
    return res.status(403).send('Acceso no autorizado');
  }

  if (blacklist.includes(clientIp)) {
    return res.status(403).send('Acceso bloqueado');
  }

  if (!tokenBucket.tryConsume(1)) {
    return res.status(429).send("Demasiadas solicitudes. Intente nuevamente más tarde.");
  }

  next();
});


app.get("/record", async (req, res) => {
  try {
    const response = await axios.get("http://localhost:80/record", {
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
    const response = await axios.post("http://localhost:80/record", req.body);
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
