const urlPopulation = "https://api.scb.se/OV0104/v1/doris/sv/ssd/START/BE/BE0101/BE0101A/FolkmangdNov";
const urlArea = "https://api.scb.se/OV0104/v1/doris/sv/ssd/START/MI/MI0802/Areal2012NN";

const regionCodeToName = {
  "01": "Stockholms län", "03": "Uppsala län", "04": "Södermanlands län", "05": "Östergötlands län",
  "06": "Jönköpings län", "07": "Kronobergs län", "08": "Kalmar län", "09": "Gotlands län",
  "10": "Blekinge län", "12": "Skåne län", "13": "Hallands län", "14": "Västra Götalands län",
  "17": "Värmlands län", "18": "Örebro län", "19": "Västmanlands län", "20": "Dalarnas län",
  "21": "Gävleborgs län", "22": "Västernorrlands län", "23": "Jämtlands län",
  "24": "Västerbottens län", "25": "Norrbottens län"
};

const nameToConsumptionKey = {
  "Stockholms län": "Stockholm",
  "Uppsala län": "Uppsala",
  "Södermanlands län": "Södermanland",
  "Östergötlands län": "Östergötland",
  "Jönköpings län": "Jönköping",
  "Kronobergs län": "Kronoberg",
  "Kalmar län": "Kalmar",
  "Gotlands län": "Gotland",
  "Blekinge län": "Blekinge",
  "Skåne län": "Skåne",
  "Hallands län": "Halland",
  "Västra Götalands län": "Västra Götaland",
  "Värmlands län": "Värmland",
  "Örebro län": "Örebro",
  "Västmanlands län": "Västmanland",
  "Dalarnas län": "Dalarna",
  "Gävleborgs län": "Gävleborg",
  "Västernorrlands län": "Västernorrland",
  "Jämtlands län": "Jämtland",
  "Västerbottens län": "Västerbotten",
  "Norrbottens län": "Norrbotten"
};

const consumptionData = {
  "Stockholm": 4.4, "Uppsala": 3.9, "Södermanland": 3.6, "Östergötland": 3.9,
  "Jönköping": 3.3, "Kronoberg": 3.6, "Kalmar": 3.5, "Gotland": 4.0,
  "Blekinge": 3.6, "Skåne": 3.9, "Halland": 3.7, "Västra Götaland": 3.9,
  "Värmland": 3.6, "Örebro": 3.5, "Västmanland": 3.4, "Dalarna": 3.4,
  "Gävleborg": 3.5, "Västernorrland": 3.5, "Jämtland": 3.5,
  "Västerbotten": 3.6, "Norrbotten": 3.5
};

const regionCodes = Object.keys(regionCodeToName);

const querySCB4 = {
  query: [
    { code: "Region", selection: { filter: "vs:RegionLän07", values: regionCodes }},
    { code: "Alder", selection: { filter: "vs:ÅlderTotA", values: ["tot"] }},
    { code: "Kon", selection: { filter: "item", values: ["1", "2"] }},
    { code: "Tid", selection: { filter: "item", values: ["2019"] }}
  ],
  response: { format: "JSON" }
};

const queryArea = {
  query: [
    { code: "Region", selection: { filter: "vs:BRegionLän07N", values: regionCodes }},
    { code: "ArealTyp", selection: { filter: "item", values: ["01"] }},
    { code: "ContentsCode", selection: { filter: "item", values: ["000001O3"] }},
    { code: "Tid", selection: { filter: "item", values: ["2019"] }}
  ],
  response: { format: "JSON" }
};

function fetchAndDrawChart() {
  const popReq = new Request(urlPopulation, {
    method: 'POST',
    body: JSON.stringify(querySCB4)
  });

  const areaReq = new Request(urlArea, {
    method: 'POST',
    body: JSON.stringify(queryArea)
  });

  Promise.all([
    fetch(popReq).then(res => res.json()),
    fetch(areaReq).then(res => res.json())
  ])
  .then(([popData, areaData]) => {
    const populationMap = {};
    const areaMap = {};

    popData.data.forEach(entry => {
      const code = entry.key[0];
      const value = parseInt(entry.values[0].replace(/\s/g, ""), 10);
      if (!populationMap[code]) populationMap[code] = 0;
      populationMap[code] += value;
    });

    areaData.data.forEach(entry => {
      const code = entry.key[0];
      const area = parseFloat(entry.values[0].replace(/\s/g, "").replace(",", "."));
      areaMap[code] = area;
    });

    const bubbleData = [];

    regionCodes.forEach(code => {
      const name = regionCodeToName[code];
      const pop = populationMap[code];
      const area = areaMap[code];
      const key = nameToConsumptionKey[name];
      const consumption = consumptionData[key];

      if (pop && area && consumption) {
        const density = pop / area;
        bubbleData.push({
          x: parseFloat(density.toFixed(1)),
          y: consumption,
          r: Math.sqrt(pop / 100000) * 5, // Radien baseras på populationen
          label: name
        });
      }
    });

    new Chart(document.getElementById("scb4"), {
      type: "bubble",
      data: {
        datasets: [{
          label: "Alkoholkonsumtion vs Befolkningstäthet",
          data: bubbleData,
          backgroundColor: "rgba(54, 162, 235, 0.6)",
          borderColor: "rgba(54, 162, 235, 1)"
        }]
      },
      options: {
        plugins: {
          tooltip: {
            callbacks: {
              label: ctx => {
                const d = ctx.raw;
                return `${d.label}: ${d.x} inv/km², ${d.y} L/pers`;
              }
            }
          }
        },
        scales: {
          x: {
            title: { display: true, text: "Invånare per km²" }
          },
          y: {
            title: { display: true, text: "Liter ren alkohol per person/år" }
          }
        }
      }
    });
  })
  .catch(err => {
    console.error("Fel vid hämtning:", err);
    document.getElementById("scb4").innerText = "Kunde inte hämta data.";
  });
}

fetchAndDrawChart();
