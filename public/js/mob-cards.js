// Fetch and display mob stats in card style with expandable details, grouped by region in an accordion
fetch('/api/mob-values')
  .then(res => res.json())
  .then(data => {
    const mobList = document.getElementById('mob-list');
    const modal = document.getElementById('mob-modal');
    const modalBody = document.getElementById('modal-body');
    const modalClose = document.getElementById('modal-close');

    function showModal(contentHtml) {
      modalBody.innerHTML = contentHtml;
      modal.classList.add('active');
    }
    function hideModal() {
      modal.classList.remove('active');
      modalBody.innerHTML = '';
    }
    modalClose.addEventListener('click', hideModal);
    modal.addEventListener('click', (e) => {
      if (e.target === modal) hideModal();
    });

    function formatNumber(val) {
      return typeof val === 'number' ? val.toLocaleString() : val;
    }
    function formatQuestEntry([k, v]) {
      // Capitalize first letter and tab in
      const label = k.charAt(0).toUpperCase() + k.slice(1);
      return `&nbsp;&nbsp;&nbsp;&nbsp;${label}: ${formatNumber(v)}`;
    }

    // Group mobs by region
    const mobsByRegion = {};
    data.monsters.forEach(mob => {
      if (!mobsByRegion[mob.region]) mobsByRegion[mob.region] = [];
      mobsByRegion[mob.region].push(mob);
    });

    // Accordion logic
    let openRegion = null;

    // Custom region order
    const customOrder = [
      'Jurand',
      'Mitron',
      'Airos',
      'Forilon',
      'Iceroost',
      'Vulcardi',
      'Dekdun',
      'Ranhain'
    ];
    const allRegions = Object.keys(mobsByRegion);
    const sortedRegions = [
      ...customOrder.filter(r => allRegions.includes(r)),
      ...allRegions.filter(r => !customOrder.includes(r)).sort()
    ];

    sortedRegions.forEach(region => {
      const mobs = mobsByRegion[region];
      // Create region accordion section
      const section = document.createElement('div');
      section.className = 'region-section';

      const header = document.createElement('button');
      header.className = 'region-header';
      header.type = 'button';
      header.setAttribute('aria-expanded', 'false');
      header.textContent = region;

      const content = document.createElement('div');
      content.className = 'region-content';
      content.style.display = 'none';

      // Mob cards grid for this region
      const grid = document.createElement('div');
      grid.className = 'mob-grid';
      mobs.forEach(mob => {
        const card = document.createElement('div');
        card.className = 'mob-card';
        card.innerHTML = `<div class=\"mob-title\">${mob.name}</div>`;
        card.addEventListener('click', function(e) {
          // Show modal with mob details
          const detailsHtml = `
            <div class=\"mob-title\" style=\"font-size:1.3rem; margin-bottom:0.7rem;\">${mob.name}</div>
            <div class=\"mob-details-grid\">
              <div><strong>EXP:</strong> ${formatNumber(mob.exp)}</div>
              <div><strong>HP:</strong> ${formatNumber(mob.hp)}</div>
              <div><strong>Gold:</strong> ${formatNumber(mob.gold)}</div>
              <div><strong>Boss Damage:</strong> ${formatNumber(mob.bossDamage)}</div>
              <div><strong>Quest EXP:</strong><br>${Object.entries(mob.questExp).map(formatQuestEntry).join('<br>')}</div>
              <div><strong>Quest Gold:</strong><br>${Object.entries(mob.questGold).map(formatQuestEntry).join('<br>')}</div>
            </div>
          `;
          showModal(detailsHtml);
        });
        grid.appendChild(card);
      });
      content.appendChild(grid);

      // Accordion toggle
      header.addEventListener('click', function() {
        // Close any open region
        if (openRegion && openRegion !== content) {
          openRegion.style.display = 'none';
          openRegion.previousSibling.setAttribute('aria-expanded', 'false');
        }
        // Toggle this region
        const isOpen = content.style.display === 'block';
        content.style.display = isOpen ? 'none' : 'block';
        header.setAttribute('aria-expanded', !isOpen);
        openRegion = !isOpen ? content : null;
      });

      section.appendChild(header);
      section.appendChild(content);
      mobList.appendChild(section);
    });
  }); 