import { addPlayer } from './database-api.js';

// Create and add the player input form to the header
function createPlayerInputForm() {
  const form = document.createElement('form');
  form.className = 'player-input-form';
  form.onsubmit = async (e) => {
    e.preventDefault();
    const input = form.querySelector('input');
    const player = input.value.trim();
    
    if (player) {
      try {
        await addPlayer(player);
        input.value = '';
        // Refresh the page to show the new player
        window.location.reload();
      } catch (error) {
        alert(error.message);
      }
    }
  };
  
  const input = document.createElement('input');
  input.type = 'text';
  input.placeholder = 'Enter player name';
  input.required = true;
  
  const button = document.createElement('button');
  button.type = 'submit';
  button.className = 'add-player-button';
  button.textContent = 'Add Player';
  
  form.appendChild(input);
  form.appendChild(button);
  
  // Insert the form into the tabs container
  const tabs = document.querySelector('.tabs');
  if (tabs) {
    tabs.appendChild(form);
  }
}

// Add MNGMT dropdown for admin users
function addManagementDropdown() {
  const token = localStorage.getItem('jwt');
  let isAdmin = false;
  if (token) {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      isAdmin = !!payload.is_admin;
    } catch (e) {}
  }
  if (!isAdmin) return;

  // Create Dashboard button
  const dashboardBtn = document.createElement('a');
  dashboardBtn.href = '/dashboard.html';
  dashboardBtn.className = 'tab-button';
  dashboardBtn.textContent = 'Dashboard';
  // Add 'active' class if on dashboard page
  if (window.location.pathname.endsWith('/dashboard.html')) {
    dashboardBtn.classList.add('active');
  }
  // Insert as the first button in the tabs container
  const tabs = document.querySelector('.tabs');
  if (tabs) {
    tabs.insertBefore(dashboardBtn, tabs.firstChild);
  }
}

// Initialize the header when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  addManagementDropdown();
}); 