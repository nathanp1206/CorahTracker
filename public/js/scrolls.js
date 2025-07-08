// Scrolls Page Logic

// Data holders
let players = [];
let playerStats = [];
let xpLevels = [];
let mobs = [];
let scrollPrices = {};

// Checkbox multipliers
let questXpEventMultiplier = 1;
let challengerBuffMultiplier = 1;
let questXpPercentMultiplier = 1;

const scrollTypes = ['ancient', 'demoniac', 'arcane', 'shadow', 'void', 'sunlight'];

// DOM elements
const playerSelect = document.getElementById('scrollsPlayerSelect');
const playerStatsDiv = document.getElementById('scrollsPlayerStats');
const goalLevelSelect = document.getElementById('scrollsGoalLevel');
const goalLevelDisplay = document.getElementById('scrollsGoalLevelDisplay');
const goalXPDisplay = document.getElementById('scrollsGoalXPDisplay');
const mobSelect = document.getElementById('scrollsMobSelect');
const mobQuestExpDiv = document.getElementById('scrollsMobQuestExp');
const scrollsInputsContainer = document.getElementById('scrollsInputsContainer');
const resultsContainer = document.getElementById('scrolls-results');

const questXpEventCheckbox = document.getElementById('questXpEventCheckbox');
const challengerBuffCheckbox = document.getElementById('challengerBuffCheckbox');
const questXpPercentInput = document.getElementById('questXpPercentInput');

// Persistent state for DBS checkboxes
const dbsCheckboxState = { shadow: false, void: false, sunlight: false };

// Fetch all required data in parallel
async function fetchAllData() {
  const [playersRes, statsRes, xpRes, mobsRes, scrollPricesRes] = await Promise.all([
    fetch('/api/players'),
    fetch('/api/player-stats'),
    fetch('/api/xp-values'),
    fetch('/api/mob-values'),
    fetch('/api/scroll-prices')
  ]);
  players = await playersRes.json();
  playerStats = await statsRes.json();
  xpLevels = (await xpRes.json()).levels.filter(l => l.total_exp && l.level !== undefined);
  mobs = (await mobsRes.json()).monsters;
  scrollPrices = (await scrollPricesRes.json());
}

// Populate player dropdown and show most recent stats
function populatePlayerDropdown() {
  const playerItems = players.map(player => ({ text: player, value: player }));
  setupSearchableSelect(playerSelect, playerItems, { displayClass: 'searchable-select-display-scrolls' });
  updatePlayerStatsDisplay();
}

function updatePlayerStatsDisplay() {
  const selectedPlayer = playerSelect.value;
  if (!selectedPlayer) { playerStatsDiv.textContent = '--'; return; }
  // Find most recent stat for this player
  const stats = playerStats.filter(s => s.player === selectedPlayer);
  if (!stats.length) { playerStatsDiv.textContent = 'No stats.'; return; }
  const latest = stats.reduce((a, b) => new Date(a.dateTime) > new Date(b.dateTime) ? a : b);
  playerStatsDiv.innerHTML = `
    <strong>EXP:</strong> ${latest.exp.toLocaleString()}<br>
    <em>Last updated: ${new Date(latest.dateTime).toLocaleString()}</em>
  `;
}

// Populate goal level dropdown
function populateGoalLevelDropdown() {
  goalLevelSelect.innerHTML = '<option value="">Select a level</option>';
  xpLevels.slice().reverse().forEach(level => {
    const option = document.createElement('option');
    option.value = level.total_exp;
    option.textContent = level.level;
    goalLevelSelect.appendChild(option);
  });
  // Default to level 310 if present
  const lvl310 = xpLevels.find(l => l.level == 310);
  if (lvl310) {
    goalLevelSelect.value = lvl310.total_exp;
  }
}

function updateGoalLevelDisplay() {
  const selectedXP = goalLevelSelect.value;
  const selectedLevel = xpLevels.find(l => String(l.total_exp) === String(selectedXP));
  goalLevelDisplay.textContent = selectedLevel ? selectedLevel.level : '--';
  goalXPDisplay.textContent = selectedLevel ? parseInt(selectedLevel.total_exp).toLocaleString() : '--';
}

// Populate mob dropdown
function populateMobDropdown() {
  const regionOrder = [
    'Jurand', 'Mitron', 'Airos', 'Forilon', 
    'Iceroost', 'Volcardi', 'Dekdun', 'Ranhain'
  ];

  const sortedMobs = mobs.slice().sort((a, b) => {
    const regionAIndex = regionOrder.indexOf(a.region);
    const regionBIndex = regionOrder.indexOf(b.region);

    // If a region is not in the list, place it at the end
    const effectiveIndexA = regionAIndex === -1 ? Infinity : regionAIndex;
    const effectiveIndexB = regionBIndex === -1 ? Infinity : regionBIndex;

    if (effectiveIndexA !== effectiveIndexB) {
      return effectiveIndexA - effectiveIndexB;
    }

    // If regions are the same, sort by exp in descending order
    return b.exp - a.exp;
  });

  mobSelect.innerHTML = '';
  sortedMobs.forEach(mob => {
    const option = document.createElement('option');
    option.value = mob.name;
    option.textContent = mob.name;
    mobSelect.appendChild(option);
  });

  // Default to Grimshade Colossus if present
  const grimshadeOption = Array.from(mobSelect.options).find(opt => opt.value === 'Grimshade Colossus');
  if (grimshadeOption) {
    mobSelect.value = 'Grimshade Colossus';
  }
  updateMobQuestExpDisplay();
}

