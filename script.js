const STORAGE_KEY = 'gymRegistrations';
const GYM_PHOTOS_KEY = 'gymPhotos';
const SETTINGS_KEY = 'gymSettings';
const PASSWORDS_KEY = 'gymPasswords';

// Initialize passwords with default values
let passwords = {
  login: '4756',
  renew: '4756',
  delete: '4756',
  deleteAll: '475647by'
};

let currentPhotoData = '';
let allRegistrations = [];
let registrationCounter = 1;
let gymPhotos = [];
let expiringMembers = [];
let currentEditId = null;
let currentMemberFilter = 'all';

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
  // Load passwords first
  loadPasswords();
  
  document.getElementById('startDate').valueAsDate = new Date();
  document.getElementById('startDate').dispatchEvent(new Event('change'));
  
  // Initialize photo upload
  document.getElementById('photoInput').addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = function(event) {
        currentPhotoData = event.target.result;
        const photoPreview = document.getElementById('photoPreview');
        photoPreview.innerHTML = '';
        const img = document.createElement('img');
        img.src = currentPhotoData;
        photoPreview.appendChild(img);
      };
      reader.readAsDataURL(file);
    }
  });
  
  // Initialize gym photo upload
  document.getElementById('gymPhotoInput').addEventListener('change', function(e) {
    const files = e.target.files;
    if (files && files.length > 0) {
      Array.from(files).forEach(file => {
        if (file.type.match('image.*')) {
          const reader = new FileReader();
          reader.onload = function(event) {
            gymPhotos.push({
              url: event.target.result,
              caption: file.name.split('.')[0] || 'Gym Photo'
            });
            localStorage.setItem(GYM_PHOTOS_KEY, JSON.stringify(gymPhotos));
            renderGymPhotos();
          };
          reader.readAsDataURL(file);
        }
      });
    }
  });
  
  // Initialize edit photo upload
  document.getElementById('editPhotoInput').addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = function(event) {
        const photoPreview = document.getElementById('editPhotoPreview');
        photoPreview.innerHTML = '';
        const img = document.createElement('img');
        img.src = event.target.result;
        photoPreview.appendChild(img);
      };
      reader.readAsDataURL(file);
    }
  });
  
  // Load gym photos
  loadGymPhotos();
  
  // Load settings
  loadSettings();
});

// Convert Gregorian date to Ethiopian date
function gregorianToEthiopian(date) {
  const ethiopianMonths = ["Meskerem", "Tikimt", "Hidar", "Tahesas", "Tir", "Yekatit", "Megabit", "Miyazya", "Ginbot", "Sene", "Hamle", "Nehase", "Pagume"];
  
  const inputDate = new Date(date);
  const offset = 8; // Ethiopian calendar is 8 years behind Gregorian
  const newYearDay = 11; // Ethiopian new year starts on September 11
  
  const year = inputDate.getFullYear();
  const month = inputDate.getMonth();
  const day = inputDate.getDate();
  
  // Calculate Ethiopian year
  let ethYear = year - offset;
  if (month < 8 || (month === 8 && day < newYearDay)) {
    ethYear--;
  }
  
  // Calculate day of year
  const startOfEthYear = new Date(year, 8, newYearDay); // September 11
  const diff = Math.floor((inputDate - startOfEthYear) / (1000 * 60 * 60 * 24));
  
  let dayOfYear = diff;
  if (diff < 0) {
    // Before Ethiopian new year, so it's the previous year
    const prevStart = new Date(year - 1, 8, newYearDay);
    dayOfYear = Math.floor((inputDate - prevStart) / (1000 * 60 * 60 * 24));
  }
  
  // Calculate month and day
  let ethMonth = Math.floor(dayOfYear / 30);
  let ethDay = dayOfYear % 30 + 1;
  
  if (ethMonth > 12) {
    ethMonth = 12;
    ethDay = dayOfYear - 360; // Last 5-6 days
  }
  
  return {
    year: ethYear,
    month: ethiopianMonths[ethMonth],
    day: ethDay,
    formatted: `${ethDay} ${ethiopianMonths[ethMonth]} ${ethYear}`
  };
}

