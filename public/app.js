// API endpoint
const API_URL = "https://opendata.vlci.valencia.es/api/3/action/datastore_search?resource_id=19b5a1a7-5888-4d3e-b69b-3c1436d64e6e&limit=60";
const lineChart = document.getElementById("lineChart");
const tempChart = document.getElementById("tempChart");
const humChart = document.getElementById("humChart");
const precChart = document.getElementById("precChart");
const windChart = document.getElementById("windChart");
// global storage for processed data
let variables = {};

// run on page load
document.addEventListener("DOMContentLoaded", displayAPI);

// tools
const num = v => {
  if (v === null || v === undefined || v === "") return NaN;
  return parseFloat(String(v).replace(",", "."));
};// safe number conversion

const avg = arr => {
  const valid = arr.filter(v => !isNaN(v) && v !== null);
  return valid.length
    ? valid.reduce((a, b) => a + b, 0) / valid.length
    : 0;
};

// extract month name from date
function month(d){
  return new Date(d).toLocaleString("es-ES", { month: "long" });
}

// fetch API data
async function displayAPI(){
  try{
    const res = await fetch(API_URL);
    const { result:{records} } = await res.json();

    if(!records?.length) return alert("No data");

    // process data into usable structure
    variables = extract(records);

    // draw main chart
    temporal_graph();

  }catch(err){
    console.error(err);
    alert("Fetch error");
  }
}

