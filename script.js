class Robot {
    constructor(isBlueAlliance, id) {
        this.isBlueAlliance = isBlueAlliance;
        this.id = id;

        let allInputs = document.querySelectorAll("input");
        for (let i of allInputs) {
            let idParts = i.id.split("-");
            if (idParts[0] === "nonrobot") continue;
            if ((idParts[0] === "blue") !== isBlueAlliance) continue;
            if (idParts[1] !== id.toString()) continue;
            this[idParts[2]] = i.value;
        }
    }
}

function numNotesAtTime(time, cycleTimes) {
    return cycleTimes.map(x => x ? Math.floor(time / x) : 0).reduce((a, b) => a + b);
}

function timeUnitsForNotes(numNotes, cycleTimes) {
    let upperBound = numNotes * Math.min(...cycleTimes);
    for (let time = upperBound; time >= 0; time--) {
        if (numNotesAtTime(time, cycleTimes) < numNotes) return time + 1;
    }
    throw new RangeError("Should not happen - if this does, something has gone horribly wrong.");
}

function getRobots() {
    return [true, false].flatMap(x => [0, 1, 2].map(y => new Robot(x, y)));
}