let startDate;
try {
  const saved = localStorage.getItem("startDate");
  startDate = saved ? new Date(saved) : new Date(2026, 7, 16, 14, 40, 0);
} catch (e) {
  startDate = new Date(2026, 7, 16, 14, 40, 0);
}

const monthNames = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

function updateTimer() {
  const now = new Date();
  const diffMs = now - startDate;
  const totalMinutes = Math.floor(diffMs / 60000);
  const days = Math.floor(totalMinutes / (24 * 60));
  const hours = Math.floor((totalMinutes % (24 * 60)) / 60);
  const minutes = Math.floor(totalMinutes % 60);
  const seconds = Math.floor((diffMs % 60000) / 1000);
  const message = `${days} days, ${hours} hours, ${minutes} minutes, ${seconds} seconds`;

  if (typeof document !== "undefined") {
    const outputElement = document.getElementById("output");
    outputElement && (outputElement.textContent = message);
  }
}

function applySystemTheme() {
  const mediaQuery = window.matchMedia("(prefers-color-scheme: light)");
  const isLightTheme = mediaQuery.matches;

  document.body.classList.toggle("light-theme", isLightTheme);
  document.documentElement.style.colorScheme = isLightTheme ? "light" : "dark";
}

function setupSystemThemeListener() {
  applySystemTheme();

  const mediaQuery = window.matchMedia("(prefers-color-scheme: light)");
  mediaQuery.addEventListener("change", applySystemTheme);
}

function getDaysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate();
}

function getMaxDate() {
  const today = new Date();
  return new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate(),
    23,
    59,
    59,
  );
}

function saveStartDate() {
  try {
    localStorage.setItem("startDate", startDate.toISOString());
  } catch (e) {
    // ignore storage errors (e.g., privacy mode)
  }
}

function getSelectElements(field) {
  return {
    trigger: document.getElementById(`${field}Select`),
    options: document.getElementById(`${field}SelectOptions`),
  };
}

function closeAllCustomSelects() {
  document.querySelectorAll(".custom-select.is-open").forEach((select) => {
    select.classList.remove("is-open");
    const trigger = select.querySelector(".custom-select__trigger");
    trigger && trigger.setAttribute("aria-expanded", "false");
  });
}

function renderCustomOptions(field, items, selectedValue) {
  const { trigger, options } = getSelectElements(field);
  if (!trigger || !options) return;

  const selectedItem =
    items.find((item) => item.value === selectedValue) || items[0];
  options.innerHTML = "";

  items.forEach((item) => {
    const optionButton = document.createElement("button");
    optionButton.type = "button";
    optionButton.className = "custom-select__option";
    optionButton.textContent = item.label;
    optionButton.dataset.value = item.value;
    if (item.disabled) {
      optionButton.disabled = true;
    }
    if (selectedItem && item.value === selectedItem.value) {
      optionButton.classList.add("is-selected");
    }
    optionButton.addEventListener("click", () => {
      trigger.dataset.value = item.value;
      trigger.textContent = item.label;
      closeAllCustomSelects();
      updateStartDateFromPicker();
    });
    options.appendChild(optionButton);
  });

  if (selectedItem) {
    trigger.dataset.value = selectedItem.value;
    trigger.textContent = selectedItem.label;
  }
}

function populateDays(year, month, selectedDay = 1) {
  const maxDate = getMaxDate();
  const dayCount = getDaysInMonth(year, month);
  const isCurrentMonth =
    year === maxDate.getFullYear() && month === maxDate.getMonth();
  const maxDay = isCurrentMonth ? maxDate.getDate() : dayCount;
  const safeSelectedDay = Math.min(Number(selectedDay || 1), maxDay);
  const items = [];

  for (let day = 1; day <= dayCount; day += 1) {
    items.push({
      value: String(day),
      label: String(day),
      disabled: day > maxDay,
    });
  }

  renderCustomOptions("day", items, String(safeSelectedDay));
}