function updateMobQuestExpDisplay() {
  const selectedMobName = mobSelect.value;
  const mob = mobs.find(m => m.name === selectedMobName);
  if (!mob) { mobQuestExpDiv.textContent = '--'; return; }
  let html = '<strong>Quest EXP per scroll:</strong><br>';
  scrollTypes.forEach(type => {
    const exp = mob.questExp[type] || 0;
    html += `${type.charAt(0).toUpperCase() + type.slice(1)}: <span>${exp.toLocaleString()}</span><br>`;
  });
  mobQuestExpDiv.innerHTML = html;
}

// Generate scroll input fields
function generateScrollInputs() {
  scrollsInputsContainer.innerHTML = '';
  scrollTypes.forEach(type => {
    const div = document.createElement('div');
    div.style.marginBottom = '0.5em';
    div.innerHTML = `
      <label for="scrollInput_${type}">${type.charAt(0).toUpperCase() + type.slice(1)} Scroll:</label>
      <input type="number" id="scrollInput_${type}" min="0" placeholder="Enter value...">
    `;
    scrollsInputsContainer.appendChild(div);
  });
  addScrollInputListeners();
}

function calculateAndDisplayResults() {
  const selectedMobName = mobSelect.value;
  const mob = mobs.find(m => m.name === selectedMobName);
  if (!mob) {
    resultsContainer.innerHTML = '<p>No mob selected.</p>';
    return;
  }
  let html = '<h3>Scroll XP Results</h3><ul style="list-style:none;padding:0;">';
  let totalAll = 0;
  scrollTypes.forEach(type => {
    const input = document.getElementById(`scrollInput_${type}`);
    let count = input ? parseFloat(input.value) || 0 : 0;
    let dbsMultiplier = 1;
    let checkboxHtml = '';
    if (type === 'shadow' || type === 'void' || type === 'sunlight') {
      // Use persistent state for checked value
      const checked = dbsCheckboxState[type];
      checkboxHtml = `<div class="checkboxScrolls"><input type='checkbox' id='${type}MultiplierCheckbox' ${checked ? 'checked' : ''}/><label>DBS only?</label></div>`;
      if (checked) dbsMultiplier = 2.5;
    }
    const xpPerScroll = (mob.questExp[type] || 0) * dbsMultiplier;
    const totalXP = (((count * challengerBuffMultiplier) * (xpPerScroll * questXpPercentMultiplier)) * questXpEventMultiplier);
    totalAll += totalXP;
    html += `<li class="scrollResultLi"><div><strong>${type.charAt(0).toUpperCase() + type.slice(1)}:</strong> ${Math.round(totalXP).toLocaleString()} XP</div> ${checkboxHtml}</li>`;
  });
  html += `<li style='margin-top:1em; border-top:1px solid #444; padding-top:0.5em;'><strong>Total:</strong> ${Math.round(totalAll).toLocaleString()} XP</li>`;
  html += '</ul>';
  resultsContainer.innerHTML = html;
  // Add listeners for x2.5 checkboxes in results
  const typeToNth = { shadow: 4, void: 5, sunlight: 6 };
  ['shadow','void','sunlight'].forEach(type => {
    const nth = typeToNth[type];
    // Use the specific selector as requested
    const selector = `li.scrollResultLi:nth-child(${nth}) > div.checkboxScrolls > input[type='checkbox']`;
    const box = resultsContainer.querySelector(selector);
    if (box) {
      box.addEventListener('change', function() {
        dbsCheckboxState[type] = box.checked;
        calculateAndDisplayResults();
      });
    }
  });
}

function addScrollInputListeners() {
  scrollTypes.forEach(type => {
    const input = document.getElementById(`scrollInput_${type}`);
    if (input) {
      input.addEventListener('input', calculateAndDisplayResults);
    }
  });
}

// Event listeners
playerSelect.addEventListener('change', updatePlayerStatsDisplay);
goalLevelSelect.addEventListener('change', updateGoalLevelDisplay);
mobSelect.addEventListener('change', () => {
  updateMobQuestExpDisplay();
  calculateAndDisplayResults();
});

if (questXpEventCheckbox && challengerBuffCheckbox) {
  questXpEventCheckbox.addEventListener('change', () => { updateMultipliers(); calculateAndDisplayResults(); });
  challengerBuffCheckbox.addEventListener('change', () => { updateMultipliers(); calculateAndDisplayResults(); });
}

if (questXpPercentInput) {
  questXpPercentInput.addEventListener('input', () => {
    updateQuestXpPercentMultiplier();
    calculateAndDisplayResults();
  });
}

// Initialize page
async function initScrollsPage() {
  await fetchAllData();
  populatePlayerDropdown();
  populateGoalLevelDropdown();
  populateMobDropdown();
  generateScrollInputs();
  updateGoalLevelDisplay();
  updateMultipliers();
  updateQuestXpPercentMultiplier();
  calculateAndDisplayResults();
}

document.addEventListener('DOMContentLoaded', initScrollsPage);

function updateMultipliers() {
  questXpEventMultiplier = questXpEventCheckbox.checked ? 2 : 1;
  challengerBuffMultiplier = challengerBuffCheckbox.checked ? 1.1 : 1;
}

function updateQuestXpPercentMultiplier() {
  const percent = parseFloat(questXpPercentInput.value) || 0;
  questXpPercentMultiplier = 1 + (percent / 100);
} 