// Global variables
let connected = false;
let initialMarketCap = 4000; // Starting MCAP of $4K
let totalSupply = 1000000000; // 1 billion tokens (typical for memecoins)
let currentPrice = initialMarketCap / totalSupply; // Initial price based on MCAP and supply
let priceHistory = [];
let candleData = [];
let pumpVotes = 0;
let dumpVotes = 0;
let userVote = null;
let countdownInterval;
let chart;
let hasClaimedReward = false;
let userWalletAddress = "";

// DOM elements
const connectWalletBtn = document.getElementById('connectWallet');
const currentPriceEl = document.getElementById('currentPrice');
const growthRateEl = document.getElementById('growthRate');
const countdownEl = document.getElementById('countdown');
const pumpBtn = document.getElementById('pumpButton');
const dumpBtn = document.getElementById('dumpButton');
const pumpVotesEl = document.getElementById('pumpVotes');
const dumpVotesEl = document.getElementById('dumpVotes');
const pumpProgressEl = document.querySelector('.pump-progress');
const dumpProgressEl = document.querySelector('.dump-progress');
const claimRewardBtn = document.getElementById('claimRewardButton');
const priceChartEl = document.getElementById('priceChart');

// Initialize when the page loads
document.addEventListener('DOMContentLoaded', function() {
  initializePage();
});

// Set up initial page state
function initializePage() {
  // Generate initial candle data (last 20 candles)
  const now = new Date();
  
  for (let i = 0; i < 20; i++) {
    const startTime = new Date(now.getTime() - (20 - i) * 15 * 60000); // 15-minute candles
    const endTime = new Date(startTime.getTime() + 15 * 60000);
    
    const open = i === 0 ? currentPrice : candleData[i-1].close;
    const close = open * (1 + (Math.random() * 0.04 - 0.02)); // -2% to +2% change
    const high = Math.max(open, close) * (1 + Math.random() * 0.01); // Up to 1% higher than max(open,close)
    const low = Math.min(open, close) * (1 - Math.random() * 0.01); // Up to 1% lower than min(open,close)
    const volume = Math.random() * 500 + 100; // Random volume between 100-600
    
    candleData.push({
      time: startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      open,
      high,
      low,
      close,
      volume
    });
    
    // Also add to price history for tracking
    priceHistory.push({
      time: startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      price: close
    });
  }
  
  // Set current price to the last candle's close
  currentPrice = candleData[candleData.length - 1].close;
  updatePriceDisplay();
  
  // Initialize random votes
  pumpVotes = Math.floor(Math.random() * 50) + 10;
  dumpVotes = Math.floor(Math.random() * 50) + 10;
  updateVoteDisplay();
  
  // Set up event listeners
  connectWalletBtn.addEventListener('click', connectPhantomWallet);
  pumpBtn.addEventListener('click', () => vote('pump'));
  dumpBtn.addEventListener('click', () => vote('dump'));
  claimRewardBtn.addEventListener('click', claimReward);
  
  // Start countdown timer for next round (8 minutes)
  startCountdown(8 * 60);
  
  // Initialize price chart
  initializeCandleChart();
  
  // Simulate price changes
  startPriceSimulation();
}

