// JWT check: redirect to login if not present or expired
(function() {
  // Don't run on the login page itself
  if (window.location.pathname.endsWith('/login.html')) return;
  const token = localStorage.getItem('jwt');
  if (!token) {
    window.location.href = '/login.html';
    return;
  }
  // Check expiration (decode JWT payload)
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    if (payload.exp && Date.now() / 1000 > payload.exp) {
      localStorage.removeItem('jwt');
      window.location.href = '/login.html';
    }
  } catch (e) {
    localStorage.removeItem('jwt');
    window.location.href = '/login.html';
  }
})();

// Theme handling
const themeStorageKey = 'theme';
const prefersDarkScheme = window.matchMedia('(prefers-color-scheme: dark)');

// Initialize theme
function initializeTheme() {
    const savedTheme = localStorage.getItem(themeStorageKey);
    if (savedTheme) {
        document.documentElement.setAttribute('data-theme', savedTheme);
        updateThemeIcons(savedTheme === 'dark');
    } else {
        // Default to dark theme if no saved preference
        document.documentElement.setAttribute('data-theme', 'dark');
        updateThemeIcons(true);
    }
    updateChartThemes();
}

// Toggle theme
function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem(themeStorageKey, newTheme);
    updateThemeIcons(newTheme === 'dark');
    updateChartThemes();
}

// Update theme icons
function updateThemeIcons(isDark) {
    const sunIcons = document.querySelectorAll('.sun-icon');
    const moonIcons = document.querySelectorAll('.moon-icon');
    
    sunIcons.forEach(icon => {
        icon.style.display = isDark ? 'none' : 'block';
    });
    moonIcons.forEach(icon => {
        icon.style.display = isDark ? 'block' : 'none';
    });
}

// Update chart themes
function updateChartThemes() {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    const textColor = isDark ? '#ffffff' : '#333333';
    const gridColor = isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';
    
    const chartOptions = {
        color: textColor,
        scales: {
            x: {
                grid: {
                    color: gridColor
                },
                ticks: {
                    color: textColor
                }
            },
            y: {
                grid: {
                    color: gridColor
                },
                ticks: {
                    color: textColor
                }
            }
        },
        plugins: {
            legend: {
                labels: {
                    color: textColor
                }
            }
        }
    };

    // Update all charts if they exist
    if (playerChart) {
        playerChart.options = {
            ...playerChart.options,
            ...chartOptions
        };
        playerChart.update();
    }
    if (scrollChartGold) {
        scrollChartGold.options = {
            ...scrollChartGold.options,
            ...chartOptions
        };
        scrollChartGold.update();
    }
    if (scrollChartDiamond) {
        scrollChartDiamond.options = {
            ...scrollChartDiamond.options,
            ...chartOptions
        };
        scrollChartDiamond.update();
    }
    if (goldChart) {
        goldChart.options = {
            ...goldChart.options,
            ...chartOptions
        };
        goldChart.update();
    }
}

// Initialize theme when the page loads
document.addEventListener('DOMContentLoaded', function() {
    initializeTheme();
    
    // Initialize charts if on the graphs page
    if (document.getElementById('playerChart')) {
        initializeCharts();
        // Load filter state from local storage
        const filterGigalogicCheckbox = document.getElementById('filterGigalogic');
        if (filterGigalogicCheckbox) {
            const savedFilterState = localStorage.getItem(filterGigalogicStorageKey);
            if (savedFilterState !== null) {
                filterGigalogicCheckbox.checked = JSON.parse(savedFilterState);
            }
            // Add event listener to save state when changed
            filterGigalogicCheckbox.addEventListener('change', function() {
                localStorage.setItem(filterGigalogicStorageKey, this.checked);
                 // Reload chart data when filter changes (only for "All Players")
                 const playerSelect = document.getElementById('playerSelect');
                 if (playerSelect && playerSelect.value === '') {
                    loadChartData(''); // Reload with "All Players" data
                 }
            });
             // Hide the filter option by default and show only when 'All Players' is selected
             const filterOptionsDiv = filterGigalogicCheckbox.closest('.filter-options');
             if(filterOptionsDiv) {
                filterOptionsDiv.style.display = 'none';
             }
        }
        
        loadChartData();
        populatePlayerDropdown();
        setupPlayerDropdownListener();
    }

    // Setup player snapshot section if on the index page
    if (document.getElementById('player-snapshot')) {
        console.log('DOMContentLoaded: Setting up player snapshot...');
        setupPlayerSnapshot();
    }

    // Setup average daily XP section if on the index page
    if (document.getElementById('average-daily-xp')) {
        console.log('DOMContentLoaded: Setting up average daily XP...');
        setupAverageDailyXP();
    }

    // Display latest player stats if on the index page
    if (document.getElementById('latest-player-stats')) {
        console.log('DOMContentLoaded: Displaying latest player stats...');
        displayLatestPlayerStats();
    }

    // Setup searchable player dropdowns on the main page
    if (document.getElementById('summaryPlayerSelect')) {
        makeSummaryPlayerDropdownSearchable();
    }
    if (document.getElementById('avgXpPlayerSelect')) {
        makeAvgXpPlayerDropdownSearchable();
    }
    if (document.getElementById('snapshotPlayerSelect')) {
        makeSnapshotPlayerDropdownSearchable();
    }

    // --- Custom XP/Gold/Monster Calculator Section ---
    if (document.getElementById('custom-xp-gold-monster')) {
      setupCustomXpGoldMonsterSection();
    }
});

// Chart instances
let playerChart = null;
let scrollChartGold = null;
let scrollChartDiamond = null;
let goldChart = null;

// Define a color palette for multiple players
const playerColors = [
    '#4CAF50', // Green (Level)
    '#FFC107', // Yellow (Gold)
    '#2196F3', // Blue (Mobs Killed)
    '#9C27B0', // Purple
    '#F44336', // Red
    '#000000', // Black
    '#607D8B', // Grey
    '#795548', // Brown
    '#E91E63', // Pink
    '#00BCD4'  // Cyan
];

const filterGigalogicStorageKey = 'filterGigalogic';

function initializeCharts() {
    // Player Progress Chart
    const playerCtx = document.getElementById('playerChart').getContext('2d');
    playerChart = new Chart(playerCtx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [] // Start with empty datasets
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            layout: {
                padding: {
                    top: 10,
                    right: 5,
                    bottom: 5,
                    left: 5
                }
            },
            scales: {
                'y-level': { // Configuration for the Level y-axis
                    type: 'linear',
                    position: 'left',
                    beginAtZero: true,
                    title: {
                      display: true,
                      text: '',
                      font: { size: 10 },
                      color: '#4CAF50'
                    },
                    ticks: {
                      font: { size: 9 },
                      color: '#4CAF50'
                    }
                },
                'y-gold': { // Configuration for the Gold y-axis
                    type: 'linear',
                    position: 'right',
                    beginAtZero: true,
                    grid: {
                        drawOnChartArea: false
                    },
                     title: {
                      display: true,
                      text: '',
                      font: { size: 10 },
                      color: '#FFC107'
                    },
                    ticks: {
                      font: { size: 9 },
                      color: '#FFC107'
                    }
                },
                 'y-mobs': { // Configuration for the Mobs Killed y-axis
                    type: 'linear',
                    position: 'right',
                    beginAtZero: true,
                    grid: {
                        drawOnChartArea: false
                    },
                    title: {
                      display: true,
                      text: '',
                      font: { size: 10 },
                      color: '#2196F3'
                    },
                    ticks: {
                      font: { size: 9 },
                      color: '#2196F3'
                    }
                }
            }
        }
    });

    // Scroll Price Chart (Gold)
    const scrollCtxGold = document.getElementById('scrollChartGold').getContext('2d');
    scrollChartGold = new Chart(scrollCtxGold, {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                label: 'Ancient Scroll',
                data: [],
                borderColor: '#9C27B0',
                tension: 0.1
            }, {
                label: 'Demoniac Scroll',
                data: [],
                borderColor: '#F44336',
                tension: 0.1
            }, {
                label: 'Arcane Scroll',
                data: [],
                borderColor: '#2196F3',
                tension: 0.1
            }, {
                label: 'Shadow Scroll',
                data: [],
                borderColor: '#607D8B',
                tension: 0.1
            }, {
                label: 'Void Scroll',
                data: [],
                borderColor: '#000000',
                tension: 0.1
            }, {
                label: 'Sunlight Scroll',
                data: [],
                borderColor: '#FFC107',
                tension: 0.1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            layout: {
                padding: {
                    top: 10,
                    right: 10,
                    bottom: 10,
                    left: 10
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Gold Price'
                    }
                }
            }
        }
    });

    // Scroll Price Chart (Diamond)
    const scrollCtxDiamond = document.getElementById('scrollChartDiamond').getContext('2d');
    scrollChartDiamond = new Chart(scrollCtxDiamond, {
        type: 'line',
        data: {
            labels: [],
            datasets: [
                { label: 'Ancient Scroll', data: [], borderColor: '#9C27B0', tension: 0.1 },
                { label: 'Demoniac Scroll', data: [], borderColor: '#F44336', tension: 0.1 },
                { label: 'Arcane Scroll', data: [], borderColor: '#2196F3', tension: 0.1 },
                { label: 'Shadow Scroll', data: [], borderColor: '#607D8B', tension: 0.1 },
                { label: 'Void Scroll', data: [], borderColor: '#000000', tension: 0.1 },
                { label: 'Sunlight Scroll', data: [], borderColor: '#FFC107', tension: 0.1 }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            layout: {
                padding: {
                    top: 10,
                    right: 10,
                    bottom: 10,
                    left: 10
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Diamond Price'
                    }
                }
            }
        }
    });

    // Gold Price Chart
    const goldCtx = document.getElementById('goldChart').getContext('2d');
    goldChart = new Chart(goldCtx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                label: 'Gold Price',
                data: [],
                borderColor: '#FFC107',
                tension: 0.1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            layout: {
                padding: {
                    top: 10,
                    right: 10,
                    bottom: 10,
                    left: 10
                }
            },
            scales: {
                y: {
                    min: 1.0,
                    beginAtZero: false
                }
            }
        }
    });
}

async function loadChartData(playerName = null) {
    try {
        // Show/hide filter options based on selected player
        const filterOptionsDiv = document.querySelector('.filter-options');
        if (filterOptionsDiv) {
            filterOptionsDiv.style.display = playerName === '' ? 'flex' : 'none';
        }

        // Load player data
        const playerEndpoint = playerName ? `/api/player-stats?player=${encodeURIComponent(playerName)}` : '/api/player-stats';
        const playerResponse = await fetch(playerEndpoint);
        const playerData = await playerResponse.json();
        updatePlayerChart(playerData, playerName);

        // Load scroll prices (both gold and diamond) - only do this once on initial load
        if (!playerName) { // Only fetch scroll and gold prices on initial load (when playerName is null)
          const scrollResponse = await fetch('/api/scroll-prices');
          const scrollData = await scrollResponse.json();
          updateScrollChartGold(scrollData);
          updateScrollChartDiamond(scrollData);

          // Load gold prices
          const goldResponse = await fetch('/api/gold-prices');
          const goldData = await goldResponse.json();
          updateGoldChart(goldData);
        }

    } catch (error) {
        console.error('Error loading chart data:', error);
    }
}

