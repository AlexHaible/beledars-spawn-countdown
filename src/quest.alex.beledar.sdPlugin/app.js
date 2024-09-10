/// <reference path="libs/js/action.js" />
/// <reference path="libs/js/stream-deck.js" />

const timerAction = new Action('quest.alex.beledar.timer');
let timerActionContext = null;

// Define times for NA and EU regions
const timesEU = ["01:00", "04:00", "07:00", "10:00", "13:00", "16:00", "19:00", "22:00"];
const timesNA = ["00:00", "03:00", "06:00", "09:00", "12:00", "15:00", "18:00", "21:00"];

/**
 * When the action first appears, request the settings.
 */
timerAction.onWillAppear(({ action, context, device, event, payload }) => {
    console.log('Action appeared:', action);
    console.log('Context:', context);
    console.log('Device:', device);
    console.log('Event:', event);
    console.log('Payload:', payload);

    timerActionContext = context;

    // Request settings for this specific action instance
    $SD.getSettings(context); // Use the correct context from the willAppear event
});

/**
 * Handle settings received after requesting via getSettings or updating via property inspector.
 */
timerAction.onDidReceiveSettings((jsonObj) => {
    if (!jsonObj || !jsonObj.payload) {
        console.error('jsonObj or jsonObj.payload is missing:', jsonObj);
        return; // Exit if payload is missing
    }

    const settings = jsonObj.payload.settings;

    if (settings && settings.region) {
        console.log(`Region set to: ${settings.region}`);
        startCountdown(settings.region);
    } else {
        console.log('No region found in settings, defaulting to EU');
        startCountdown('EU'); // Default to EU if no settings exist
    }
});

/**
 * Optional: Handle key up event if needed.
 */
timerAction.onKeyUp(({ action, context, device, event, payload }) => {
    console.log('Key Pressed!');
});

/**
 * Function to start the countdown based on the region.
 */
function startCountdown(region) {
    console.log(`Starting countdown for region: ${region}`);

    // Choose times based on region
    const timeList = (region === 'NA') ? timesNA : timesEU;
    const closestTime = getClosestTime(timeList);

    // Handle updating the countdown
    handleCountdown(closestTime);
}

/**
 * Find the closest upcoming time from the list of times.
 */
function getClosestTime(timeList) {
    const now = new Date();
    let closestTime = null;
    let minDiff = Infinity;

    timeList.forEach(time => {
        const [hours, minutes] = time.split(':');
        const eventTime = new Date();
        eventTime.setHours(hours);
        eventTime.setMinutes(minutes);
        eventTime.setSeconds(0);

        const diff = eventTime - now;
        if (diff > 0 && diff < minDiff) {
            minDiff = diff;
            closestTime = eventTime;
        }
    });

    return closestTime;
}

/**
 * Countdown logic to update the title of the button.
 */
function handleCountdown(closestTime) {
    let updateInterval;
    let context = timerActionContext;

    function updateCountdown() {
        const now = new Date();
        const timeDiff = closestTime - now;

        if (timeDiff <= 0) {
            // Countdown is finished
            clearInterval(updateInterval);
            $SD.setTitle(context, "Event\nStarted");
            sleep(10000).then(() => { // Wait 10 seconds before restarting
                updateInterval = setInterval(updateCountdown, 60 * 1000); // Update every minute
                updateCountdown(); // Restart countdown
            });
            return;
        }

        if (timeDiff > 60 * 1000) {
            // More than 1 minute remaining, update every minute
            $SD.setTitle(context, `${Math.floor(timeDiff / (60 * 1000))}`);
        } else {
            // Less than 1 minute, update every second
            $SD.setTitle(context, `${Math.floor(timeDiff / 1000)}`);
        }
    }

    // Initial update
    updateCountdown();

    // Update every minute if more than 1 minute is left, otherwise every second
    if (closestTime - new Date() > 60 * 1000) {
        updateInterval = setInterval(updateCountdown, 60 * 1000); // Update every minute
    } else {
        updateInterval = setInterval(updateCountdown, 1000); // Update every second
    }
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
