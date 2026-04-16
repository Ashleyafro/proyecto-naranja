const express = require("express");
const fetch = require("node-fetch");
const path = require("path");

const app = express();
const PORT = 3000;

app.use(express.static(path.join(__dirname, "public")));

app.get("/api/aire", async (req, res) => {
  try {
    const url = "https://valencia.opendatasoft.com/api/records/1.0/search/?dataset=qualitat-aire&rows=50";

    const response = await fetch(url);
    const data = await response.json();

    const resultado = data.records
      .filter(r => r.fields && r.fields.no2 !== undefined)
      .map(r => ({
        estacion: r.fields.estacion,
        valor: Number(r.fields.no2)
      }));

    res.json(resultado);

  } catch (error) {
    console.error(error);
    res.json([]);
  }
});

app.listen(PORT, () => {
  console.log(`http://localhost:${PORT}`);
});