async function obtenerDatos() {
  const res = await fetch("/api/aire");
  const data = await res.json();

  console.log("DATOS:", data);

  if (!Array.isArray(data) || data.length === 0) {
    return { estaciones: [], valores: [] };
  }

  return {
    estaciones: data.map(d => d.estacion),
    valores: data.map(d => d.valor)
  };
}

function crearGraficaLineas(labels, data) {
  const ctx = document.getElementById("lineChart").getContext("2d");

  new Chart(ctx, {
    type: "line",
    data: {
      labels,
      datasets: [{
        label: "Contaminación",
        data,
        borderColor: "#ff6a00",
        backgroundColor: "rgba(255,106,0,0.2)",
        fill: true
      }]
    }
  });
}

function crearGauge(valor) {
  const canvas = document.getElementById("gauge");
  const ctx = canvas.getContext("2d");

  const cx = canvas.width / 2;
  const cy = canvas.height / 2 + 40;
  const r = 100;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  ctx.beginPath();
  ctx.arc(cx, cy, r, Math.PI, 0);
  ctx.strokeStyle = "#ffe0cc";
  ctx.lineWidth = 20;
  ctx.stroke();

  const angle = Math.PI + (valor / 100) * Math.PI;

  ctx.beginPath();
  ctx.arc(cx, cy, r, Math.PI, angle);
  ctx.strokeStyle = "#ff6a00";
  ctx.lineWidth = 20;
  ctx.stroke();

  ctx.fillStyle = "#ff6a00";
  ctx.font = "28px Arial";
  ctx.textAlign = "center";
  ctx.fillText(valor.toFixed(1), cx, cy);
}

async function init() {
  const { estaciones, valores } = await obtenerDatos();

  if (!valores.length) {
    console.error("No hay datos");
    return;
  }

  crearGraficaLineas(estaciones, valores);

  const promedio = valores.reduce((a, b) => a + b, 0) / valores.length;
  crearGauge(promedio);
}

window.onload = init;