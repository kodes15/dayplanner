/**
 * AuraPlan — Calming Daily Flow & Schedule Engine
 * Dark-mode day planner that guides you through every moment.
 */

// ==========================================
// App State & Configuration
// ==========================================
const STORAGE_KEY_TASKS = 'auraplan_tasks_v1';
const STORAGE_KEY_SETTINGS = 'auraplan_settings_v1';

const defaultSettings = {
  dayStart: '08:30',
  dayEnd: '22:30',
  breakDuration: 10,
  lunchDuration: 45,
  startFromNow: false,
  soundEnabled: true
};

let settings = { ...defaultSettings };
let tasks = [];
let currentFilter = 'all';
let audioCtx = null;

// ==========================================
// Category Badges & Labels
// ==========================================
const CATEGORY_MAP = {
  focus: { label: 'Deep Work', class: 'cat-focus', icon: '🎯' },
  routine: { label: 'Routine', class: 'cat-routine', icon: '🌱' },
  creative: { label: 'Creative', class: 'cat-creative', icon: '🎨' },
  health: { label: 'Health', class: 'cat-health', icon: '🏃' },
  social: { label: 'Sync / Social', class: 'cat-social', icon: '💬' },
  break: { label: 'Calm Break', class: 'cat-break', icon: '☕' }
};

// ==========================================
// Initialization
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
  loadData();
  setupEventListeners();
  startLiveClock();
  
  if (tasks.length === 0) {
    loadSampleRoutine(false);
  } else {
    renderAll();
  }
});

// ==========================================
// Storage Helpers
// ==========================================
function loadData() {
  try {
    const savedTasks = localStorage.getItem(STORAGE_KEY_TASKS);
    if (savedTasks) {
      tasks = JSON.parse(savedTasks);
    }
    const savedSettings = localStorage.getItem(STORAGE_KEY_SETTINGS);
    if (savedSettings) {
      settings = { ...defaultSettings, ...JSON.parse(savedSettings) };
    }
  } catch (e) {
    console.error('Error loading data from localStorage', e);
  }
  updateSoundButtonUI();
}

function saveData() {
  try {
    localStorage.setItem(STORAGE_KEY_TASKS, JSON.stringify(tasks));
    localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(settings));
  } catch (e) {
    console.error('Error saving data to localStorage', e);
  }
}

// ==========================================
// Audio Synthesis (Web Audio API)
// Calming singing bowl / meditation chime
// ==========================================
function playZenChime(type = 'bell') {
  if (!settings.soundEnabled) return;

  try {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return;
    if (!audioCtx) audioCtx = new AudioContextClass();
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }

    const now = audioCtx.currentTime;

    if (type === 'bell') {
      // Harmonic Singing Bowl Bell (528 Hz - Solfeggio frequency)
      const freqs = [528, 1056, 1584];
      freqs.forEach((freq, idx) => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now);

        const volume = (0.22 / (idx + 1));
        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(volume, now + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 2.4);

        osc.connect(gain);
        gain.connect(audioCtx.destination);

        osc.start(now);
        osc.stop(now + 2.5);
      });
    } else if (type === 'complete') {
      // Pleasant dual tone celebration
      [659.25, 880.0].forEach((freq, i) => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + (i * 0.12));
        gain.gain.setValueAtTime(0.18, now + (i * 0.12));
        gain.gain.exponentialRampToValueAtTime(0.0001, now + (i * 0.12) + 0.9);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(now + (i * 0.12));
        osc.stop(now + (i * 0.12) + 1.0);
      });
    }
  } catch (e) {
    console.warn('Web Audio note failed:', e);
  }
}

function updateSoundButtonUI() {
  const soundBtn = document.getElementById('soundToggleBtn');
  const indicator = soundBtn.querySelector('.sound-indicator');
  if (settings.soundEnabled) {
    indicator.textContent = 'ON';
    indicator.classList.remove('muted');
  } else {
    indicator.textContent = 'OFF';
    indicator.classList.add('muted');
  }
}