function updatePlayerChart(data, selectedPlayer = null) {
    if (!playerChart || !data) return;

    // Clear existing datasets
    playerChart.data.datasets = [];
    playerChart.data.labels = [];

    // Check if Gigalogic filter is active for "All Players" view
    const filterGigalogicCheckbox = document.getElementById('filterGigalogic');
    const isGigalogicFiltered = selectedPlayer === '' && filterGigalogicCheckbox && filterGigalogicCheckbox.checked;

    let filteredData = data;
    if (isGigalogicFiltered) {
        filteredData = data.filter(entry => entry.player !== 'Gigalogic');
    }

    if (!selectedPlayer) { // "All Players" selected
        // Get unique players from the filtered data and sort them
        const players = [...new Set(filteredData.map(entry => entry.player))].sort();

        // Create a dataset for each player's Total EXP
        players.forEach((player, index) => {
            const playerExpData = filteredData
                .filter(entry => entry.player === player)
                .map(entry => ({
                    x: new Date(entry.dateTime),
                    y: entry.exp
                }));

            // Sort player data by date to ensure correct line drawing
            playerExpData.sort((a, b) => a.x - b.x);

            playerChart.data.datasets.push({
                label: `${player} - Total EXP`,
                data: playerExpData,
                borderColor: playerColors[index % playerColors.length], // Assign color from palette
                tension: 0.1,
                yAxisID: 'y-level' // Always use the level axis for EXP
            });
        });

        // Get all unique timestamps across filtered data for labels and sort them
        const allTimestamps = [...new Set(filteredData.map(entry => entry.dateTime))];
        allTimestamps.sort((a, b) => new Date(a) - new Date(b));
        playerChart.data.labels = allTimestamps.map(timestamp => {
            const date = new Date(timestamp);
            return date instanceof Date && !isNaN(date) ? date.toLocaleDateString() : timestamp;
        });

        // Configure scales: only show y-level
        playerChart.options.scales['y-level'].display = true;
        playerChart.options.scales['y-gold'].display = false;
        playerChart.options.scales['y-mobs'].display = false;

        // Ensure the y-level axis title and ticks have a neutral color for All Players view
        playerChart.options.scales['y-level'].title.color = '#666'; // Neutral color
        playerChart.options.scales['y-level'].ticks.color = '#666'; // Neutral color

    } else { // Specific player selected
        // Filter data for the selected player (already done by API if playerName is not null)
        const playerSpecificData = data; // Use data directly as it's already filtered by the API

        const timestamps = playerSpecificData.map(entry => {
            const date = new Date(entry.dateTime);
            return date instanceof Date && !isNaN(date) ? date.toLocaleDateString() : entry.dateTime;
        });
        const expData = playerSpecificData.map(entry => entry.exp);
        const goldData = playerSpecificData.map(entry => entry.gold);
        const mobsKilledData = playerSpecificData.map(entry => entry.mobsKilled);

        playerChart.data.labels = timestamps;

        // Add datasets for EXP, Gold, and Mobs Killed
        playerChart.data.datasets.push({
            label: 'Total EXP',
            data: expData,
            borderColor: '#4CAF50',
            tension: 0.1,
            yAxisID: 'y-level'
        });
        playerChart.data.datasets.push({
            label: 'Gold',
            data: goldData,
            borderColor: '#FFC107',
            tension: 0.1,
            yAxisID: 'y-gold'
        });
        playerChart.data.datasets.push({
            label: 'Mobs Killed',
            data: mobsKilledData,
            borderColor: '#2196F3',
            tension: 0.1,
            yAxisID: 'y-mobs'
        });

        // Configure scales: show all three y-axes
        playerChart.options.scales['y-level'].display = true;
        playerChart.options.scales['y-gold'].display = true;
        playerChart.options.scales['y-mobs'].display = true;

        // Restore axis title and ticks colors for specific player view
        playerChart.options.scales['y-level'].title.color = '#4CAF50';
        playerChart.options.scales['y-level'].ticks.color = '#4CAF50';
        playerChart.options.scales['y-gold'].title.color = '#FFC107';
        playerChart.options.scales['y-gold'].ticks.color = '#FFC107';
        playerChart.options.scales['y-mobs'].title.color = '#2196F3';
        playerChart.options.scales['y-mobs'].ticks.color = '#2196F3';
    }

    playerChart.update();
}

function updateScrollChartGold(data) {
    if (!scrollChartGold || !data) return;

    // Extract unique timestamps, ensuring valid dates
    const uniqueTimestamps = [...new Set(data.map(entry => entry.timestamp))];
    const sortedUniqueTimestamps = uniqueTimestamps.sort((a, b) => new Date(a) - new Date(b));

    const formattedTimestamps = sortedUniqueTimestamps.map(timestamp => {
        const date = new Date(timestamp);
        return date instanceof Date && !isNaN(date) ? date.toLocaleDateString() : timestamp;
    });

    const scrollTypes = ['ancient', 'demoniac', 'arcane', 'shadow', 'void', 'sunlight'];

    scrollChartGold.data.labels = formattedTimestamps;
    scrollTypes.forEach((type, index) => {
        // Filter data for the specific scroll type and map to GOLD prices, ensuring dates align
        const pricesForType = sortedUniqueTimestamps.map(timestamp => {
            const entry = data.find(d => d.type === type && d.timestamp === timestamp);
            return entry ? entry.goldPrice : null; // Use null for missing data points
        });
        scrollChartGold.data.datasets[index].data = pricesForType;
    });
    scrollChartGold.update();
}

function updateScrollChartDiamond(data) {
    if (!scrollChartDiamond || !data) return;

    // Extract unique timestamps, ensuring valid dates (same as gold chart)
    const uniqueTimestamps = [...new Set(data.map(entry => entry.timestamp))];
    const sortedUniqueTimestamps = uniqueTimestamps.sort((a, b) => new Date(a) - new Date(b));

    const formattedTimestamps = sortedUniqueTimestamps.map(timestamp => {
        const date = new Date(timestamp);
        return date instanceof Date && !isNaN(date) ? date.toLocaleDateString() : timestamp;
    });

    const scrollTypes = ['ancient', 'demoniac', 'arcane', 'shadow', 'void', 'sunlight'];

    scrollChartDiamond.data.labels = formattedTimestamps;
    scrollTypes.forEach((type, index) => {
        // Filter data for the specific scroll type and map to DIAMOND prices, ensuring dates align
        const pricesForType = sortedUniqueTimestamps.map(timestamp => {
            const entry = data.find(d => d.type === type && d.timestamp === timestamp);
            return entry ? entry.diamondPrice : null; // Use null for missing data points
        });
        scrollChartDiamond.data.datasets[index].data = pricesForType;
    });
    scrollChartDiamond.update();
}

function updateGoldChart(data) {
    if (!goldChart || !data) return;

    const timestamps = data.map(entry => {
        const date = new Date(entry.dateTime); // Use entry.dateTime for gold prices
        return date instanceof Date && !isNaN(date) ? date.toLocaleDateString() : entry.dateTime; // Check for valid date
    });
    const prices = data.map(entry => entry.price);

    goldChart.data.labels = timestamps;
    goldChart.data.datasets[0].data = prices;
    goldChart.update();
}

function submitStats() {
  const submitBtn = document.querySelector("button[onclick='submitStats()']");
  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.textContent = 'Submitting...';
  }
  const player = document.getElementById('player').value;
  const exp = document.getElementById('exp').value;
  const mobsKilled = document.getElementById('mobsKilled').value;
  const gold = document.getElementById('gold').value;

  // Validate inputs
  if (!player || !exp || !mobsKilled || !gold) {
    alert('Please fill in all fields');
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Submit';
    }
    return;
  }

  async function doSubmit() {
    fetch('/api/addStat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ player, exp, mobsKilled, gold })
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          alert('Stats added successfully');
          document.getElementById('player').value = '';
          document.getElementById('exp').value = '';
          document.getElementById('mobsKilled').value = '';
          document.getElementById('gold').value = '';
          if (playerChart) {
            const playerSelect = document.getElementById('playerSelect');
            const selectedPlayer = playerSelect ? playerSelect.value : '';
            loadChartData(selectedPlayer);
          }
          fetchPlayers();
          if (document.getElementById('latest-player-stats')) {
            displayLatestPlayerStats();
          }
        } else {
          alert('Error: ' + (data.error || 'Unknown error'));
        }
      })
      .catch(err => {
        alert('Error adding stats: ' + err.message);
      })
      .finally(() => {
        if (submitBtn) {
          submitBtn.textContent = 'Wait 10s...';
          setTimeout(() => {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Submit';
          }, 10000);
        }
      });
  }
  fetchPlayerStats().then(stats => {
    if (!stats || !Array.isArray(stats)) {
      doSubmit();
      return;
    }
    const playerStats = stats.filter(s => s.player === player);
    if (!playerStats.length) {
      doSubmit();
      return;
    }
    const latest = playerStats.reduce((a, b) => new Date(a.dateTime) > new Date(b.dateTime) ? a : b);
    let warnFields = [];
    if (Number(exp) < Number(latest.exp)) warnFields.push({name: 'EXP', entered: exp, latest: latest.exp});
    if (Number(mobsKilled) < Number(latest.mobsKilled)) warnFields.push({name: 'Total Mobs Killed', entered: mobsKilled, latest: latest.mobsKilled});
    if (Number(gold) < Number(latest.gold)) warnFields.push({name: 'Total Gold', entered: gold, latest: latest.gold});
    if (warnFields.length > 0) {
      const fieldMsgs = warnFields.map(f => {
        const enteredFormatted = Number(f.entered).toLocaleString();
        const latestFormatted = Number(f.latest).toLocaleString();
        return `${f.name}: Entered (${enteredFormatted}) - Latest (${latestFormatted})<br /><br />`;
      }).join('');
      const msg = `The following values are lower than the most recent data:<br /><br /><br />${fieldMsgs}<br /><br />Please correct these values before submitting.`;
      showBackOnlyAlert(msg, true);
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Submit';
      }
      return;
    }
    doSubmit();
  });
}

