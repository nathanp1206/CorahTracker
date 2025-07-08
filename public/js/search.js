function setupSearchableSelect(selectElement, items,
    options = {}
) {
    const {
        placeholder = 'Select an option',
        displayClass = 'searchable-select-display'
    } = options;
    selectElement.style.display = 'none';

    // Populate the original select element so we can set its value and it can be used as a fallback
    selectElement.innerHTML = '';
    items.forEach(item => {
        const option = document.createElement('option');
        option.value = item.value;
        option.textContent = item.text;
        selectElement.appendChild(option);
    });

    let container = selectElement.previousElementSibling;
    if (!container || !container.classList.contains('searchable-select-container')) {
        container = document.createElement('div');
        container.className = 'searchable-select-container';
        selectElement.parentNode.insertBefore(container, selectElement);
    }
    container.innerHTML = '';

    const selectedDisplay = document.createElement('div');
    selectedDisplay.className = displayClass;
    container.appendChild(selectedDisplay);

    const dropdown = document.createElement('div');
    dropdown.className = 'searchable-select-dropdown';
    container.appendChild(dropdown);

    const searchInput = document.createElement('input');
    searchInput.type = 'text';
    searchInput.placeholder = 'Search...';
    searchInput.className = 'searchable-select-input';
    dropdown.appendChild(searchInput);

    const optionsContainer = document.createElement('div');
    optionsContainer.className = 'searchable-select-options';
    dropdown.appendChild(optionsContainer);

    const populateOptions = (filter = '') => {
        optionsContainer.innerHTML = '';
        const lowerCaseFilter = filter.toLowerCase();
        const currentSelectedValue = selectElement.value;

        items.forEach(item => {
            if (item.text.toLowerCase().includes(lowerCaseFilter)) {
                const optionDiv = document.createElement('div');
                optionDiv.className = 'searchable-select-option';
                optionDiv.dataset.value = item.value;
                optionDiv.textContent = item.text;

                if (String(item.value) === String(currentSelectedValue)) {
                    optionDiv.classList.add('selected');
                }

                optionDiv.addEventListener('click', (e) => {
                    e.stopPropagation();
                    selectedDisplay.textContent = item.text;
                    selectElement.value = item.value;
                    selectElement.dispatchEvent(new Event('change', {
                        bubbles: true
                    }));
                    dropdown.style.display = 'none';
                });

                optionsContainer.appendChild(optionDiv);
            }
        });
    };

    populateOptions();

    const updateSelectedDisplay = () => {
        const selectedOption = items.find(item => item.value == selectElement.value);
        if (selectedOption) {
            selectedDisplay.textContent = selectedOption.text;
        } else if (items.length > 0) {
            selectedDisplay.textContent = items[0].text;
            selectElement.value = items[0].value;
        } else {
            selectedDisplay.textContent = placeholder;
        }
    };

    updateSelectedDisplay();

    selectedDisplay.addEventListener('click', () => {
        const isHidden = dropdown.style.display === 'none' || !dropdown.style.display;
        dropdown.style.display = isHidden ? 'flex' : 'none';
        if (isHidden) {
            searchInput.value = '';
            populateOptions();
            searchInput.focus();
        }
    });

    searchInput.addEventListener('input', () => {
        populateOptions(searchInput.value);
    });

    document.addEventListener('click', (e) => {
        if (!container.contains(e.target)) {
            dropdown.style.display = 'none';
        }
    });

    // When the original select changes, update the display
    selectElement.addEventListener('change', updateSelectedDisplay);
} 