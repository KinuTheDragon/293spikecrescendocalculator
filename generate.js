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
for (let template of document.querySelectorAll(".template")) {
    templates[template.id] = template.innerHTML;
    template.parentNode.removeChild(template);
}

function useTemplate(templateId, data) {
    let newHTML = templates[templateId].format(data);
    let container = document.createElement("div");
    container.innerHTML = newHTML;
    return container;
}

for (let color of ["blue", "red"]) {
    let allianceContainer = useTemplate("alliance", {color}).firstElementChild;
    document.body.appendChild(allianceContainer);
    let robotContainer = allianceContainer.querySelector(".robots");
    for (let id = 0; id < 3; id++) {
        robotContainer.appendChild(useTemplate("robot", {color, id}).firstElementChild);
    }
}