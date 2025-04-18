// Constants
const VOTE_DURATION = 60 * 8; // 1 hour in seconds
const PRICE_UPDATE_INTERVAL = 5000; // Update price every 5 seconds
const INITIAL_PRICE = 0.00004; // Starting token price

// State
let countdownTime = VOTE_DURATION;
let pumpVotes = 0;
let dumpVotes = 0;
let currentPrice = INITIAL_PRICE;
let isVotingActive = true;
let userAddress = null;

// DOM Elements
const countdownElement = document.getElementById('countdown');
const currentPriceElement = document.getElementById('currentPrice');
const growthRateElement = document.getElementById('growthRate');
const pumpVotesElement = document.getElementById('pumpVotes');
const dumpVotesElement = document.getElementById('dumpVotes');
const pumpButton = document.getElementById('pumpButton');
const dumpButton = document.getElementById('dumpButton');
const connectWalletButton = document.getElementById('connectWallet');

// Chart Setup
const ctx = document.getElementById('priceChart').getContext('2d');
const priceChart = new Chart(ctx, {
  type: 'line',
  data: {
    labels: [], // Time labels will be added dynamically
    datasets: [{
      label: 'Token Price',
      data: [], // Price data will be added dynamically
      borderColor: '#00FF88',
      tension: 0.4,
      fill: false,
    }]
  },
  options: {
    scales: {
      y: {
        beginAtZero: false, // Start from the minimum price
        grid: {
          color: '#333333',
        },
        ticks: {
          color: '#CCCCCC',
          callback: function (value) {
            return value.toFixed(5); // Display prices with 5 decimal places
          },
        },
      },
      x: {
        grid: {
          color: '#333333',
        },
        ticks: {
          color: '#CCCCCC',
        },
      },
    },
    plugins: {
      legend: {
        display: false,
      },
    },
  },
});

// Functions

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
  const pumpAmount = Math.random() * 20 + 10; // Random price increase between 10% and 30%
  currentPrice *= 1 + pumpAmount / 100;
  updatePrice();
}

// Simulate Price Dump
function simulatePriceDump() {
  const dumpAmount = Math.random() * 20 + 10; // Random price decrease between 10% and 30%
  currentPrice *= 1 - dumpAmount / 100;
  updatePrice();
}

// Simulate Fake Price Fluctuations (Trending Upward)
function simulatePriceFluctuation() {
  const fluctuation = (Math.random() - 0.3) * 2; // Random fluctuation between -0.6% and +1.4%
  currentPrice *= 1 + fluctuation / 100;
  if (currentPrice < INITIAL_PRICE) {
    currentPrice = INITIAL_PRICE; // Ensure price doesn't go below the starting price
  }
  updatePrice();
}

// Update Price Display
function updatePrice() {
  currentPriceElement.textContent = `$${currentPrice.toFixed(5)}`; // Display price with 5 decimal places
  const growthRate = ((currentPrice - INITIAL_PRICE) / INITIAL_PRICE) * 100;
  growthRateElement.textContent = `${growthRate.toFixed(2)}%`;
  updateChart();
}

// Update Chart
function updateChart() {
  const now = new Date();
  const timeLabel = `${now.getHours()}:${String(now.getMinutes()).padStart(2, '0')}`;
  priceChart.data.labels.push(timeLabel);
  priceChart.data.datasets[0].data.push(currentPrice);
  if (priceChart.data.labels.length > 10) {
    priceChart.data.labels.shift();
    priceChart.data.datasets[0].data.shift();
  }
  priceChart.update();
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
        console.log('Wallet connected:', userAddress);
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

// Voting Buttons
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

// Wallet Connection
connectWalletButton.addEventListener('click', connectWallet);

// Initialize
setInterval(updateCountdown, 1000);
setInterval(simulatePriceFluctuation, PRICE_UPDATE_INTERVAL); // Simulate price fluctuations
updatePrice(); // Initial price update