// ==========================================
// Event Listeners
// ==========================================
function setupEventListeners() {
  // Sound toggle
  document.getElementById('soundToggleBtn').addEventListener('click', () => {
    settings.soundEnabled = !settings.soundEnabled;
    saveData();
    updateSoundButtonUI();
    showToast(settings.soundEnabled ? '🔔 Calm audio bell enabled' : '🔕 Audio muted');
    if (settings.soundEnabled) playZenChime('bell');
  });

  // Sample day routine buttons
  document.getElementById('quickSampleBtn').addEventListener('click', () => {
    loadSampleRoutine(true);
  });
  document.getElementById('btnEmptySample').addEventListener('click', () => {
    loadSampleRoutine(true);
  });

  // Modal open / close for Task
  const taskModal = document.getElementById('taskModal');
  const openModal = () => {
    document.getElementById('taskForm').reset();
    document.getElementById('editTaskId').value = '';
    document.getElementById('modalTitle').textContent = 'Schedule New Task';
    document.getElementById('modalSubmitBtn').textContent = 'Add to Schedule';
    selectDurationChip(30);
    taskModal.classList.remove('hidden');
    document.getElementById('taskTitleInput').focus();
  };
  const closeModal = () => {
    taskModal.classList.add('hidden');
  };

  document.getElementById('btnOpenAddModal').addEventListener('click', openModal);
  document.getElementById('btnEmptyAddTask').addEventListener('click', openModal);
  document.getElementById('modalCloseBtn').addEventListener('click', closeModal);
  document.getElementById('modalCancelBtn').addEventListener('click', closeModal);

  // Quick duration chips in modal
  document.querySelectorAll('.duration-chip').forEach(chip => {
    chip.addEventListener('click', (e) => {
      const minutes = parseInt(e.target.dataset.min, 10);
      selectDurationChip(minutes);
    });
  });

  // Task Form Submit
  document.getElementById('taskForm').addEventListener('submit', (e) => {
    e.preventDefault();
    handleTaskFormSubmit();
  });

  // Settings Modal open / close
  const settingsModal = document.getElementById('settingsModal');
  const openSettings = () => {
    document.getElementById('settingDayStart').value = settings.dayStart;
    document.getElementById('settingDayEnd').value = settings.dayEnd;
    document.getElementById('settingBreakDuration').value = settings.breakDuration;
    document.getElementById('settingLunchDuration').value = settings.lunchDuration;
    document.getElementById('settingStartFromNow').checked = settings.startFromNow;
    settingsModal.classList.remove('hidden');
  };
  const closeSettings = () => {
    settingsModal.classList.add('hidden');
  };

  document.getElementById('daySettingsBtn').addEventListener('click', openSettings);
  document.getElementById('settingsCloseBtn').addEventListener('click', closeSettings);
  
  // Settings Form Submit
  document.getElementById('settingsForm').addEventListener('submit', (e) => {
    e.preventDefault();
    settings.dayStart = document.getElementById('settingDayStart').value || '08:30';
    settings.dayEnd = document.getElementById('settingDayEnd').value || '22:30';
    settings.breakDuration = parseInt(document.getElementById('settingBreakDuration').value, 10) || 10;
    settings.lunchDuration = parseInt(document.getElementById('settingLunchDuration').value, 10) || 45;
    settings.startFromNow = document.getElementById('settingStartFromNow').checked;
    saveData();
    closeSettings();
    distributeScheduleWithBreaks();
    showToast('✨ Day preferences saved & timeline rebalanced');
  });

  // Clear all tasks
  document.getElementById('btnClearAllTasks').addEventListener('click', () => {
    if (confirm('Are you sure you want to clear all tasks from your day?')) {
      tasks = [];
      saveData();
      closeSettings();
      renderAll();
      showToast('All tasks cleared');
    }
  });

  // Auto-Balance Button
  document.getElementById('btnAutoDistribute').addEventListener('click', () => {
    distributeScheduleWithBreaks();
    showToast('🌿 Day schedule smoothed and balanced with mindful breaks!');
    playZenChime('bell');
  });

  // Align to current time button
  const alignBtn = document.getElementById('btnAlignNow');
  if (alignBtn) {
    alignBtn.addEventListener('click', () => {
      settings.startFromNow = true;
      tasks.forEach(t => t.completed = false);
      saveData();
      distributeScheduleWithBreaks();
      showToast('⏰ Routine shifted to start right now!');
      playZenChime('bell');
    });
  }

  // Filter tabs
  document.querySelectorAll('.filter-tab').forEach(tab => {
    tab.addEventListener('click', (e) => {
      document.querySelectorAll('.filter-tab').forEach(t => t.classList.remove('active'));
      e.target.classList.add('active');
      currentFilter = e.target.dataset.filter;
      renderTimeline();
    });
  });

  // NOW Hero Actions
  document.getElementById('btnCompleteNow').addEventListener('click', completeCurrentTask);
  document.getElementById('btnAddPauseNow').addEventListener('click', insertInstantPause);
  document.getElementById('btnSkipNextNow').addEventListener('click', skipToNextItem);

  // Close modals on escape or backdrop click
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeModal();
      closeSettings();
    }
  });

  [taskModal, settingsModal].forEach(overlay => {
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        closeModal();
        closeSettings();
      }
    });
  });
}

