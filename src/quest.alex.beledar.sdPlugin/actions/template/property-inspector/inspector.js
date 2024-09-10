/// <reference path="../../../libs/js/property-inspector.js" />
/// <reference path="../../../libs/js/utils.js" />

$PI.onConnected(({actionInfo, appInfo, connection, messageType, port, uuid}) => {
    const {payload} = actionInfo;
    const {settings} = payload;

    // Preload settings if they exist
    if (settings && settings.region) {
        document.getElementById('regionSelector').value = settings.region;
    }

    // When settings change, update the form and save the new settings
    document.getElementById('regionSelector').addEventListener('change', (event) => {
        const selectedRegion = event.target.value;
        saveSettings({ region: selectedRegion });
    });
});

function saveSettings(settings) {
    // Send updated settings back to Stream Deck
    $PI.setSettings(settings);
}