// Phantom Wallet Connection
async function connectPhantomWallet() {
  if (connected) return;
  
  connectWalletBtn.textContent = 'Connecting...';
  
  try {
    // Check if Phantom is installed
    const isPhantomInstalled = window.solana && window.solana.isPhantom;
    
    if (!isPhantomInstalled) {
      showNotification('Phantom wallet is not installed. Please install it first.');
      connectWalletBtn.textContent = 'Connect Wallet';
      window.open('https://phantom.app/', '_blank');
      return;
    }
    
    // Connect to Phantom
    const resp = await window.solana.connect();
    userWalletAddress = resp.publicKey.toString();
    
    // Update UI
    connected = true;
    connectWalletBtn.textContent = userWalletAddress.substring(0, 4) + '...' + userWalletAddress.substring(userWalletAddress.length - 4);
    showNotification('Wallet Connected Successfully!');
    
  } catch (error) {
    console.error('Wallet connection error:', error);
    
    // Fallback to simulated connection for testing
    if (error.message.includes('User rejected') || !window.solana) {
      showNotification('Simulating wallet connection for testing...');
      setTimeout(() => {
        connected = true;
        userWalletAddress = "sol" + Math.random().toString(36).substring(2, 10);
        connectWalletBtn.textContent = userWalletAddress.substring(0, 4) + '...' + userWalletAddress.substring(userWalletAddress.length - 4);
      }, 1000);
    } else {
      showNotification('Failed to connect wallet: ' + error.message);
      connectWalletBtn.textContent = 'Connect Wallet';
    }
  }
}

// Handle voting - now works without wallet connection
function vote(voteType) {
  // If user changes their vote, subtract from previous vote count
  if (userVote) {
    if (userVote === 'pump') pumpVotes--;
    else dumpVotes--;
  }
  
  userVote = voteType;
  
  if (voteType === 'pump') {
    pumpVotes++;
    pumpBtn.classList.add('active');
    dumpBtn.classList.remove('active');
    showNotification('You voted to Pump!');
  } else {
    dumpVotes++;
    dumpBtn.classList.add('active');
    pumpBtn.classList.remove('active');
    showNotification('You voted to Dump!');
  }
  
  updateVoteDisplay();
  
  // Simulate vote impact on price immediately
  simulateVoteImpact(voteType);
}

// Update the vote display
function updateVoteDisplay() {
  const totalVotes = pumpVotes + dumpVotes;
  const pumpPercentage = totalVotes > 0 ? Math.round((pumpVotes / totalVotes) * 100) : 50;
  const dumpPercentage = totalVotes > 0 ? Math.round((dumpVotes / totalVotes) * 100) : 50;
  
  pumpVotesEl.textContent = pumpPercentage + '%';
  dumpVotesEl.textContent = dumpPercentage + '%';
  
  pumpProgressEl.style.width = pumpPercentage + '%';
  dumpProgressEl.style.width = dumpPercentage + '%';
}

// Start countdown timer
function startCountdown(seconds) {
  let remainingTime = seconds;
  
  // Clear any existing interval
  if (countdownInterval) clearInterval(countdownInterval);
  
  countdownInterval = setInterval(() => {
    remainingTime--;
    
    if (remainingTime <= 0) {
      clearInterval(countdownInterval);
      endRound();
      return;
    }
    
    const hours = Math.floor(remainingTime / 3600);
    const minutes = Math.floor((remainingTime % 3600) / 60);
    const secs = remainingTime % 60;
    
    countdownEl.textContent = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }, 1000);
}

// End current round and start a new one
function endRound() {
  // Calculate round result based on votes
  const totalVotes = pumpVotes + dumpVotes;
  const pumpPercentage = totalVotes > 0 ? (pumpVotes / totalVotes) * 100 : 50;
  
  // Apply final impact to price
  if (pumpPercentage > 50) {
    const pumpStrength = (pumpPercentage - 50) / 100; // 0-0.5 range
    currentPrice *= (1 + (pumpStrength * 0.2)); // Up to 10% increase for 100% pump votes
  } else if (pumpPercentage < 50) {
    const dumpStrength = (50 - pumpPercentage) / 100; // 0-0.5 range
    currentPrice *= (1 - (dumpStrength * 0.2)); // Up to 10% decrease for 100% dump votes
  }
  
  // Update market cap based on new price
  const marketCap = currentPrice * totalSupply;
  
  // Add a new candle
  const lastCandle = candleData[candleData.length - 1];
  const open = lastCandle.close;
  const close = currentPrice;
  const high = Math.max(open, close) * (1 + Math.random() * 0.005);
  const low = Math.min(open, close) * (1 - Math.random() * 0.005);
  const volume = totalVotes * 10 + Math.random() * 200; // Volume based on votes
  
  const now = new Date();
  candleData.push({
    time: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    open,
    high,
    low,
    close,
    volume
  });
  
  // Remove oldest candle if we have more than 20
  if (candleData.length > 20) {
    candleData.shift();
  }
  
  // Update price history
  priceHistory.push({
    time: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    price: currentPrice
  });
  
  if (priceHistory.length > 20) {
    priceHistory.shift();
  }
  
  updatePriceDisplay();
  updateChart();
  
  // Reset for new round
  hasClaimedReward = false;
  userVote = null;
  pumpVotes = Math.floor(Math.random() * 20) + 5;
  dumpVotes = Math.floor(Math.random() * 20) + 5;
  updateVoteDisplay();
  
  pumpBtn.classList.remove('active');
  dumpBtn.classList.remove('active');
  
  // Show round end notification
  showNotification(`Round ended! New MCAP: $${(marketCap).toFixed(2)}`);
  
  // Start new countdown
  startCountdown(8 * 60); // 8 minutes
}