function selectDurationChip(minutes) {
  document.getElementById('taskDurationInput').value = minutes;
  document.querySelectorAll('.duration-chip').forEach(chip => {
    chip.classList.toggle('active', parseInt(chip.dataset.min, 10) === minutes);
  });
}

// ==========================================
// Task Handling: Add, Edit, Delete, Toggle
// ==========================================
function handleTaskFormSubmit() {
  const idInput = document.getElementById('editTaskId').value;
  const title = document.getElementById('taskTitleInput').value.trim();
  const duration = parseInt(document.getElementById('taskDurationInput').value, 10) || 30;
  const category = document.getElementById('taskCategorySelect').value;
  const preferredStart = document.getElementById('taskStartTimeInput').value;
  const priority = document.getElementById('taskPrioritySelect').value;
  const notes = document.getElementById('taskNotesInput').value.trim();

  if (!title) return;

  if (idInput) {
    // Edit existing task
    const taskIndex = tasks.findIndex(t => t.id === idInput);
    if (taskIndex !== -1) {
      tasks[taskIndex].title = title;
      tasks[taskIndex].duration = duration;
      tasks[taskIndex].category = category;
      tasks[taskIndex].startTime = preferredStart || tasks[taskIndex].startTime;
      tasks[taskIndex].priority = priority;
      tasks[taskIndex].notes = notes;
      tasks[taskIndex].isBreak = (category === 'break');
      showToast('Task updated successfully');
    }
  } else {
    // Add new task
    const newTask = {
      id: 'task_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
      title,
      duration,
      category,
      startTime: preferredStart || null,
      endTime: null,
      priority,
      notes,
      completed: false,
      isBreak: (category === 'break'),
      createdAt: new Date().toISOString()
    };
    tasks.push(newTask);
    showToast('Task added to your schedule');
  }

  // Close modal & automatically distribute/refresh
  document.getElementById('taskModal').classList.add('hidden');
  distributeScheduleWithBreaks();
  saveData();
  renderAll();
}

function editTask(taskId) {
  const task = tasks.find(t => t.id === taskId);
  if (!task) return;

  document.getElementById('editTaskId').value = task.id;
  document.getElementById('taskTitleInput').value = task.title;
  document.getElementById('taskDurationInput').value = task.duration;
  document.getElementById('taskCategorySelect').value = task.category;
  document.getElementById('taskStartTimeInput').value = task.startTime || '';
  document.getElementById('taskPrioritySelect').value = task.priority || 'medium';
  document.getElementById('taskNotesInput').value = task.notes || '';

  selectDurationChip(task.duration);

  document.getElementById('modalTitle').textContent = 'Edit Scheduled Block';
  document.getElementById('modalSubmitBtn').textContent = 'Save Changes';
  document.getElementById('taskModal').classList.remove('hidden');
}

function deleteTask(taskId) {
  const task = tasks.find(t => t.id === taskId);
  const taskName = task ? task.title : 'Task';
  
  tasks = tasks.filter(t => t.id !== taskId);
  saveData();
  distributeScheduleWithBreaks();
  renderAll();
  showToast(`Deleted "${taskName}"`);
}

function toggleTaskComplete(taskId) {
  const task = tasks.find(t => t.id === taskId);
  if (!task) return;

  task.completed = !task.completed;
  saveData();
  renderAll();

  if (task.completed) {
    playZenChime('complete');
    showToast(`✓ Completed: ${task.title}`);
  }
}

