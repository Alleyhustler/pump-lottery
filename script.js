// Constants
const VOTE_DURATION = 60 * 8; // 8 minutes in seconds
const INITIAL_PRICE = 0.00004; // Starting token price
const CHART_HISTORY_LENGTH = 60; // Show last 60 data points
const PRICE_UPDATE_INTERVAL = 1000; // 1 second between price updates in milliseconds

// State variables
let countdownTime = VOTE_DURATION;
let pumpVotes = 0;
let dumpVotes = 0;
let currentPrice = INITIAL_PRICE;
let isVotingActive = true;
let userAddress = null;
let lastUpdateTime = Date.now();
let priceChart = null;

// Helper function to safely get DOM elements
function getElement(id) {
  const element = document.getElementById(id);
  if (!element) {
    console.error(`Element with ID '${id}' not found`);
    return null;
  }
  return element;
}

// Helper function to format time
function formatTime(date) {
  return `${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')}:${String(date.getSeconds()).padStart(2, '0')}`;
}

// Update Countdown Timer
function updateCountdown() {
  if (!countdownElement) return;
  
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
  if (!pumpVotesElement || !dumpVotesElement) return;
  
  const totalVotes = pumpVotes + dumpVotes;
  const pumpPercentage = totalVotes > 0 ? Math.round((pumpVotes / totalVotes) * 100) : 0;
  const dumpPercentage = totalVotes > 0 ? Math.round((dumpVotes / totalVotes) * 100) : 0;
  pumpVotesElement.textContent = `${pumpPercentage}%`;
  dumpVotesElement.textContent = `${dumpPercentage}%`;
  
  // Update progress bars if they exist
  const pumpProgressBar = document.querySelector('.pump-progress');
  const dumpProgressBar = document.querySelector('.dump-progress');
  
  if (pumpProgressBar && dumpProgressBar) {
    pumpProgressBar.style.width = `${pumpPercentage}%`;
    dumpProgressBar.style.width = `${dumpPercentage}%`;
  }
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
  if (currentPrice < INITIAL_PRICE * 0.5) {
    currentPrice = INITIAL_PRICE * 0.5;
  }
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
    if (currentPrice < INITIAL_PRICE * 0.5) {
      currentPrice = INITIAL_PRICE * 0.5;
    }
    updatePrice();
  }
}

// Update Price Display
function updatePrice() {
  if (!currentPriceElement || !growthRateElement) return;
  
  currentPriceElement.textContent = `$${currentPrice.toFixed(5)}`;
  const growthRate = ((currentPrice - INITIAL_PRICE) / INITIAL_PRICE) * 100;
  growthRateElement.textContent = `${growthRate.toFixed(2)}%`;
  
  if (priceChart) {
    updateChart();
  }
}

// Update Chart - Optimized version
function updateChart() {
  if (!priceChart) return;
  
  const currentTime = formatTime(new Date());
  
  // Shift the data arrays if they're full
  if (priceChart.data.labels.length >= CHART_HISTORY_LENGTH) {
    priceChart.data.labels.shift();
    priceChart.data.datasets[0].data.shift();
  }
  
  priceChart.data.labels.push(currentTime);
  priceChart.data.datasets[0].data.push(currentPrice);
  
  // Update chart with 'none' animation mode for better performance
  priceChart.update('none');
}

// Solana Wallet Connection
async function connectWallet() {
  if (!connectWalletButton) return;
  
  if ('solana' in window) {
    const provider = window.solana;
    if (provider && provider.isPhantom) {
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

// Handle Pump Vote
function handlePumpVote() {
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
}

// Handle Dump Vote
function handleDumpVote() {
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
}

// Initialize chart with empty data
function initializeChart(chartCanvas) {
  if (!chartCanvas) return null;
  
  // Pre-initialize chart data with empty values
  const initialLabels = [];
  const initialData = [];
  const now = Date.now();

  for (let i = CHART_HISTORY_LENGTH - 1; i >= 0; i--) {
    const time = new Date(now - i * PRICE_UPDATE_INTERVAL);
    initialLabels.push(formatTime(time));
    initialData.push(INITIAL_PRICE);
  }

  try {
    const ctx = chartCanvas.getContext('2d');
    return new Chart(ctx, {
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
  } catch (error) {
    console.error('Error initializing chart:', error);
    return null;
  }
}

// Main initialization function
function initializeApp() {
  // Get all necessary DOM elements
  const countdownElement = getElement('countdown');
  const currentPriceElement = getElement('currentPrice');
  const growthRateElement = getElement('growthRate');
  const pumpVotesElement = getElement('pumpVotes');
  const dumpVotesElement = getElement('dumpVotes');
  const pumpButton = getElement('pumpButton');
  const dumpButton = getElement('dumpButton');
  const connectWalletButton = getElement('connectWallet');
  const chartCanvas = getElement('priceChart');
  const claimRewardButton = getElement('claimRewardButton');
  
  // Check if critical elements are missing
  if (!chartCanvas || !countdownElement || !currentPriceElement) {
    console.error('Critical DOM elements are missing. App initialization aborted.');
    return;
  }
  
  // Initialize chart
  priceChart = initializeChart(chartCanvas);
  
  // Set initial values
  if (currentPriceElement) {
    currentPriceElement.textContent = `$${INITIAL_PRICE.toFixed(5)}`;
  }
  
  if (growthRateElement) {
    growthRateElement.textContent = '0.00%';
  }
  
  // Add event listeners
  if (pumpButton) {
    pumpButton.addEventListener('click', handlePumpVote);
  }
  
  if (dumpButton) {
    dumpButton.addEventListener('click', handleDumpVote);
  }
  
  if (connectWalletButton) {
    connectWalletButton.addEventListener('click', connectWallet);
  }
  
  if (claimRewardButton) {
    claimRewardButton.addEventListener('click', function() {
      if (!userAddress) {
        alert('Please connect your wallet to claim rewards.');
        return;
      }
      alert('Rewards can be claimed after each voting round ends.');
    });
  }
  
  // Start timers
  setInterval(updateCountdown, 1000);
  setInterval(simulatePriceFluctuation, PRICE_UPDATE_INTERVAL);
  
  console.log('Pump & Dump Lottery application initialized successfully!');
}

// Initialize the application when DOM content is loaded
document.addEventListener('DOMContentLoaded', initializeApp);

// Global scope references for DOM elements
let countdownElement, currentPriceElement, growthRateElement, 
    pumpVotesElement, dumpVotesElement;

// Set these variables once the DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
  countdownElement = getElement('countdown');
  currentPriceElement = getElement('currentPrice');
  growthRateElement = getElement('growthRate');
  pumpVotesElement = getElement('pumpVotes');
  dumpVotesElement = getElement('dumpVotes');
});
