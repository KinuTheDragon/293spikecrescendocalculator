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

function useTemplate(templateElement, data) {
    let newHTML = templateElement.innerHTML.format(data);
    let container = document.createElement("div");
    container.innerHTML = newHTML;
    return container;
}

let robotTemplate = document.getElementById("robot-template");
for (let color of ["blue", "red"]) {
    let robotContainer = document.getElementById(`${color}-robots`);
    for (let id = 0; id < 3; id++) {
        robotContainer.appendChild(useTemplate(robotTemplate, {color, id}).firstElementChild);
    }
}