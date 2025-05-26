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
    // Assuming scroll-prices returns an object with scroll types as keys
    // and an array of entries for each scroll type.
    // We need to extract gold prices.
    const goldPrices = {};
    for (const scrollType in data) {
      if (data.hasOwnProperty(scrollType)) {
        goldPrices[scrollType] = data[scrollType].map(entry => ({
          dateTime: entry.dateTime,
          goldPrice: entry.goldPrice
        }));
      }
    }
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
    // Assuming scroll-prices returns an object with scroll types as keys
    // and an array of entries for each scroll type.
    // We need to extract diamond prices.
    const diamondPrices = {};
    for (const scrollType in data) {
      if (data.hasOwnProperty(scrollType)) {
        diamondPrices[scrollType] = data[scrollType].map(entry => ({
          dateTime: entry.dateTime,
          diamondPrice: entry.diamondPrice
        }));
      }
    }
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