// Claim reward functionality
function claimReward() {
  if (hasClaimedReward) {
    showNotification('You already claimed your reward for this round!');
    return;
  }
  
  if (!userVote) {
    showNotification('You need to vote before claiming a reward!');
    return;
  }
  
  // Calculate reward based on if user's vote aligns with the majority
  const totalVotes = pumpVotes + dumpVotes;
  const pumpPercentage = totalVotes > 0 ? (pumpVotes / totalVotes) * 100 : 50;
  const majorityVote = pumpPercentage >= 50 ? 'pump' : 'dump';
  
  if (userVote === majorityVote) {
    // User voted with majority
    const rewardAmount = connected ? 0.1 : 0.05; // Double reward for connected wallets
    showNotification(`Congratulations! You earned ${rewardAmount} $LOTTERY tokens!`);
  } else {
    // User voted against majority
    showNotification('Better luck next time! No reward this round.');
  }
  
  hasClaimedReward = true;
  claimRewardBtn.disabled = true;
  setTimeout(() => {
    claimRewardBtn.disabled = false;
  }, 3000);
}

// Initialize candle chart
function initializeCandleChart() {
  const ctx = priceChartEl.getContext('2d');
  
  // Prepare data for CandleStick chart
  const labels = candleData.map(data => data.time);
  const ohlc = candleData.map(data => ({
    o: data.open,
    h: data.high,
    l: data.low,
    c: data.close
  }));
  
  // Custom candle rendering plugin
  const candlePlugin = {
    id: 'candleStick',
    beforeDraw: (chart) => {
      const ctx = chart.ctx;
      const xAxis = chart.scales.x;
      const yAxis = chart.scales.y;
      
      const candleWidth = Math.max(2, xAxis.width / ohlc.length / 2);
      
      ohlc.forEach((candle, i) => {
        const x = xAxis.getPixelForValue(i);
        const color = candle.o < candle.c ? '#00c853' : '#ff3d00'; // Green for bullish, red for bearish
        
        // Draw candle body
        const openY = yAxis.getPixelForValue(candle.o);
        const closeY = yAxis.getPixelForValue(candle.c);
        const bodyHeight = Math.max(1, Math.abs(closeY - openY));
        
        ctx.fillStyle = color;
        ctx.fillRect(
          x - candleWidth / 2,
          Math.min(openY, closeY),
          candleWidth,
          bodyHeight
        );
        
        // Draw wicks
        ctx.strokeStyle = color;
        ctx.lineWidth = 1;
        ctx.beginPath();
        // Top wick
        ctx.moveTo(x, yAxis.getPixelForValue(candle.h));
        ctx.lineTo(x, Math.min(openY, closeY));
        // Bottom wick
        ctx.moveTo(x, Math.max(openY, closeY));
        ctx.lineTo(x, yAxis.getPixelForValue(candle.l));
        ctx.stroke();
      });
    }
  };
  
  // Create the chart
  chart = new Chart(ctx, {
    type: 'line', // Base type, will be overridden by plugin
    data: {
      labels: labels,
      datasets: [{
        label: '$LOTTERY Price',
        data: candleData.map((data, index) => index), // Using index as data to position candles
        borderColor: 'rgba(0, 0, 0, 0)', // Transparent, we'll draw candles manually
        backgroundColor: 'rgba(0, 0, 0, 0)',
        pointRadius: 0,
        tension: 0,
      }, {
        // Volume bars shown at bottom
        label: 'Volume',
        data: candleData.map(data => data.volume / 1000), // Scale down volumes
        backgroundColor: candleData.map(data => data.open < data.close ? 'rgba(0, 200, 83, 0.3)' : 'rgba(255, 61, 0, 0.3)'),
        barThickness: 'flex',
        barPercentage: 0.8,
        categoryPercentage: 0.8,
        yAxisID: 'volume',
        type: 'bar',
        order: 1
      }]
    },
    plugins: [candlePlugin],
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        mode: 'index',
        intersect: false,
      },
      scales: {
        x: {
          grid: {
            color: 'rgba(255, 255, 255, 0.1)'
          },
          ticks: {
            color: '#b0b0b0',
            maxRotation: 0,
            autoSkip: true,
            maxTicksLimit: 10
          }
        },
        y: {
          position: 'right',
          grid: {
            color: 'rgba(255, 255, 255, 0.1)'
          },
          ticks: {
            color: '#b0b0b0',
            callback: function(value) {
              return '$' + value.toFixed(7);
            }
          }
        },
        volume: {
          position: 'left',
          grid: {
            display: false
          },
          ticks: {
            color: '#b0b0b0'
          },
          max: Math.max(...candleData.map(d => d.volume)) / 500 // Scale volume axis
        }
      },
      plugins: {
        legend: {
          display: false
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              const index = context.dataIndex;
              const candle = candleData[index];
              return [
                'Open: $' + candle.open.toFixed(8),
                'High: $' + candle.high.toFixed(8),
                'Low: $' + candle.low.toFixed(8),
                'Close: $' + candle.close.toFixed(8),
                'Volume: ' + Math.floor(candle.volume) + ' SOL'
              ];
            }
          }
        }
      }
    }
  });
}

