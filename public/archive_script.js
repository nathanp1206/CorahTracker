function submitStats() {
  const player = document.getElementById('player').value;
  const exp = document.getElementById('exp').value;
  const mobsKilled = document.getElementById('mobsKilled').value;
  const gold = document.getElementById('gold').value;

  fetch('/api/addStat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ player, exp, mobsKilled, gold })
  })
    .then(res => res.json())
    .then(data => alert('Stats added successfully'))
    .catch(err => alert('Error adding stats'));
    console.log('db.data:', db.data);
    console.log('db.data.stats:', db.data?.stats);
}

function submitGoldPrice() {
  const price = document.getElementById('goldPrice').value;

  fetch('/api/addGoldPrice', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ price })
  })
    .then(res => res.json())
    .then(data => alert('Gold price added successfully'))
    .catch(err => alert('Error adding gold price'));
}