// ==========================================
// Smart Scheduler Engine
// Allocates time for tasks throughout the day
// and intelligently weaves appropriate breaks
// ==========================================
function distributeScheduleWithBreaks() {
  if (tasks.length === 0) return;

  // Separate non-break user tasks
  // (We regenerate automatic breaks cleanly based on pacing)
  const userTasks = tasks.filter(t => !t.isAutoBreak);

  if (userTasks.length === 0) {
    tasks = [];
    renderAll();
    return;
  }

  // Determine starting point
  let currentMinutes = 0;
  const now = new Date();

  if (settings.startFromNow) {
    // Start from current time rounded up to nearest 5 minutes
    currentMinutes = (now.getHours() * 60) + Math.ceil(now.getMinutes() / 5) * 5;
  } else {
    // Start from configured dayStart
    currentMinutes = timeStringToMinutes(settings.dayStart || '08:30');
  }

  const distributedList = [];
  let minutesSinceLastBreak = 0;
  let lunchBreakAdded = false;

  for (let i = 0; i < userTasks.length; i++) {
    const task = userTasks[i];

    // Midday Lunch Break: if time is passing 12:45 - 13:30 and lunch not yet added
    if (!lunchBreakAdded && currentMinutes >= (12 * 60 + 45) && currentMinutes <= (14 * 60)) {
      const lunchDuration = settings.lunchDuration || 45;
      distributedList.push({
        id: 'break_lunch_' + Date.now(),
        title: 'Mindful Lunch & Rest',
        duration: lunchDuration,
        category: 'break',
        priority: 'high',
        notes: 'Nourish yourself, step away from screens.',
        completed: false,
        isBreak: true,
        isAutoBreak: true,
        startTime: minutesToTimeString(currentMinutes),
        endTime: minutesToTimeString(currentMinutes + lunchDuration)
      });
      currentMinutes += lunchDuration;
      minutesSinceLastBreak = 0;
      lunchBreakAdded = true;
    }

    // Check if task has a fixed preferred start time in the future
    if (task.startTime && !settings.startFromNow) {
      const preferredMins = timeStringToMinutes(task.startTime);
      if (preferredMins > currentMinutes) {
        // There's a gap! Add a calm relaxation / buffer break
        const gap = preferredMins - currentMinutes;
        if (gap >= 10) {
          distributedList.push({
            id: 'gap_break_' + Math.random().toString(36).substr(2, 6),
            title: gap > 30 ? 'Free Time & Recharge' : 'Mindful Breathing Pause',
            duration: gap,
            category: 'break',
            priority: 'low',
            notes: 'Rest your mind before the next focus block.',
            completed: false,
            isBreak: true,
            isAutoBreak: true,
            startTime: minutesToTimeString(currentMinutes),
            endTime: minutesToTimeString(preferredMins)
          });
        }
        currentMinutes = preferredMins;
      }
    }

    // Allocate Task Time
    const taskStartMins = currentMinutes;
    const taskEndMins = currentMinutes + task.duration;

    task.startTime = minutesToTimeString(taskStartMins);
    task.endTime = minutesToTimeString(taskEndMins);
    distributedList.push(task);

    currentMinutes = taskEndMins;
    minutesSinceLastBreak += task.duration;

    // Mindful short break after intense work:
    // If the task itself was >= 45m OR accumulated work is >= 60m
    const isLastTask = (i === userTasks.length - 1);
    if (!isLastTask && !task.isBreak) {
      if (task.duration >= 45 || minutesSinceLastBreak >= 55) {
        const breakMins = settings.breakDuration || 10;
        distributedList.push({
          id: 'auto_break_' + i + '_' + Date.now(),
          title: breakMins >= 15 ? 'Restorative Stretch & Hydration' : 'Calm Breathing Break',
          duration: breakMins,
          category: 'break',
          priority: 'medium',
          notes: 'Stand up, hydrate, take deep calm breaths.',
          completed: false,
          isBreak: true,
          isAutoBreak: true,
          startTime: minutesToTimeString(currentMinutes),
          endTime: minutesToTimeString(currentMinutes + breakMins)
        });
        currentMinutes += breakMins;
        minutesSinceLastBreak = 0;
      }
    }
  }

  tasks = distributedList;
  saveData();
  renderAll();
}

