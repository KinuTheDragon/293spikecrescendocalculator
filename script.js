class Robot {
    constructor(isBlueAlliance, id) {
        this.isBlueAlliance = isBlueAlliance;
        this.id = id;
        this.isValid = true;

        let allInputs = document.querySelectorAll("input");
        for (let i of allInputs) {
            let idParts = i.id.split("-");
            if (idParts[0] === "nonrobot") continue;
            if ((idParts[0] === "blue") !== isBlueAlliance) continue;
            if (idParts[1] !== id.toString()) continue;
            let setKey = value => {this[idParts[2]] = value;};
            switch (i.type) {
                case "number":
                    setKey(i.valueAsNumber);
                    if (isNaN(i.valueAsNumber)) this.isValid = false;
                    if (i.valueAsNumber <= 0 && i.getAttribute("pos") !== null) this.isValid = false;
                    if (i.valueAsNumber !== Math.floor(i.valueAsNumber) && i.getAttribute("int") !== null) this.isValid = false;
                    break;
                case "checkbox":
                    setKey(i.checked);
                    break;
                default:
                    setKey(i.value);
                    break;
            }
        }
    }
}

function numNotesAtTime(time, cycleTimes) {
    return cycleTimes.map(x => x ? Math.floor(time / x) : 0).reduce((a, b) => a + b, 0);
}

function timeUnitsForNotes(numNotes, cycleTimes) {
    if (numNotes <= 0) return 0;
    let upperBound = numNotes * Math.min(...cycleTimes);
    for (let time = upperBound; time >= 0; time--) {
        if (numNotesAtTime(time, cycleTimes) < numNotes) return time + 1;
    }
    throw new RangeError("Should not happen - if this does, something has gone horribly wrong.");
}

function getAlliance(isBlueAlliance) {
    return [0, 1, 2].map(x => new Robot(isBlueAlliance, x));
}

function getRobots() {
    return getAlliance(true).concat(getAlliance(false));
}

function getAllianceNotesAtTime(isBlueAlliance, time) {
    let alliance = getAlliance(isBlueAlliance);
    if (!alliance.every(x => x.isValid)) return null;
    let cycleTimes = alliance.map(x => x.cycleTime);
    return numNotesAtTime(time, cycleTimes);
}

function getAllianceTimeUnitsForNotes(isBlueAlliance, numNotes) {
    let alliance = getAlliance(isBlueAlliance);
    if (!alliance.every(x => x.isValid)) return null;
    let cycleTimes = alliance.map(x => x.cycleTime);
    return timeUnitsForNotes(numNotes, cycleTimes);
}

function getAllianceScoreTime(isBlueAlliance) {
    let alliance = getAlliance(isBlueAlliance);
    if (!alliance.every(x => x.isValid)) return null;
    let shootTimes = alliance.filter(x => x.canScoreSpeaker).map(x => x.shootTime);
    return timeUnitsForNotes(4, shootTimes);
}

function updateOutputs() {
    let robotDivs = [...document.querySelectorAll(".robot:not(.hidden)")];
    robotDivs.forEach(x => {x.classList.remove("error");});
    let robots = getRobots();
    for (let i = 0; i < 6; i++) {
        if (!robots[i].isValid) robotDivs[i].classList.add("error");
    }
    for (let isBlueAlliance of [true, false]) {
        let color = isBlueAlliance ? "blue" : "red";
        let numNotes = document.getElementById(`${color}-gatherNotes`).valueAsNumber;
        let timeUnits = isNaN(numNotes) ? null : getAllianceTimeUnitsForNotes(isBlueAlliance, numNotes);
        document.getElementById(`${color}-noteGatherTime`).innerText = timeUnits ?? "Unknown";
        document.getElementById(`${color}-endgameNotes`).innerText = getAllianceNotesAtTime(isBlueAlliance, 115) ?? "Unknown";
        let speakerScoreTime = getAllianceScoreTime(isBlueAlliance);
        let speakerScoreText;
        if (speakerScoreTime === null) speakerScoreText = "Unknown";
        else if (speakerScoreTime === Infinity) speakerScoreText = "No robots can score in speaker";
        else if (speakerScoreTime <= 10) speakerScoreText = speakerScoreTime + " (Can score all 4)";
        else speakerScoreText = speakerScoreTime + " (Cannot score all 4)";
        document.getElementById(`${color}-speakerScoreTime`).innerText = speakerScoreText;
    }
}
updateOutputs();

document.querySelectorAll("input").forEach(i => i.addEventListener("input", updateOutputs));