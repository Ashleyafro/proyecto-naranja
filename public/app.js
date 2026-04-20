// API endpoint
const API_URL = "https://opendata.vlci.valencia.es/api/3/action/datastore_search?resource_id=19b5a1a7-5888-4d3e-b69b-3c1436d64e6e&limit=60";

// global storage for processed data
let variables = {};

// run on page load
window.onload = displayAPI;

// tools
const num = v => Number(v) || 0; // safe number conversion
const avg = arr => arr.length ? arr.reduce((a,b)=>a+b,0)/arr.length : 0;

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

  records.forEach(r=>{
    const mo = month(r.Fecha);

    // initialize month bucket if needed
    m[mo] ??= {
      NO:[], NO2:[], O3:[], SO2:[],
      temp:[], hum:[], prec:[], wind:[]
    };

    // store pollutant values
    m[mo].NO.push(num(r.NO));
    m[mo].NO2.push(num(r.NO2));
    m[mo].O3.push(num(r.O3));
    m[mo].SO2.push(num(r.SO2));

    // store weather values
    m[mo].temp.push(num(r.Temperatura));
    m[mo].hum.push(num(r["Humedad relativa"]));
    m[mo].prec.push(num(r.Precipitacion));
    m[mo].wind.push(num(r["Velocidad maxima del viento"]));
  });

  const months = Object.keys(m);

  // tool to map averages per month
  const pick = key => months.map(x => avg(m[x][key]));

  // final structured dataset for charts
  const out = {
    fecha_data: months,
    NO_data: pick("NO"),
    NO2_data: pick("NO2"),
    O3_data: pick("O3"),
    SO2_data: pick("SO2"),
    temp_data: pick("temp"),
    hum_data: pick("hum"),
    prec_data: pick("prec"),
    vel_data: pick("wind")
  };

  // current month gauges
  const c = m[month(new Date())] || {};

  createGauge(tempChart.getContext("2d"), avg(c.temp||[]), 50, "Temperature");
  createGauge(humChart.getContext("2d"), avg(c.hum||[]), 100, "Humidity");
  createGauge(precChart.getContext("2d"), avg(c.prec||[]), 100, "Precipitation");
  createGauge(windChart.getContext("2d"), avg(c.wind||[]), 120, "Wind Speed");

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
        { label: "NO", data: variables.NO_data },
        { label: "NO2", data: variables.NO2_data },
        { label: "O3", data: variables.O3_data },
        { label: "SO2", data: variables.SO2_data }
      ]
    },
    options: {
      responsive: true,
      plugins: {
        title: {
          display: true,
          text: "Air Pollution Over Time"
        }
      }
    }
  });
}

// gauge chart
function createGauge(ctx, value, maxValue, label){
  if(!ctx) return;

  const safe = Math.min(value, maxValue);

  return new Chart(ctx, {
    type: "doughnut",
    data: {
      datasets: [{
        data: [safe, maxValue - safe],
        backgroundColor: ["#4CAF50", "#e0e0e0"],
        borderWidth: 0
      }]
    },
    options: {
      rotation: -90,
      circumference: 180,
      cutout: "70%",
      plugins: {
        legend: { display: false },
        tooltip: { enabled: false },
        title: {
          display: true,
          text: `${label}: ${value ?? 0}`
        }
      }
    }
  });
}