function submitGoldPrice() {
  const submitBtn = document.querySelector("button[onclick='submitGoldPrice()']");
  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.textContent = 'Submitting...';
  }
  const price = document.getElementById('goldPrice').value;
  if (!price) {
    alert('Please enter a gold price');
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Submit';
    }
    return;
  }
  fetch('/api/addGoldPrice', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ price })
  })
    .then(res => res.json())
    .then(data => {
      if (data.success) {
        alert('Gold price added successfully');
        document.getElementById('goldPrice').value = '';
        if (goldChart) {
          loadChartData();
        }
      } else {
        alert('Error: ' + (data.error || 'Unknown error'));
      }
    })
    .catch(err => {
      alert('Error adding gold price: ' + err.message);
    })
    .finally(() => {
      if (submitBtn) {
        submitBtn.textContent = 'Wait 10s...';
        setTimeout(() => {
          submitBtn.disabled = false;
          submitBtn.textContent = 'Submit';
        }, 10000);
      }
    });
}

function submitScrollPrice(scrollType) {
  const submitBtn = document.querySelector(`button[onclick="submitScrollPrice('${scrollType}')"]`);
  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.textContent = 'Submitting...';
  }
  const goldPrice = document.getElementById(`${scrollType}Gold`).value;
  const diamondPrice = document.getElementById(`${scrollType}Diamond`).value;
  if (!goldPrice || !diamondPrice) {
    alert('Please enter both gold and diamond prices');
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Submit';
    }
    return;
  }
  const requestBody = { 
    scrollType, 
    goldPrice: Number(goldPrice), 
    diamondPrice: Number(diamondPrice) 
  };
  fetch('/api/addScrollPrice', {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    },
    body: JSON.stringify(requestBody)
  })
    .then(async res => {
      const text = await res.text();
      if (!text) throw new Error('Empty response from server');
      try {
        return JSON.parse(text);
      } catch (e) {
        throw new Error('Invalid JSON response from server');
      }
    })
    .then(data => {
      if (data.success) {
        alert('Scroll price added successfully');
        document.getElementById(`${scrollType}Gold`).value = '';
        document.getElementById(`${scrollType}Diamond`).value = '';
        if (scrollChartGold) {
          loadChartData();
        }
      } else {
        alert('Error: ' + (data.error || 'Unknown error'));
      }
    })
    .catch(err => {
      alert('Error adding scroll price: ' + err.message);
    })
    .finally(() => {
      if (submitBtn) {
        submitBtn.textContent = 'Wait 10s...';
        setTimeout(() => {
          submitBtn.disabled = false;
          submitBtn.textContent = 'Submit';
        }, 10000);
      }
    });
}

// Test function to check if server is working
function testConnection() {
  fetch('/api/test')
    .then(res => res.json())
    .then(data => {
      console.log('Server test:', data);
      alert(`Server is working! Stats: ${data.dbSize.stats}, Gold prices: ${data.dbSize.goldPrices.length}`);
    })
    .catch(err => {
      console.error('Connection test failed:', err);
      alert('Connection test failed');
    });
}

// Function to add a new player
async function addNewPlayer() {
  const playerNameInput = document.getElementById('newPlayerName');
  const playerName = playerNameInput.value.trim();

  if (!playerName) {
    alert('Please enter a player name.');
    return;
  }

  try {
    const response = await fetch('/api/addPlayer', { // Corrected endpoint
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ playerName: playerName }), // Corrected key
    });

    const result = await response.json();

    if (response.ok) {
      alert('Player added successfully!');
      playerNameInput.value = ''; // Clear the input field
      // Update the player dropdown after successful addition
      populatePlayerDropdown(); // Use the correct populate function
      // Also update the player dropdown on the add data page
      fetchPlayers(); // Use the correct fetch function for add data page dropdown
    } else {
      alert(`Error: ${result.error || 'Failed to add player'}`);
    }
  } catch (error) {
    console.error('Error adding player:', error);
    alert('Failed to add player.');
  }
}

// Function to fetch and populate players dropdown on Add Data page
async function fetchPlayers() {
  try {
    const response = await fetch('/api/players');
    const data = await response.json();

    if (response.ok) {
      let playerNames = data;
      const playerSelect = document.getElementById('player');
      if (playerSelect) {
        playerSelect.innerHTML = '';
        // Get JWT and decode
        const token = localStorage.getItem('jwt');
        let isAdmin = false;
        let username = '';
        if (token) {
          try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            isAdmin = !!payload.is_admin;
            username = payload.username;
          } catch (e) {}
        }
        if (isAdmin) {
          // Admin: show all players (sorted, Hunt3r1206 first)
          const hunt3rIndex = playerNames.indexOf('Hunt3r1206');
          let sortedPlayerNames = [];
          if (hunt3rIndex > -1) {
            const hunt3r = playerNames.splice(hunt3rIndex, 1)[0];
            sortedPlayerNames = playerNames.sort();
            sortedPlayerNames.unshift(hunt3r);
          } else {
            sortedPlayerNames = playerNames.sort();
          }
          sortedPlayerNames.forEach(name => {
            const option = document.createElement('option');
            option.value = name;
            option.textContent = name;
            playerSelect.appendChild(option);
          });
        } else {
          // Non-admin: show only their own username
          const option = document.createElement('option');
          option.value = username;
          option.textContent = username;
          playerSelect.appendChild(option);
        }
      }
    } else {
      console.error('Error fetching players:', data.error);
    }
  } catch (error) {
    console.error('Error fetching players:', error);
  }
}

// Call fetchPlayers on page load to populate the dropdown on the Add Data page
document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('player')) {
        fetchPlayers();
    }
});

// Function to fetch players and populate the dropdown on Graphs page
async function populatePlayerDropdown() {
  try {
    const response = await fetch('/api/players');
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    let players = await response.json();
    const playerSelect = document.getElementById('playerSelect');

    if (!playerSelect) return; // Exit if the dropdown doesn't exist

    // Get signed-in player from JWT
    let signedInPlayer = null;
    const token = localStorage.getItem('jwt');
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        signedInPlayer = payload.username;
      } catch (e) {}
    }

    // Clear existing options
    playerSelect.innerHTML = '';

    // Find and handle 'Hunt3r1206'
    const hunt3rIndex = players.indexOf('Hunt3r1206');
    let hunt3r = null;
    if (hunt3rIndex > -1) {
      hunt3r = players.splice(hunt3rIndex, 1)[0];
    }

    // Sort the remaining players alphabetically
    players.sort();

    // Add 'Hunt3r1206' option if found
    if (hunt3r) {
      const hunt3rOption = document.createElement('option');
      hunt3rOption.value = hunt3r;
      hunt3rOption.textContent = hunt3r;
      playerSelect.appendChild(hunt3rOption);
    }

    // Add 'All Players' option
    const allPlayersOption = document.createElement('option');
    allPlayersOption.value = '';
    allPlayersOption.textContent = 'All Players';
    playerSelect.appendChild(allPlayersOption);

    // Add the rest of the sorted players
    players.forEach(player => {
      const option = document.createElement('option');
      option.value = player;
      option.textContent = player;
      playerSelect.appendChild(option);
    });

    // Prepare items for searchable select
    const items = [];
    if (hunt3r) {
      items.push({ value: hunt3r, text: hunt3r });
    }
    items.push({ value: '', text: 'All Players' });
    players.forEach(player => {
      items.push({ value: player, text: player });
    });

    // Determine default selection: signed-in player, else Hunt3r1206, else All Players
    let defaultValue = '';
    if (signedInPlayer && items.some(i => i.value === signedInPlayer)) {
      defaultValue = signedInPlayer;
    } else if (hunt3r) {
      defaultValue = hunt3r;
    }
    playerSelect.value = defaultValue;

    // Make the dropdown searchable
    if (typeof setupSearchableSelect === 'function') {
      setupSearchableSelect(playerSelect, items, { placeholder: 'Select a player' });
      playerSelect.value = defaultValue; // Ensure select value matches after setup
      playerSelect.dispatchEvent(new Event('change', { bubbles: true }));
    }

    // Load chart data for the initial selected player, applying the filter state
    loadChartData(playerSelect.value);

  } catch (error) {
    console.error('Error fetching players:', error);
  }
}

// Function to setup the dropdown event listener
function setupPlayerDropdownListener() {
  const playerSelect = document.getElementById('playerSelect');
   if (playerSelect) { // Check if the element exists
      playerSelect.addEventListener('change', function() {
        const selectedPlayer = this.value;
        loadChartData(selectedPlayer); // Load data for the selected player
      });
   }
}

// Call populatePlayerDropdown and setupPlayerDropdownListener on Graphs page load
document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('playerChart')) { // Check for an element unique to graphs page
        populatePlayerDropdown();
        setupPlayerDropdownListener();
        // Filter Gigalogic logic is now integrated into loadChartData and updatePlayerChart
    }
});

// Function to display latest player stats on the Summary page (This function remains focused on the latest stats section)
async function displayLatestPlayerStats() {
    const playerStatsListDiv = document.getElementById('player-stats-list');
    const playerSelect = document.getElementById('summaryPlayerSelect');
    if (!playerStatsListDiv || !playerSelect) return;

    playerStatsListDiv.innerHTML = 'Loading latest stats...';

    try {
        // Fetch all player stats
        const response = await fetch('/api/player-stats');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const allStats = await response.json();

        // Find the latest entry for each player
        const latestStats = {};
        allStats.forEach(entry => {
            if (!latestStats[entry.player] || new Date(entry.dateTime) > new Date(latestStats[entry.player].dateTime)) {
                latestStats[entry.player] = entry;
            }
        });

        // Fetch players list
        const playersResponse = await fetch('/api/players');
        if (!playersResponse.ok) {
            throw new Error(`HTTP error! status: ${playersResponse.status}`);
        }
        let players = await playersResponse.json();

        // Sort players, with Hunt3r1206 first
        const hunt3rIndex = players.indexOf('Hunt3r1206');
        let hunt3r = null;
        if (hunt3rIndex > -1) {
            hunt3r = players.splice(hunt3rIndex, 1)[0];
        }
        players.sort();

        // Populate the latest stats dropdown
        playerSelect.innerHTML = ''; // Clear existing options
        // Add blank option at the top
        const blankOption = document.createElement('option');
        blankOption.value = '';
        blankOption.textContent = 'Select a player';
        playerSelect.appendChild(blankOption);
        if (hunt3r) {
            const option = document.createElement('option');
            option.value = hunt3r;
            option.textContent = hunt3r;
            playerSelect.appendChild(option);
        }
        players.forEach(player => {
            const option = document.createElement('option');
            option.value = player;
            option.textContent = player;
            playerSelect.appendChild(option);
        });
        // Do not select any player by default
        playerSelect.value = '';

        // Helper to render latest stats for a player
        function renderLatestStats(player) {
            playerStatsListDiv.innerHTML = '';
            if (!player) {
                playerStatsListDiv.innerHTML = '<p>No player selected.</p>';
                return;
            }
            if (!latestStats[player]) {
                playerStatsListDiv.innerHTML = '<p>No stats found for this player.</p>';
                return;
            }
            const stats = latestStats[player];
            const statsElement = document.createElement('div');
            statsElement.innerHTML = `
                <h3>${player}</h3>
                <p><strong>Total EXP:</strong> ${stats.exp.toLocaleString()}</p>
                <p><strong>Total Gold:</strong> ${stats.gold.toLocaleString()}</p>
                <p><em>Last updated: ${new Date(stats.dateTime).toLocaleString()}</em></p>
            `;
            playerStatsListDiv.appendChild(statsElement);
        }

        // Do not render any stats by default
        renderLatestStats('');

        // Update latest stats when dropdown changes
        playerSelect.onchange = function() {
            renderLatestStats(this.value);
        };

    } catch (error) {
        console.error('Error fetching latest player stats:', error);
        playerStatsListDiv.innerHTML = '<p>Error loading stats.</p>';
    }
}