// Update chart with new candle data
function updateChart() {
  if (!chart) return;
  
  chart.data.labels = candleData.map(data => data.time);
  chart.data.datasets[1].data = candleData.map(data => data.volume / 1000);
  chart.data.datasets[1].backgroundColor = candleData.map(data => 
    data.open < data.close ? 'rgba(0, 200, 83, 0.3)' : 'rgba(255, 61, 0, 0.3)'
  );
  
  chart.update();
}

// Update price display in UI
function updatePriceDisplay() {
  // Update price display
  currentPriceEl.textContent = '$' + currentPrice.toFixed(8);
  
  // Calculate market cap
  const marketCap = currentPrice * totalSupply;
  
  // Calculate growth rate (24h equivalent)
  if (priceHistory.length > 1) {
    const oldestPrice = priceHistory[0].price;
    const growthRate = ((currentPrice - oldestPrice) / oldestPrice) * 100;
    growthRateEl.textContent = growthRate.toFixed(2) + '%';
    
    // Set color based on growth rate
    if (growthRate > 0) {
      growthRateEl.style.color = '#00c853'; // Green for positive
    } else if (growthRate < 0) {
      growthRateEl.style.color = '#ff3d00'; // Red for negative
    } else {
      growthRateEl.style.color = '#ffffff'; // White for neutral
    }
  }
}