// Calculate membership status
function getMembershipStatus(expiryDate) {
  const today = new Date();
  const expiry = new Date(expiryDate);
  const diffTime = expiry - today;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays < 0) {
    return 'expired';
  } else if (diffDays <= 7) {
    return 'expiring';
  } else {
    return 'active';
  }
}

// Calculate remaining days
function getRemainingDays(expiryDate) {
  const today = new Date();
  const expiry = new Date(expiryDate);
  const diffTime = expiry - today;
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

// Load passwords from localStorage
function loadPasswords() {
  const savedPasswords = localStorage.getItem(PASSWORDS_KEY);
  if (savedPasswords) {
    passwords = JSON.parse(savedPasswords);
  } else {
    // Save default passwords to localStorage
    localStorage.setItem(PASSWORDS_KEY, JSON.stringify(passwords));
  }
}

// Save passwords to localStorage
function savePasswords() {
  localStorage.setItem(PASSWORDS_KEY, JSON.stringify(passwords));
}

// Load gym photos from localStorage
function loadGymPhotos() {
  const savedPhotos = localStorage.getItem(GYM_PHOTOS_KEY);
  if (savedPhotos) {
    gymPhotos = JSON.parse(savedPhotos);
  } else {
    // Default gym photos
    gymPhotos = [
      {
        url: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1470&q=80',
        caption: 'Weight Training Area'
      },
      {
        url: 'https://images.unsplash.com/photo-1540497077202-7c8a3999166f?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1470&q=80',
        caption: 'Cardio Zone'
      },
      {
        url: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1470&q=80',
        caption: 'Personal Training Session'
      },
      {
        url: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1470&q=80',
        caption: 'Group Fitness Class'
      }
    ];
    localStorage.setItem(GYM_PHOTOS_KEY, JSON.stringify(gymPhotos));
  }
  renderGymPhotos();
}

// Load settings
function loadSettings() {
  const savedSettings = localStorage.getItem(SETTINGS_KEY);
  if (savedSettings) {
    const settings = JSON.parse(savedSettings);
    
    // Apply dark mode if enabled
    if (settings.darkMode) {
      document.body.classList.add('dark-mode');
      document.getElementById('darkModeToggle').checked = true;
    }
    
    // Apply other settings
    document.getElementById('autoBackupToggle').checked = settings.autoBackup || false;
    document.getElementById('autoNotifyToggle').checked = settings.autoNotify || true;
  }
}

// Save settings
function saveSettings() {
  const settings = {
    darkMode: document.getElementById('darkModeToggle').checked,
    autoBackup: document.getElementById('autoBackupToggle').checked,
    autoNotify: document.getElementById('autoNotifyToggle').checked
  };
  
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  alert("Settings saved successfully!");
  closeSettings();
}

// Render gym photos
function renderGymPhotos() {
  const gallery = document.getElementById('gymPhotosGallery');
  gallery.innerHTML = '';
  
  gymPhotos.forEach(photo => {
    const item = document.createElement('div');
    item.className = 'gallery-item';
    item.innerHTML = `
      <img src="${photo.url}" alt="${photo.caption}">
      <div class="gallery-caption">${photo.caption}</div>
    `;
    gallery.appendChild(item);
  });
}

// Show settings modal
function showSettings() {
  document.getElementById('settingsModal').style.display = 'flex';
}

// Close settings modal
function closeSettings() {
  document.getElementById('settingsModal').style.display = 'none';
}

// Toggle dark mode
function toggleDarkMode() {
  document.body.classList.toggle('dark-mode');
}

// Show password form
function showPasswordForm(type) {
  // Hide all forms
  document.querySelectorAll('.password-form-section').forEach(form => {
    form.classList.add('hidden');
  });
  
  // Show the selected form
  document.getElementById(`${type}PasswordForm`).classList.remove('hidden');
}

// Change password
function changePassword(type) {
  const currentInput = document.getElementById(`current${type.charAt(0).toUpperCase() + type.slice(1)}Password`).value;
  const newPass = document.getElementById(`new${type.charAt(0).toUpperCase() + type.slice(1)}Password`).value;
  const confirmPass = document.getElementById(`confirm${type.charAt(0).toUpperCase() + type.slice(1)}Password`).value;
  
  if (currentInput !== passwords[type]) {
    alert("Current password is incorrect");
    return;
  }
  
  if (newPass !== confirmPass) {
    alert("New passwords do not match");
    return;
  }
  
  if (newPass.length < 4) {
    alert("Password must be at least 4 characters");
    return;
  }
  
  passwords[type] = newPass;
  savePasswords();
  
  // Clear form
  document.getElementById(`current${type.charAt(0).toUpperCase() + type.slice(1)}Password`).value = '';
  document.getElementById(`new${type.charAt(0).toUpperCase() + type.slice(1)}Password`).value = '';
  document.getElementById(`confirm${type.charAt(0).toUpperCase() + type.slice(1)}Password`).value = '';
  
  alert("Password changed successfully!");
  document.getElementById(`${type}PasswordForm`).classList.add('hidden');
}

// Backup data to JSON
function backupData() {
  const data = {
    registrations: allRegistrations,
    photos: gymPhotos,
    settings: JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}'),
    counter: registrationCounter,
    passwords: passwords
  };
  
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  
  const a = document.createElement('a');
  a.href = url;
  a.download = `gym-backup-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  
  alert("Backup completed successfully!");
}

// Restore data from JSON
function restoreData() {
  const fileInput = document.getElementById('restoreFile');
  const file = fileInput.files[0];
  
  if (!file) return;
  
  const reader = new FileReader();
  reader.onload = function(e) {
    try {
      const data = JSON.parse(e.target.result);
      
      // Restore registrations
      if (data.registrations) {
        allRegistrations = data.registrations;
        localStorage.setItem(STORAGE_KEY, JSON.stringify(allRegistrations));
      }
      
      // Restore photos
      if (data.photos) {
        gymPhotos = data.photos;
        localStorage.setItem(GYM_PHOTOS_KEY, JSON.stringify(gymPhotos));
        renderGymPhotos();
      }
      
      // Restore settings
      if (data.settings) {
        localStorage.setItem(SETTINGS_KEY, JSON.stringify(data.settings));
        loadSettings();
      }
      
      // Restore counter
      if (data.counter) {
        registrationCounter = data.counter;
        localStorage.setItem('registrationCounter', registrationCounter.toString());
      }
      
      // Restore passwords
      if (data.passwords) {
        passwords = data.passwords;
        savePasswords();
      }
      
      // Update UI
      updateCounters();
      renderList(allRegistrations);
      renderMonthlySummary(allRegistrations);
      
      alert("Data restored successfully!");
    } catch (error) {
      alert("Error restoring data: Invalid file format");
      console.error(error);
    }
  };
  reader.readAsText(file);
}

// Show notification modal
function showNotificationModal() {
  // Find all expiring members
  const today = new Date();
  expiringMembers = allRegistrations.filter(entry => {
    const status = getMembershipStatus(entry.expiryDate);
    return status === 'expiring';
  });
  
  if (expiringMembers.length === 0) {
    alert("No expiring members found");
    return;
  }
  
  document.getElementById('notificationCount').textContent = expiringMembers.length;
  document.getElementById('notificationModal').style.display = 'flex';
}

// Close modal
function closeModal() {
  document.getElementById('notificationModal').style.display = 'none';
}

// Close edit modal
function closeEditModal() {
  document.getElementById('editMemberModal').style.display = 'none';
  currentEditId = null;
}

// Send notifications
function sendNotifications() {
  const password = prompt("Enter the password to send notifications:");
  if (password !== passwords.login) {
    alert("Incorrect password");
    return;
  }
  
  // Simulate sending notifications
  let successCount = 0;
  let failedCount = 0;
  
  expiringMembers.forEach(member => {
    // In a real app, this would call an SMS API
    // For simulation, we'll just log to console
    console.log(`Sent notification to ${member.firstName} ${member.surname} at ${member.phone}`);
    
    // Randomly simulate success/failure for demonstration
    if (Math.random() > 0.2) {
      successCount++;
    } else {
      failedCount++;
    }
  });
  
  closeModal();
  
  // Show results
  alert(`Notifications sent successfully to ${successCount} members. ${failedCount} failed.`);
}

// Login function
function login() {
  const input = document.getElementById('loginPassword').value;
  const errorElement = document.getElementById('loginError');
  
  if (input === passwords.login) {
    document.getElementById('loginPage').classList.add('hidden');
    document.getElementById('mainPage').classList.remove('hidden');
    loadRegistrations();
    errorElement.style.display = 'none';
  } else {
    errorElement.style.display = 'block';
  }
}

// Logout function
function logout() {
  document.getElementById('loginPage').classList.remove('hidden');
  document.getElementById('mainPage').classList.add('hidden');
  document.getElementById('loginPassword').value = '';
}

// Load registrations from localStorage
function loadRegistrations() {
  allRegistrations = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  
  // Load registration counter
  const storedCounter = localStorage.getItem('registrationCounter');
  registrationCounter = storedCounter ? parseInt(storedCounter) : 1;
  
  // If there are registrations but no counter, find the highest existing number
  if (allRegistrations.length > 0 && !storedCounter) {
    const maxRegNumber = Math.max(...allRegistrations.map(entry => entry.regNumber || 0));
    registrationCounter = maxRegNumber + 1;
  }
  
  updateCounters();
  renderList(allRegistrations);
  renderMonthlySummary(allRegistrations);
}

// Update counters for dashboard
function updateCounters() {
  const today = new Date();
  
  let activeCount = 0;
  let expiringCount = 0;
  let expiredCount = 0;
  
  allRegistrations.forEach(entry => {
    const status = getMembershipStatus(entry.expiryDate);
    if (status === 'active') activeCount++;
    else if (status === 'expiring') expiringCount++;
    else if (status === 'expired') expiredCount++;
  });
  
  // Update sidebar counters
  document.getElementById('allCount').textContent = allRegistrations.length;
  
  // Update dashboard cards
  document.getElementById('allCountCard').textContent = allRegistrations.length;
  document.getElementById('activeCountCard').textContent = activeCount;
  document.getElementById('expiringCountCard').textContent = expiringCount;
  document.getElementById('expiredCountCard').textContent = expiredCount;
  
  // Update member filter tabs
  document.getElementById('allCountTab').textContent = `(${allRegistrations.length})`;
  document.getElementById('activeCountTab').textContent = `(${activeCount})`;
  document.getElementById('expiringCountTab').textContent = `(${expiringCount})`;
  document.getElementById('expiredCountTab').textContent = `(${expiredCount})`;
  
  // Update search results info
  document.getElementById('totalResults').textContent = allRegistrations.length;
}

// Register new member
function register() {
  const worker = document.getElementById('workerName').value;
  const firstName = document.getElementById('firstName').value;
  const surname = document.getElementById('surname').value;
  const phone = document.getElementById('phoneNumber').value;
  const startDate = document.getElementById('startDate').value;
  const expiryDate = document.getElementById('expiryDateDisplay').textContent;
  const price = parseFloat(document.getElementById('price').value);

  if (!worker || !firstName || !surname || !phone || !startDate || expiryDate === '-' || isNaN(price)) {
    alert("Please fill all fields");
    return;
  }

  // Convert dates to Ethiopian
  const ethStartDate = gregorianToEthiopian(startDate);
  const ethExpiryDate = gregorianToEthiopian(new Date(new Date(startDate).setDate(new Date(startDate).getDate() + 30));

  const newEntry = {
    id: Date.now(),
    regNumber: registrationCounter,
    worker,
    firstName,
    surname,
    phone,
    startDate,
    expiryDate,
    ethStartDate: ethStartDate.formatted,
    ethExpiryDate: ethExpiryDate.formatted,
    price,
    timestamp: new Date().toISOString(),
    photo: currentPhotoData || null
  };

  allRegistrations.push(newEntry);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(allRegistrations));
  
  // Increment and save registration counter
  registrationCounter++;
  localStorage.setItem('registrationCounter', registrationCounter.toString());
  
  updateCounters();
  renderList(allRegistrations);
  renderMonthlySummary(allRegistrations);
  
  // Reset form
  document.getElementById('workerName').value = '';
  document.getElementById('firstName').value = '';
  document.getElementById('surname').value = '';
  document.getElementById('phoneNumber').value = '';
  document.getElementById('price').value = '';
  document.getElementById('photoPreview').innerHTML = '<i class="fas fa-user"></i>';
  currentPhotoData = '';
  document.getElementById('photoInput').value = '';
  document.getElementById('startDate').valueAsDate = new Date();
  document.getElementById('startDate').dispatchEvent(new Event('change'));
  
  // Show success message
  alert(`${firstName} ${surname} has been registered successfully!`);
}

// Render member list
function renderList(data) {
  const list = document.getElementById('registrationList');
  list.innerHTML = '';
  
  // Apply current filter
  let filteredData = data;
  if (currentMemberFilter === 'active') {
    filteredData = data.filter(entry => getMembershipStatus(entry.expiryDate) === 'active');
  } else if (currentMemberFilter === 'expiring') {
    filteredData = data.filter(entry => getMembershipStatus(entry.expiryDate) === 'expiring');
  } else if (currentMemberFilter === 'expired') {
    filteredData = data.filter(entry => getMembershipStatus(entry.expiryDate) === 'expired');
  }
  
  if (filteredData.length === 0) {
    list.innerHTML = `
      <div class="no-results">
        <i class="fas fa-search"></i>
        <h3>No members found</h3>
        <p>Try changing your search criteria or filters</p>
      </div>
    `;
    return;
  }
  
  filteredData.forEach(entry => {
    const status = getMembershipStatus(entry.expiryDate);
    const remainingDays = getRemainingDays(entry.expiryDate);
    
    const el = document.createElement('div');
    el.className = 'entry-card';
    
    // Entry header with photo and basic info
    const header = document.createElement('div');
    header.className = 'entry-header';
    
    // Photo or placeholder
    const photoContainer = document.createElement('div');
    if (entry.photo) {
      photoContainer.innerHTML = `<img src="${entry.photo}" alt="${entry.firstName} ${entry.surname}" class="entry-photo">`;
    } else {
      photoContainer.innerHTML = '<div class="entry-photo" style="background:#eee;display:flex;align-items:center;justify-content:center;"><i class="fas fa-user"></i></div>';
    }
    
    // Details
    const details = document.createElement('div');
    details.className = 'entry-details';
    details.innerHTML = `
      <div class="entry-name">${entry.firstName} ${entry.surname}</div>
      <div class="entry-info"><i class="fas fa-phone"></i> ${entry.phone}</div>
      <div class="entry-info"><i class="fas fa-user-tie"></i> By ${entry.worker} - ${entry.price.toFixed(2)} ETB</div>
      <div class="reg-number">Reg. Number: ${entry.regNumber}</div>
      <div class="status-badge status-${status}">${status.toUpperCase()}</div>
    `;
    
    header.appendChild(photoContainer);
    header.appendChild(details);
    el.appendChild(header);
    
    // Meta information
    const meta = document.createElement('div');
    meta.className = 'entry-meta';
    meta.innerHTML = `
      <div class="meta-box">
        <div class="meta-label">Start Date</div>
        <div class="meta-value">${entry.startDate}</div>
        <div class="ethiopian-date">${entry.ethStartDate}</div>
      </div>
      <div class="meta-box">
        <div class="meta-label">Expiry Date</div>
        <div class="meta-value">${entry.expiryDate}</div>
        <div class="ethiopian-date">${entry.ethExpiryDate}</div>
      </div>
      <div class="meta-box">
        <div class="meta-label">Remaining Days</div>
        <div class="meta-value remaining-days">${remainingDays > 0 ? remainingDays : 0}</div>
      </div>
      <div class="meta-box">
        <div class="meta-label">Member ID</div>
        <div class="meta-value">${entry.id}</div>
      </div>
    `;
    el.appendChild(meta);
    
    // QR Code
    const qrContainer = document.createElement('div');
    qrContainer.className = 'qr-container';
    const qrCanvas = document.createElement('canvas');
    new QRious({
      element: qrCanvas,
      value: `ID: ${entry.id}, ${entry.firstName} ${entry.surname}, ${entry.phone}, ${entry.startDate} to ${entry.expiryDate}`,
      size: 150,
    });
    qrContainer.appendChild(qrCanvas);
    el.appendChild(qrContainer);

    // Action buttons
    const entryButtons = document.createElement('div');
    entryButtons.className = 'entry-buttons';
    
    // Edit button
    const editButton = document.createElement('button');
    editButton.textContent = 'Edit';
    editButton.className = 'btn edit-btn';
    editButton.innerHTML = '<i class="fas fa-edit"></i> Edit';
    editButton.onclick = () => editMember(entry);
    
    // Renew button
    const renewButton = document.createElement('button');
    renewButton.textContent = 'Renew';
    renewButton.className = 'btn renew-btn';
    renewButton.innerHTML = '<i class="fas fa-sync-alt"></i> Renew';
    renewButton.onclick = () => renewMembership(entry.id);
    
    // Delete button
    const deleteButton = document.createElement('button');
    deleteButton.textContent = 'Delete';
    deleteButton.className = 'btn delete-btn';
    deleteButton.innerHTML = '<i class="fas fa-trash-alt"></i> Delete';
    deleteButton.onclick = () => confirmDelete(entry.id);
    
    entryButtons.appendChild(editButton);
    entryButtons.appendChild(renewButton);
    entryButtons.appendChild(deleteButton);

    el.appendChild(entryButtons);
    list.appendChild(el);
  });
}

// Set member filter
function setMemberFilter(filter) {
  currentMemberFilter = filter;
  
  // Update active tab
  const tabs = document.querySelectorAll('.filter-btn');
  tabs.forEach(tab => tab.classList.remove('active'));
  event.currentTarget.classList.add('active');
  
  renderList(allRegistrations);
}

// Edit member
function editMember(member) {
  currentEditId = member.id;
  
  // Fill the edit form
  document.getElementById('editPhone').value = member.phone;
  
  const photoPreview = document.getElementById('editPhotoPreview');
  photoPreview.innerHTML = '';
  if (member.photo) {
    const img = document.createElement('img');
    img.src = member.photo;
    photoPreview.appendChild(img);
  } else {
    const icon = document.createElement('i');
    icon.className = 'fas fa-user';
    photoPreview.appendChild(icon);
  }
  
  document.getElementById('editMemberModal').style.display = 'flex';
}

// Save member edit
function saveMemberEdit() {
  const phone = document.getElementById('editPhone').value;
  
  if (!phone) {
    alert("Phone number is required");
    return;
  }
  
  const entryIndex = allRegistrations.findIndex(entry => entry.id === currentEditId);
  if (entryIndex === -1) return;
  
  // Update phone
  allRegistrations[entryIndex].phone = phone;
  
  // Update photo if changed
  const editPhotoInput = document.getElementById('editPhotoInput');
  if (editPhotoInput.files.length > 0) {
    const reader = new FileReader();
    reader.onload = function(event) {
      allRegistrations[entryIndex].photo = event.target.result;
      saveChanges();
    };
    reader.readAsDataURL(editPhotoInput.files[0]);
  } else {
    saveChanges();
  }
  
  function saveChanges() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(allRegistrations));
    renderList(allRegistrations);
    closeEditModal();
    alert("Member information updated successfully!");
  }
}

// Renew membership
function renewMembership(id) {
  const password = prompt("Enter the password to renew this membership:");
  if (password !== passwords.renew) {
    alert("Incorrect password");
    return;
  }
  
  const entryIndex = allRegistrations.findIndex(entry => entry.id === id);
  if (entryIndex === -1) return;
  
  const entry = allRegistrations[entryIndex];
  const currentExpiry = new Date(entry.expiryDate);
  
  // Calculate new expiry date (30 days from current expiry)
  const newExpiryDate = new Date(currentExpiry);
  newExpiryDate.setDate(newExpiryDate.getDate() + 30);
  
  // Convert to Ethiopian
  const ethExpiryDate = gregorianToEthiopian(newExpiryDate);
  
  // Update entry
  allRegistrations[entryIndex] = {
    ...entry,
    expiryDate: newExpiryDate.toISOString().split('T')[0],
    ethExpiryDate: ethExpiryDate.formatted
  };
  
  localStorage.setItem(STORAGE_KEY, JSON.stringify(allRegistrations));
  updateCounters();
  renderList(allRegistrations);
  alert("Membership renewed successfully!");
}

// Confirm deletion
function confirmDelete(id) {
  const password = prompt("Enter the password to delete this entry:");
  if (password === passwords.delete) {
    deleteEntry(id);
  } else {
    alert("Incorrect password");
  }
}

// Delete entry
function deleteEntry(id) {
  allRegistrations = allRegistrations.filter(entry => entry.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(allRegistrations));
  updateCounters();
  renderList(allRegistrations);
  renderMonthlySummary(allRegistrations);
}

// Delete all registrations
function deleteAllRegistrations() {
  const password = prompt("Enter the password to delete all registrations:");
  if (password === passwords.deleteAll) {
    localStorage.removeItem(STORAGE_KEY);
    allRegistrations = [];
    
    // Reset registration counter
    registrationCounter = 1;
    localStorage.setItem('registrationCounter', '1');
    
    updateCounters();
    renderList(allRegistrations);
    renderMonthlySummary(allRegistrations);
    alert("All registrations have been deleted.");
  } else {
    alert("Incorrect password");
  }
}

// Render monthly summary
function renderMonthlySummary(data) {
  const monthlyData = {
    Yonas: Array(12).fill(0),
    Biruk: Array(12).fill(0),
  };
  const monthlyPrice = {
    Yonas: Array(12).fill(0),
    Biruk: Array(12).fill(0),
  };
  
  // Initialize worker totals
  const workerTotals = {
    Yonas: { count: 0, price: 0 },
    Biruk: { count: 0, price: 0 }
  };

  data.forEach(entry => {
    const monthIndex = new Date(entry.startDate).getMonth();
    if (entry.worker === 'Yonas') {
      monthlyData.Yonas[monthIndex] += 1;
      monthlyPrice.Yonas[monthIndex] += entry.price;
      workerTotals.Yonas.count += 1;
      workerTotals.Yonas.price += entry.price;
    } else if (entry.worker === 'Biruk') {
      monthlyData.Biruk[monthIndex] += 1;
      monthlyPrice.Biruk[monthIndex] += entry.price;
      workerTotals.Biruk.count += 1;
      workerTotals.Biruk.price += entry.price;
    }
  });

  const tableBody = document.getElementById('monthlySummaryTable');
  tableBody.innerHTML = '';

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  months.forEach((month, index) => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${month}</td>
      <td>${monthlyData.Yonas[index]}</td>
      <td>${monthlyPrice.Yonas[index].toFixed(2)}</td>
      <td>${monthlyData.Biruk[index]}</td>
      <td>${monthlyPrice.Biruk[index].toFixed(2)}</td>
    `;
    tableBody.appendChild(row);
  });
  
  // Add totals row
  const totalRow = document.createElement('tr');
  totalRow.className = 'total-row';
  totalRow.innerHTML = `
    <td><strong>TOTAL</strong></td>
    <td><strong>${workerTotals.Yonas.count}</strong></td>
    <td><strong>${workerTotals.Yonas.price.toFixed(2)}</strong></td>
    <td><strong>${workerTotals.Biruk.count}</strong></td>
    <td><strong>${workerTotals.Biruk.price.toFixed(2)}</strong></td>
  `;
  tableBody.appendChild(totalRow);
}