function populateTimeSelectors(
  year,
  month,
  day,
  selectedHour = 0,
  selectedMinute = 0,
) {
  const maxDate = getMaxDate();
  const isToday =
    year === maxDate.getFullYear() &&
    month === maxDate.getMonth() &&
    day === maxDate.getDate();
  const maxHour = isToday ? maxDate.getHours() : 23;
  const safeHour = Math.min(Number(selectedHour || 0), maxHour);
  const maxMinute =
    isToday && safeHour === maxDate.getHours() ? maxDate.getMinutes() : 59;
  const safeMinute = Math.min(Number(selectedMinute || 0), maxMinute);

  const hourItems = [];
  for (let hour = 0; hour < 24; hour += 1) {
    hourItems.push({
      value: String(hour),
      label: String(hour).padStart(2, "0"),
      disabled: isToday && hour > maxHour,
    });
  }
  renderCustomOptions("hour", hourItems, String(safeHour));

  const minuteItems = [];
  for (let minute = 0; minute < 60; minute += 1) {
    minuteItems.push({
      value: String(minute),
      label: String(minute).padStart(2, "0"),
      disabled:
        isToday && safeHour === maxDate.getHours() && minute > maxMinute,
    });
  }
  renderCustomOptions("minute", minuteItems, String(safeMinute));
}

function populateDatePicker() {
  const maxDate = getMaxDate();
  const safeStartDate = startDate > maxDate ? maxDate : startDate;
  startDate = safeStartDate;
  saveStartDate();

  const yearItems = [];
  for (let year = 2000; year <= maxDate.getFullYear(); year += 1) {
    yearItems.push({
      value: String(year),
      label: String(year),
    });
  }
  renderCustomOptions("year", yearItems, String(safeStartDate.getFullYear()));

  const monthItems = [];
  monthNames.forEach((name, index) => {
    monthItems.push({
      value: String(index),
      label: name,
      disabled:
        safeStartDate.getFullYear() === maxDate.getFullYear() &&
        index > maxDate.getMonth(),
    });
  });
  renderCustomOptions("month", monthItems, String(safeStartDate.getMonth()));

  populateDays(
    safeStartDate.getFullYear(),
    safeStartDate.getMonth(),
    safeStartDate.getDate(),
  );
  populateTimeSelectors(
    safeStartDate.getFullYear(),
    safeStartDate.getMonth(),
    safeStartDate.getDate(),
    safeStartDate.getHours(),
    safeStartDate.getMinutes(),
  );
}

function updateStartDateFromPicker() {
  const year = Number(
    document.getElementById("yearSelect")?.dataset.value || 0,
  );
  const month = Number(
    document.getElementById("monthSelect")?.dataset.value || 0,
  );
  const day = Number(document.getElementById("daySelect")?.dataset.value || 1);
  const hour = Number(
    document.getElementById("hourSelect")?.dataset.value || 0,
  );
  const minute = Number(
    document.getElementById("minuteSelect")?.dataset.value || 0,
  );
  const safeDay = Math.min(day, getDaysInMonth(year, month));
  const maxDate = getMaxDate();
  const selectedDate = new Date(year, month, safeDay, hour, minute, 0);
  const finalDate = selectedDate > maxDate ? maxDate : selectedDate;

  startDate = finalDate;
  saveStartDate();
  populateDatePicker();
  updateTimer();
}

function setupDatePicker() {
  populateDatePicker();

  document.querySelectorAll(".custom-select__trigger").forEach((trigger) => {
    trigger.addEventListener("click", (event) => {
      event.stopPropagation();
      const customSelect = trigger.closest(".custom-select");
      if (!customSelect) return;

      closeAllCustomSelects();
      customSelect.classList.add("is-open");
      trigger.setAttribute("aria-expanded", "true");
    });
  });

  document.addEventListener("click", (event) => {
    if (!event.target.closest(".custom-select")) {
      closeAllCustomSelects();
    }
  });
}

setupSystemThemeListener();
setupDatePicker();
updateTimer();
setInterval(updateTimer, 1000);