// Start price simulation
function startPriceSimulation() {
  // Update price more frequently for memecoin-like volatility (every 5 seconds)
  setInterval(() => {
    // Calculate vote influence
    const totalVotes = pumpVotes + dumpVotes;
    const pumpPercentage = totalVotes > 0 ? (pumpVotes / totalVotes) * 100 : 50;
    const voteInfluence = (pumpPercentage - 50) / 5000; // Very small continuous influence
    
    // Base random fluctuation (high volatility for memecoins)
    const volatility = currentPrice * 0.02; // 2% base volatility
    const randomChange = (Math.random() * 2 - 1) * volatility;
    
    // Apply market trend (slight upward bias for lottery token)
    const marketTrend = Math.random() < 0.55 ? currentPrice * 0.001 : -currentPrice * 0.001;
    
    // Calculate new price
    currentPrice += randomChange + marketTrend + (currentPrice * voteInfluence);
    
    // Ensure price doesn't go too low
    if (currentPrice < 0.00000001) currentPrice = 0.00000001;
    
    // Update candle data (update current candle)
    const lastCandle = candleData[candleData.length - 1];
    lastCandle.close = currentPrice;
    lastCandle.high = Math.max(lastCandle.high, currentPrice);
    lastCandle.low = Math.min(lastCandle.low, currentPrice);
    
    // Update UI
    updatePriceDisplay();
    updateChart();
  }, 5000); // 5 seconds
  
  // Create new candle every 15 seconds (for demo purposes - real candles would be longer)
  setInterval(() => {
    const lastCandle = candleData[candleData.length - 1];
    const now = new Date();
    
    // Create new candle
    const newCandle = {
      time: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      open: lastCandle.close,
      high: lastCandle.close,
      low: lastCandle.close,
      close: lastCandle.close,
      volume: Math.random() * 200 + 50
    };
    
    candleData.push(newCandle);
    
    // Keep only the most recent 20 candles
    if (candleData.length > 20) {
      candleData.shift();
    }
    
    // Update price history
    priceHistory.push({
      time: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      price: currentPrice
    });
    
    if (priceHistory.length > 20) {
      priceHistory.shift();
    }
    
    updateChart();
  }, 15000); // 15 seconds per candle
}

// Simulate immediate price impact from votes
function simulateVoteImpact(voteType) {
  // Calculate current vote balance
  const totalVotes = pumpVotes + dumpVotes;
  const pumpPercentage = (pumpVotes / totalVotes) * 100;
  
  // Calculate price impact (more significant for memecoin)
  let priceChange = 0;
  
  if (voteType === 'pump') {
    priceChange = currentPrice * (0.003 * (pumpPercentage / 100)); // 0.3% max immediate impact per vote
  } else {
    priceChange = -currentPrice * (0.003 * ((100 - pumpPercentage) / 100));
  }
  
  // Apply change to current price
  currentPrice += priceChange;
  
  // Ensure price doesn't go too low
  if (currentPrice < 0.00000001) currentPrice = 0.00000001;
  
  // Update candle data
  const lastCandle = candleData[candleData.length - 1];
  lastCandle.close = currentPrice;
  lastCandle.high = Math.max(lastCandle.high, currentPrice);
  lastCandle.low = Math.min(lastCandle.low, currentPrice);
  
  // Update UI
  updatePriceDisplay();
  updateChart();
}

// Show notification
function showNotification(message) {
  // Create notification element
  const notification = document.createElement('div');
  notification.className = 'notification animate__animated animate__fadeIn';
  notification.textContent = message;
  notification.style.position = 'fixed';
  notification.style.bottom = '20px';
  notification.style.right = '20px';
  notification.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
  notification.style.color = '#ffffff';
  notification.style.padding = '10px 20px';
  notification.style.borderRadius = '4px';
  notification.style.zIndex = '1000';
  notification.style.maxWidth = '300px';
  document.body.appendChild(notification);
  
  // Remove after delay
  setTimeout(() => {
    notification.classList.remove('animate__fadeIn');
    notification.classList.add('animate__fadeOut');
    setTimeout(() => {
      document.body.removeChild(notification);
    }, 1000);
  }, 3000);
}