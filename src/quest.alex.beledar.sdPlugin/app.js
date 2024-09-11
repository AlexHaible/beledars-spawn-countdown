/// <reference path="libs/js/action.js" />
/// <reference path="libs/js/stream-deck.js" />

const timerAction = new Action('quest.alex.beledar.timer');
let updateInterval = null;
let timerActionContext = null;

const times = {
    EU: ["01:00", "04:00", "07:00", "10:00", "13:00", "16:00", "19:00", "22:00"],
    NA: ["00:00", "03:00", "06:00", "09:00", "12:00", "15:00", "18:00", "21:00"]
};

/**
 * When the action appears, request the settings and start countdown.
 */
timerAction.onWillAppear(({ context }) => {
    //console.log("Context", context);
    timerActionContext = context;
    $SD.getSettings(context);
});

/**
 * Handle settings and start the countdown based on the region.
 */
timerAction.onDidReceiveSettings(({ payload }) => {
    //console.log("Payload", payload);
    const region = (payload.settings && payload.settings.region) || 'EU'; // Default to EU
    startCountdown(times[region]);
});

/**
 * Start and update the countdown for the closest event time.
 */
function startCountdown(timeList) {
    clearInterval(updateInterval); // Clear any existing countdown

    const closestTime = timeList
        .map(time => {
            const [hours, minutes] = time.split(':');
            const eventTime = new Date();
            eventTime.setHours(hours, minutes, 0);
            return eventTime > new Date() ? eventTime : null;
        })
        .filter(Boolean)
        .sort((a, b) => a - b)[0]; // Get the closest future time

        //console.log("Closest time", closestTime);

    if (!closestTime) return; // No valid time

    const updateCountdown = () => {
        const timeDiff = closestTime - new Date();
        //console.log("Time diff", timeDiff);

        if (timeDiff <= 0) {
            $SD.setTitle(timerActionContext, "Event\nStarted");
            setTimeout(() => startCountdown(timeList), 10000); // Restart after 10 seconds
            clearInterval(updateInterval);
        } else {
            const title = timeDiff > 60000 
                ? `${Math.floor(timeDiff / 60000)}\nmin`
                : `${Math.floor(timeDiff / 1000)}\nsec`;
            //console.log("Title", title);
            $SD.setTitle(timerActionContext, title);
        }
    };

    updateCountdown();
    updateInterval = setInterval(updateCountdown, closestTime - new Date() > 60000 ? 60000 : 1000);
}