// ==========================================
// Live Clock & Present Moment Tracker
// Updates every second to reflect real-time state
// ==========================================
function startLiveClock() {
  updateClockAndPresentMoment();
  setInterval(updateClockAndPresentMoment, 1000);
}

function updateClockAndPresentMoment() {
  const now = new Date();
  
  // Format live clock HH:MM:SS
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');
  document.getElementById('liveClock').textContent = `${hours}:${minutes}:${seconds}`;

  // Format date
  const options = { weekday: 'short', month: 'short', day: 'numeric' };
  document.getElementById('liveDate').textContent = now.toLocaleDateString('en-US', options);

  // Evaluate "What to do right now"
  updateNowGuidance(now);
}

// Helper to test if a time is within a start-end block (handles crossing midnight)
function isTimeInBlock(currMins, startM, endM) {
  if (startM <= endM) {
    return currMins >= startM && currMins < endM;
  } else {
    // Crosses midnight, e.g. 23:30 (1410) to 00:30 (30)
    return currMins >= startM || currMins < endM;
  }
}

// ==========================================
// What to do RIGHT NOW Guidance Engine
// ==========================================
function updateNowGuidance(nowDate) {
  const nowMins = (nowDate.getHours() * 60) + nowDate.getMinutes();

  const heroCard = document.getElementById('nowHeroCard');
  const statusPill = document.getElementById('nowStatusPill');
  const statusLabel = document.getElementById('nowStatusLabel');
  const timeRange = document.getElementById('nowTimeRange');
  const titleEl = document.getElementById('nowTaskTitle');
  const subtitleEl = document.getElementById('nowTaskSubtitle');
  const tagsRow = document.getElementById('nowTagsRow');
  const breathingWidget = document.getElementById('breathingWidget');
  const actionsRow = document.getElementById('nowActionsRow');
  const alignNowWrap = document.getElementById('alignNowWrap');

  if (tasks.length === 0) {
    statusLabel.textContent = 'FREE FLOW';
    statusPill.className = 'now-status-pill free-status';
    timeRange.textContent = '--:-- — --:--';
    titleEl.textContent = 'Day is clear and open';
    subtitleEl.textContent = 'You have no scheduled tasks right now. Add a task or load a demo routine to start your day.';
    tagsRow.innerHTML = '';
    progressContainer.classList.add('hidden');
    breathingWidget.classList.add('hidden');
    actionsRow.classList.add('hidden');
    highlightActiveTimelineCard(null);
    return;
  }

  // Find if a task is currently active right now
  let activeTask = null;
  let nextTask = null;

  for (let i = 0; i < tasks.length; i++) {
    const t = tasks[i];
    if (!t.startTime || !t.endTime) continue;
    const startM = timeStringToMinutes(t.startTime);
    const endM = timeStringToMinutes(t.endTime);

    if (isTimeInBlock(nowMins, startM, endM)) {
      activeTask = t;
      break;
    }

    if (startM > nowMins && !nextTask) {
      nextTask = t;
    }
  }

  if (activeTask) {
    // We are currently INSIDE an active scheduled block!
    highlightActiveTimelineCard(activeTask.id);
    actionsRow.classList.remove('hidden');
    if (alignNowWrap) alignNowWrap.classList.add('hidden');

    timeRange.textContent = `${activeTask.startTime} — ${activeTask.endTime}`;
    titleEl.textContent = activeTask.title;

    if (activeTask.isBreak) {
      statusLabel.textContent = 'MINDFUL BREAK';
      statusPill.className = 'now-status-pill break-status';
      subtitleEl.textContent = activeTask.notes || 'Take a calming pause. Rest your eyes and reset your mind.';
      breathingWidget.classList.remove('hidden');
    } else {
      statusLabel.textContent = 'CURRENT FOCUS';
      statusPill.className = 'now-status-pill';
      subtitleEl.textContent = activeTask.notes || 'Immerse gently into this single task. One moment at a time.';
      breathingWidget.classList.add('hidden');
    }

    // Render category tag
    const cat = CATEGORY_MAP[activeTask.category] || CATEGORY_MAP.focus;
    tagsRow.innerHTML = `
      <span class="badge ${cat.class}">${cat.icon} ${cat.label}</span>
      <span class="badge cat-focus">⏱ ${activeTask.duration} mins</span>
      ${activeTask.completed ? '<span class="badge cat-routine">✓ Completed</span>' : ''}
    `;

    // Toggle button text
    const completeBtn = document.getElementById('btnCompleteNow');
    if (activeTask.completed) {
      completeBtn.innerHTML = `
        <svg class="icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>
        <span>Completed</span>
      `;
      completeBtn.style.opacity = '0.7';
    } else {
      completeBtn.innerHTML = `
        <svg class="icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>
        <span>Done</span>
      `;
      completeBtn.style.opacity = '1';
    }

  } else if (nextTask) {
    // No active task this very second, but an upcoming task is scheduled
    highlightActiveTimelineCard(null);
    breathingWidget.classList.add('hidden');
    actionsRow.classList.add('hidden');
    if (alignNowWrap) alignNowWrap.classList.remove('hidden');

    const nextStartM = timeStringToMinutes(nextTask.startTime);
    const diffMins = nextStartM - nowMins;

    statusLabel.textContent = 'COMING UP NEXT';
    statusPill.className = 'now-status-pill free-status';
    timeRange.textContent = `Starts at ${nextTask.startTime}`;
    titleEl.textContent = nextTask.title;
    subtitleEl.textContent = `Begins in about ${diffMins} minutes. Take this time to hydrate and prepare calmly.`;

    const cat = CATEGORY_MAP[nextTask.category] || CATEGORY_MAP.focus;
    tagsRow.innerHTML = `
      <span class="badge ${cat.class}">${cat.icon} ${cat.label}</span>
      <span class="badge cat-focus">⏱ ${nextTask.duration} mins</span>
    `;

  } else {
    // All scheduled tasks for today have concluded or are in the past
    highlightActiveTimelineCard(null);
    breathingWidget.classList.add('hidden');
    actionsRow.classList.add('hidden');
    if (alignNowWrap) alignNowWrap.classList.remove('hidden');

    statusLabel.textContent = 'DAY COMPLETE';
    statusPill.className = 'now-status-pill free-status';
    timeRange.textContent = 'Evening Rest';
    titleEl.textContent = 'All planned tasks are complete!';
    subtitleEl.textContent = 'Great work today. Relax and restore your energy for tomorrow.';
    tagsRow.innerHTML = `<span class="badge cat-routine">✨ Well done</span>`;
  }
}

