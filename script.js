// Constants
const VOTE_DURATION = 60 * 8; // 1 hour in seconds
const PRICE_UPDATE_INTERVAL = 1000; // Changed from 5000 to 1000 (1 second updates)
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
      pointRadius: 0, // Remove points for cleaner look with more data
    }]
  },
  options: {
    animation: {
      duration: 0, // Disable animation for faster updates
    },
    scales: {
      y: {
        beginAtZero: false,
        grid: {
          color: '#333333',
        },
        ticks: {
          color: '#CCCCCC',
          callback: function (value) {
            return value.toFixed(5);
          },
        },
      },
      x: {
        grid: {
          color: '#333333',
        },
        ticks: {
          color: '#CCCCCC',
          maxTicksLimit: 10, // Limit number of x-axis labels
        },
      },
    },
    plugins: {
      legend: {
        display: false,
      },
    },
    responsiveAnimationDuration: 0, // Disable responsive animation
  },
});

// Update Chart function - modified to handle more frequent updates
function updateChart() {
  const now = new Date();
  const timeLabel = `${now.getHours()}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
  
  priceChart.data.labels.push(timeLabel);
  priceChart.data.datasets[0].data.push(currentPrice);
  
  // Show more data points but limit to a reasonable number
  if (priceChart.data.labels.length > 30) { // Increased from 10 to 30
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
