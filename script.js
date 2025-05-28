const proxy = "https://cors-anywhere.herokuapp.com/";
const scb3Url = "https://api.scb.se/OV0104/v1/doris/sv/ssd/START/BE/BE0101/BE0101A/FolkmangdDistrikt";

const consumptionPerCapita = {
  "Stockholm": 4.4,
  "Uppsala": 3.9,
  "Södermanland": 3.6,
  "Östergötland": 3.9,
  "Jönköping": 3.3,
  "Kronoberg": 3.6,
  "Kalmar": 3.5,
  "Gotland": 4.0,
  "Blekinge": 3.6,
  "Skåne": 3.9,
  "Halland": 3.7,
  "Västergötland": 3.9, // kombinerad uppskattning
  "Värmland": 3.6,
  "Närke": 3.5,
  "Västmanland": 3.4,
  "Dalarna": 3.4,
  "Gästrikland": 3.5,
  "Medelpad": 3.5,
  "Jämtland": 3.5,
  "Västerbotten": 3.6,
  "Norrbotten": 3.5
};

const landArea = {
  "Stockholm": 6519,
  "Uppsala": 8197,
  "Södermanland": 6091,
  "Östergötland": 9813,
  "Jönköping": 10475,
  "Kronoberg": 8458,
  "Kalmar": 11170,
  "Gotland": 3184,
  "Blekinge": 2945,
  "Skåne": 11027,
  "Halland": 5454,
  "Västergötland": 16900, // uppskattad delmängd av Västra Götalands län
  "Värmland": 17735,
  "Närke": 4100,
  "Västmanland": 5632,
  "Dalarna": 28194,
  "Gästrikland": 4300,
  "Medelpad": 17720,
  "Jämtland": 49341,
  "Västerbotten": 55401,
  "Norrbotten": 98000
};

const query = {
  query: [
    {
      code: "Region",
      selection: {
        filter: "vs:ELandskap",
        values: [
          "101", "102", "103", "104", "105", "106", "107", "108", "109", "110",
          "211", "212", "213", "214", "215", "217", "316", "318", "319", "320",
          "321", "322", "323", "324", "325"
        ]
      }
    },
    {
      code: "Kon",
      selection: {
        filter: "item",
        values: ["1", "2"]
      }
    },
    {
      code: "Tid",
      selection: {
        filter: "item",
        values: ["2023"]
      }
    }
  ],
  response: { format: "JSON" }
};

fetch(proxy + scb3Url, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(query)
})
  .then(res => {
    if (!res.ok) throw new Error("Kunde inte hämta SCB-data");
    return res.json();
  })
  .then(data => {
    const points = [];

    data.data.forEach(entry => {
      const region = entry.key[0]; // landskapsnamn, t.ex. "Närke"
      const population = parseInt(entry.values[0].replace(/\s/g, ""), 10);
      const perCapita = consumptionPerCapita[region];
      const area = landArea[region];

      console.log({ region, population, perCapita, area });

      if (population && perCapita && area) {
        const density = population / area;
        const total = perCapita * population;

        points.push({
          region,
          density,
          perCapita,
          population,
          total,
          text: `${region}<br>Täthet: ${density.toFixed(1)} inv/km²<br>Konsumtion: ${perCapita} L/inv`
        });
      }
    });

    if (points.length === 0) {
      document.getElementById("chart").innerText = "Ingen matchande data att visa.";
      return;
    }

    Plotly.newPlot('chart', [{
      x: points.map(p => p.density),
      y: points.map(p => p.perCapita),
      text: points.map(p => p.text),
      mode: 'markers',
      type: 'scatter',
      marker: {
        size: points.map(p => p.total / 500000),
        sizemode: 'area',
        sizeref: 2.0 * Math.max(...points.map(p => p.total / 500000)) / (100 ** 2),
        color: points.map(p => p.perCapita),
        colorscale: 'YlGnBu',
        colorbar: { title: "Liter/invånare" },
        line: { width: 1, color: '#333' },
        opacity: 0.85
      }
    }], {
      title: "Konsumtion per invånare vs befolkningstäthet (2023)",
      xaxis: { title: "Befolkningstäthet (inv/km²)" },
      yaxis: { title: "Konsumtion per invånare (liter)" },
      hovermode: 'closest'
    });
  })
  .catch(err => {
    console.error("Fel vid hämtning från SCB:", err);
    document.getElementById("chart").innerText = "Kunde inte hämta data.";
  });
