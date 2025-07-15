// Ensure the DOM is fully loaded before running any script
document.addEventListener('DOMContentLoaded', () => {
    console.log("--- SCRIPT INITIALIZATION ---");
    console.log("script.js is running and DOMContentLoaded.");

    // --- GLOBAL DATA & LOCAL STORAGE FUNCTIONS ---
    // Define a unique key for localStorage to store our booking data
    const LOCAL_STORAGE_KEY = 'officeRoomBookingData';

    // Default hardcoded room data. This is used if no data is found in localStorage.
    // It defines the initial state of all rooms and zones in the office.
    const defaultOfficeRoomsData = {
        'office-a': {
            name: 'Office A (Team Alpha)', status: 'Available',
            capacity: '4 people', features: 'Whiteboard, Standing Desk', type: 'individual'
        },
        'kitchen': {
            name: 'Office Kitchen', status: 'Available',
            capacity: 'N/A', features: 'Coffee Machine, Microwave, Fridge', type: 'individual'
        },
        'office-b': {
            name: 'Office B (Quiet Zone)', status: 'Available',
            capacity: '2 people', features: 'Soundproof, Ergonomic Chairs', type: 'individual'
        },
        'reception': {
            name: 'Reception Area', status: 'Available',
            capacity: '10', features: 'Waiting Area, Guest Check-in', type: 'individual'
        },
        'hallway': {
            name: 'Main Hallway', status: 'Open',
            capacity: '50', features: 'Connecting various departments', type: 'zone'
        },
        'meeting-rooms-zone': {
            name: 'Meeting Rooms', type: 'zone',
            subRooms: {
                'conf-a': { name: 'Conference Room A', status: 'Available', capacity: '8 people', features: 'Projector, Whiteboard' },
                'huddle-3': { name: 'Huddle Room 3', status: 'locked', capacity: '4 people', features: 'Monitor, Privacy Door' },
                'quiet-booth': { name: 'Quiet Booth', status: 'Available', capacity: '1 person', features: 'Soundproofing, Outlet' },
                'media-lab': { name: 'Media Lab', status: 'Available', capacity: '3 people', features: 'Green Screen, Microphones, Camera' }
            }
        }
    };

    /**
     * Attempts to load the room booking data from localStorage.
     * If successful, returns the parsed data. Otherwise, logs an error and returns default data.
     * @returns {object} The loaded or default officeRoomsData.
     */
    const loadRoomData = () => {
        try {
            const storedData = localStorage.getItem(LOCAL_STORAGE_KEY);
            if (storedData) {
                console.log("[localStorage] Loading room data from localStorage.");
                return JSON.parse(storedData);
            }
        } catch (e) {
            console.error("[localStorage] Error loading data from localStorage:", e);
            localStorage.removeItem(LOCAL_STORAGE_KEY); // Clear potentially corrupted data
        }
        console.log("[localStorage] No room data in localStorage or error, using default data.");
        return defaultOfficeRoomsData;
    };

    /**
     * Saves the current officeRoomsData object to localStorage.
     * @param {object} data - The officeRoomsData object to save.
     */
    const saveRoomData = (data) => {
        try {
            localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data));
            console.log("[localStorage] Room data saved to localStorage.");
        } catch (e) {
            console.error("[localStorage] Error saving data to localStorage:", e);
        }
    };

    // Initialize officeRoomsData: Try to load from localStorage first, otherwise use default
    let officeRoomsData = loadRoomData();
    console.log("[Data Init] Initial officeRoomsData:", officeRoomsData);
    
    // GOLDEN RULE: NEW: Define current user data (can be dynamic later with login)
    let currentUser = { name: "Alice" };
    // --- END GLOBAL DATA & LOCAL STORAGE FUNCTIONS ---


    // --- GLOBAL ELEMENT REFERENCES ---
    // Get references to main HTML elements used throughout the script
    const rooms = document.querySelectorAll('.room'); // All clickable room divs on the map
    const detailsPanel = document.querySelector('.details-panel'); // The sidebar panel to display details
    const detailsPanelTitle = document.getElementById('details-panel-title'); // Title inside the details panel
    const detailsList = document.getElementById('details-list'); // List inside the details panel
    const actionBtn = document.getElementById('actionBtn'); // The book/release button in the details panel

    // References for the new full-page content views
    const mainContentWrapper = document.querySelector('.main-content-wrapper'); // The original map+sidebar container
    const dashboardPage = document.getElementById('dashboard-page'); // The dashboard content section
    const calendarPage = document.getElementById('calendar-page'); // The calendar content section
    // GOLDEN RULE: NEW: Reference to the Directory Page
    const directoryPage = document.getElementById('colleagues-page');

    // GOLDEN RULE: Declare clearSearchIcon at the top among other elements for proper scope
    const clearSearchIcon = document.querySelector('.clear-search'); // Reference to the search clear icon
    // GOLDEN RULE: NEW: Reference to the return-to-map buttons (for Dashboard/Calendar pages)
    const returnToMapButtons = document.querySelectorAll('.return-to-map-btn');
    
    // GOLDEN RULE: NEW: References for Calendar Generation
    const calendarDisplay = document.getElementById('calendar-display');
    const currentMonthYearHeader = document.getElementById('currentMonthYear');
    const prevMonthButton = document.getElementById('prevMonth');
    const nextMonthButton = document.getElementById('nextMonth');
    const calendarGrid = document.getElementById('calendar-grid');
    
    // GOLDEN RULE: NEW: References for Dashboard Widgets
    const openBookingsToday = document.getElementById('openBookingsToday');
    const availableRoomsCount = document.getElementById('availableRoomsCount');
    const totalColleaguesCount = document.getElementById('totalColleaguesCount');
    const upcomingMeetingsList = document.getElementById('upcomingMeetingsList'); // Assuming you add an ID to the UL
    
    // GOLDEN RULE: NEW: Reference for the user selection dropdown
    const userSelect = document.getElementById('userSelect');
    
    // GOLDEN RULE: NEW: Reference for Quick Links Company Calendar link
    const quickLinksCalendar = document.getElementById('quickLinksCalendar');
    
    // GOLDEN RULE: NEW: Reference for the Office Equipments List container
    const officeEquipmentsList = document.getElementById('officeEquipmentsList');
    

    // Debugging initial state of action button
    console.log("--- DEBUGGING ACTION BUTTON REFERENCE ---");
    console.log("[ActionBtn] Action button element found:", actionBtn);
    console.log("[ActionBtn] Is action button initially displayed?", actionBtn ? actionBtn.style.display : 'Element not found');
    console.log("-----------------------------------------");
    
    // --- END GLOBAL ELEMENT REFERENCES ---


    // --- HELPER FUNCTIONS ---

    /**
     * Applies initial visual state (e.g., occupied color) to map rooms based on loaded data.
     * Called on page load.
     */
    const applyInitialMapVisuals = () => {
        console.log("[Init] Applying initial map visuals based on loaded data.");
        rooms.forEach(roomElement => {
            const roomId = Array.from(roomElement.classList).find(cls => officeRoomsData[cls] || (officeRoomsData['meeting-rooms-zone'] && officeRoomsData['meeting-rooms-zone'].subRooms[cls]));
            
            let roomStatus = null;
            if (officeRoomsData[roomId]) { // It's a top-level room or zone
                roomStatus = officeRoomsData[roomId].status;
            } else if (officeRoomsData['meeting-rooms-zone'] && officeRoomsData['meeting-rooms-zone'].subRooms[roomId]) { // It's a sub-room of the meeting zone
                roomStatus = officeRoomsData['meeting-rooms-zone'].subRooms[roomId].status;
            }

            // Apply 'map-room-occupied' or 'map-room-locked' class based on status
            if (roomStatus === 'Booked' || roomStatus === 'Occupied') {
                roomElement.classList.add('map-room-occupied');
                roomElement.classList.remove('map-room-locked'); // GOLDEN RULE: Ensure no 'locked' class if it's 'booked'
                console.log(`[Init Visuals] Room ${roomId} set to occupied color.`);
            } else if (roomStatus === 'Locked') { // GOLDEN RULE: NEW: Handle 'Locked' status
                roomElement.classList.add('map-room-locked');
                roomElement.classList.remove('map-room-occupied'); // Ensure no 'occupied' class if it's 'locked'
                console.log(`[Init Visuals] Room ${roomId} set to locked color.`);
            } else { // 'Available', 'Open', etc.
                roomElement.classList.remove('map-room-occupied');
                roomElement.classList.remove('map-room-locked');
            }
        });
        console.log("[Init] Initial map visuals applied.");       
        
        
    };
    
    // GOLDEN RULE: NEW: Function to update the displayed user name (made more robust)
    const updateUserNameDisplay = () => {
        // Ensure userNameDisplay element is found before trying to access its textContent
        const displayElement = document.getElementById('userNameDisplay'); // Re-get element inside function for robustness
        if (displayElement && currentUser && currentUser.name) {
            displayElement.textContent = `Hi, ${currentUser.name}!`;
            console.log(`[User] User name updated to: ${currentUser.name}`);
        } else if (displayElement) {
            displayElement.textContent = `Hi there!`; // Fallback if no user name or user not defined
            console.log(`[User] User name display fallback to 'Hi there!'.`);
        } else {
            console.warn("[User] userNameDisplay element not found on page.");
        }
    };
    // --- END NEW HELPER FUNCTION: updateUserNameDisplay ---
    
    /**
     * Displays details for an individual room in the sidebar's details panel.
     * Controls the visibility and text of the booking action button.
     * @param {string} id - The ID of the room (e.g., 'office-a').
     * @param {object} data - The room's data object.
     */
    const displayIndividualRoomDetails = (id, data) => {
        console.log(`[Details Panel] Displaying details for individual room: ${data.name} (ID: ${id})`);
        detailsPanelTitle.textContent = `Details for ${data.name}:`;
        detailsList.innerHTML = ''; // Clear previous content in the list

        // Define properties to display
        const properties = [
            { label: 'Status', value: data.status, class: data.status === 'Booked' || data.status === 'Occupied' ? 'booked' : 'available' },
            { label: 'Capacity', value: data.capacity },
            { label: 'Features', value: data.features }
        ];

        // Append each property as a list item
        properties.forEach(prop => {
            const listItem = document.createElement('li');
            listItem.innerHTML = `<strong>${prop.label}:</strong> <span class="${prop.class || ''}">${prop.value}</span>`;
            detailsList.appendChild(listItem);
            console.log(`[Details Panel] Added property: ${prop.label} - ${prop.value}`);
        });

        // Control action button display and text based on room status
        if (data.status === 'Available') {
            actionBtn.textContent = `Book ${data.name}`;
            actionBtn.setAttribute('data-room-id', id); // Store room ID on button
            actionBtn.style.display = 'block'; // Make button visible
            console.log(`[ActionBtn] For ${data.name} set to display:block and text: Book.`);
        } else if (data.status === 'Booked' || data.status === 'Occupied' || data.status === 'Locked') {
            actionBtn.textContent = `Release ${data.name}`; // Change text for booked/occupied rooms
            actionBtn.setAttribute('data-room-id', id); // Store room ID on button
            actionBtn.style.display = 'block'; // Make button visible even when booked/occupied
            console.log(`[ActionBtn] For ${data.name} set to display:block and text: Release.`);
        } else {
            actionBtn.style.display = 'none'; // Hide button for 'Open' or 'N/A' statuses
            console.log(`[ActionBtn] For ${data.name} set to display:none.`);
        }
        console.log("[Details Panel] Details display complete.");
    };
    
                
    // GOLDEN RULE: Iterate ONLY through the SUB-ROOMS of this specific zone
    /**
     * Displays a list of sub-rooms within a zone (e.g., Meeting Rooms Zone) in the details panel.
     * @param {string} zoneId - The ID of the zone (e.g., 'meeting-rooms-zone').
     */
    const displayZoneDetails = (zoneId) => {
        console.log(`[Details Panel] Displaying details for zone: ${zoneId}`);
        const zoneData = officeRoomsData[zoneId]; // Get the data for the specific zone (e.g., 'meeting-rooms-zone')
        if (zoneData && zoneData.type === 'zone' && zoneData.subRooms) {
            detailsPanelTitle.textContent = `${zoneData.name} Zone:`;
            detailsList.innerHTML = ''; // Clear previous list content
            actionBtn.style.display = 'none'; // No action button directly on the zone itself

            // GOLDEN RULE: Iterate ONLY through the SUB-ROOMS of this specific zone (FIXED LOOP)
            for (const subRoomId in zoneData.subRooms) {
                const subRoom = zoneData.subRooms[subRoomId]; // Get sub-room data directly from zoneData.subRooms
                const listItem = document.createElement('li');
                
                // GOLDEN RULE: Use the new helper to set status and clickability for this list item
                updateSidebarListItemStatus(listItem, subRoomId, subRoom); // Set text, classes, listeners
                
                detailsList.appendChild(listItem);
                console.log(`[Details Panel] Added sub-room: ${subRoom.name} with status ${subRoom.status}`);
            }
        }
        console.log("[Details Panel] Zone details display complete.");
    };
    
    // GOLDEN RULE: NEW HELPER FUNCTION: Updates a single sidebar list item's status and clickability
    // This function ensures consistency in how list items are displayed and made interactive.
    const updateSidebarListItemStatus = (liElement, roomId, roomData) => {
        if (!liElement || !roomData) {
            console.warn(`[updateSidebarListItemStatus] Missing element or data for roomId: ${roomId}`);
            return;
        }

        let statusText = roomData.status;
        if (statusText === 'Booked') {
            statusText = 'Booked until 3 PM'; // Standard text for booked
        } else if (statusText === 'Available') {
            statusText = 'Available';
        } else if (statusText === 'Locked') {
            statusText = 'Locked'; // Specific text for 'Locked' status
        } else if (statusText === 'Open') { // For kitchen, reception, hallway
            statusText = 'Open';
        }

        liElement.textContent = `${roomData.name} (${statusText})`;
        liElement.setAttribute('data-room-id', roomId); // Ensure data-room-id is set

        // Remove all previous status classes and add the correct one based on actual status
        liElement.classList.remove('booked', 'available', 'locked', 'occupied', 'open'); 
        liElement.classList.add(roomData.status.toLowerCase()); // Add class matching status (e.g., 'booked', 'available', 'locked')

        // Set clickability and cursor based on status
        if (roomData.status === 'Available' || roomData.status === 'Locked' || roomData.status === 'Open') { // Make available, locked, open items clickable
            liElement.style.cursor = 'pointer';
            liElement.style.pointerEvents = 'auto'; // Ensure clickable
            // GOLDEN RULE: Use onclick to easily replace previous handler if it exists (prevents duplicate listeners)
            liElement.onclick = (event) => { 
                event.stopPropagation(); // Prevent click from propagating to parent elements
                console.log(`[Sidebar List Click] Clicked: ${roomData.name} (ID: ${roomId})`);
                displayIndividualRoomDetails(roomId, roomData); // Show individual details for this room
                detailsPanel.style.display = 'block'; // Ensure details panel is visible
            };
        } else { // Booked, Occupied (not generally clickable for details from sidebar lists)
            liElement.style.cursor = 'not-allowed';
            liElement.style.pointerEvents = 'none'; // Make unclickable
            liElement.onclick = null; // Remove click handler
        }
    };
    // --- END NEW HELPER FUNCTION: updateSidebarListItemStatus ---

    /**
     * Manages showing a specific top-level content page (map, dashboard, calendar) and hiding others.
     * Also scrolls to the top of the newly displayed page.
     * @param {string} pageToShowId - The ID of the page to show ('map', 'dashboard', 'calendar').
     */
    const showPage = (pageToShowId) => {
        console.log(`[View Manager] Attempting to show page: ${pageToShowId}`);
        // Hide all major content pages first
        mainContentWrapper.style.display = 'none';
        dashboardPage.style.display = 'none';
        calendarPage.style.display = 'none';
        directoryPage.style.display = 'none';

        // Show the requested page using flex display (for layout purposes)
        /*if (pageToShowId === 'map') {
            mainContentWrapper.style.display = 'flex';
            console.log("[View Manager] Displaying map page.");
        } else if (pageToShowId === 'dashboard') {
            dashboardPage.style.display = 'flex';
            console.log("[View Manager] Displaying dashboard page.");
        if (pageToShowId === 'dashboard') {
            dashboardPage.style.display = 'flex';
            console.log("[View Manager] Displaying dashboard page.");
            // GOLDEN RULE: NEW: Call function to update dashboard widgets when dashboard page is shown
            updateDashboardWidgets(); 
        }    
        } else if (pageToShowId === 'calendar') {
            calendarPage.style.display = 'flex';
            console.log("[View Manager] Displaying calendar page.");
        }*/
        
        // Show the requested page using flex display (for layout purposes)
        if (pageToShowId === 'map') {
            mainContentWrapper.style.display = 'flex';
            console.log("[View Manager] Displaying map page.");
        } else if (pageToShowId === 'dashboard') {
            dashboardPage.style.display = 'flex';
            console.log("[View Manager] Displaying dashboard page.");
            updateDashboardWidgets(); 
        } else if (pageToShowId === 'calendar') {
            calendarPage.style.display = 'flex';
            console.log("[View Manager] Displaying calendar page.");
            generateCalendar(); // Re-generate calendar to ensure it's up-to-date when viewed
        } else if (pageToShowId === 'directory') { // GOLDEN RULE: NEW: Handle Directory page
            directoryPage.style.display = 'flex';
            console.log("[View Manager] Displaying directory page.");
        }
        
        
        // Always scroll to top of the newly displayed page for a clean view
        window.scrollTo({ top: 0, behavior: 'smooth' });
        console.log("[View Manager] Scrolled to top of new page.");
    };

    /**
     * Expands a target collapsible element and all its parent collapsible elements
     * to ensure it's visible after a top navigation click.
     * @param {string} elementId - The ID of the target collapsible element (e.g., '#resources-section').
     */
    const expandCollapsibleAndParents = (elementId) => {
        console.log(`[expandCollapsibleAndParents] Called for ID: ${elementId}`);
        const targetElement = document.querySelector(elementId);
        if (!targetElement) {
            console.warn(`[expandCollapsibleAndParents] Target element with ID ${elementId} not found. Aborting expansion.`);
            return;
        }

        // --- GOLDEN RULE: Explicitly expand the target element itself if it's a collapsible container ---
        // This addresses cases where the target itself (like #colleagues-section) is a collapsible container.
        const targetCollapsibleContent = targetElement.querySelector(':scope > .collapsible-content');
        const targetCollapsibleHeader = targetElement.querySelector(':scope > .collapsible-header');

        if (targetCollapsibleContent && targetCollapsibleHeader && targetCollapsibleHeader.classList.contains('collapsed')) {
            console.log(`[expandCollapsibleAndParents] Expanding target itself: ${targetCollapsibleHeader.querySelector('h4').textContent.trim()}`);
            targetCollapsibleHeader.classList.remove('collapsed'); // Remove collapsed class to expand
            
            // Apply display:block for expansion (snap open)
            targetCollapsibleContent.style.display = 'block'; 
            targetCollapsibleContent.style.paddingTop = '10px';
            targetCollapsibleContent.style.paddingBottom = '10px';
            targetCollapsibleContent.style.overflow = 'visible'; // Allow all content to show
        }
        // --- END NEW LOGIC FOR EXPANDING TARGET ELEMENT ITSELF ---

        let currentElement = targetElement; // Start iterating upwards from the target element
        // Iterate upwards through the DOM tree to expand parent collapsibles
        while (currentElement && currentElement !== mainContentWrapper && currentElement.tagName !== 'BODY' && currentElement.tagName !== 'HTML') {
            console.log(`[expandCollapsibleAndParents] Checking parent element: ${currentElement.tagName} ID=${currentElement.id || 'N/A'} Classes=${currentElement.className}`);
            
            // If the current element is a collapsible content div
            if (currentElement.classList.contains('collapsible-content')) {
                const header = currentElement.previousElementSibling; // Get its corresponding header
                // Check if it's a valid header and if it's currently collapsed
                if (header && header.classList.contains('collapsible-header') && header.classList.contains('collapsed')) {
                    console.log(`[expandCollapsibleAndParents] Expanding parent: ${header.querySelector('h4').textContent.trim()} (Header ID: ${header.id || 'N/A'})`);
                    header.classList.remove('collapsed'); // Remove 'collapsed' class from header
                    
                    currentElement.style.display = 'block'; // Snap open
                    currentElement.style.paddingTop = '10px';
                    currentElement.style.paddingBottom = '10px';
                    currentElement.style.overflow = 'visible'; // Allow content to show
                } else if (header && header.classList.contains('collapsible-header')) {
                    console.log(`[expandCollapsibleAndParents] Parent is collapsible and already open: ${header.querySelector('h4').textContent.trim()}. Ensuring flexibility.`);
                    // If it's already open, ensure its max-height is none if it was restricted before.
                    if (currentElement.style.display !== 'block') { // If somehow not block, force it
                         currentElement.style.display = 'block';
                         currentElement.style.overflow = 'visible';
                    }
                }
            }
            currentElement = currentElement.parentElement; // Move up to the next parent in the DOM tree
        }
        console.log(`[expandCollapsibleAndParents] Finished ascending parents for ID: ${elementId}.`);
    };
    
    // --- NEW: CALENDAR GENERATION FUNCTIONS ---

    let currentCalendarDate = new Date(); // Stores the currently displayed month/year

    /**
     * Generates and displays the calendar grid for the current month.
     */
    const generateCalendar = () => {
        console.log("[Calendar] Generating calendar for:", currentCalendarDate.toLocaleString('default', { month: 'long', year: 'numeric' }));
        calendarGrid.innerHTML = ''; // Clear previous days

        currentMonthYearHeader.textContent = currentCalendarDate.toLocaleString('default', { month: 'long', year: 'numeric' });

        const year = currentCalendarDate.getFullYear();
        const month = currentCalendarDate.getMonth(); // 0-indexed

        // Get the first day of the month and last day of the month
        const firstDayOfMonth = new Date(year, month, 1);
        const lastDayOfMonth = new Date(year, month + 1, 0); // Day 0 of next month is last day of current
        const lastDayOfPrevMonth = new Date(year, month, 0);

        // Calculate how many days from previous month to show (to fill the first week)
        const startWeekday = firstDayOfMonth.getDay(); // 0 for Sunday, 1 for Monday etc.

        // Add days from previous month (if any)
        for (let i = startWeekday; i > 0; i--) {
            const day = new Date(year, month, 1 - i);
            const dayElement = document.createElement('div');
            dayElement.classList.add('calendar-day', 'other-month');
            dayElement.innerHTML = `<span class="calendar-day-number">${day.getDate()}</span>`;
            calendarGrid.appendChild(dayElement);
        }

        // Add days of the current month
        // Add days of the current month
        for (let i = 1; i <= lastDayOfMonth.getDate(); i++) {
            const dayElement = document.createElement('div');
            dayElement.classList.add('calendar-day', 'current-month');
            dayElement.innerHTML = `<span class="calendar-day-number">${i}</span>`;
            
            // GOLDEN RULE: NEW: Dynamically display booked rooms on the calendar for specific days
            // For demonstration, let's assign events to the 15th and 25th of the displayed month.
            // In a real app, this would involve event objects with actual dates.
            if (i === 15 || i === 25) { // Arbitrary days for demonstration
                // Filter officeRoomsData for currently booked rooms
                Object.keys(officeRoomsData).forEach(roomId => {
                    const room = officeRoomsData[roomId];
                    if (room.type === 'individual' && (room.status === 'Booked' || room.status === 'Occupied')) {
                        const eventElement = document.createElement('div');
                        eventElement.classList.add('calendar-event');
                        eventElement.textContent = `${room.name} (${room.status})`; // Show room name and status
                        dayElement.appendChild(eventElement);
                        console.log(`[Calendar] Added event for ${room.name} on day ${i}.`);
                    } else if (room.type === 'zone' && room.subRooms) {
                        // Check sub-rooms within zones
                        Object.keys(room.subRooms).forEach(subRoomId => {
                            const subRoom = room.subRooms[subRoomId];
                            if (subRoom.status === 'Booked' || subRoom.status === 'Occupied') {
                                const eventElement = document.createElement('div');
                                eventElement.classList.add('calendar-event');
                                eventElement.textContent = `${subRoom.name} (${subRoom.status})`;
                                dayElement.appendChild(eventElement);
                                console.log(`[Calendar] Added event for sub-room ${subRoom.name} on day ${i}.`);
                            }
                        });
                    }
                });
            }
            // END NEW Dynamic Event Display

            calendarGrid.appendChild(dayElement);
        }
        console.log("[Calendar] Calendar grid generated.");
    };

    /**
     * Updates the calendar to the previous month.
     */
    const showPrevMonth = () => {
        console.log("[Calendar] Showing previous month.");
        currentCalendarDate.setMonth(currentCalendarDate.getMonth() - 1);
        generateCalendar();
    };

    /**
     * Updates the calendar to the next month.
     */
    const showNextMonth = () => {
        console.log("[Calendar] Showing next month.");
        currentCalendarDate.setMonth(currentCalendarDate.getMonth() + 1);
        generateCalendar();
    };
    // --- END CALENDAR GENERATION FUNCTIONS ---
    
    // GOLDEN RULE: NEW: OFFICE EQUIPMENTS LIST GENERATION FUNCTION
    /**
     * Generates and displays the unique equipment list in the sidebar from room features.
     */
    const generateOfficeEquipmentsList = () => {
        console.log("[Office Equipments] Generating dynamic list.");
        if (!officeEquipmentsList) {
            console.warn("[Office Equipments] officeEquipmentsList element not found. Skipping generation.");
            return;
        }

        officeEquipmentsList.innerHTML = ''; // Clear previous content

        const uniqueFeatures = new Set(); // Use a Set to automatically handle unique features

        // Iterate through all rooms to collect unique features
        Object.keys(officeRoomsData).forEach(roomId => {
            const room = officeRoomsData[roomId];
            // Process individual rooms (like Office A, Kitchen)
            if (room.type === 'individual' && room.features) {
                room.features.split(',').map(f => f.trim()).filter(f => f).forEach(feature => {
                    uniqueFeatures.add(feature);
                });
            } else if (room.type === 'zone' && room.subRooms) {
                // Process sub-rooms within zones (like Conference Room A, Huddle Room 3)
                Object.keys(room.subRooms).forEach(subRoomId => {
                    const subRoom = room.subRooms[subRoomId];
                    if (subRoom.features) {
                        subRoom.features.split(',').map(f => f.trim()).filter(f => f).forEach(feature => {
                            uniqueFeatures.add(feature);
                        });
                    }
                });
            }
        });

        // Convert Set to Array, sort alphabetically, and create list items
        const sortedFeatures = Array.from(uniqueFeatures).sort();

        if (sortedFeatures.length === 0) {
            const li = document.createElement('li');
            li.textContent = "No equipment features found.";
            officeEquipmentsList.appendChild(li);
            console.log("[Office Equipments] No features found to display.");
        } else {
            sortedFeatures.forEach(feature => {
                const li = document.createElement('li');
                li.textContent = feature;
                officeEquipmentsList.appendChild(li);
            });
            console.log(`[Office Equipments] Generated list with ${sortedFeatures.length} unique features.`);
        }
    };
    // --- END NEW HELPER FUNCTION: generateOfficeEquipmentsList ---
    
    // --- NEW: DASHBOARD WIDGET FUNCTIONS ---

    /**
     * Updates the content of Dashboard widgets based on current data.
     */
    const updateDashboardWidgets = () => {
        console.log("[Dashboard] Updating Dashboard widgets.");

        // Calculate counts for 'Quick Stats'
        let bookedRooms = 0;
        let availableRooms = 0;
        let totalColleagues = 0;

        Object.keys(officeRoomsData).forEach(roomId => {
            const room = officeRoomsData[roomId];
            if (room.type === 'individual') {
                if (room.status === 'Booked' || room.status === 'Occupied') {
                    bookedRooms++;
                } else if (room.status === 'Available') {
                    availableRooms++;
                }
            } else if (room.type === 'zone' && room.subRooms) {
                Object.keys(room.subRooms).forEach(subRoomId => {
                    const subRoom = room.subRooms[subRoomId];
                    if (subRoom.status === 'Booked' || subRoom.status === 'Occupied') {
                        bookedRooms++;
                    } else if (subRoom.status === 'Available') {
                        availableRooms++;
                    }
                });
            }
        });

        // GOLDEN RULE: Hardcoded for now, assuming "Colleagues" list in HTML has fixed number
        // This count could be made dynamic later by reading the "Colleagues" list items from HTML.
        totalColleagues = 5; 
        const colleaguesListElement = document.querySelector('#colleagues-section .collapsible-content ul');
        if (colleaguesListElement) {
            totalColleagues = colleaguesListElement.querySelectorAll('li').length;
        }


        // Update 'Quick Stats' widget
        if (openBookingsToday) openBookingsToday.textContent = bookedRooms;
        if (availableRoomsCount) availableRoomsCount.textContent = availableRooms;
        if (totalColleaguesCount) totalColleaguesCount.textContent = totalColleagues;

        console.log(`[Dashboard] Quick Stats updated: Booked: ${bookedRooms}, Available: ${availableRooms}, Colleagues: ${totalColleagues}`);

        // GOLDEN RULE: For "Upcoming Meetings" - initially static, but can list dynamic bookings if we add date info
        if (upcomingMeetingsList) {
            upcomingMeetingsList.innerHTML = ''; // Clear existing static list
            // Example: Add currently booked rooms as "upcoming meetings" for today
            let todayBookings = 0;
            Object.keys(officeRoomsData).forEach(roomId => {
                const room = officeRoomsData[roomId];
                if ((room.status === 'Booked' || room.status === 'Occupied')) { // Simplified: all booked rooms are "upcoming today"
                    const li = document.createElement('li');
                    li.textContent = `${room.name}: Today (Booked)`;
                    upcomingMeetingsList.appendChild(li);
                    todayBookings++;
                } else if (room.type === 'zone' && room.subRooms) {
                     Object.keys(room.subRooms).forEach(subRoomId => {
                        const subRoom = room.subRooms[subRoomId];
                        if (subRoom.status === 'Booked' || subRoom.status === 'Occupied') {
                            const li = document.createElement('li');
                            li.textContent = `${subRoom.name}: Today (Booked)`;
                            upcomingMeetingsList.appendChild(li);
                            todayBookings++;
                        }
                    });
                }
            });
            if (todayBookings === 0) {
                const li = document.createElement('li');
                li.textContent = 'No meetings scheduled for today.';
                upcomingMeetingsList.appendChild(li);
            }
            console.log(`[Dashboard] Upcoming Meetings updated with ${todayBookings} entries.`);
        }

        console.log("[Dashboard] Dashboard widgets update complete.");
    };

    // --- END DASHBOARD WIDGET FUNCTIONS ---


    // --- EVENT LISTENERS ---

    // 1. Initial Apply Map Visuals (called once on DOMContentLoaded)
    applyInitialMapVisuals();
    // GOLDEN RULE: NEW: Call to update user name display on page load
    updateUserNameDisplay(); 
  
    // GOLDEN RULE: NEW: Update initial sidebar list item statuses and clickability on page load
    // This loops through all <li> elements in the sidebar that have a data-room-id and updates their display/clickability.
    document.querySelectorAll('.collapsible-content ul li[data-room-id]').forEach(liElement => {
        const roomId = liElement.getAttribute('data-room-id');
        let roomData = officeRoomsData[roomId];
        // Check if it's a sub-room if not found as a top-level room
        if (!roomData && officeRoomsData['meeting-rooms-zone'] && officeRoomsData['meeting-rooms-zone'].subRooms[roomId]) {
            roomData = officeRoomsData['meeting-rooms-zone'].subRooms[roomId];
        }
        if (roomData) {
            updateSidebarListItemStatus(liElement, roomId, roomData);
            console.log(`[Init] Sidebar list item for ${roomData.name} initialized with status ${roomData.status}.`);
        } else {
            console.warn(`[Init] No room data found for sidebar list item with ID: ${roomId}`);
        }
    });
    // --- END NEW Initial Sidebar List Item Status Update ---
    
    // GOLDEN RULE: NEW: Call to generate Office Equipments list on page load
    generateOfficeEquipmentsList(); // Populate the Office Equipments list dynamically
    // --- END NEW Office Equipments List Generation Call ---    

    // GOLDEN RULE: NEW: Initial Calendar Generation and Button Listeners
    generateCalendar(); // Generate calendar for current month on page load
    if (prevMonthButton) {
        prevMonthButton.addEventListener('click', showPrevMonth);
        console.log("[Calendar] Previous month button listener attached.");
    }
    if (nextMonthButton) {
        nextMonthButton.addEventListener('click', showNextMonth);
        console.log("[Calendar] Next month button listener attached.");
    }
    // --- END NEW Calendar Generation and Button Listeners ---
    
    // GOLDEN RULE: NEW: User Selection Dropdown Listener
    // This section updates the displayed user name when a new user is selected from the dropdown.
    if (userSelect) {
        userSelect.addEventListener('change', () => {
            currentUser.name = userSelect.value; // Update the current user's name
            updateUserNameDisplay(); // Call the helper function to update the display
            console.log(`[User Select] User changed to: ${currentUser.name}`);
        });
        console.log("[User Select] User selection dropdown listener attached.");
    }
    // --- END NEW User Selection Dropdown Listener ---
    
    // GOLDEN RULE: NEW: Quick Links "Company Calendar" Listener
    // This section makes the "Company Calendar" link under Quick Links functional.
    if (quickLinksCalendar) {
        console.log("[QuickLinks] Found Company Calendar quick link:", quickLinksCalendar);
        quickLinksCalendar.addEventListener('click', (event) => {
            event.preventDefault(); // Prevent default anchor behavior
            console.log("[QuickLinks] Company Calendar link clicked.");
            showPage('calendar'); // Switch to the Calendar view page
            history.pushState(null, null, '/calendar'); // Update URL
        });
        console.log("[QuickLinks] Company Calendar quick link listener attached.");
    }
    // --- END NEW Quick Links "Company Calendar" Listener ---

    // 2. Map Room Click Listeners (existing code)
    rooms.forEach(room => { /* ... existing code ... */ });

    // 2.2 Map Room Click Listeners
    rooms.forEach(room => {
        const roomId = Array.from(room.classList).find(cls => officeRoomsData[cls] || (officeRoomsData['meeting-rooms-zone'] && officeRoomsData['meeting-rooms-zone'].subRooms[cls]));
        if (roomId && officeRoomsData[roomId] && roomId !== 'hallway') { // Hallway not clickable
            room.addEventListener('click', () => {
                console.log(`[Map Click] Room clicked: ${roomId}`);
                const clickedRoomData = officeRoomsData[roomId];
                if (clickedRoomData) {
                    detailsPanel.style.display = 'block';
                    detailsList.innerHTML = '';

                    rooms.forEach(r => r.classList.remove('active-room'));
                    room.classList.add('active-room');

                    if (clickedRoomData.type === 'zone' && clickedRoomData.subRooms) {
                        displayZoneDetails(roomId);
                    } else if (clickedRoomData.type === 'individual') {
                        displayIndividualRoomDetails(roomId, clickedRoomData);
                    }
                    console.log("[Map Click] Details panel updated after map click.");
                }
            });
        }
    });

    // 3. Search Functionality Listeners (Task 3 Fix - Auto-Expand Search Results)
    const resourceSearchInput = document.getElementById('resourceSearch');
    const searchButton = document.querySelector('.search-bar button');
    const allSearchableListItems = document.querySelectorAll(
        '.collapsible-content ul li, #officeEquipmentsList li' // GOLDEN RULE: NEW: Selects <li>s from both normal lists AND #officeEquipmentsList
    );

    const filterResources = () => {
        console.log("[Search] Filtering resources...");
        const searchTerm = resourceSearchInput.value.toLowerCase();
        let resultsFound = false; // Track if any results are found

        // GOLDEN RULE: Show/hide the clear icon based on search term presence
        // clearSearchIcon is declared globally at the top now
        if (clearSearchIcon) { // Ensure icon exists
            if (searchTerm.length > 0) {
                clearSearchIcon.style.display = 'block';
            } else {
                clearSearchIcon.style.display = 'none';
            }
        }

        // Apply filter to all individual list items (show/hide)
        allSearchableListItems.forEach(item => {
            const itemText = item.textContent.toLowerCase();
            if (itemText.includes(searchTerm)) {
                item.style.display = ''; // Show the item
                resultsFound = true;
            } else {
                item.style.display = 'none'; // Hide the item
            }
        });
        console.log(`[Search] Filtered by: "${searchTerm}". Results found: ${resultsFound}`);

        // GOLDEN RULE: Auto-expand/collapse parent collapsible sections based on search results
        // Iterate over all main collapsible sections and expand if they contain visible items
        //document.querySelectorAll('.collapsible-section').forEach(section => {
        document.querySelectorAll('.collapsible-section, .collapsible-sub-section').forEach(section => { // NEW: Selects both main and sub-sections for auto-expand
            const sectionContent = section.querySelector('.collapsible-content');
            const sectionHeader = section.querySelector('.collapsible-header');
            
            if (!sectionContent || !sectionHeader) return; // Skip if structure is incomplete

            // Check if any child item of this section is visible (i.e., not display: none) AND search term is active
            const hasVisibleItemsInThisSection = Array.from(sectionContent.querySelectorAll('li')).some(li => li.style.display !== 'none');

            // Only auto-expand if there are actual results and the section is currently collapsed
            if (hasVisibleItemsInThisSection && searchTerm.length > 0 && sectionHeader.classList.contains('collapsed')) {
                console.log(`[Search Auto-Expand] Expanding main section: ${sectionHeader.querySelector('h4').textContent.trim()} due to search results.`);
                sectionHeader.classList.remove('collapsed');
                sectionContent.style.display = 'block'; // Snap open
                sectionContent.style.paddingTop = '10px';
                sectionContent.style.paddingBottom = '10px';
                sectionContent.style.overflow = 'visible'; // Allow native scroll if content overflows
            } else if (!hasVisibleItemsInThisSection && searchTerm.length > 0 && sectionHeader && !sectionHeader.classList.contains('collapsed')) {
                // If search term is active but no results in this section, collapse it if it's open
                console.log(`[Search Auto-Collapse] Collapsing main section: ${sectionHeader.querySelector('h4').textContent.trim()} due to no results for active search.`);
                sectionHeader.classList.add('collapsed');
                sectionContent.style.display = 'none'; // Snap closed
                sectionContent.style.paddingTop = '0';
                sectionContent.style.paddingBottom = '0';
                sectionContent.style.overflow = 'hidden'; 
            } else if (searchTerm.length === 0 && sectionHeader && !sectionHeader.classList.contains('collapsed')) {
                // If search box is cleared (searchTerm is empty) and section is currently OPEN, collapse it to its initial state
                console.log(`[Search Auto-Collapse] Collapsing section: ${sectionHeader.querySelector('h4').textContent.trim()} because search is cleared.`);
                sectionHeader.classList.add('collapsed');
                sectionContent.style.display = 'none'; // Snap closed
                sectionContent.style.paddingTop = '0';
                sectionContent.style.paddingBottom = '0';
                sectionContent.style.overflow = 'hidden'; 
            }
        });
    };

    if (resourceSearchInput) {
        resourceSearchInput.addEventListener('keyup', filterResources);
        searchButton.addEventListener('click', filterResources); // Listener for button click

        // GOLDEN RULE: Add click listener for the clear search icon
        if (clearSearchIcon) {
            clearSearchIcon.addEventListener('click', () => {
                console.log("[Search Clear] Clear icon clicked. Clearing search.");
                resourceSearchInput.value = ''; // Clear the input field
                filterResources(); // Re-run filter to show all items and collapse lists
                resourceSearchInput.focus(); // Put focus back in the search box
            });
        }
    }

    // 4. Collapsible Sidebar Sections Listeners (Manual Toggling)
    const collapsibleHeaders = document.querySelectorAll('.collapsible-header');

    collapsibleHeaders.forEach(header => {
        const content = header.nextElementSibling;
        // Initialize state on page load: if no 'active' class from HTML, ensure it's collapsed
        if (!content.classList.contains('active')) {
            header.classList.add('collapsed');
            content.style.display = 'none'; // Snap closed
            content.style.paddingTop = '0';
            content.style.paddingBottom = '0';
            console.log(`[Collapsible Init] ${header.querySelector('h4').textContent.trim()} initialized as CLOSED.`);
        } else {
            // For elements that start with 'active' (we removed them by default in HTML)
            // This ensures they expand correctly on initial load
            content.style.display = 'block'; // Snap open
            content.style.paddingTop = '10px';
            content.style.paddingBottom = '10px';
            console.log(`[Collapsible Init] ${header.querySelector('h4').textContent.trim()} initialized as OPEN.`);
        }

        header.addEventListener('click', () => {
            console.log(`[Collapsible Click] Clicked: ${header.querySelector('h4').textContent.trim()}`);
            header.classList.toggle('collapsed');

            if (header.classList.contains('collapsed')) { // If it's now collapsed (after toggle)
                // Collapsing Logic
                console.log(`[Collapsible Click] Attempting to collapse: ${header.querySelector('h4').textContent.trim()}`);
                content.style.display = 'none'; // Snap closed
                content.style.paddingTop = '0';
                content.style.paddingBottom = '0';
            } else { // If it's now expanded (after toggle)
                // Expanding Logic
                console.log(`[Collapsible Click] Attempting to expand: ${header.querySelector('h4').textContent.trim()}.`);
                content.style.display = 'block'; // Snap open
                content.style.paddingTop = '10px';
                content.style.paddingBottom = '10px';
            }
        });
    });

    // 5. Top Navigation Listeners (Manual Smooth Scrolling & View Management)
    const topNavLinks = document.querySelectorAll('.main-nav a[href^="#"]');
    console.log("[Top Nav Init] Top Navigation Links found on page load:", topNavLinks);
    const fixedHeaderHeight = 105;

    topNavLinks.forEach(link => {
        link.addEventListener('click', (event) => {
            event.preventDefault();

            const targetId = link.getAttribute('href');
            console.log(`[Top Nav Click] Clicked: ${targetId}`);

            if (targetId === '#dashboard-page') {
                showPage('dashboard');
                history.pushState(null, null, '/dashboard');
                console.log(`[Top Nav Click] Redirected to Dashboard.`);
            } else if (targetId === '#calendar-page') {
                showPage('calendar');
                history.pushState(null, null, '/calendar');
                console.log(`[Top Nav Click] Redirected to Calendar.`);
            }
            
            // GOLDEN RULE: NEW: Inserted missing specific check for Directory page
            else if (targetId === '#colleagues-page') {
                showPage('directory'); // Show the new directory page
                history.pushState(null, null, '/directory'); // Update URL
                console.log(`[Top Nav Click] Redirected to Directory page.`);
            }
            
            // GOLDEN RULE: Handle other #id links (Resources, Announcements, etc.)
            else if (targetId.startsWith('#')) {
                showPage('map');
                
                const targetElement = document.querySelector(targetId);
                if (targetElement) {
                    console.log(`[Top Nav Click] Target element ${targetId} found for scrolling and expansion.`);
                    // GOLDEN RULE: Delay is crucial here to allow 'showPage('map')' to fully render the map and sidebar
                    setTimeout(() => {
                        expandCollapsibleAndParents(targetId); // Auto-expand target and parents
                        console.log(`[Top Nav Click] expandCollapsibleAndParents called for ${targetId}.`);

                        // Scroll after potential expansion
                        const scrollPosition = targetElement.getBoundingClientRect().top + window.pageYOffset - fixedHeaderHeight;
                        window.scrollTo({
                            top: scrollPosition,
                            behavior: 'smooth'
                        });
                        history.pushState(null, null, targetId);
                        console.log(`[Top Nav Click] Scrolled to ${targetId}.`);
                    }, 150); // Increased delay for more robustness (e.g., 150ms)
                } else {
                    console.warn(`[Top Nav Click] Target element ${targetId} NOT found for scrolling or expansion. Check ID in HTML.`);
                }
            } else {
                console.warn(`[Top Nav Click] Unhandled navigation link: ${targetId}`);
            }
        });
        // --- END MANUAL SMOOTH SCROLLING ---
        
        // 5.1. Return To Map Buttons Listener
        // GOLDEN RULE: NEW: Listener for the "Return to Map" buttons
        // This section makes the "Click 'Interactive Office Map'" button functional on Dashboard/Calendar pages.
        if (returnToMapButtons) { // 'returnToMapButtons' is declared globally at the top element references section
            console.log("[ReturnToMap] Found return-to-map buttons:", returnToMapButtons);
            returnToMapButtons.forEach(button => {
                button.addEventListener('click', (event) => {
                    event.preventDefault(); // Prevent default anchor behavior to control the navigation
                    console.log("[ReturnToMap] Return to map button clicked.");
                    showPage('map'); // Call showPage helper to switch to the map view
                    history.pushState(null, null, '/map'); // Update URL to reflect map view
                });
            });
            console.log("[ReturnToMap] Return to map listeners attached.");
        }
        // --- END Return To Map Buttons Listener ---
        
    });
    
    

    // 6. Optional: Hide details panel when clicking outside map/sidebar
    document.addEventListener('click', (event) => {
        const isClickInsideMap = event.target.closest('.map-container');
        const isClickInsideSidebar = event.target.closest('.sidebar');

        if (detailsPanel && detailsPanel.style.display === 'block') {
            const isClickInsideDetailsPanel = event.target.closest('.details-panel');

            if (!isClickInsideMap && !isClickInsideSidebar && !isClickInsideDetailsPanel) {
                detailsPanel.style.display = 'none';
                rooms.forEach(r => r.classList.remove('active-room'));
                console.log("[Outside Click] Details panel hidden.");
            }
        }
    });   
    

    // 7. Basic Booking Simulation (actionBtn listener)
    if (actionBtn) {
        console.log("[ActionBtn Init] Attempting to attach click listener to actionBtn.");
        actionBtn.addEventListener('click', (event) => {
            console.log("Action button click detected!");
            event.stopPropagation();
            const roomIdToBook = actionBtn.getAttribute('data-room-id');
            // GOLDEN RULE: Corrected syntax for console.log with template literal
            console.log(`Booking action initiated for room ID: ${roomIdToBook}`); 

            // Find the room data (could be top-level or a sub-room)
            let roomToUpdate = officeRoomsData[roomIdToBook];
            let isSubRoom = false;

            if (!roomToUpdate && officeRoomsData['meeting-rooms-zone'] && officeRoomsData['meeting-rooms-zone'].subRooms[roomIdToBook]) {
                roomToUpdate = officeRoomsData['meeting-rooms-zone'].subRooms[roomIdToBook];
                isSubRoom = true;
                // GOLDEN RULE: Corrected syntax for console.log with template literal
                console.log(`[ActionBtn Click] Room ${roomIdToBook} identified as sub-room.`);
            }

            if (roomToUpdate) {
                if (roomToUpdate.status === 'Available') {
                    roomToUpdate.status = 'Booked';
                    // GOLDEN RULE: Corrected syntax for console.log with template literal
                    console.log(`[ActionBtn Click] Room ${roomToUpdate.name} is now Booked.`);
                    // GOLDEN RULE: Corrected syntax for alert with template literal
                    alert(`${roomToUpdate.name} has been booked!`);
                } else if (roomToUpdate.status === 'Booked' || roomToUpdate.status === 'Occupied' || roomToUpdate.status === 'Locked') {
                    roomToUpdate.status = 'Available';
                    // GOLDEN RULE: Corrected syntax for console.log with template literal
                    console.log(`[ActionBtn Click] Room ${roomToUpdate.name} is now Available.`);
                    // GOLDEN RULE: Corrected syntax for alert with template literal
                    alert(`${roomToUpdate.name} has been released!`);
                }

                // --- SAVE DATA TO LOCAL STORAGE AFTER CHANGE ---
                saveRoomData(officeRoomsData);
                console.log("[ActionBtn Click] Data saved to localStorage.");

                // Update the UI after status change
                if (isSubRoom) {
                    displayZoneDetails('meeting-rooms-zone');
                    console.log("[ActionBtn Click] Displaying zone details after sub-room booking.");
                } else {
                    displayIndividualRoomDetails(roomIdToBook, roomToUpdate);
                    console.log("[ActionBtn Click] Displaying individual room details after booking.");
                }

                // Update map visuals (only for individual rooms directly on map)
                // GOLDEN RULE: Corrected syntax for document.querySelector with template literal
                const mapRoomElement = document.querySelector(`.room.${roomIdToBook}`);
                if (mapRoomElement) {
                    let currentRoomStatus = roomToUpdate.status; 
                    if (currentRoomStatus === 'Booked' || currentRoomStatus === 'Occupied') {
                        mapRoomElement.classList.add('map-room-occupied');
                        // GOLDEN RULE: Corrected syntax for console.log with template literal
                        console.log(`[ActionBtn Click] Map element ${roomIdToBook} set to occupied visual.`);
                    } else if (currentRoomStatus === 'Locked') { // Ensure locked status is respected for visual removal
                        mapRoomElement.classList.remove('map-room-occupied');
                        mapRoomElement.classList.add('map-room-locked'); // Ensure locked status is applied
                        console.log(`[ActionBtn Click] Map element ${roomIdToBook} updated to locked visual.`);
                    } else { // Available
                        mapRoomElement.classList.remove('map-room-occupied');
                        mapRoomElement.classList.remove('map-room-locked'); // Ensure both are removed
                        // GOLDEN RULE: Corrected syntax for console.log with template literal
                        console.log(`[ActionBtn Click] Map element ${roomIdToBook} removed occupied visual.`);
                    }
                }

                // Update sidebar resource list
                // GOLDEN RULE: Corrected syntax for document.querySelector with template literal
                const liElement = document.querySelector(`.collapsible-content ul li[data-room-id="${roomIdToBook}"]`);
                if (liElement) {
                    // GOLDEN RULE: Use helper function to update the list item status and clickability
                    updateSidebarListItemStatus(liElement, roomIdToBook, roomToUpdate);
                    console.log(`[ActionBtn Click] Sidebar list item for ${roomToUpdate.name} updated.`);
                } else {
                    console.warn(`[ActionBtn Click] WARNING: No matching li element found for data-room-id="${roomIdToBook}" in sidebar resource list.`);
                }
            }
        });
    } else {
        console.error("ERROR: Action button (id='actionBtn') not found at DOMContentLoaded time!");
    }
    // --- END Basic Booking Simulation ---

}); // End of DOMContentLoaded