// Function to setup the Player Snapshot section
async function setupPlayerSnapshot() {
    console.log('setupPlayerSnapshot: Function started.');
    const playerSelect = document.getElementById('snapshotPlayerSelect');
    const timeSelect = document.getElementById('snapshotTimeSelect');
    const goalDateTimeInput = document.getElementById('goalDate'); // Corrected ID
    const goalLevelSelect = document.getElementById('goalLevel');
    const initialSnapshotLevelSpan = document.getElementById('initialLevel'); // Corrected ID
    const initialSnapshotExpSpan = document.getElementById('initialXP'); // Corrected ID
    const goalLevelDisplaySpan = document.getElementById('goalLevelDisplay'); // Corrected ID
    const goalXPDisplaySpan = document.getElementById('goalXP'); // Corrected ID
    const dailyXPNeededSpan = document.getElementById('dailyXPNeeded'); // Corrected ID

    // Added checks for each element
    if (!playerSelect) { console.error('setupPlayerSnapshot: playerSelect not found.'); return; }
    if (!timeSelect) { console.error('setupPlayerSnapshot: timeSelect not found.'); return; }
    if (!goalDateTimeInput) { console.error('setupPlayerSnapshot: goalDateTimeInput not found.'); return; }
    if (!goalLevelSelect) { console.error('setupPlayerSnapshot: goalLevelSelect not found.'); return; }
    if (!initialSnapshotLevelSpan) { console.error('setupPlayerSnapshot: initialSnapshotLevelSpan not found.'); return; }
    if (!initialSnapshotExpSpan) { console.error('setupPlayerSnapshot: initialSnapshotExpSpan not found.'); return; }
    if (!goalLevelDisplaySpan) { console.error('setupPlayerSnapshot: goalLevelDisplaySpan not found.'); return; }
    if (!goalXPDisplaySpan) { console.error('setupPlayerSnapshot: goalXPDisplaySpan not found.'); return; }
    if (!dailyXPNeededSpan) { console.error('setupPlayerSnapshot: dailyXPNeededSpan not found.'); return; }

    console.log('setupPlayerSnapshot: All elements found.');

    let allPlayerStatsData = []; // Store all stats for the selected player
    let xpValues = []; // Store XP values for levels

    // Load XP values
    try {
        console.log('setupPlayerSnapshot: Fetching XP values...');
        const response = await fetch('/api/xp-values');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        console.log('setupPlayerSnapshot: XP values fetched.', data);
        // Check if data.levels exists and is an array before filtering
        if (data && Array.isArray(data.levels)) {
             xpValues = data.levels.filter(level => level.total_exp !== "" && level.level !== undefined); // Filter out empty XP values and levels without level number
        } else {
            console.error('setupPlayerSnapshot: Invalid XP values data format.', data);
            goalLevelSelect.innerHTML = '<option value="">Error loading levels</option>';
            return; // Stop execution if XP data is bad
        }
        
        // Populate goal level dropdown
        goalLevelSelect.innerHTML = '<option value="">Select a level</option>';
        xpValues.slice().reverse().forEach(level => {
            const option = document.createElement('option');
            option.value = level.total_exp;
            option.textContent = level.level;
            goalLevelSelect.appendChild(option);
        });
        console.log('setupPlayerSnapshot: Goal level dropdown populated.');

    } catch (error) {
        console.error('Error loading XP values:', error);
        goalLevelSelect.innerHTML = '<option value="">Error loading levels</option>';
    }

    // Function to find the closest data point to a given date/time
    function findClosestStat(targetDateString) {
        console.log('findClosestStat: targetDateString =', targetDateString);
        if (!allPlayerStatsData || allPlayerStatsData.length === 0 || !targetDateString) {
            console.log('findClosestStat: Insufficient data or target date missing.');
            return null;
        }

        // Use the full target date string including time from input, no hardcoded T20:00:00
        // Assuming goalDateTimeInput.value provides a date string like 'YYYY-MM-DD'
        // We need to consider time if the input type was datetime-local, but it's 'date'.
        // For date inputs, the time is usually assumed to be midnight UTC or the user's local midnight.
        // Let's assume local midnight for simplicity with date input.
        const targetDate = new Date(targetDateString);
        targetDate.setHours(0, 0, 0, 0); // Set to local midnight
        const targetTime = targetDate.getTime();
        console.log('findClosestStat: targetTime =', new Date(targetTime).toLocaleString());

        let closestStat = null;
        let closestBefore = null;

        for (const stat of allPlayerStatsData) {
            const statDate = new Date(stat.dateTime);
            // Set stat date to local midnight for comparison if only comparing dates
            // statDate.setHours(0, 0, 0, 0);
            const statTime = statDate.getTime();

            if (statTime <= targetTime) {
                 if (!closestBefore || (targetTime - statTime) < (targetTime - new Date(closestBefore.dateTime).getTime())) {
                     closestBefore = stat;
                 }
            }
             const diff = Math.abs(statTime - targetTime);
             if (closestStat === null || diff < Math.abs(new Date(closestStat.dateTime).getTime() - targetTime)) {
                 closestStat = stat;
             }
        }
        console.log('findClosestStat: closestBefore =', closestBefore);
        console.log('findClosestStat: closestStat =', closestStat);
        return closestBefore || closestStat; // Prefer stat before or on the date, otherwise closest overall
    }

    // Function to load stats for the selected player and populate the initial time dropdown
    async function loadPlayerStatsAndPopulateTimeDropdown(selectedPlayer) {
        console.log('loadPlayerStatsAndPopulateTimeDropdown: Function started for player', selectedPlayer);
        const timeSelect = document.getElementById('snapshotTimeSelect'); // Ensure timeSelect is correctly referenced
        const initialSnapshotLevelSpan = document.getElementById('initialLevel'); // Get reference
        const initialSnapshotExpSpan = document.getElementById('initialXP'); // Get reference
        const goalLevelDisplaySpan = document.getElementById('goalLevelDisplay'); // Get reference
        const goalXPDisplaySpan = document.getElementById('goalXP'); // Get reference
        const dailyXPNeededSpan = document.getElementById('dailyXPNeeded'); // Get reference

        if (!timeSelect || !initialSnapshotLevelSpan || !initialSnapshotExpSpan || !goalLevelDisplaySpan || !goalXPDisplaySpan || !dailyXPNeededSpan) {
             console.error('loadPlayerStatsAndPopulateTimeDropdown: One or more necessary display elements not found.');
             // Log which element is missing for easier debugging
             if (!timeSelect) console.error('loadPlayerStatsAndPopulateTimeDropdown: timeSelect not found.');
             if (!initialSnapshotLevelSpan) console.error('loadPlayerStatsAndPopulateTimeDropdown: initialSnapshotLevelSpan not found.');
             if (!initialSnapshotExpSpan) console.error('loadPlayerStatsAndPopulateTimeDropdown: initialSnapshotExpSpan not found.');
             if (!goalLevelDisplaySpan) console.error('loadPlayerStatsAndPopulateTimeDropdown: goalLevelDisplaySpan not found.');
             if (!goalXPDisplaySpan) console.error('loadPlayerStatsAndPopulateTimeDropdown: goalXPDisplaySpan not found.');
             if (!dailyXPNeededSpan) console.error('loadPlayerStatsAndPopulateTimeDropdown: dailyXPNeededSpan not found.');

             return;
        }

        timeSelect.innerHTML = '<option value="">Loading data points...</option>';
        
        // Manually clear relevant fields instead of calling a non-existent function
        initialSnapshotLevelSpan.textContent = '--';
        initialSnapshotExpSpan.textContent = '--';
        goalLevelDisplaySpan.textContent = '--';
        goalXPDisplaySpan.textContent = '--';
        dailyXPNeededSpan.textContent = '--';


        allPlayerStatsData = []; // Clear previous player's data

        if (!selectedPlayer) {
            console.log('loadPlayerStatsAndPopulateTimeDropdown: No player selected.');
            timeSelect.innerHTML = '<option value="">Select a player</option>';
            updateSnapshotDisplays(); // Update display to reflect no player selected
            return;
        }

        try {
            console.log('loadPlayerStatsAndPopulateTimeDropdown: Fetching stats for player', selectedPlayer);
            const statsResponse = await fetch(`/api/player-stats?player=${encodeURIComponent(selectedPlayer)}`);
            if (!statsResponse.ok) {
                 throw new Error(`HTTP error! status: ${statsResponse.status}`);
            }
            const playerStats = await statsResponse.json();
            console.log('loadPlayerStatsAndPopulateTimeDropdown: Player stats fetched.', playerStats);
            allPlayerStatsData = playerStats;

             // Sort stats by date/time
            allPlayerStatsData.sort((a, b) => new Date(a.dateTime) - new Date(b.dateTime));
            console.log('loadPlayerStatsAndPopulateTimeDropdown: allPlayerStatsData after sort:', allPlayerStatsData);

            timeSelect.innerHTML = ''; // Clear loading message

            if (!allPlayerStatsData || allPlayerStatsData.length === 0) {
                console.log('loadPlayerStatsAndPopulateTimeDropdown: No data points found for player.');
                timeSelect.innerHTML = '<option value="">No data points</option>';
                updateSnapshotDisplays(); // Update display to reflect no data
                return;
            }

            // Populate the time dropdown with all data points
            console.log('loadPlayerStatsAndPopulateTimeDropdown: Populating time dropdown...');
            allPlayerStatsData.forEach(stat => {
                if (stat && stat.dateTime) { // Add check for stat and dateTime
                const option = document.createElement('option');
                option.value = stat.dateTime;
                    const formattedDate = new Date(stat.dateTime).toLocaleString();
                    option.textContent = formattedDate;
                timeSelect.appendChild(option);
                    console.log('loadPlayerStatsAndPopulateTimeDropdown: Added option', option.value, option.textContent);
                } else {
                    console.warn('loadPlayerStatsAndPopulateTimeDropdown: Skipping invalid stat entry:', stat);
                }
            });
            console.log('loadPlayerStatsAndPopulateTimeDropdown: Initial time dropdown populated.');

            // Set initial values to the latest data point
            if (allPlayerStatsData.length > 0) {
                const latestDateTime = allPlayerStatsData[allPlayerStatsData.length - 1].dateTime;
                const secondLatestDateTime = allPlayerStatsData[allPlayerStatsData.length - 2].dateTime;
                initialSnapshotLevelSpan.textContent = '--';
                initialSnapshotExpSpan.textContent = '--';
                goalLevelDisplaySpan.textContent = '--';
                goalXPDisplaySpan.textContent = '--';
                dailyXPNeededSpan.textContent = '--';
                timeSelect.value = secondLatestDateTime;
            }

            // Trigger initial display based on the default selected time and any pre-selected goal time
            updateSnapshotDisplays();
            console.log('loadPlayerStatsAndPopulateTimeDropdown: updateSnapshotDisplays called after populating dropdown.');

        } catch (error) {
            console.error('Error fetching player stats for snapshot time dropdown:', error);
            timeSelect.innerHTML = '<option value="">Error loading data</option>';
            updateSnapshotDisplays(); // Update display to reflect error
        }
    }

    // Function to update the displayed snapshot data for both initial and goal
    function updateSnapshotDisplays() {
        console.log('updateSnapshotDisplays: Function started.');
        // Get references to the necessary display spans within this function's scope
        const initialSnapshotLevelSpan = document.getElementById('initialLevel');
        const initialSnapshotExpSpan = document.getElementById('initialXP');
        // const initialSnapshotDateSpan = document.getElementById('initialSnapshotDate'); // This span doesn't exist - REMOVED
        const goalLevelDisplaySpan = document.getElementById('goalLevelDisplay');
        const goalXPDisplaySpan = document.getElementById('goalXP');
        // const goalSnapshotDateSpan = document.getElementById('goalSnapshotDate'); // This span doesn't exist - REMOVED
        const dailyXPNeededSpan = document.getElementById('dailyXPNeeded');

        // Get references to the input/select elements
        const timeSelect = document.getElementById('snapshotTimeSelect');
        const goalDateTimeInput = document.getElementById('goalDate');
        const goalLevelSelect = document.getElementById('goalLevel');

        // Check if necessary elements are found (excluding the non-existent date spans)
         if (!timeSelect || !goalDateTimeInput || !goalLevelSelect || !initialSnapshotLevelSpan || !initialSnapshotExpSpan || !goalLevelDisplaySpan || !goalXPDisplaySpan || !dailyXPNeededSpan) {
            console.error('updateSnapshotDisplays: One or more required elements not found.');
             // Log which element is missing for easier debugging
             if (!timeSelect) console.error('updateSnapshotDisplays: timeSelect not found.');
             if (!goalDateTimeInput) console.error('updateSnapshotDisplays: goalDateTimeInput not found.');
             if (!goalLevelSelect) console.error('updateSnapshotDisplays: goalLevelSelect not found.');
             if (!initialSnapshotLevelSpan) console.error('updateSnapshotDisplays: initialSnapshotLevelSpan not found.');
             if (!initialSnapshotExpSpan) console.error('updateSnapshotDisplays: initialSnapshotExpSpan not found.');
             if (!goalLevelDisplaySpan) console.error('updateSnapshotDisplays: goalLevelDisplaySpan not found.');
             if (!goalXPDisplaySpan) console.error('updateSnapshotDisplays: goalXPDisplaySpan not found.');
             if (!dailyXPNeededSpan) console.error('updateSnapshotDisplays: dailyXPNeededSpan not found.');
            return;
        }

        const initialTimeValue = timeSelect.value;
        const goalDateValue = goalDateTimeInput.value; // Get the date value
        const goalLevelValue = goalLevelSelect.value;

        console.log('updateSnapshotDisplays: initialTimeValue =', initialTimeValue);
        console.log('updateSnapshotDisplays: goalDateValue =', goalDateValue);
        console.log('updateSnapshotDisplays: goalLevelValue =', goalLevelValue);

        const initialStat = allPlayerStatsData.find(stat => stat.dateTime === initialTimeValue);
        console.log('updateSnapshotDisplays: initialStat =', initialStat);
        const goalStat = findClosestStat(goalDateValue);
        console.log('updateSnapshotDisplays: goalStat =', goalStat);

        // Update Initial Snapshot details
        if (initialStat && initialStat.exp !== undefined) {
            // Find the level based on initialStat.exp
            let initialLevel = '--';
            // Ensure xpValues is sorted by total_exp ascending for correct level finding
            const sortedXpValues = [...xpValues].sort((a, b) => parseInt(a.total_exp) - parseInt(b.total_exp));

            for (let i = 0; i < sortedXpValues.length; i++) {
                const currentLevel = sortedXpValues[i];
                const nextLevel = sortedXpValues[i + 1];

                const currentExp = parseInt(currentLevel.total_exp);
                const initialExp = parseInt(initialStat.exp);

                if (initialExp >= currentExp) {
                    if (!nextLevel || initialExp < parseInt(nextLevel.total_exp)) {
                        initialLevel = currentLevel.level;
                        break; // Found the level
                    }
                } else if (initialExp < currentExp && i === 0) {
                    // If initialExp is less than the lowest level's exp, it's below the first level in data (e.g., level 1)
                    initialLevel = sortedXpValues[0].level; // Or handle as level 1 if appropriate
                     break;
                }
            }
             initialSnapshotLevelSpan.textContent = initialLevel.toLocaleString(); // Display found level
            initialSnapshotExpSpan.textContent = initialStat.exp.toLocaleString();
            // Update Initial Snapshot Date using the text content of the selected option
            const selectedOption = timeSelect.options[timeSelect.selectedIndex];
            // Check if selectedOption and a span for date display exists before updating
            const initialSnapshotDateSpan = document.getElementById('initialSnapshotDate'); // Get reference here if needed for logging/checks
            if (initialSnapshotDateSpan && selectedOption) {
                 initialSnapshotDateSpan.textContent = selectedOption.textContent; // Use text content of selected option
            }
        } else {
            initialSnapshotLevelSpan.textContent = '--';
            initialSnapshotExpSpan.textContent = '--';
            const initialSnapshotDateSpan = document.getElementById('initialSnapshotDate'); // Get reference here if needed for logging/checks
             if (initialSnapshotDateSpan) initialSnapshotDateSpan.textContent = '--';
        }
        console.log('updateSnapshotDisplays: Initial snapshot updated.');

        // Update Goal Snapshot details
        // Note: Goal Snapshot Date display needs a span with ID 'goalSnapshotDate' in HTML
        const goalSnapshotDateSpan = document.getElementById('goalSnapshotDate'); // Get reference here

        if (goalLevelValue) {
            // If a goal level is selected, use its XP value and the goal date
            const selectedLevel = xpValues.find(level => String(level.total_exp) === String(goalLevelValue)); // Find the level object
             goalLevelDisplaySpan.textContent = selectedLevel ? selectedLevel.level : '--'; // Display level number
            goalXPDisplaySpan.textContent = parseInt(goalLevelValue).toLocaleString();
            // Update Goal Snapshot Date directly from the goal date input value
            if (goalSnapshotDateSpan && goalDateValue) {
                 goalSnapshotDateSpan.textContent = new Date(goalDateValue).toLocaleDateString(); // Use goalDateValue and format it
            } else if (goalSnapshotDateSpan) {
                 goalSnapshotDateSpan.textContent = '--';
            }
        } else { // If no goal level is selected, display '--' for goal snapshot details
            goalLevelDisplaySpan.textContent = '--';
            goalXPDisplaySpan.textContent = '--';
            if (goalSnapshotDateSpan) goalSnapshotDateSpan.textContent = '--';
        }
        console.log('updateSnapshotDisplays: Goal snapshot updated.');

        // Calculate and display daily XP needed
        calculateDailyXPNeeded(initialStat, goalDateValue, goalLevelValue);
        console.log('updateSnapshotDisplays: calculateDailyXPNeeded called.');
    }

    // Function to calculate daily XP needed
    function calculateDailyXPNeeded(initialStat, goalDateValue, goalLevelValue) {
        console.log('calculateDailyXPNeeded: Function started.');
        const dailyXPNeededSpan = document.getElementById('dailyXPNeeded');
        if (!dailyXPNeededSpan) { console.error('calculateDailyXPNeeded: dailyXPNeededSpan not found.'); return; }

        console.log('calculateDailyXPNeeded: initialStat =', initialStat);
        console.log('calculateDailyXPNeeded: goalDateValue =', goalDateValue);
        console.log('calculateDailyXPNeeded: goalLevelValue =', goalLevelValue);

        // Check if we have all required data
        if (!initialStat || !goalDateValue || !goalLevelValue) {
            dailyXPNeededSpan.textContent = '--';
            console.log('calculateDailyXPNeeded: Missing required data.');
            return;
        }

        // Calculate total XP needed
        const initialXP = initialStat.exp !== undefined ? parseInt(initialStat.exp) : 0;
        const goalXP = parseInt(goalLevelValue);
        const totalXPNeeded = goalXP - initialXP;
        console.log('calculateDailyXPNeeded: initialXP =', initialXP, 'goalXP =', goalXP, 'totalXPNeeded =', totalXPNeeded);

        // Calculate time difference in hours
        const initialDate = new Date(initialStat.dateTime);
        const goalDate = new Date(goalDateValue);
        const timeDiffMs = goalDate.getTime() - initialDate.getTime();
        const hoursBetween = timeDiffMs / (1000 * 60 * 60);
        
        // Calculate days between (for display purposes)
        const daysBetween = Math.max(1, Math.ceil(hoursBetween / 24)); // At least 1 day

        // Calculate daily XP needed
        const dailyXPNeeded = Math.ceil(totalXPNeeded / daysBetween);
        dailyXPNeededSpan.textContent = dailyXPNeeded.toLocaleString();
    }

    // Populate the snapshot player dropdown initially
    try {
        console.log('setupPlayerSnapshot: Fetching players list...');
        const response = await fetch('/api/players');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        let players = await response.json();
        console.log('setupPlayerSnapshot: Players list fetched.', players);

        // Sort players, with Hunt3r1206 first
        const hunt3rIndex = players.indexOf('Hunt3r1206');
        let hunt3r = null;
        if (hunt3rIndex > -1) {
            hunt3r = players.splice(hunt3rIndex, 1)[0];
        }
        players.sort();

        playerSelect.innerHTML = ''; // Clear existing options
        // Add blank option at the top
        const blankOption = document.createElement('option');
        blankOption.value = '';
        blankOption.textContent = 'Select a player';
        playerSelect.appendChild(blankOption);
        if (hunt3r) {
            const option = document.createElement('option');
            option.value = hunt3r;
            option.textContent = hunt3r;
            playerSelect.appendChild(option);
        }
        players.forEach(player => {
            const option = document.createElement('option');
            option.value = player;
            option.textContent = player;
            playerSelect.appendChild(option);
        });
        console.log('setupPlayerSnapshot: Player dropdown populated.');

        // Do not select any player by default
        playerSelect.value = '';
        // Do not trigger loadPlayerStatsAndPopulateTimeDropdown
        // Only load stats when a player is selected
        playerSelect.onchange = function() {
            if (this.value) {
                loadPlayerStatsAndPopulateTimeDropdown(this.value);
            } else {
                // Clear time select and displays if no player selected
                timeSelect.innerHTML = '<option value="">Select a player</option>';
                updateSnapshotDisplays();
            }
            goalDateTimeInput.value = '';
            updateSnapshotDisplays();
        };
        // ... rest of function remains ...
    } catch (error) {
        // ... existing code ...
    }

    // After allPlayerStatsData, xpValues, and DOM element checks in setupPlayerSnapshot

    // Add event listeners to recalculate on change
    goalLevelSelect.addEventListener('change', updateSnapshotDisplays);
    goalDateTimeInput.addEventListener('change', updateSnapshotDisplays);
    timeSelect.addEventListener('change', updateSnapshotDisplays);
}