function highlightActiveTimelineCard(activeId) {
  document.querySelectorAll('.timeline-item').forEach(card => {
    if (activeId && card.dataset.id === activeId) {
      card.classList.add('active-now');
    } else {
      card.classList.remove('active-now');
    }
  });
}

// ==========================================
// Quick Actions from the "NOW" Hero Card
// ==========================================
function completeCurrentTask() {
  const now = new Date();
  const nowMins = (now.getHours() * 60) + now.getMinutes();

  const current = tasks.find(t => {
    if (!t.startTime || !t.endTime) return false;
    const s = timeStringToMinutes(t.startTime);
    const e = timeStringToMinutes(t.endTime);
    return isTimeInBlock(nowMins, s, e);
  });

  if (current) {
    current.completed = !current.completed;
    saveData();
    renderAll();
    if (current.completed) {
      playZenChime('complete');
      showToast(`✨ Completed "${current.title}"!`);
    }
  } else {
    showToast('No active task to mark complete');
  }
}

function insertInstantPause() {
  const now = new Date();
  const nowMins = (now.getHours() * 60) + now.getMinutes();

  const pauseTask = {
    id: 'instant_pause_' + Date.now(),
    title: '5-Minute Mindful Breathing',
    duration: 5,
    category: 'break',
    priority: 'high',
    notes: 'Inhale clarity, exhale tension.',
    completed: false,
    isBreak: true,
    isAutoBreak: false,
    startTime: minutesToTimeString(nowMins),
    endTime: minutesToTimeString(nowMins + 5)
  };

  // Insert right at current position and adjust following tasks
  tasks.push(pauseTask);
  distributeScheduleWithBreaks();
  showToast('☕ Added a 5-minute pause right now');
  playZenChime('bell');
}

