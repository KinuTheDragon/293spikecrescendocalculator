function evalInContext(code, context) {
    return function() {
        with (this) {
            return eval(code);
        }
    }.call(context);
}

String.prototype.format = function(data) {
    return this.replaceAll(/\${([^}]+)}/g, (_, x) => evalInContext(x, data));
};

String.prototype.capitalize = function() {
    return this[0].toUpperCase() + this.slice(1).toLowerCase();
}

let templates = {};
while (true) {
    let template = document.querySelector(".template");
    if (!template) break;

    templates[template.id] = template.innerHTML;
    template.parentNode.removeChild(template);

    if (template.id === "summary") {
        let allianceTemplateElement = document.getElementById("alliance").firstElementChild;
        for (let [label, idPart] of [
            ["Number of notes to score at endgame (115 seconds)", "endgameNotes"],
            ["Seconds to score 4 notes in speaker", "speakerScoreTime"],
            ["Number of notes scoreable in speaker", "speakerScoreCount"],
            ["Seconds to score 2 notes in amp", "ampScoreTime"],
            ["Seconds for a supercycle", "supercycleTime"],
            ["Points per supercycle", "pointsPerSupercycle"],
            ["Number of supercycles by endgame (115 seconds)", "numSupercycles"],
            ["Remaining seconds", "remainingSeconds"],
            ["Non-supercycle points possible", "bonusPoints"],
            ["Predicted score by endgame", "endgameScore"],
            ["Traps reachable", "reachableTraps"],
            ["Harmony points available", "harmonyPoints"],
        ]) {
            let result = useTemplate("summary", {label, idPart, wrap: x => `$\{${x}}`}).firstElementChild;
            allianceTemplateElement.insertBefore(document.createElement("br"), allianceTemplateElement.lastElementChild.previousElementSibling);
            allianceTemplateElement.insertBefore(result, allianceTemplateElement.lastElementChild.previousElementSibling);
        }
    }
}

function useTemplate(templateId, data) {
    let newHTML = templates[templateId].format(data);
    let container = document.createElement("div");
    container.innerHTML = newHTML;
    return container;
}

for (let color of ["blue", "red"]) {
    let allianceContainer = useTemplate("alliance", {color}).firstElementChild;
    document.getElementById("alliances").appendChild(allianceContainer);
    let robotContainer = allianceContainer.querySelector(".robots");
    for (let id = 0; id < 3; id++) {
        robotContainer.appendChild(useTemplate("robot", {color, id}).firstElementChild);
    }
}