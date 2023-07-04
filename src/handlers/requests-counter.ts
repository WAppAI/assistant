import KeyvSqlite from "@keyv/sqlite";
import Keyv from "keyv";

// Part of the logic to count the requests used
const counterCache = new Keyv({
  store: new KeyvSqlite({ uri: "sqlite://./counter_cache.sqlite" }),
});

export let messageCounter = 0;
let lastResetDate = new Date();

export async function loadCounterData() {
  try {
    const counterData = await counterCache.get("counterData");
    if (counterData) {
      messageCounter = counterData.counter;
      lastResetDate = new Date(counterData.lastReset);
    }
  } catch (error) {
    console.log("Failed to load counter data:", error);
  }
}

export async function saveCounterData() {
  try {
    await counterCache.set("counterData", {
      counter: messageCounter,
      lastReset: lastResetDate.toISOString(),
    });
  } catch (error) {
    console.log("Failed to save counter data:", error);
  }
}

export function resetCounter() {
  messageCounter = 0;
  lastResetDate = new Date();
  saveCounterData();
}

export function has24HoursPassed() {
  const currentDate = new Date();
  const timeDiff = currentDate.getTime() - lastResetDate.getTime();
  const hoursPassed = timeDiff / (1000 * 3600);
  return hoursPassed >= 24;
}

export function increaseCounter() {
  messageCounter++;
}

export async function counterRequests() {
  // Load counter data from the cache
  await loadCounterData();

  // Check if 24 hours have passed since the last reset
  if (has24HoursPassed()) {
    resetCounter();
  }

  // Increment the counter
  increaseCounter();

  // Rest of the code...

  // Save counter data after each handled message
  await saveCounterData();
}