function skipToNextItem() {
  const now = new Date();
  const nowMins = (now.getHours() * 60) + now.getMinutes();

  const currentIdx = tasks.findIndex(t => {
    if (!t.startTime || !t.endTime) return false;
    const s = timeStringToMinutes(t.startTime);
    const e = timeStringToMinutes(t.endTime);
    return isTimeInBlock(nowMins, s, e);
  });

  if (currentIdx !== -1 && currentIdx < tasks.length - 1) {
    const current = tasks[currentIdx];
    current.completed = true;
    showToast(`Jumped to next block: ${tasks[currentIdx + 1].title}`);
    distributeScheduleWithBreaks();
  } else {
    showToast('At the end of scheduled blocks');
  }
}

// ==========================================
// Render Timeline & Statistics
// ==========================================
function renderAll() {
  renderTimeline();
  updateStatistics();
  updateNowGuidance(new Date());
}

function renderTimeline() {
  const container = document.getElementById('timelineContainer');
  const emptyState = document.getElementById('emptyTimeline');
  const countIndicator = document.getElementById('timelineCountIndicator');

  // Filter tasks
  let filtered = [...tasks];
  if (currentFilter === 'pending') {
    filtered = filtered.filter(t => !t.completed && !t.isBreak);
  } else if (currentFilter === 'completed') {
    filtered = filtered.filter(t => t.completed);
  } else if (currentFilter === 'breaks') {
    filtered = filtered.filter(t => t.isBreak);
  }

  countIndicator.textContent = `${filtered.length} block${filtered.length === 1 ? '' : 's'}`;

  if (tasks.length === 0) {
    container.innerHTML = '';
    emptyState.classList.remove('hidden');
    return;
  }

  emptyState.classList.add('hidden');

  if (filtered.length === 0) {
    container.innerHTML = `
      <div style="text-align: center; padding: 2.5rem 1rem; color: var(--text-muted); font-size: 0.9rem;">
        No items matching the "${currentFilter}" filter.
      </div>
    `;
    return;
  }

  container.innerHTML = filtered.map(task => {
    const cat = CATEGORY_MAP[task.category] || CATEGORY_MAP.focus;
    const isCompleted = task.completed;
    const isBreak = task.isBreak;

    return `
      <div class="timeline-item ${isCompleted ? 'is-completed' : ''} ${isBreak ? 'is-break' : ''}" data-id="${task.id}">
        <!-- Left: Time Column -->
        <div class="item-time-col">
          <span class="item-time-start">${task.startTime || '--:--'}</span>
          <span class="item-time-end">to ${task.endTime || '--:--'}</span>
          <span class="item-duration-badge">${task.duration} min</span>
        </div>

        <!-- Center: Task Title & Meta -->
        <div class="item-content-col">
          <div class="item-header-line">
            <span class="badge ${cat.class}">${cat.icon} ${cat.label}</span>
            <span class="item-title" title="${escapeHtml(task.title)}">${escapeHtml(task.title)}</span>
          </div>
          ${task.notes ? `<span class="item-notes" title="${escapeHtml(task.notes)}">${escapeHtml(task.notes)}</span>` : ''}
        </div>

        <!-- Right: Checkbox & Actions -->
        <div class="item-actions-col">
          <button class="check-toggle-btn ${isCompleted ? 'checked' : ''}" 
                  onclick="toggleTaskComplete('${task.id}')" 
                  title="${isCompleted ? 'Mark uncompleted' : 'Mark completed'}"
                  aria-label="Toggle Complete">
            <svg class="icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
          </button>

          <button class="item-btn" onclick="editTask('${task.id}')" title="Edit task" aria-label="Edit Task">
            <svg class="icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
            </svg>
          </button>

          <button class="item-btn delete-btn" onclick="deleteTask('${task.id}')" title="Delete task" aria-label="Delete Task">
            <svg class="icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="3 6 5 6 21 6"></polyline>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
            </svg>
          </button>
        </div>
      </div>
    `;
  }).join('');
}

