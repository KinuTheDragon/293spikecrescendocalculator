class Robot {
    constructor(isBlueAlliance, id) {
        this.isBlueAlliance = isBlueAlliance;
        this.id = id;
        this.isValid = true;

        let allInputs = document.querySelectorAll("input");
        for (let i of allInputs) {
            if (this.disabled) break;
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

let scoutingData = null;
function updateScoutingData() {
    let file = document.getElementById("scouting").files[0];
    if (!file) return;
    let reader = new FileReader();
    reader.readAsText(file, "UTF-8");
    reader.onload = () => {
        let lines = reader.result.replaceAll("\r", "").split("\n").map(x => x.split(","));
        scoutingData = [];
        for (let line of lines.slice(1)) {
            let obj = {};
            for (let i = 0; i < line.length; i++) {
                let rawValue = line[i];
                let value = rawValue;
                if (/^\d+$/g.test(rawValue)) value = +rawValue;
                else if (rawValue === "TRUE" || rawValue === "FALSE") value = rawValue === "TRUE";
                obj[lines[0][i]] = value;
            }
            scoutingData.push(rawCsvToCleaned(obj));
        }
    }
}

// CHANGE THIS WHEN THE CSV FORMAT CHANGES
function rawCsvToCleaned(obj) {
    return {
        canClimb: obj["Can climb?"],
        canScoreAmp: obj["Can score amp?"],
        canScoreSpeaker: obj["Can score speaker?"],
        canScoreTrap: obj["Can score trap?"],
        canShootTrap: obj["Can shoot trap?"],
        cycleTime: obj["Cycle time (seconds)"],
        shootTime: obj["Shoot time (seconds)"],
        teamNumber: obj["Team number"]
    };
}

let timeouts = {};
function loadFromTeamNumber(prefix) {
    clearTimeout(timeouts[prefix]);
    document.getElementById(`${prefix}-loader`).classList.remove("badload");
    document.getElementById(`${prefix}-loader`).innerText = "Load from team number";
    let teamNumber = document.getElementById(`${prefix}-teamNumber`).value;
    for (let item of scoutingData ?? []) {
        if (item.teamNumber.toString() === teamNumber) {
            for (let k of Object.keys(item)) {
                let input = document.getElementById(`${prefix}-${k}`);
                let value = item[k];
                if (input.type === "checkbox") input.checked = value;
                else input.value = value;
            }
            updateOutputs();
            return;
        }
    }
    document.getElementById(`${prefix}-loader`).classList.add("badload");
    document.getElementById(`${prefix}-loader`).innerText = "Invalid team!";
    timeouts[prefix] = setTimeout(() => {
        document.getElementById(`${prefix}-loader`).classList.remove("badload");
        document.getElementById(`${prefix}-loader`).innerText = "Load from team number";
    }, 500);
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
    let alliance = getAlliance(isBlueAlliance).filter(robot => !robot.disabled);
    if (!alliance.every(x => x.isValid)) return null;
    let cycleTimes = alliance.map(x => x.cycleTime);
    return numNotesAtTime(time, cycleTimes);
}

function getAllianceTimeUnitsForNotes(isBlueAlliance, numNotes) {
    let alliance = getAlliance(isBlueAlliance).filter(robot => !robot.disabled);
    if (!alliance.every(x => x.isValid)) return null;
    let cycleTimes = alliance.map(x => x.cycleTime);
    return timeUnitsForNotes(numNotes, cycleTimes);
}

function getAllianceScoreTime(isBlueAlliance) {
    let alliance = getAlliance(isBlueAlliance).filter(robot => !robot.disabled);
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

document.querySelectorAll(".disabler").forEach(i => i.addEventListener("input", e => {
    let prefix = i.id.split("-").slice(0, -1).join("-") + "-";
    document.querySelectorAll("input").forEach(ii => {
        if (ii.id.startsWith(prefix) && ii !== i) ii.disabled = i.checked;
    });
}));