// transform raw API data into grouped monthly averages
function extract(records){
  const m = {};

  records.forEach(r => {
    const date = new Date(r.Fecha);
    const monthIndex = date.getMonth();
    const monthName = date.toLocaleString("es-ES", { month: "long" });

    m[monthIndex] ??= {
      name: monthName,
      NO: [],
      NO2: [],
      O3: [],
      SO2: [],
      temp: [],
      hum: [],
      prec: [],
      wind: []
    };

    m[monthIndex].NO.push(num(r.NO));
    m[monthIndex].NO2.push(num(r.NO2));
    m[monthIndex].O3.push(num(r.O3));
    m[monthIndex].SO2.push(num(r.SO2));

    m[monthIndex].temp.push(num(r.Temperatura));
    m[monthIndex].hum.push(num(r["Humedad relativa"]));
    m[monthIndex].prec.push(num(r.Precipitacion));
    m[monthIndex].wind.push(num(r["Velocidad maxima del viento"]));
  });

  const sortedMonths = Object.keys(m)
    .map(Number)
    .sort((a, b) => a - b);

  const pick = key => sortedMonths.map(i => avg(m[i][key]));

  const out = {
    fecha_data: sortedMonths.map(i => m[i].name),
    NO_data: pick("NO"),
    NO2_data: pick("NO2"),
    O3_data: pick("O3"),
    SO2_data: pick("SO2"),
    temp_data: pick("temp"),
    hum_data: pick("hum"),
    prec_data: pick("prec"),
    vel_data: pick("wind")
  };

  const currentMonth = new Date().getMonth();

  const allTemp = records.map(r => num(r.Temperatura));
  const allHum = records.map(r => num(r["Humedad relativa"]));
  const allPrec = records.map(r => num(r.Precipitacion));
  const allWind = records.map(r => num(r["Velocidad maxima del viento"]));

  createGauge(tempChart.getContext("2d"), avg(allTemp), 50, "Temperatura (°C)");
  createGauge(humChart.getContext("2d"), avg(allHum), 100, "Humedad (%)");
  createGauge(precChart.getContext("2d"), avg(allPrec), 100, "Precipitación (mm)");
  createGauge(windChart.getContext("2d"), avg(allWind), 120, "Velocidad del viento (km/h)");

  return out;
}
// line chart 
function temporal_graph(){
  if(window.lineChartInstance)
    window.lineChartInstance.destroy();

  window.lineChartInstance = new Chart(lineChart, {
    type: "line",
    data: {
      labels: variables.fecha_data,
      datasets: [
        {
          label: "NO",
          data: variables.NO_data,
          borderColor: "#E67E22",
          backgroundColor: "rgba(230,126,34,0.15)",
          borderWidth: 3,
          tension: 0.4,
          pointRadius: 4,
          pointHoverRadius: 7,
          fill: false
        },
        {
          label: "NO2",
          data: variables.NO2_data,
          borderColor: "#D35400",
          backgroundColor: "rgba(211,84,0,0.15)",
          borderWidth: 3,
          tension: 0.4,
          pointRadius: 4,
          pointHoverRadius: 7,
          fill: false
        },
        {
          label: "O3",
          data: variables.O3_data,
          borderColor: "#F39C12",
          backgroundColor: "rgba(243,156,18,0.15)",
          borderWidth: 3,
          tension: 0.4,
          pointRadius: 4,
          pointHoverRadius: 7,
          fill: false
        },
        {
          label: "SO2",
          data: variables.SO2_data,
          borderColor: "#8E5B3A",
          backgroundColor: "rgba(142,91,58,0.15)",
          borderWidth: 3,
          tension: 0.4,
          pointRadius: 4,
          pointHoverRadius: 7,
          fill: false
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        mode: "index",
        intersect: false
      },
      plugins: {
        legend: {
          position: "top",
          labels: {
            color: "#4a2c17",
            font: {
              size: 14,
              weight: "600"
            },
            padding: 20
          }
        },
        title: {
          display: true,
          text: "Evolución de la contaminación del aire (µg/m³)",
          color: "#2d1b0f",
          font: {
            size: 22,
            weight: "700"
          },
          padding: {
            bottom: 20
          }
        },
        tooltip: {
          backgroundColor: "#fff",
          titleColor: "#2d1b0f",
          bodyColor: "#4a2c17",
          borderColor: "#f0c27b",
          borderWidth: 1
        }
      },
      scales: {
        x: {
          grid: {
            display: false
          },
          ticks: {
            color: "#6b4c35"
          }
        },
        y: {
          grid: {
            color: "rgba(0,0,0,0.08)"
          },
          ticks: {
            color: "#6b4c35"
          }
        }
      }
    },
      plugins: [{
        id: "customCanvasBackgroundColor",
        beforeDraw: (chart) => {
          const ctx = chart.canvas.getContext("2d");
          ctx.save();
          ctx.globalCompositeOperation = "destination-over";
          ctx.fillStyle = "transparent";
          ctx.fillRect(0, 0, chart.width, chart.height);
          ctx.restore();
        }
      }]
  });
}

// gauge chart
function createGauge(ctx, value, maxValue, label){
  if(!ctx) return;

  const safe = Math.min(value || 0, maxValue);

  return new Chart(ctx, {
    type: "doughnut",
    data: {
      datasets: [{
        data: [safe, maxValue - safe],
        backgroundColor: [
          "#E67E22",
          "#FBE5D6"
        ],
        borderWidth: 0,
        borderRadius: 14
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      rotation: -90,
      circumference: 180,
      cutout: "78%",
      layout: {
        padding: {
          top: 10,
          bottom: 10
        }
      },
      plugins: {
        legend: {
          display: false
        },
        tooltip: {
          enabled: false
        },
        title: {
          display: true,
          text: label,
          color: "#4A2C17",
          font: {
            size: 18,
            weight: "700"
          },
          padding: {
            top: 10,
            bottom: 20
          }
        }
      }
    },
    plugins: [
      {
        id: "centerText",
        afterDraw(chart) {
          const { ctx, chartArea } = chart;

          if (!chartArea) return;

          const centerX = (chartArea.left + chartArea.right) / 2;
          const centerY = chartArea.top + (chartArea.height * 0.72);

          ctx.save();

          // main value
          ctx.font = "700 30px Inter";
          ctx.fillStyle = "#D35400";
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText(
            Math.round(value ?? 0),
            centerX,
            centerY
          );

          // subtitle
          ctx.font = "500 13px Inter";
          ctx.fillStyle = "#8E5B3A";
          ctx.fillText(
            "Media actual",
            centerX,
            centerY + 28
          );

          ctx.restore();
        }
      },
      {
        id: "roundedCanvasBackground",
        beforeDraw(chart) {
          const { ctx, width, height } = chart;

          ctx.save();
          ctx.beginPath();

          const radius = 24;

          ctx.moveTo(radius, 0);
          ctx.lineTo(width - radius, 0);
          ctx.quadraticCurveTo(width, 0, width, radius);
          ctx.lineTo(width, height - radius);
          ctx.quadraticCurveTo(width, height, width - radius, height);
          ctx.lineTo(radius, height);
          ctx.quadraticCurveTo(0, height, 0, height - radius);
          ctx.lineTo(0, radius);
          ctx.quadraticCurveTo(0, 0, radius, 0);

          ctx.closePath();
          ctx.clip();

          ctx.fillStyle = "#FFFFFF";
          ctx.fillRect(0, 0, width, height);

          ctx.restore();
        }
      }
    ]
  });
}
const saberbtn = document.querySelector(".saber-btn");

saberbtn.addEventListener("click", () => {
  document.getElementById("metodologia").scrollIntoView({
    behavior: "smooth"
  });
});

const quiensomosbtn = document.querySelector(".quiensomos-btn");

quiensomosbtn.addEventListener("click", () => {
  document.querySelector(".quiensomos").scrollIntoView({
    behavior: "smooth"
  });
});

const tipoNarbtn = document.querySelector(".tipoNar-btn");

tipoNarbtn.addEventListener("click", () => {
  document.querySelector(".TiposNaranja").scrollIntoView({
    behavior: "smooth"
  });
});

const metbtn = document.querySelector(".met-btn");

metbtn.addEventListener("click", () => {
  document.getElementById("metodologia").scrollIntoView({
    behavior: "smooth"
  });
});