function updateStatistics() {
  const nonBreakTasks = tasks.filter(t => !t.isBreak);
  const completedTasks = nonBreakTasks.filter(t => t.completed);
  
  const totalCount = nonBreakTasks.length;
  const completedCount = completedTasks.length;

  document.getElementById('statCompletedCount').textContent = completedCount;
  document.getElementById('statTotalCount').textContent = `/ ${totalCount}`;

  // Calculate focus time vs break time
  let focusMinutes = 0;
  let breakMinutes = 0;

  tasks.forEach(t => {
    if (t.isBreak) {
      breakMinutes += t.duration;
    } else {
      focusMinutes += t.duration;
    }
  });

  const focusH = Math.floor(focusMinutes / 60);
  const focusM = focusMinutes % 60;
  document.getElementById('statFocusTime').textContent = `${focusH}h ${focusM}m`;

  const breakH = Math.floor(breakMinutes / 60);
  const breakM = breakMinutes % 60;
  document.getElementById('statBreakTime').textContent = `${breakH}h ${breakM}m`;

  // Harmony / Progress Score
  const score = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
  document.getElementById('statProgressScore').textContent = `${score}%`;
}

// ==========================================
// Sample Day Routine Generator
// ==========================================
function loadSampleRoutine(forcePrompt = false) {
  if (forcePrompt && tasks.length > 0) {
    if (!confirm('Replace your current schedule with an inspiring calm sample day?')) {
      return;
    }
  }

  // A realistic, harmonious day routine with focus, health, breaks & deep work
  tasks = [
    {
      id: 'demo_1',
      title: 'Morning Mindfulness & Hydration',
      duration: 20,
      category: 'routine',
      priority: 'high',
      notes: 'Gentle stretching, lemon water, set quiet intentions.',
      completed: true,
      isBreak: false
    },
    {
      id: 'demo_2',
      title: 'Deep Architecture & Core Design',
      duration: 60,
      category: 'focus',
      priority: 'high',
      notes: 'Focused deep work on core module design. No distractions.',
      completed: true,
      isBreak: false
    },
    {
      id: 'demo_3',
      title: 'Team Sync & Standup',
      duration: 30,
      category: 'social',
      priority: 'medium',
      notes: 'Review blockers and weekly goals with the team.',
      completed: false,
      isBreak: false
    },
    {
      id: 'demo_4',
      title: 'Implementation & Feature Build',
      duration: 75,
      category: 'focus',
      priority: 'high',
      notes: 'Writing clean code and testing edge cases.',
      completed: false,
      isBreak: false
    },
    {
      id: 'demo_5',
      title: 'Inbox Zero & Async Communication',
      duration: 30,
      category: 'routine',
      priority: 'medium',
      notes: 'Batch reply to emails and messages cleanly.',
      completed: false,
      isBreak: false
    },
    {
      id: 'demo_6',
      title: 'Outdoor Walk & Sunlight',
      duration: 35,
      category: 'health',
      priority: 'medium',
      notes: 'Clear the mental cache, breathe fresh air.',
      completed: false,
      isBreak: false
    },
    {
      id: 'demo_7',
      title: 'Creative Reading & Exploration',
      duration: 45,
      category: 'creative',
      priority: 'low',
      notes: 'Read design essays and explore new ideas.',
      completed: false,
      isBreak: false
    },
    {
      id: 'demo_8',
      title: 'Daily Review & Tomorrow Prep',
      duration: 20,
      category: 'routine',
      priority: 'medium',
      notes: 'Review what went well, set 3 priorities for tomorrow.',
      completed: false,
      isBreak: false
    }
  ];

  distributeScheduleWithBreaks();
  showToast('🌟 Sample day routine loaded with mindful balance!');
  playZenChime('bell');
}

// ==========================================
// Utilities & Helper Functions
// ==========================================
function timeStringToMinutes(timeStr) {
  if (!timeStr) return 0;
  const [h, m] = timeStr.split(':').map(Number);
  return (h * 60) + (m || 0);
}

function minutesToTimeString(minutes) {
  const norm = ((minutes % 1440) + 1440) % 1440;
  const h = String(Math.floor(norm / 60)).padStart(2, '0');
  const m = String(norm % 60).padStart(2, '0');
  return `${h}:${m}`;
}

function escapeHtml(str) {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

let toastTimeout = null;
function showToast(message) {
  const toast = document.getElementById('toastNotification');
  const msgEl = document.getElementById('toastMessage');
  msgEl.textContent = message;
  toast.classList.remove('hidden');

  if (toastTimeout) clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => {
    toast.classList.add('hidden');
  }, 2800);
}

// Expose functions globally for inline onclick handlers
window.toggleTaskComplete = toggleTaskComplete;
window.editTask = editTask;
window.deleteTask = deleteTask;
