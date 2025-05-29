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

// ⬇️ Ändringen sker här: ArealTyp: "01" för LANDAREAL
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

    const labels = [];
    const data = [];

    regionCodes.forEach(code => {
      const name = regionCodeToName[code];
      const pop = populationMap[code];
      const area = areaMap[code];

      if (pop && area) {
        labels.push(name);
        data.push((pop / area).toFixed(1));
      }
    });

    const datasets = [{
      label: "Invånare per km² per län (2019)",
      data,
      fill: false,
      borderWidth: 2,
      borderColor: "hsla(250, 100%, 30%, 1)",
      hoverBorderWidth: 4
    }];

    new Chart(document.getElementById("scb4"), {
      type: "line",
      data: { labels, datasets }
    });
  })
  .catch(err => {
    console.error("Fel vid hämtning:", err);
    document.getElementById("scb4").innerText = "Kunde inte hämta data.";
  });
}

fetchAndDrawChart();
