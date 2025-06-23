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

// Initialize the header when the DOM is loaded
document.addEventListener('DOMContentLoaded', createPlayerInputForm); 