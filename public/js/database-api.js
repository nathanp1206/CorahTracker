export async function fetchPlayerStats() {
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

export async function fetchScrollGoldPrices() {
  try {
    const response = await fetch('/api/scroll-prices');
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    // Transform the data to extract gold prices by scroll type
    const goldPrices = {};
    data.forEach(entry => {
      if (!goldPrices[entry.type]) {
        goldPrices[entry.type] = [];
      }
      if (entry.goldPrice !== null) {
        goldPrices[entry.type].push({
          dateTime: entry.timestamp,
          goldPrice: entry.goldPrice
        });
      }
    });
    return goldPrices;
  } catch (error) {
    console.error('Error fetching scroll gold prices:', error);
    return null;
  }
}

export async function fetchScrollDiamondPrices() {
  try {
    const response = await fetch('/api/scroll-prices');
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    // Transform the data to extract diamond prices by scroll type
    const diamondPrices = {};
    data.forEach(entry => {
      if (!diamondPrices[entry.type]) {
        diamondPrices[entry.type] = [];
      }
      if (entry.diamondPrice !== null) {
        diamondPrices[entry.type].push({
          dateTime: entry.timestamp,
          diamondPrice: entry.diamondPrice
        });
      }
    });
    return diamondPrices;
  } catch (error) {
    console.error('Error fetching scroll diamond prices:', error);
    return null;
  }
}

export async function fetchGoldPrices() {
  try {
    const response = await fetch('/api/gold-prices');
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    // Assuming the data is an array sorted by dateTime, return the last element
    if (Array.isArray(data) && data.length > 0) {
      return data[data.length - 1];
    } else {
      return null; // Or an appropriate value for no data
    }
  } catch (error) {
    console.error('Error fetching gold prices:', error);
    return null;
  }
}

export async function addPlayer(player) {
  try {
    const response = await fetch('/api/addPlayer', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ player })
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to add player');
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error adding player:', error);
    throw error;
  }
}

// Fetch mob values via API
export async function getMobValues() {
  try {
    const response = await fetch('/api/mob-values');
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching mob values:', error);
    return null;
  }
}

// Fetch scroll prices via API
export async function getScrollPrices() {
  try {
    const response = await fetch('/api/scroll-prices');
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching scroll prices:', error);
    return null;
  }
} 