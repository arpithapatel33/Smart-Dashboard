const apiSelect = document.getElementById('api-select');
const loadingDiv = document.getElementById('loading');
const cardsContainer = document.getElementById('data-cards');
const chartContainer = document.getElementById('chart-container');
const ctx = document.getElementById('data-chart').getContext('2d');

let chartInstance = null;

// Utility to animate number changes smoothly
function animateValue(element, start, end, duration) {
  let startTimestamp = null;
  const step = (timestamp) => {
    if (!startTimestamp) startTimestamp = timestamp;
    const progress = Math.min((timestamp - startTimestamp) / duration, 1);
    element.textContent = Math.floor(progress * (end - start) + start).toLocaleString();
    if (progress < 1) {
      window.requestAnimationFrame(step);
    }
  };
  window.requestAnimationFrame(step);
}

// Clear UI for new data
function clearUI() {
  cardsContainer.innerHTML = '';
  cardsContainer.style.display = 'none';
  chartContainer.style.display = 'none';
  loadingDiv.style.display = 'block';
  loadingDiv.textContent = 'Loading...';
}

// Fetch and show crypto data
async function showCryptoData() {
  clearUI();
  try {
    // Fetch data for BTC, ETH, DOGE from CoinGecko public API
    const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,dogecoin&vs_currencies=usd&include_24hr_change=true');
    const data = await response.json();

    loadingDiv.style.display = 'none';
    cardsContainer.style.display = 'grid';

    // Create cards for each coin with price and 24h change
    ['bitcoin', 'ethereum', 'dogecoin'].forEach(coin => {
      const card = document.createElement('div');
      card.className = 'card';
      const title = coin.charAt(0).toUpperCase() + coin.slice(1);
      card.innerHTML = `<h3>${title}</h3>
        <div>Price (USD): <span class="value" id="${coin}-price">-</span></div>
        <div>24h Change: <span class="value" id="${coin}-change">-</span>%</div>`;
      cardsContainer.appendChild(card);

      // Animate values
      animateValue(card.querySelector(`#${coin}-price`), 0, data[coin].usd, 1500);
      const changeEl = card.querySelector(`#${coin}-change`);
      changeEl.textContent = data[coin].usd_24h_change.toFixed(2);
      changeEl.style.color = data[coin].usd_24h_change >= 0 ? '#0f0' : '#f55';
    });

    // Show chart: Prices over the three coins
    chartContainer.style.display = 'block';

    const labels = ['Bitcoin', 'Ethereum', 'Dogecoin'];
    const prices = labels.map(coin => data[coin.toLowerCase()].usd);

    if (chartInstance) chartInstance.destroy();
    chartInstance = new Chart(ctx, {
      type: 'bar',
      data: {
        labels,
        datasets: [{
          label: 'Price in USD',
          data: prices,
          backgroundColor: ['#f7931a', '#627eea', '#c2a633']
        }]
      },
      options: {
        animation: { duration: 1000 },
        scales: {
          y: { beginAtZero: true }
        },
        plugins: {
          legend: { display: false }
        }
      }
    });

  } catch (error) {
    loadingDiv.textContent = 'Error loading crypto data.';
    console.error(error);
  }
}

// Fetch and show weather data for fixed cities
async function showWeatherData() {
  clearUI();
  try {
    // Cities with lat/lon: Berlin, London, New York
    const cities = [
      { name: 'Berlin', lat: 52.52, lon: 13.405 },
      { name: 'London', lat: 51.5074, lon: -0.1278 },
      { name: 'New York', lat: 40.7128, lon: -74.0060 }
    ];

    // Open-Meteo API for current temperature
    const promises = cities.map(c =>
      fetch(`https://api.open-meteo.com/v1/forecast?latitude=${c.lat}&longitude=${c.lon}&current_weather=true`)
      .then(res => res.json())
      .then(data => ({
        name: c.name,
        temp: data.current_weather.temperature,
        windspeed: data.current_weather.windspeed
      }))
    );

    const weatherData = await Promise.all(promises);

    loadingDiv.style.display = 'none';
    cardsContainer.style.display = 'grid';

    // Create cards for temperature and windspeed
    weatherData.forEach(city => {
      const card = document.createElement('div');
      card.className = 'card';
      card.innerHTML = `
        <h3>${city.name}</h3>
        <div>Temperature: <span class="value" id="${city.name}-temp">-</span> °C</div>
        <div>Windspeed: <span class="value" id="${city.name}-wind">-</span> km/h</div>
      `;
      cardsContainer.appendChild(card);

      animateValue(card.querySelector(`#${city.name}-temp`), 0, city.temp, 1500);
      animateValue(card.querySelector(`#${city.name}-wind`), 0, city.windspeed, 1500);
    });

    // Show temperature line chart
    chartContainer.style.display = 'block';

    const labels = weatherData.map(c => c.name);
    const temps = weatherData.map(c => c.temp);

    if (chartInstance) chartInstance.destroy();
    chartInstance = new Chart(ctx, {
      type: 'line',
      data: {
        labels,
        datasets: [{
          label: 'Temperature (°C)',
          data: temps,
          borderColor: '#00d1b2',
          backgroundColor: 'rgba(0, 209, 178, 0.3)',
          tension: 0.4,
          fill: true,
          pointRadius: 6,
          pointHoverRadius: 8
        }]
      },
      options: {
        animation: { duration: 1000 },
        scales: {
          y: {
            beginAtZero: false
          }
        }
      }
    });

  } catch (error) {
    loadingDiv.textContent = 'Error loading weather data.';
    console.error(error);
  }
}

// Main function to update dashboard based on API selection
function updateDashboard() {
  const selectedAPI = apiSelect.value;
  if (selectedAPI === 'crypto') {
    showCryptoData();
  } else if (selectedAPI === 'weather') {
    showWeatherData();
  }
}

apiSelect.addEventListener('change', updateDashboard);

// Initial load
updateDashboard();

// Auto refresh every 60 seconds for real-time feel
setInterval(updateDashboard, 60000);
