class Robot {
    constructor(isBlueAlliance, id) {
        this.isBlueAlliance = isBlueAlliance;
        this.id = id;
        this.isValid = true;
        this.errors = [];

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
                    if (!i.checkValidity() || isNaN(i.valueAsNumber)) {
                        this.isValid = false;
                        this.errors.push(i);
                    }
                    break;
                case "checkbox":
                    setKey(i.checked);
                    break;
                default:
                    setKey(i.value);
                    break;
            }
        }
        if (this.canScoreTrap && !this.canClimb) {
            this.isValid = false;
            this.errors.push(document.getElementById(`${isBlueAlliance ? "blue" : "red"}-${id}-canScoreTrap`));
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
            scoutingData.push(rawCsvToCleaned(obj, lines[0]));
        }
    }
}

// CHANGE THIS WHEN THE CSV FORMAT CHANGES
function rawCsvToCleaned(obj, headers) {
    return {
        teamNumber: obj[headers[0]],
        cycleTime: obj[headers[1]],
        shootTime: obj[headers[2]],
        ampTime: obj[headers[3]],
        canScoreAmp: obj[headers[4]],
        canScoreSpeaker: obj[headers[5]],
        canClimb: obj[headers[6]],
        canScoreTrap: obj[headers[7]],
        canShootTrap: obj[headers[8]]
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
    for (let time = upperBound * 10; time >= 0; time--) {
        if (numNotesAtTime(time / 10, cycleTimes) < numNotes) return (time + 1) / 10;
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

function getAllianceSpeakerScoreTime(isBlueAlliance) {
    let alliance = getAlliance(isBlueAlliance).filter(robot => !robot.disabled);
    if (!alliance.every(x => x.isValid)) return null;
    let shootTimes = alliance.filter(x => x.canScoreSpeaker).map(x => x.shootTime);
    return timeUnitsForNotes(4, shootTimes);
}

function getAllianceSpeakerNotes(isBlueAlliance) {
    let alliance = getAlliance(isBlueAlliance).filter(robot => !robot.disabled);
    if (!alliance.every(x => x.isValid)) return null;
    let shootTimes = alliance.filter(x => x.canScoreSpeaker).map(x => x.shootTime);
    return Math.min(4, numNotesAtTime(10, shootTimes));
}

function getAllianceAmpScoreTime(isBlueAlliance) {
    let alliance = getAlliance(isBlueAlliance).filter(robot => !robot.disabled);
    if (!alliance.every(x => x.isValid)) return null;
    let shootTimes = alliance.filter(x => x.canScoreAmp).map(x => x.ampTime);
    return timeUnitsForNotes(2, shootTimes);
}

function getAllianceBonusPoints(isBlueAlliance, timeLeft) {
    let alliance = getAlliance(isBlueAlliance).filter(robot => !robot.disabled);
    if (!alliance.every(x => x.isValid)) return null;
    return numNotesAtTime(timeLeft, alliance.filter(x => x.canScoreSpeaker).map(x => x.cycleTime + x.shootTime)) * 2 +
           numNotesAtTime(timeLeft, alliance.filter(x => !x.canScoreSpeaker && x.canScoreAmp).map(x => x.cycleTime + x.ampTime)) * 1;
}

function updateOutputs() {
    let robotDivs = [...document.querySelectorAll(".robot:not(.hidden)")];
    document.querySelectorAll(".error").forEach(x => {x.classList.remove("error");});
    let robots = getRobots();
    for (let i = 0; i < 6; i++) {
        if (!robots[i].isValid) robotDivs[i].classList.add("error");
        for (let error of robots[i].errors) {
            error.classList.add("error");
            let anim = error.getAnimations()[0];
            if (anim) anim.currentTime = 0;
        }
        let anim = robotDivs[i].getAnimations()[0];
        if (anim) anim.currentTime = 0;
    }
    for (let isBlueAlliance of [true, false]) {
        let color = isBlueAlliance ? "blue" : "red";
        let numNotes = document.getElementById(`${color}-gatherNotes`).valueAsNumber;
        let noteGatherTime = isNaN(numNotes) ? null : getAllianceTimeUnitsForNotes(isBlueAlliance, numNotes);
        document.getElementById(`${color}-noteGatherTime`).innerText = noteGatherTime ?? "Unknown";
        document.getElementById(`${color}-endgameNotes`).innerText = getAllianceNotesAtTime(isBlueAlliance, 115) ?? "Unknown";
        let speakerScoreTime = getAllianceSpeakerScoreTime(isBlueAlliance);
        let speakerScoreText;
        let speakerScoreCountText = null;
        if (speakerScoreTime === null) speakerScoreText = speakerScoreCountText = "Unknown";
        else if (speakerScoreTime === Infinity) speakerScoreText = speakerScoreCountText = "No robots can score in speaker";
        else if (speakerScoreTime <= 10) speakerScoreText = speakerScoreTime + " (Can score all 4)";
        else speakerScoreText = speakerScoreTime + " (Cannot score all 4)";
        document.getElementById(`${color}-speakerScoreTime`).innerText = speakerScoreText;
        let speakerNotes = getAllianceSpeakerNotes(isBlueAlliance);
        document.getElementById(`${color}-speakerScoreCount`).innerText = speakerScoreCountText ?? speakerNotes;
        let ampScoreTime = getAllianceAmpScoreTime(isBlueAlliance);
        let ampScoreText;
        if (ampScoreTime === null) ampScoreText = "Unknown";
        else if (ampScoreTime === Infinity) ampScoreText = "No robots can score in amp";
        else ampScoreText = ampScoreTime;
        document.getElementById(`${color}-ampScoreTime`).innerText = ampScoreText;
        let supercycleNoteGatherTime = getAllianceTimeUnitsForNotes(isBlueAlliance, 6);
        let supercycleTime = supercycleNoteGatherTime && speakerScoreTime && ampScoreTime ? (supercycleNoteGatherTime + speakerScoreTime + ampScoreTime) : null;
        document.getElementById(`${color}-supercycleTime`).innerText = supercycleTime && isFinite(supercycleTime) ? supercycleTime : "Cannot perform supercycle";
        let pointsPerSupercycle =
            2 * 1 // amp
            + speakerNotes * 5 // speaker, amplified
            + (4 - speakerNotes) * 2; // speaker, not amplified
        document.getElementById(`${color}-pointsPerSupercycle`).innerText = supercycleTime ? pointsPerSupercycle : "Cannot perform supercycle";
        let numSupercycles = supercycleTime ? Math.floor(115 / supercycleTime) : null;
        document.getElementById(`${color}-numSupercycles`).innerText = numSupercycles ?? "Cannot perform supercycle";
        let remainingSeconds = supercycleTime && isFinite(supercycleTime) ? 115 - supercycleTime * numSupercycles : null;
        document.getElementById(`${color}-remainingSeconds`).innerText = remainingSeconds ?? "Cannot perform supercycle";
        let bonusPoints = supercycleTime && isFinite(supercycleTime) ? getAllianceBonusPoints(isBlueAlliance, remainingSeconds) : null;
        document.getElementById(`${color}-bonusPoints`).innerText = bonusPoints ?? "Cannot perform supercycle";
        let endgameScore = supercycleTime && isFinite(supercycleTime) ? numSupercycles * pointsPerSupercycle + bonusPoints : null;
        document.getElementById(`${color}-endgameScore`).innerText = endgameScore ?? "Cannot perform supercycle";
        let reachableTraps = !getAlliance(isBlueAlliance).every(x => x.isValid) ? null :
                                getAlliance(isBlueAlliance).filter(x => x.canShootTrap).length > 0 ? 3 :
                                getAlliance(isBlueAlliance).filter(x => x.canScoreTrap).length;
        document.getElementById(`${color}-reachableTraps`).innerText = reachableTraps ?? "Unknown";
        let potentialClimbers = getAlliance(isBlueAlliance).filter(x => x.canClimb);
        let chainsRequired = Math.max(1, potentialClimbers.filter(x => x.canScoreTrap && !x.canShootTrap).length);
        let harmonyPoints = !getAlliance(isBlueAlliance).every(x => x.isValid) ? null :
                            Math.max(0, potentialClimbers.length - chainsRequired) * 2;
        document.getElementById(`${color}-harmonyPoints`).innerText = harmonyPoints ?? "Unknown";
        document.getElementById(`${color}-finalPredictedScore`).innerText =
            endgameScore ? endgameScore + reachableTraps * 5 + harmonyPoints : "Unknown";
    }
}
updateOutputs();

document.querySelectorAll("input").forEach(i => i.addEventListener("input", updateOutputs));

document.querySelectorAll(".disabler").forEach(i => i.addEventListener("input", e => {
    let prefix = i.id.split("-").slice(0, -1).join("-") + "-";
    document.querySelectorAll("input").forEach(ii => {
        if (ii.id.startsWith(prefix) && ii !== i) ii.disabled = i.checked;
    });
    updateOutputs();
}));