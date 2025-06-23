document.addEventListener('DOMContentLoaded', async () => {
  const container = document.getElementById('levels-container');
  try {
    const res = await fetch('/api/levels');
    if (!res.ok) throw new Error('Failed to fetch levels');
    const data = await res.json();
    const levels = Array.isArray(data.levels) ? data.levels : [];
    if (!levels.length) {
      container.textContent = 'No level data found.';
      return;
    }
    // Group levels as 0-25, 26-50, 51-75, etc.
    const groups = [];
    let min = 0;
    let max = 25;
    while (true) {
      const group = levels.filter(lvl => lvl.level >= min && lvl.level <= max);
      if (group.length === 0) {
        // If there are no more levels to process, stop.
        if (min > Math.max(...levels.map(l => l.level))) break;
      }
      groups.push({ min, max, group });
      min = max + 1;
      max = min + 24;
    }
    // Reverse the groups to show highest levels first
    groups.reverse();
    groups.forEach(({ min, max, group }) => {
      // Dropdown header
      const header = document.createElement('div');
      header.className = 'dropdowns-header';
      header.textContent = `Levels ${min} - ${max}`;
      // Table
      const table = document.createElement('table');
      table.className = 'level-table';
      const thead = document.createElement('thead');
      thead.innerHTML = '<tr><th>Level</th><th>Total XP</th></tr>';
      table.appendChild(thead);
      const tbody = document.createElement('tbody');
      // Sort levels within the group in descending order
      const sortedGroup = [...group].sort((a, b) => b.level - a.level);
      sortedGroup.forEach(lvl => {
        const tr = document.createElement('tr');
        tr.innerHTML = `<td>${lvl.level}</td><td>${parseInt(lvl.total_exp).toLocaleString()}</td>`;
        tbody.appendChild(tr);
      });
      table.appendChild(tbody);
      // Toggle logic
      header.addEventListener('click', () => {
        header.classList.toggle('open');
        table.classList.toggle('open');
      });
      container.appendChild(header);
      container.appendChild(table);
    });
  } catch (err) {
    container.textContent = 'Error loading levels.';
    console.error(err);
  }
}); 