// Call setupPlayerSnapshot when the DOM is fully loaded
// This call was moved inside the DOMContentLoaded listener for consistency.

// Function to update snapshot data (This seems redundant with updateSnapshotDisplays, removing or consolidating)
// function updateSnapshotData(initialStats, goalStats) {
//     // Functionality seems to be covered by updateSnapshotDisplays
// }

// Add setupPlayerSnapshot to be called on DOMContentLoaded
// Check if the element exists before calling to avoid errors on other pages.
// The check is already included in the DOMContentLoaded listener above.

// Function to setup the Average Daily XP section
async function setupAverageDailyXP() {
    console.log('setupAverageDailyXP: Function started.');
    const playerSelect = document.getElementById('avgXpPlayerSelect');
    const initialTimeSelect = document.getElementById('avgXpInitialTimeSelect');
    const latestTimeSelect = document.getElementById('avgXpLatestTimeSelect');
    const totalXpGainedSpan = document.getElementById('totalXpGained');
    const daysBetweenSpan = document.getElementById('daysBetween');
    const averageDailyXpSpan = document.getElementById('averageDailyXp');
    const goalLevelSelect = document.getElementById('avgXpGoalLevel');
    const expectedDateSpan = document.getElementById('avgXpExpectedDate');

    // Added checks for each element
    if (!playerSelect) { console.error('setupAverageDailyXP: playerSelect not found.'); return; }
    if (!initialTimeSelect) { console.error('setupAverageDailyXP: initialTimeSelect not found.'); return; }
    if (!latestTimeSelect) { console.error('setupAverageDailyXP: latestTimeSelect not found.'); return; }
    if (!totalXpGainedSpan) { console.error('setupAverageDailyXP: totalXpGainedSpan not found.'); return; }
    if (!daysBetweenSpan) { console.error('setupAverageDailyXP: daysBetweenSpan not found.'); return; }
    if (!averageDailyXpSpan) { console.error('setupAverageDailyXP: averageDailyXpSpan not found.'); return; }
    if (!goalLevelSelect) { console.error('setupAverageDailyXP: goalLevelSelect not found.'); return; }
    if (!expectedDateSpan) { console.error('setupAverageDailyXP: expectedDateSpan not found.'); return; }

    console.log('setupAverageDailyXP: All elements found.');

    let allPlayerStatsData = [];
    let xpValues = []; // Store XP values for levels

    // Load XP values for goal level dropdown
    try {
        console.log('setupAverageDailyXP: Fetching XP values...');
        const response = await fetch('/api/xp-values');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        console.log('setupAverageDailyXP: XP values fetched.', data);
        
        if (data && Array.isArray(data.levels)) {
            xpValues = data.levels.filter(level => level.total_exp !== "" && level.level !== undefined);
            
            // Populate goal level dropdown
            goalLevelSelect.innerHTML = '<option value="">Select a level</option>';
            xpValues.slice().reverse().forEach(level => {
                const option = document.createElement('option');
                option.value = level.total_exp;
                option.textContent = level.level;
                goalLevelSelect.appendChild(option);
            });
            console.log('setupAverageDailyXP: Goal level dropdown populated.');
        } else {
            console.error('setupAverageDailyXP: Invalid XP values data format.', data);
            goalLevelSelect.innerHTML = '<option value="">Error loading levels</option>';
        }
    } catch (error) {
        console.error('Error loading XP values:', error);
        goalLevelSelect.innerHTML = '<option value="">Error loading levels</option>';
    }

    // Function to calculate and display expected date to hit goal level
    function calculateExpectedDate() {
        const goalLevelValue = goalLevelSelect.value;
        const latestTime = latestTimeSelect.value;
        const averageDailyXp = parseInt(averageDailyXpSpan.textContent.replace(/,/g, ''));

        if (!goalLevelValue || !latestTime || !averageDailyXp) {
            expectedDateSpan.textContent = '--';
            return;
        }

        // Find the latest stat
        const latestStat = allPlayerStatsData.find(stat => stat.dateTime === latestTime);
        if (!latestStat) {
            expectedDateSpan.textContent = '--';
            return;
        }

        // Calculate total XP needed
        const currentXP = latestStat.exp;
        const goalXP = parseInt(goalLevelValue);
        const totalXPNeeded = goalXP - currentXP;

        if (totalXPNeeded <= 0) {
            expectedDateSpan.textContent = 'Already achieved!';
            return;
        }

        // Calculate days needed
        const daysNeeded = Math.ceil(totalXPNeeded / averageDailyXp);
        
        // Calculate expected date
        const latestDate = new Date(latestTime);
        const expectedDate = new Date(latestDate);
        expectedDate.setDate(latestDate.getDate() + daysNeeded);
        
        // Format the expected date
        expectedDateSpan.textContent = expectedDate.toLocaleDateString();
    }

    // Function to load stats for the selected player and populate the time dropdowns
    async function loadPlayerStatsAndPopulateTimeDropdowns(selectedPlayer) {
        console.log('loadPlayerStatsAndPopulateTimeDropdowns: Function started for player', selectedPlayer);
        
        initialTimeSelect.innerHTML = '<option value="">Loading data points...</option>';
        latestTimeSelect.innerHTML = '<option value="">Loading data points...</option>';
        
        // Clear display fields
        totalXpGainedSpan.textContent = '--';
        daysBetweenSpan.textContent = '--';
        averageDailyXpSpan.textContent = '--';

        allPlayerStatsData = []; // Clear previous player's data

        if (!selectedPlayer) {
            console.log('loadPlayerStatsAndPopulateTimeDropdowns: No player selected.');
            initialTimeSelect.innerHTML = '<option value="">Select a player</option>';
            latestTimeSelect.innerHTML = '<option value="">Select a player</option>';
            return;
        }

        try {
            console.log('loadPlayerStatsAndPopulateTimeDropdowns: Fetching stats for player', selectedPlayer);
            const statsResponse = await fetch(`/api/player-stats?player=${encodeURIComponent(selectedPlayer)}`);
            if (!statsResponse.ok) {
                throw new Error(`HTTP error! status: ${statsResponse.status}`);
            }
            const playerStats = await statsResponse.json();
            console.log('loadPlayerStatsAndPopulateTimeDropdowns: Player stats fetched.', playerStats);
            allPlayerStatsData = playerStats;

            // Sort stats by date/time
            allPlayerStatsData.sort((a, b) => new Date(a.dateTime) - new Date(b.dateTime));
            console.log('loadPlayerStatsAndPopulateTimeDropdowns: allPlayerStatsData after sort:', allPlayerStatsData);

            initialTimeSelect.innerHTML = ''; // Clear loading message
            latestTimeSelect.innerHTML = ''; // Clear loading message

            if (!allPlayerStatsData || allPlayerStatsData.length === 0) {
                console.log('loadPlayerStatsAndPopulateTimeDropdowns: No data points found for player.');
                initialTimeSelect.innerHTML = '<option value="">No data points</option>';
                latestTimeSelect.innerHTML = '<option value="">No data points</option>';
                return;
            }

            // Populate both time dropdowns with all data points
            allPlayerStatsData.forEach(stat => {
                const dateTime = new Date(stat.dateTime);
                const optionText = `${dateTime.toLocaleDateString()} ${dateTime.toLocaleTimeString()}`;
                
                // Add to initial time select
                const initialOption = document.createElement('option');
                initialOption.value = stat.dateTime;
                initialOption.textContent = optionText;
                initialTimeSelect.appendChild(initialOption);

                // Add to latest time select
                const latestOption = document.createElement('option');
                latestOption.value = stat.dateTime;
                latestOption.textContent = optionText;
                latestTimeSelect.appendChild(latestOption);
            });

            // Set initial values to the latest data point
            if (allPlayerStatsData.length > 0) {
                const latestDateTime = allPlayerStatsData[allPlayerStatsData.length - 1].dateTime;
                const secondLatestDateTime = allPlayerStatsData[allPlayerStatsData.length - 2].dateTime;
                initialTimeSelect.value = secondLatestDateTime;
                latestTimeSelect.value = latestDateTime;
                updateAverageDailyXP();
            }

        } catch (error) {
            console.error('Error loading player stats:', error);
            initialTimeSelect.innerHTML = '<option value="">Error loading data</option>';
            latestTimeSelect.innerHTML = '<option value="">Error loading data</option>';
        }
    }

    // Function to update the average daily XP display
    function updateAverageDailyXP() {
        const initialTime = initialTimeSelect.value;
        const latestTime = latestTimeSelect.value;

        if (!initialTime || !latestTime) {
            totalXpGainedSpan.textContent = '--';
            daysBetweenSpan.textContent = '--';
            averageDailyXpSpan.textContent = '--';
            expectedDateSpan.textContent = '--';
            return;
        }

        // Find the stats for the selected times
        const initialStat = allPlayerStatsData.find(stat => stat.dateTime === initialTime);
        const latestStat = allPlayerStatsData.find(stat => stat.dateTime === latestTime);

        if (!initialStat || !latestStat) {
            totalXpGainedSpan.textContent = '--';
            daysBetweenSpan.textContent = '--';
            averageDailyXpSpan.textContent = '--';
            expectedDateSpan.textContent = '--';
            return;
        }

        // Calculate total XP gained
        const totalXpGained = latestStat.exp - initialStat.exp;
        totalXpGainedSpan.textContent = totalXpGained.toLocaleString();

        // Calculate time difference
        const initialDate = new Date(initialTime);
        const latestDate = new Date(latestTime);
        const timeDiffMs = latestDate.getTime() - initialDate.getTime();
        
        // Calculate days, hours, and minutes
        const totalMinutes = Math.floor(timeDiffMs / (1000 * 60));
        const days = Math.floor(totalMinutes / (24 * 60));
        const hours = Math.floor((totalMinutes % (24 * 60)) / 60);
        const minutes = totalMinutes % 60;
        
        // Format time difference as "d:hh:mm"
        const timeBetween = `${days}:${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
        daysBetweenSpan.textContent = timeBetween;

        // Calculate hours between for XP calculations
        const hoursBetween = timeDiffMs / (1000 * 60 * 60);
        
        // Calculate average XP per hour and extrapolate to 24 hours
        const averageXpPerHour = totalXpGained / hoursBetween;
        const averageDailyXp = Math.floor(averageXpPerHour * 24);
        averageDailyXpSpan.textContent = averageDailyXp.toLocaleString();

        // Calculate expected date to hit goal level
        calculateExpectedDate();
    }

    // Populate player dropdown and set up event listeners
    try {
        const response = await fetch('/api/players');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const players = await response.json();
        
        playerSelect.innerHTML = ''; // Clear existing options
        
        // Add blank option at the top
        const blankOption = document.createElement('option');
        blankOption.value = '';
        blankOption.textContent = 'Select a player';
        playerSelect.appendChild(blankOption);
        // Sort players, with Hunt3r1206 first
        const hunt3rIndex = players.indexOf('Hunt3r1206');
        let hunt3r = null;
        if (hunt3rIndex > -1) {
            hunt3r = players.splice(hunt3rIndex, 1)[0];
        }
        players.sort();
        if (hunt3r) {
            const option = document.createElement('option');
            option.value = hunt3r;
            option.textContent = hunt3r;
            playerSelect.appendChild(option);
        }
        players.forEach(player => {
            const option = document.createElement('option');
            option.value = player;
            option.textContent = player;
            playerSelect.appendChild(option);
        });
        // Do not select any player by default
        playerSelect.value = '';
        // Do not trigger loadPlayerStatsAndPopulateTimeDropdowns
        // Only load stats when a player is selected
        playerSelect.addEventListener('change', function() {
            if (this.value) {
                loadPlayerStatsAndPopulateTimeDropdowns(this.value);
            } else {
                initialTimeSelect.innerHTML = '<option value="">Select a player</option>';
                latestTimeSelect.innerHTML = '<option value="">Select a player</option>';
                totalXpGainedSpan.textContent = '--';
                daysBetweenSpan.textContent = '--';
                averageDailyXpSpan.textContent = '--';
                expectedDateSpan.textContent = '--';
            }
        });
        // ... rest of function remains ...
    } catch (error) {
        // ... existing code ...
    }

    // After allPlayerStatsData, xpValues, and DOM element checks in setupAverageDailyXP

    // Add event listeners to recalculate on change
    goalLevelSelect.addEventListener('change', updateAverageDailyXP);
    initialTimeSelect.addEventListener('change', updateAverageDailyXP);
    latestTimeSelect.addEventListener('change', updateAverageDailyXP);
}

// Add helper functions to make dropdowns searchable
async function makeSummaryPlayerDropdownSearchable() {
    const select = document.getElementById('summaryPlayerSelect');
    if (!select) return;
    try {
        const response = await fetch('/api/players');
        if (!response.ok) throw new Error('Failed to fetch players');
        let players = await response.json();
        const hunt3rIndex = players.indexOf('Hunt3r1206');
        let hunt3r = null;
        if (hunt3rIndex > -1) hunt3r = players.splice(hunt3rIndex, 1)[0];
        players.sort();
        const items = [];
        // Add blank option at the top
        items.push({ value: '', text: 'Select a player' });
        if (hunt3r) items.push({ value: hunt3r, text: hunt3r });
        players.forEach(player => items.push({ value: player, text: player }));
        // Do not set a default value
        setupSearchableSelect(select, items, { placeholder: 'Select a player' });
        select.value = '';
        // Do not trigger change event
    } catch (e) { console.error(e); }
}

async function makeAvgXpPlayerDropdownSearchable() {
    const select = document.getElementById('avgXpPlayerSelect');
    if (!select) return;
    try {
        const response = await fetch('/api/players');
        if (!response.ok) throw new Error('Failed to fetch players');
        let players = await response.json();
        const hunt3rIndex = players.indexOf('Hunt3r1206');
        let hunt3r = null;
        if (hunt3rIndex > -1) hunt3r = players.splice(hunt3rIndex, 1)[0];
        players.sort();
        const items = [];
        // Add blank option at the top
        items.push({ value: '', text: 'Select a player' });
        if (hunt3r) items.push({ value: hunt3r, text: hunt3r });
        players.forEach(player => items.push({ value: player, text: player }));
        // Do not set a default value
        setupSearchableSelect(select, items, { placeholder: 'Select a player' });
        select.value = '';
        // Do not trigger change event
    } catch (e) { console.error(e); }
}

async function makeSnapshotPlayerDropdownSearchable() {
    const select = document.getElementById('snapshotPlayerSelect');
    if (!select) return;
    try {
        const response = await fetch('/api/players');
        if (!response.ok) throw new Error('Failed to fetch players');
        let players = await response.json();
        const hunt3rIndex = players.indexOf('Hunt3r1206');
        let hunt3r = null;
        if (hunt3rIndex > -1) hunt3r = players.splice(hunt3rIndex, 1)[0];
        players.sort();
        const items = [];
        // Add blank option at the top
        items.push({ value: '', text: 'Select a player' });
        if (hunt3r) items.push({ value: hunt3r, text: hunt3r });
        players.forEach(player => items.push({ value: player, text: player }));
        // Do not set a default value
        setupSearchableSelect(select, items, { placeholder: 'Select a player' });
        select.value = '';
        // Do not trigger change event
    } catch (e) { console.error(e); }
}

// Admin Registration Modal Logic
(function() {
  // Only run if not on login page
  if (window.location.pathname.endsWith('/login.html')) return;
  const token = localStorage.getItem('jwt');
  if (!token) return;
  let isAdmin = false;
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    isAdmin = !!payload.is_admin;
  } catch (e) {}
  // Always inject the modal, but do not create the floating button or logout button here
  // Modal HTML
  const modal = document.createElement('div');
  modal.innerHTML = `
    <div id="adminRegModal" style="display:none;position:fixed;top:0;left:0;width:100vw;height:100vh;background:rgba(0,0,0,0.5);z-index:2000;align-items:center;justify-content:center;">
      <div style="background:#23272a;color:#f1f1f1;padding:2em;border-radius:8px;max-width:400px;width:100%;position:relative;">
        <button id="closeRegModal" style="position:absolute;top:8px;right:8px;font-size:1.2em;color:#fff;background:none;border:none;cursor:pointer;">&times;</button>
        <h2 style="color:#f1f1f1;">Register New User</h2>
        <div id="regError" style="color:#c00;display:none;"></div>
        <div id="regSuccess" style="color:#0c0;display:none;"></div>
        <form id="adminRegForm">
          <input type="text" id="regUsername" placeholder="Username" required style="width:100%;margin-bottom:1em;background:#181a1b;color:#f1f1f1;border:1px solid #42464c;">
          <input type="password" id="regPassword" placeholder="Password" required style="width:100%;margin-bottom:1em;background:#181a1b;color:#f1f1f1;border:1px solid #42464c;">
          <label style="color:#f1f1f1;"><input type="checkbox" id="regIsAdmin"> Admin</label>
          <label style="margin-left:1em;color:#f1f1f1;"><input type="checkbox" id="regIsActive" checked> Active</label>
          <button type="submit" id="regSubmit" disabled style="background:#2d6cdf;color:#fff;border:none;border-radius:4px;">Register</button>
        </form>
      </div>
    </div>
  `;
  document.body.appendChild(modal);
  const modalDiv = document.getElementById('adminRegModal');
  // Modal open/close and submit logic will be triggered from header.js
})();

// Hide gold/scroll price sections for non-admins on add-data page
(function() {
  if (!window.location.pathname.startsWith('/add-data')) return;
  const token = localStorage.getItem('jwt');
  let isAdmin = false;
  if (token) {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      isAdmin = !!payload.is_admin;
    } catch (e) {}
  }
  if (!isAdmin) {
    // Hide gold price section
    const goldSection = Array.from(document.querySelectorAll('.content-box')).find(box => box.querySelector('#goldPrice'));
    if (goldSection) goldSection.style.display = 'none';
    // Hide scroll price section
    const scrollSection = Array.from(document.querySelectorAll('.content-box')).find(box => box.querySelector('.scroll-prices'));
    if (scrollSection) scrollSection.style.display = 'none';
    // Center the player add-data section
    const leftSection = document.querySelector('.left-section');
    if (leftSection) {
      leftSection.style.margin = '0 auto';
      leftSection.style.float = 'none';
      leftSection.style.width = '100%';
      leftSection.style.maxWidth = '500px';
    }
    // Hide the right section
    const rightSection = document.querySelector('.right-section');
    if (rightSection) rightSection.style.display = 'none';
    // Center the container
    const container = document.querySelector('.container');
    if (container) container.style.display = 'flex';
    if (container) container.style.justifyContent = 'center';
  }
})();

// Add this at the top if not present already
// Remove the ES6 import for fetchPlayerStats
// Add fetchPlayerStats directly here
async function fetchPlayerStats() {
  try {
    const response = await fetch('/api/player-stats');
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching player stats:', error);
    return null;
  }
}

// Add this helper at the end of the file
function showBackOnlyAlert(message, isHtml) {
  // Create modal elements
  const modal = document.createElement('div');
  modal.style.position = 'fixed';
  modal.style.top = '0';
  modal.style.left = '0';
  modal.style.width = '100vw';
  modal.style.height = '100vh';
  modal.style.background = 'rgba(0,0,0,0.5)';
  modal.style.display = 'flex';
  modal.style.alignItems = 'center';
  modal.style.justifyContent = 'center';
  modal.style.zIndex = '9999';

  const box = document.createElement('div');
  box.style.background = '#222';
  box.style.color = '#fff';
  box.style.padding = '2em';
  box.style.borderRadius = '10px';
  box.style.maxWidth = '90vw';
  box.style.boxShadow = '0 2px 16px rgba(0,0,0,0.3)';
  box.style.textAlign = 'left';
  box.style.fontSize = '1.1em';

  const msgElem = document.createElement('pre');
  if (isHtml) {
    msgElem.innerHTML = message;
  } else {
    msgElem.textContent = message;
  }
  msgElem.style.whiteSpace = isHtml ? 'normal' : 'pre-wrap';
  msgElem.style.marginBottom = '1.5em';
  box.appendChild(msgElem);

  const btn = document.createElement('button');
  btn.textContent = 'Back';
  btn.style.background = '#5F7FFF';
  btn.style.color = '#fff';
  btn.style.border = 'none';
  btn.style.padding = '0.7em 2em';
  btn.style.borderRadius = '5px';
  btn.style.fontSize = '1em';
  btn.style.cursor = 'pointer';
  btn.onclick = () => document.body.removeChild(modal);
  box.appendChild(btn);

  modal.appendChild(box);
  document.body.appendChild(modal);
}

async function setupCustomXpGoldMonsterSection() {
  const playerSelect = document.getElementById('customPlayerSelect');
  const startTimeSelect = document.getElementById('customStartTimeSelect');
  const endTimeSelect = document.getElementById('customEndTimeSelect');
  const monsterSelect = document.getElementById('customMonsterSelect');

  // --- Populate Player Dropdown (searchable, like others) ---
  try {
    const response = await fetch('/api/players');
    if (!response.ok) throw new Error('Failed to fetch players');
    let players = await response.json();
    const hunt3rIndex = players.indexOf('Hunt3r1206');
    let hunt3r = null;
    if (hunt3rIndex > -1) hunt3r = players.splice(hunt3rIndex, 1)[0];
    players.sort();
    const items = [];
    items.push({ value: '', text: 'Select a player' });
    if (hunt3r) items.push({ value: hunt3r, text: hunt3r });
    players.forEach(player => items.push({ value: player, text: player }));
    setupSearchableSelect(playerSelect, items, { placeholder: 'Select a player' });
    playerSelect.value = '';
  } catch (e) { console.error(e); }

  // --- Populate Monster Dropdown ---
  try {
    const response = await fetch('/api/mob-values');
    if (!response.ok) throw new Error('Failed to fetch monsters');
    const data = await response.json();
    const mobs = Array.isArray(data.monsters) ? data.monsters : [];
    // Use Scrolls page region/exp ordering
    const regionOrder = [
      'Jurand', 'Mitron', 'Airos', 'Forilon', 
      'Iceroost', 'Volcardi', 'Dekdun', 'Ranhain'
    ];
    const sortedMobs = mobs.slice().sort((a, b) => {
      const regionAIndex = regionOrder.indexOf(a.region);
      const regionBIndex = regionOrder.indexOf(b.region);
      const effectiveIndexA = regionAIndex === -1 ? Infinity : regionAIndex;
      const effectiveIndexB = regionBIndex === -1 ? Infinity : regionBIndex;
      if (effectiveIndexA !== effectiveIndexB) {
        return effectiveIndexA - effectiveIndexB;
      }
      // If regions are the same, sort by exp in descending order
      return b.exp - a.exp;
    });
    monsterSelect.innerHTML = '';
    sortedMobs.forEach(mob => {
      const option = document.createElement('option');
      option.value = mob.name;
      option.textContent = mob.name;
      monsterSelect.appendChild(option);
    });
  } catch (e) { console.error(e); }

  // --- Populate Start/End Time Dropdowns when player changes ---
  playerSelect.addEventListener('change', async function() {
    const selectedPlayer = this.value;
    startTimeSelect.innerHTML = '';
    endTimeSelect.innerHTML = '';
    if (!selectedPlayer) {
      startTimeSelect.innerHTML = '<option value="">Select a player</option>';
      endTimeSelect.innerHTML = '<option value="">Select a player</option>';
      updateCustomAverages();
      return;
    }
    try {
      const statsResponse = await fetch(`/api/player-stats?player=${encodeURIComponent(selectedPlayer)}`);
      if (!statsResponse.ok) throw new Error('Failed to fetch player stats');
      const stats = await statsResponse.json();
      stats.sort((a, b) => new Date(b.dateTime) - new Date(a.dateTime)); // Most recent first
      startTimeSelect.innerHTML = '';
      endTimeSelect.innerHTML = '';
      stats.forEach(stat => {
        const dateTime = new Date(stat.dateTime);
        const optionText = `${dateTime.toLocaleDateString()} ${dateTime.toLocaleTimeString()}`;
        const option1 = document.createElement('option');
        option1.value = stat.dateTime;
        option1.textContent = optionText;
        startTimeSelect.appendChild(option1);
        const option2 = document.createElement('option');
        option2.value = stat.dateTime;
        option2.textContent = optionText;
        endTimeSelect.appendChild(option2);
      });
      // Set default selections: start = second latest, end = latest
      if (stats.length > 1) {
        startTimeSelect.value = stats[1].dateTime;
        endTimeSelect.value = stats[0].dateTime;
      } else if (stats.length === 1) {
        startTimeSelect.value = stats[0].dateTime;
        endTimeSelect.value = stats[0].dateTime;
      }
      updateCustomAverages();
    } catch (e) {
      startTimeSelect.innerHTML = '<option value="">Error loading data</option>';
      endTimeSelect.innerHTML = '<option value="">Error loading data</option>';
      updateCustomAverages();
    }
  });

  // Update averages when start/end time changes
  startTimeSelect.addEventListener('change', updateCustomAverages);
  endTimeSelect.addEventListener('change', updateCustomAverages);

  async function updateCustomAverages() {
    const player = playerSelect.value;
    const start = startTimeSelect.value;
    const end = endTimeSelect.value;
    const avgMobKillsPerMinuteSpan = document.getElementById('customAvgMobKillsPerMinute');
    const avgDailyMobKillsSpan = document.getElementById('customAvgDailyMobKills');
    const avgDailyGoldSpan = document.getElementById('customAvgDailyGold');
    const avgGoldPerKillSpan = document.getElementById('customAvgGoldPerKill');
    const goldRateInput = document.getElementById('customGoldRate');
    const avgPercentMobKilledSpan = document.getElementById('customAvgPercentMobKilled');
    const monsterSelect = document.getElementById('customMonsterSelect');
    const avgDailyXpSpan = document.getElementById('customAvgDailyXp');
    const xpRateInput = document.getElementById('customXpRate');
    if (!player || !start || !end) {
      avgMobKillsPerMinuteSpan.textContent = '--';
      avgDailyMobKillsSpan.textContent = '--';
      avgDailyGoldSpan.textContent = '--';
      avgGoldPerKillSpan.textContent = '--';
      avgPercentMobKilledSpan.textContent = '--';
      avgDailyXpSpan.textContent = '--';
      return;
    }
    try {
      const statsResponse = await fetch(`/api/player-stats?player=${encodeURIComponent(player)}`);
      if (!statsResponse.ok) throw new Error('Failed to fetch player stats');
      const stats = await statsResponse.json();
      const startStat = stats.find(s => s.dateTime === start);
      const endStat = stats.find(s => s.dateTime === end);
      if (!startStat || !endStat) {
        avgMobKillsPerMinuteSpan.textContent = '--';
        avgDailyMobKillsSpan.textContent = '--';
        avgDailyGoldSpan.textContent = '--';
        avgGoldPerKillSpan.textContent = '--';
        avgPercentMobKilledSpan.textContent = '--';
        avgDailyXpSpan.textContent = '--';
        return;
      }
      const mobKillsDiff = endStat.mobsKilled - startStat.mobsKilled;
      const goldDiff = endStat.gold - startStat.gold;
      const startDate = new Date(startStat.dateTime);
      const endDate = new Date(endStat.dateTime);
      const minutes = Math.abs((endDate - startDate) / (1000 * 60));
      if (minutes === 0) {
        avgMobKillsPerMinuteSpan.textContent = '--';
        avgDailyMobKillsSpan.textContent = '--';
        avgDailyGoldSpan.textContent = '--';
        avgGoldPerKillSpan.textContent = '--';
        avgPercentMobKilledSpan.textContent = '--';
        avgDailyXpSpan.textContent = '--';
        return;
      }
      const avg = mobKillsDiff / minutes;
      avgMobKillsPerMinuteSpan.textContent = avg.toFixed(2);
      // Extrapolate to 24 hours (1440 minutes)
      const avgDaily = Math.round(avg * 1440);
      avgDailyMobKillsSpan.textContent = avgDaily.toLocaleString();
      // Average Daily Gold
      const avgGoldPerMinute = goldDiff / minutes;
      const avgDailyGold = Math.round(avgGoldPerMinute * 1440);
      avgDailyGoldSpan.textContent = avgDailyGold.toLocaleString();
      // Average Gold per Kill (adjusted by Gold Rate)
      let avgGoldPerKill = null;
      if (mobKillsDiff !== 0) {
        avgGoldPerKill = goldDiff / mobKillsDiff;
        let goldRate = parseFloat(goldRateInput.value);
        if (!isNaN(goldRate)) {
          avgGoldPerKill = avgGoldPerKill / (1 + (goldRate / 100));
        }
        avgGoldPerKillSpan.textContent = Math.round(avgGoldPerKill).toLocaleString();
      } else {
        avgGoldPerKillSpan.textContent = '--';
      }
      // Average % of Mob Killed
      let avgPercentMobKilled = null;
      let monsterExp = null;
      if (avgGoldPerKill !== null && monsterSelect.value) {
        // Find the selected monster's gold and exp value
        let monsterGold = null;
        if (monsterSelect.options.length > 0) {
          if (!window._customMonsterGoldMap || !window._customMonsterExpMap) {
            // Build a map of monster name to gold and exp value from the last fetch
            const mobDataResp = await fetch('/api/mob-values');
            const mobData = await mobDataResp.json();
            window._customMonsterGoldMap = {};
            window._customMonsterExpMap = {};
            if (Array.isArray(mobData.monsters)) {
              mobData.monsters.forEach(mob => {
                window._customMonsterGoldMap[mob.name] = mob.gold;
                window._customMonsterExpMap[mob.name] = mob.exp;
              });
            }
          }
          monsterGold = window._customMonsterGoldMap[monsterSelect.value];
          monsterExp = window._customMonsterExpMap[monsterSelect.value];
        }
        if (monsterGold && monsterGold !== 0) {
          avgPercentMobKilled = avgGoldPerKill / monsterGold;
          avgPercentMobKilledSpan.textContent = avgPercentMobKilled.toFixed(4);
        } else {
          avgPercentMobKilledSpan.textContent = '--';
        }
      } else {
        avgPercentMobKilledSpan.textContent = '--';
      }
      // Average Daily XP
      if (avgPercentMobKilled !== null && monsterExp && avgDaily) {
        let xpRate = parseFloat(xpRateInput.value);
        if (isNaN(xpRate)) xpRate = 0;
        let avgDailyXp = (avgPercentMobKilled * monsterExp) * avgDaily;
        avgDailyXp = avgDailyXp * (1 + (xpRate / 100));
        avgDailyXpSpan.textContent = Math.round(avgDailyXp).toLocaleString();
      } else {
        avgDailyXpSpan.textContent = '--';
      }
    } catch (e) {
      avgMobKillsPerMinuteSpan.textContent = '--';
      avgDailyMobKillsSpan.textContent = '--';
      avgDailyGoldSpan.textContent = '--';
      avgGoldPerKillSpan.textContent = '--';
      avgPercentMobKilledSpan.textContent = '--';
      avgDailyXpSpan.textContent = '--';
    }

    // Update on gold rate, xp rate, or monster change
    goldRateInput.removeEventListener('input', updateCustomAverages);
    goldRateInput.addEventListener('input', updateCustomAverages);
    xpRateInput.removeEventListener('input', updateCustomAverages);
    xpRateInput.addEventListener('input', updateCustomAverages);
    monsterSelect.removeEventListener('change', updateCustomAverages);
    monsterSelect.addEventListener('change', updateCustomAverages);
  }
}