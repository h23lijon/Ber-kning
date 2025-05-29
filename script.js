// URL till SCB:s API
const urlSCB4 = "https://api.scb.se/OV0104/v1/doris/sv/ssd/START/BE/BE0101/BE0101A/FolkmangdDistrikt";

const querySCB4 = {
  query: [
    {
      code: "Region",
      selection: {
        filter: "vs:ELandskap",
        values: [
          "101", "102", "103", "104", "105", "106", "107", "108", "109", "110",
          "211", "212", "213", "214", "215", "217", "316", "318", "319",
          "320", "321", "322", "323", "324", "325"
        ]
      }
    },
    {
      code: "Kon",
      selection: {
        filter: "item",
        values: ["1", "2"] // summerar män och kvinnor
      }
    },
    {
      code: "Tid",
      selection: {
        filter: "item",
        values: ["2019"]
      }
    }
  ],
  response: { format: "JSON" }
};

const regionCodeToName = {
  "101": "Skåne",
  "102": "Blekinge",
  "103": "Öland",
  "104": "Halland",
  "105": "Småland",
  "106": "Gotland",
  "107": "Västergötland",
  "108": "Östergötland",
  "109": "Bohuslän",
  "110": "Dalsland",
  "211": "Närke",
  "212": "Södermanland",
  "213": "Värmland",
  "214": "Västmanland",
  "215": "Uppland",
  "217": "Dalarna",
  "316": "Gästrikland",
  "318": "Hälsingland",
  "319": "Härjedalen",
  "320": "Medelpad",
  "321": "Ångermanland",
  "322": "Jämtland",
  "323": "Västerbotten",
  "324": "Lappland",
  "325": "Norrbotten"
};

// ✅ Summerar befolkning (män + kvinnor) per landskap
function printSCB4Chart(dataSCB4) {
  const grouped = {};

  dataSCB4.data.forEach(entry => {
    const code = entry.key[0]; // landskapskod
    const value = parseInt(entry.values[0].replace(/\s/g, ""), 10);
    if (!grouped[code]) grouped[code] = 0;
    grouped[code] += value;
  });

  const labels = Object.keys(grouped).map(code => regionCodeToName[code]);
  const data = Object.values(grouped);

  const datasets = [{
    label: 'Total befolkning per landskap (2019)',
    data,
    fill: false,
    borderWidth: 2,
    borderColor: 'hsla(250, 100%, 30%, 1)',
    hoverBorderWidth: 4
  }];

  new Chart(document.getElementById('scb4'), {
    type: 'line',
    data: { labels, datasets }
  });
}

// Fetch-anrop
const request = new Request(urlSCB4, {
  method: 'POST',
  body: JSON.stringify(querySCB4)
});

fetch(request)
  .then(response => response.json())
  .then(printSCB4Chart);
