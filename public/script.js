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

// Initialize charts when the page loads
document.addEventListener('DOMContentLoaded', function() {
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
});

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
            scales: {
                'y-level': { // Configuration for the Level y-axis
                    type: 'linear',
                    position: 'left',
                    beginAtZero: true,
                    title: {
                      display: true,
                      text: 'Total EXP',
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
                      text: 'Gold',
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
                      text: 'Mobs Killed',
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
            scales: {
                y: {
                    beginAtZero: true
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
  const player = document.getElementById('player').value;
  const exp = document.getElementById('exp').value;
  const mobsKilled = document.getElementById('mobsKilled').value;
  const gold = document.getElementById('gold').value;

  // Validate inputs
  if (!player || !exp || !mobsKilled || !gold) {
    alert('Please fill in all fields');
    return;
  }

  console.log('Submitting stats:', { player, exp, mobsKilled, gold });

  fetch('/api/addStat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ player, exp, mobsKilled, gold })
  })
    .then(res => {
      console.log('Response status:', res.status);
      return res.json();
    })
    .then(data => {
      console.log('Response data:', data);
      if (data.success) {
        alert('Stats added successfully');
        // Clear form
        document.getElementById('player').value = '';
        document.getElementById('exp').value = '';
        document.getElementById('mobsKilled').value = '';
        document.getElementById('gold').value = '';
        // Refresh player chart data and dropdown after adding new stat
        if (playerChart) {
          const playerSelect = document.getElementById('playerSelect');
          const selectedPlayer = playerSelect ? playerSelect.value : ''; // Use empty string for All Players
          loadChartData(selectedPlayer);
        }
        // Also refresh the add data player dropdown
        fetchPlayers();

      } else {
        alert('Error: ' + (data.error || 'Unknown error'));
      }
    })
    .catch(err => {
      console.error('Fetch error:', err);
      alert('Error adding stats: ' + err.message);
    });
}

function submitGoldPrice() {
  const price = document.getElementById('goldPrice').value;

  if (!price) {
    alert('Please enter a gold price');
    return;
  }

  console.log('Submitting gold price:', price);

  fetch('/api/addGoldPrice', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ price })
  })
    .then(res => {
      console.log('Response status:', res.status);
      return res.json();
    })
    .then(data => {
      console.log('Response data:', data);
      if (data.success) {
        alert('Gold price added successfully');
        // Clear form
        document.getElementById('goldPrice').value = '';
        if (goldChart) {
          loadChartData();
        }
      } else {
        alert('Error: ' + (data.error || 'Unknown error'));
      }
    })
    .catch(err => {
      console.error('Fetch error:', err);
      alert('Error adding gold price: ' + err.message);
    });
}

