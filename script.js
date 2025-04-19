// Constants
const VOTE_DURATION = 60 * 60; // 1 hour in seconds (was previously 60 * 8)const PRICE_UPDATE_INTERVAL = 500; // Update price every 0.5 seconds (faster updates)
const INITIAL_PRICE = 0.00004; // Starting token price
const CHART_HISTORY_LENGTH = 60; // Show last 60 data points (1 minute at 1 update per second)

// State
let countdownTime = VOTE_DURATION;
let pumpVotes = 0;
let dumpVotes = 0;
let currentPrice = INITIAL_PRICE;
let isVotingActive = true;
let userAddress = null;
let lastUpdateTime = Date.now();

// DOM Elements
const countdownElement = document.getElementById('countdown');
const currentPriceElement = document.getElementById('currentPrice');
const growthRateElement = document.getElementById('growthRate');
const pumpVotesElement = document.getElementById('pumpVotes');
const dumpVotesElement = document.getElementById('dumpVotes');
const pumpButton = document.getElementById('pumpButton');
const dumpButton = document.getElementById('dumpButton');
const connectWalletButton = document.getElementById('connectWallet');

// Pre-initialize chart data with empty values
const initialLabels = [];
const initialData = [];
const now = Date.now();

for (let i = CHART_HISTORY_LENGTH - 1; i >= 0; i--) {
  const time = new Date(now - i * PRICE_UPDATE_INTERVAL);
  initialLabels.push(formatTime(time));
  initialData.push(INITIAL_PRICE);
}

// Chart Setup
const ctx = document.getElementById('priceChart').getContext('2d');
const priceChart = new Chart(ctx, {
  type: 'line',
  data: {
    labels: initialLabels,
    datasets: [{
      label: 'Token Price',
      data: initialData,
      borderColor: '#00FF88',
      borderWidth: 2,
      tension: 0.1, // Less curve for faster rendering
      fill: false,
      pointRadius: 0, // No points for better performance
    }]
  },
  options: {
    responsive: true,
    maintainAspectRatio: false,
    animation: {
      duration: 0 // Disable all animations
    },
    hover: {
      mode: null, // Disable hover effects
      intersect: false
    },
    scales: {
      y: {
        beginAtZero: false,
        grid: {
          color: '#333333',
        },
        ticks: {
          color: '#CCCCCC',
          callback: function(value) {
            return value.toFixed(5);
          },
        },
      },
      x: {
        grid: {
          display: false,
        },
        ticks: {
          color: '#CCCCCC',
          maxRotation: 0,
          autoSkip: true,
          autoSkipPadding: 20,
          maxTicksLimit: 10
        },
      },
    },
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        enabled: false // Disable tooltips for better performance
      }
    },
  },
});

// Helper function to format time
function formatTime(date) {
  return `${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')}:${String(date.getSeconds()).padStart(2, '0')}`;
}

// Update Countdown Timer
function updateCountdown() {
  const hours = Math.floor(countdownTime / 3600);
  const minutes = Math.floor((countdownTime % 3600) / 60);
  const seconds = countdownTime % 60;
  countdownElement.textContent = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  if (countdownTime > 0) {
    countdownTime--;
  } else {
    endVotingRound();
  }
}

// End Voting Round
function endVotingRound() {
  isVotingActive = false;
  const totalVotes = pumpVotes + dumpVotes;
  if (totalVotes > 0) {
    if (pumpVotes > dumpVotes) {
      alert('Pump wins! Price will continue to rise.');
      simulatePricePump();
    } else {
      alert('Dump wins! Early voters share profits.');
      simulatePriceDump();
    }
  } else {
    alert('No votes were cast. Price remains unchanged.');
  }
  resetVotingRound();
}

// Reset Voting Round
function resetVotingRound() {
  countdownTime = VOTE_DURATION;
  pumpVotes = 0;
  dumpVotes = 0;
  isVotingActive = true;
  updateVotes();
}

// Update Votes Display
function updateVotes() {
  const totalVotes = pumpVotes + dumpVotes;
  const pumpPercentage = totalVotes > 0 ? Math.round((pumpVotes / totalVotes) * 100) : 0;
  const dumpPercentage = totalVotes > 0 ? Math.round((dumpVotes / totalVotes) * 100) : 0;
  pumpVotesElement.textContent = `${pumpPercentage}%`;
  dumpVotesElement.textContent = `${dumpPercentage}%`;
}

// Simulate Price Pump
function simulatePricePump() {
  const pumpAmount = Math.random() * 20 + 10;
  currentPrice *= 1 + pumpAmount / 100;
  updatePrice();
}

// Simulate Price Dump
function simulatePriceDump() {
  const dumpAmount = Math.random() * 20 + 10;
  currentPrice *= 1 - dumpAmount / 100;
  updatePrice();
}

// Simulate Price Fluctuations
function simulatePriceFluctuation() {
  const now = Date.now();
  // Only update if enough time has passed
  if (now - lastUpdateTime >= PRICE_UPDATE_INTERVAL) {
    lastUpdateTime = now;
    const fluctuation = (Math.random() - 0.3) * 2;
    currentPrice *= 1 + fluctuation / 100;
    if (currentPrice < INITIAL_PRICE) {
      currentPrice = INITIAL_PRICE;
    }
    updatePrice();
  }
}

// Update Price Display
function updatePrice() {
  currentPriceElement.textContent = `$${currentPrice.toFixed(5)}`;
  const growthRate = ((currentPrice - INITIAL_PRICE) / INITIAL_PRICE) * 100;
  growthRateElement.textContent = `${growthRate.toFixed(2)}%`;
  updateChart();
}

// Update Chart - Optimized version
function updateChart() {
  // Shift the data arrays if they're full
  if (priceChart.data.labels.length >= CHART_HISTORY_LENGTH) {
    priceChart.data.labels.shift();
    priceChart.data.datasets[0].data.shift();
  }
  
  // Add new data point
  priceChart.data.labels.push(formatTime(new Date()));
  priceChart.data.datasets[0].data.push(currentPrice);
  
  // Perform the update
  priceChart.update('none');
}

// Solana Wallet Connection
async function connectWallet() {
  if ('solana' in window) {
    const provider = window.solana;
    if (provider.isPhantom) {
      try {
        const response = await provider.connect();
        userAddress = response.publicKey.toString();
        connectWalletButton.textContent = `Connected: ${userAddress.slice(0, 4)}...${userAddress.slice(-4)}`;
        connectWalletButton.disabled = true;
      } catch (error) {
        console.error('User denied wallet connection:', error);
      }
    } else {
      alert('Please install Phantom Wallet.');
    }
  } else {
    alert('Phantom Wallet not detected. Please install it.');
  }
}

// Event Listeners
pumpButton.addEventListener('click', () => {
  if (!userAddress) {
    alert('Please connect your wallet to vote.');
    return;
  }
  if (isVotingActive) {
    pumpVotes++;
    updateVotes();
  } else {
    alert('Voting is currently closed. Wait for the next round.');
  }
});

dumpButton.addEventListener('click', () => {
  if (!userAddress) {
    alert('Please connect your wallet to vote.');
    return;
  }
  if (isVotingActive) {
    dumpVotes++;
    updateVotes();
  } else {
    alert('Voting is currently closed. Wait for the next round.');
  }
});

connectWalletButton.addEventListener('click', connectWallet);

// Initialize with current price
currentPriceElement.textContent = `$${INITIAL_PRICE.toFixed(5)}`;
growthRateElement.textContent = '0.00%';

// Start timers
setInterval(updateCountdown, 1000);
setInterval(simulatePriceFluctuation, 100); // Check more frequently but only update when needed