// Export to Excel
function exportToExcel() {
  const fileName = document.getElementById('fileName').value || 'gym_registrations';
  
  // Convert photo data to simple indicator for Excel export
  const exportData = allRegistrations.map(entry => {
    const { photo, ...rest } = entry;
    return {
      ...rest,
      hasPhoto: photo ? "Yes" : "No"
    };
  });
  
  const ws = XLSX.utils.json_to_sheet(exportData);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Registrations");
  XLSX.writeFile(wb, `${fileName}.xlsx`);
}

// Import from Excel
function importFromExcel() {
  const fileInput = document.getElementById('importExcelInput');
  const file = fileInput.files[0];
  if (!file) return alert('Please select a file.');

  const reader = new FileReader();
  reader.onload = function (e) {
    const data = e.target.result;
    const workbook = XLSX.read(data, { type: 'binary' });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const json = XLSX.utils.sheet_to_json(sheet);
    
    // Convert imported data to our format
    const importedData = json.map(item => ({
      ...item,
      photo: null, // Photos can't be imported from Excel
    }));
    
    allRegistrations = importedData;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(allRegistrations));
    
    // Update registration counter
    const maxRegNumber = Math.max(...allRegistrations.map(entry => entry.regNumber || 0));
    registrationCounter = maxRegNumber + 1;
    localStorage.setItem('registrationCounter', registrationCounter.toString());
    
    updateCounters();
    renderList(allRegistrations);
    renderMonthlySummary(allRegistrations);
  };
  reader.readAsBinaryString(file);
}