function submitScrollPrice(scrollType) {
  const goldPrice = document.getElementById(`${scrollType}Gold`).value;
  const diamondPrice = document.getElementById(`${scrollType}Diamond`).value;

  if (!goldPrice || !diamondPrice) {
    alert('Please enter both gold and diamond prices');
    return;
  }

  const requestBody = { 
    scrollType, 
    goldPrice: Number(goldPrice), 
    diamondPrice: Number(diamondPrice) 
  };
  console.log('Submitting scroll price request:', requestBody);

  fetch('/api/addScrollPrice', {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    },
    body: JSON.stringify(requestBody)
  })
    .then(async res => {
      console.log('Response status:', res.status);
      const text = await res.text();
      console.log('Raw response:', text);
      
      if (!text) {
        throw new Error('Empty response from server');
      }
      
      try {
        return JSON.parse(text);
      } catch (e) {
        console.error('Failed to parse response as JSON:', e);
        console.error('Raw response was:', text);
        throw new Error('Invalid JSON response from server');
      }
    })
    .then(data => {
      console.log('Response data:', data);
      if (data.success) {
        alert('Scroll price added successfully');
        // Clear form
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
      console.error('Fetch error:', err);
      alert('Error adding scroll price: ' + err.message);
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
      const playerSelect = document.getElementById('player'); // Target the dropdown on add data page
      if (playerSelect) { // Check if the element exists
        playerSelect.innerHTML = ''; // Clear existing options

        // Separate 'Hunt3r1206' and sort the rest alphabetically
        const hunt3rIndex = playerNames.indexOf('Hunt3r1206');
        let sortedPlayerNames = [];
        if (hunt3rIndex > -1) {
          const hunt3r = playerNames.splice(hunt3rIndex, 1)[0]; // Remove and get Hunt3r1206
          sortedPlayerNames = playerNames.sort(); // Sort remaining
          sortedPlayerNames.unshift(hunt3r); // Add Hunt3r1206 to the front
        } else {
          sortedPlayerNames = playerNames.sort(); // Just sort if Hunt3r1206 is not present
        }

        sortedPlayerNames.forEach(name => {
          const option = document.createElement('option');
          option.value = name;
          option.textContent = name;
          playerSelect.appendChild(option);
        });
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

    // Clear existing options
    playerSelect.innerHTML = '';

    // Find and handle 'Hunt3r1206'
    const hunt3rIndex = players.indexOf('Hunt3r1206');
    let hunt3r = null;
    if (hunt3rIndex > -1) {
      hunt3r = players.splice(hunt3rIndex, 1)[0]; // Remove Hunt3r1206 from the players array
    }

    // Sort the remaining players alphabetically
    players.sort();

    // Add 'Hunt3r1206' option if found
    if (hunt3r) {
      const hunt3rOption = document.createElement('option');
      hunt3rOption.value = hunt3r;
      hunt3rOption.textContent = hunt3r;
      hunt3rOption.selected = true; // Set as default selected
      playerSelect.appendChild(hunt3rOption);
    }

    // Add 'All Players' option
    const allPlayersOption = document.createElement('option');
    allPlayersOption.value = '';
    allPlayersOption.textContent = 'All Players';
    // Set 'All Players' as selected only if Hunt3r1206 was not found
    if (!hunt3r) {
        allPlayersOption.selected = true;
    }
    playerSelect.appendChild(allPlayersOption);

    // Add the rest of the sorted players
    players.forEach(player => {
      const option = document.createElement('option');
      option.value = player;
      option.textContent = player;
      playerSelect.appendChild(option);
    });

    // Determine the initially selected player based on the dropdown state after population
    const initialPlayer = playerSelect.value;
    // Load chart data for the initial selected player, applying the filter state
    loadChartData(initialPlayer);

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

        // Get sorted player names, with Hunt3r1206 first if present
        let players = Object.keys(latestStats);
        const hunt3rIndex = players.indexOf('Hunt3r1206');
        let hunt3r = null;
        if (hunt3rIndex > -1) {
            hunt3r = players.splice(hunt3rIndex, 1)[0];
        }
        players.sort();

        // Populate the latest stats dropdown
        playerSelect.innerHTML = '';
        if (hunt3r) {
            const option = document.createElement('option');
            option.value = hunt3r;
            option.textContent = hunt3r;
            option.selected = true;
            playerSelect.appendChild(option);
        }
        players.forEach(player => {
            const option = document.createElement('option');
            option.value = player;
            option.textContent = player;
            playerSelect.appendChild(option);
        });

        // Helper to render latest stats for a player
        function renderLatestStats(player) {
            playerStatsListDiv.innerHTML = '';
            if (!player || !latestStats[player]) {
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

        // Initial render for Hunt3r1206 if present, otherwise first player
        renderLatestStats(playerSelect.value || players[0]);

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
    const playerSelect = document.getElementById('snapshotPlayerSelect');
    const timeSelect = document.getElementById('snapshotTimeSelect');
    const goalDateTimeInput = document.getElementById('goalDateTime');
    const initialSnapshotExpSpan = document.getElementById('initialSnapshotExp');
    const initialSnapshotDateSpan = document.getElementById('initialSnapshotDate');
    const goalSnapshotExpSpan = document.getElementById('goalSnapshotExp');
    const goalSnapshotDateSpan = document.getElementById('goalSnapshotDate');

    if (!playerSelect || !timeSelect || !goalDateTimeInput || !initialSnapshotExpSpan || !initialSnapshotDateSpan || !goalSnapshotExpSpan || !goalSnapshotDateSpan) return;

    let allPlayerStatsData = []; // Store all stats for the selected player

    // Function to find the closest data point to a given date/time
    function findClosestStat(targetDateString) {
        if (!allPlayerStatsData || allPlayerStatsData.length === 0 || !targetDateString) {
            return null;
        }

        // Combine the target date string with a default time (3 PM EST - considering potential timezone issues)
        // A simple approach is to append a fixed time string. A more robust approach might involve timezone handling.
        // Let's assume 3 PM UTC for simplicity, or convert EST to UTC.
        // EST is UTC-5, so 3 PM EST is 20:00 UTC.
        const targetDateTimeString = `${targetDateString}T20:00:00.000Z`; // 3 PM EST is 20:00 UTC
        const targetTime = new Date(targetDateTimeString).getTime();

        // Find the stat closest in time, preferring one before or exactly at the target date
        let closestStat = null;
        let closestBefore = null;

        for (const stat of allPlayerStatsData) {
            const statTime = new Date(stat.dateTime).getTime();

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
         // If a stat exists exactly at or before the target date, prefer that one
        return closestBefore || closestStat;
    }

     // Function to update the displayed snapshot data for both initial and goal
    function updateSnapshotDisplays() {
        const initialTime = timeSelect.value;
        const goalTime = goalDateTimeInput.value;

        const initialStat = allPlayerStatsData.find(stat => stat.dateTime === initialTime);
        const goalStat = findClosestStat(goalTime);

        // Update Initial Snapshot details
        if (initialStat) {
            initialSnapshotExpSpan.textContent = initialStat.exp.toLocaleString();
            initialSnapshotDateSpan.textContent = new Date(initialStat.dateTime).toLocaleString();
        } else {
            initialSnapshotExpSpan.textContent = '--';
            initialSnapshotDateSpan.textContent = '--';
        }

        // Update Goal Snapshot details
        if (goalStat) {
            goalSnapshotExpSpan.textContent = goalStat.exp.toLocaleString();
            goalSnapshotDateSpan.textContent = new Date(goalStat.dateTime).toLocaleString();
        } else {
            goalSnapshotExpSpan.textContent = '--';
            goalSnapshotDateSpan.textContent = '--';
        }
    }


    // Function to load stats for the selected player and populate the initial time dropdown
    async function loadPlayerStatsAndPopulateTimeDropdown(selectedPlayer) {
        timeSelect.innerHTML = '<option value="">Loading data points...</option>';
        updateSnapshotData(null, null); // Clear previous snapshot data
        allPlayerStatsData = []; // Clear previous player's data

        if (!selectedPlayer) {
            timeSelect.innerHTML = '<option value="">Select a player</option>';
            return;
        }

        try {
            const statsResponse = await fetch(`/api/player-stats?player=${encodeURIComponent(selectedPlayer)}`);
            if (!statsResponse.ok) {
                 throw new Error(`HTTP error! status: ${statsResponse.status}`);
            }
            const playerStats = await statsResponse.json();
            allPlayerStatsData = playerStats;

             // Sort stats by date/time
            allPlayerStatsData.sort((a, b) => new Date(a.dateTime) - new Date(b.dateTime));

            timeSelect.innerHTML = ''; // Clear loading message

            if (allPlayerStatsData.length === 0) {
                timeSelect.innerHTML = '<option value="">No data points</option>';
                updateSnapshotData(null, null);
                return;
            }

            allPlayerStatsData.forEach(stat => {
                const option = document.createElement('option');
                option.value = stat.dateTime;
                option.textContent = new Date(stat.dateTime).toLocaleString(); // Format date for readability
                timeSelect.appendChild(option);
            });

            // Select the last data point by default in the initial time dropdown
            if (allPlayerStatsData.length > 0) {
                 timeSelect.value = allPlayerStatsData[allPlayerStatsData.length - 1].dateTime;
            }

             // Trigger initial display based on the default selected time and any pre-selected goal time
             updateSnapshotDisplays();

        } catch (error) {
            console.error('Error fetching player stats for snapshot time dropdown:', error);
            timeSelect.innerHTML = '<option value="">Error loading data</option>';
            updateSnapshotData(null, null);
        }
    }

    // Populate the snapshot player dropdown initially
    try {
        const response = await fetch('/api/players');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        let players = await response.json();

        // Sort players, with Hunt3r1206 first
        const hunt3rIndex = players.indexOf('Hunt3r1206');
        let hunt3r = null;
        if (hunt3rIndex > -1) {
            hunt3r = players.splice(hunt3rIndex, 1)[0];
        }
        players.sort();

        playerSelect.innerHTML = ''; // Clear existing options
        if (hunt3r) {
            const option = document.createElement('option');
            option.value = hunt3r;
            option.textContent = hunt3r;
            option.selected = true;
            playerSelect.appendChild(option);
        }
        players.forEach(player => {
            const option = document.createElement('option');
            option.value = player;
            option.textContent = player;
            playerSelect.appendChild(option);
        });

        // Initial load of player stats for the default selected player
        loadPlayerStatsAndPopulateTimeDropdown(playerSelect.value);

        // Event listener for the snapshot player dropdown
        playerSelect.onchange = function() {
            loadPlayerStatsAndPopulateTimeDropdown(this.value);
             // Clear goal date when player changes, as old date might not be relevant
            goalDateTimeInput.value = '';
        };

        // Event listener for the initial date/time dropdown
        timeSelect.onchange = function() {
            updateSnapshotDisplays();
        };

        // Event listener for the goal date/time input
        goalDateTimeInput.onchange = function() {
            updateSnapshotDisplays();
        };

        // Add an event listener to set a default date on load if none is present
        window.addEventListener('load', () => {
            if (!goalDateTimeInput.value) {
                const today = new Date();
                // Format today's date as YYYY-MM-DD for the input field
                const year = today.getFullYear();
                const month = (today.getMonth() + 1).toString().padStart(2, '0');
                const day = today.getDate().toString().padStart(2, '0');
                goalDateTimeInput.value = `${year}-${month}-${day}`;
                 // Trigger display update after setting the default date
                 updateSnapshotDisplays();
            }
        });

    } catch (error) {
        console.error('Error setting up player snapshot:', error);
        playerSelect.innerHTML = '<option value="">Error loading players</option>';
        timeSelect.innerHTML = '<option value="">Select a player</option>';
        updateSnapshotData(null, null);
    }
}

// Function to update the displayed snapshot data (Handles both initial and goal stats)
function updateSnapshotData(initialStats, goalStats) {
    const initialSnapshotExpSpan = document.getElementById('initialSnapshotExp');
    const initialSnapshotDateSpan = document.getElementById('initialSnapshotDate');
    const goalSnapshotExpSpan = document.getElementById('goalSnapshotExp');
    const goalSnapshotDateSpan = document.getElementById('goalSnapshotDate');

    if (!initialSnapshotExpSpan || !initialSnapshotDateSpan || !goalSnapshotExpSpan || !goalSnapshotDateSpan) return;

    // Update Initial Snapshot details
    if (initialStats) {
        initialSnapshotExpSpan.textContent = initialStats.exp.toLocaleString();
        initialSnapshotDateSpan.textContent = new Date(initialStats.dateTime).toLocaleString();
    } else {
        initialSnapshotExpSpan.textContent = '--';
        initialSnapshotDateSpan.textContent = '--';
    }

    // Update Goal Snapshot details
    if (goalStats) {
        goalSnapshotExpSpan.textContent = goalStats.exp.toLocaleString();
        goalSnapshotDateSpan.textContent = new Date(goalStats.dateTime).toLocaleString();
    } else {
        goalSnapshotExpSpan.textContent = '--';
        goalSnapshotDateSpan.textContent = '--';
    }
}

// Call displayLatestPlayerStats and setupPlayerSnapshot when the Summary page loads
document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('latest-player-stats')) {
        displayLatestPlayerStats();
    }
    if (document.getElementById('player-snapshot')) {
        setupPlayerSnapshot();
    }
});