// Filter registrations
function filterRegistrations() {
  const searchTerm = document.getElementById('searchInput').value.toLowerCase();
  
  // Show/hide clear button
  document.querySelector('.clear-search').style.display = searchTerm ? 'block' : 'none';
  
  if (!searchTerm) {
    renderList(allRegistrations);
    document.getElementById('searchResultsInfo').innerHTML = `Showing all <span id="totalResults">${allRegistrations.length}</span> members`;
    return;
  }
  
  const filtered = allRegistrations.filter(entry => {
    const searchFields = [
      entry.firstName?.toLowerCase() || '',
      entry.surname?.toLowerCase() || '',
      entry.phone?.toString() || '',
      entry.startDate?.toString() || '',
      entry.expiryDate?.toString() || '',
      entry.ethStartDate?.toString() || '',
      entry.ethExpiryDate?.toString() || '',
      entry.regNumber?.toString() || '',
      entry.worker?.toLowerCase() || '',
      entry.price?.toString() || ''
    ];
    
    return searchFields.some(field => field.includes(searchTerm));
  });
  
  renderList(filtered);
  document.getElementById('searchResultsInfo').innerHTML = `Found <span id="totalResults">${filtered.length}</span> matching members`;
}

// Clear search
function clearSearch() {
  document.getElementById('searchInput').value = '';
  document.querySelector('.clear-search').style.display = 'none';
  renderList(allRegistrations);
}

// Switch view
function switchView(viewId) {
  // Update active menu item
  const menuItems = document.querySelectorAll('.sidebar-menu li');
  menuItems.forEach(item => item.classList.remove('active'));
  event.currentTarget.classList.add('active');
  
  // Hide all views
  document.querySelectorAll('.view-section').forEach(section => {
    section.classList.remove('active');
  });
  
  // Show selected view
  document.getElementById(viewId).classList.add('active');
}

// Set default date and calculate expiry
document.getElementById('startDate').addEventListener('change', function() {
  const startDate = new Date(this.value);
  if (!isNaN(startDate.getTime())) {
    const expiryDate = new Date(startDate);
    expiryDate.setDate(expiryDate.getDate() + 30);
    document.getElementById('expiryDateDisplay').textContent = expiryDate.toISOString().split('T')[0];
    
    // Calculate Ethiopian dates
    const ethStartDate = gregorianToEthiopian(startDate);
    const ethExpiryDate = gregorianToEthiopian(expiryDate);
    
    document.getElementById('startDateEth').textContent = ethStartDate.formatted;
    document.getElementById('expiryDateEthDisplay').textContent = ethExpiryDate.formatted;
  }
});