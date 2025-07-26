// Official React Doc fn Link: https://github.com/facebook/react/blob/f4cc45ce962adc9f307690e1d5cfa28a288418eb/packages/react/src/ReactElement.js#L111
function createElement(type,props,...children) {
    return {
        type,
        props: {
            ...props,
            children: children.map(child => (
                typeof child === "object"
                    ? child :
                    createTextElement(child)
            )),
        }
    }
}

// React doesn't wrap primitive values or create empty
// arrays when there aren't children but we are doing it
// to simplify our code
function createTextElement(text) {
    return {
        type: "TEXT_ELEMENT",
        props: {
            nodeValue: text,
            children: []
        }
    }
}

// ZACT is the name of our library
const Zact = {
    createElement
}

/** @jsx Zact.createElement */
const element = Zact.createElement(
    "div",
    {id: "foo"},
    Zact.createElement("a", null, "bar"),
    Zact.createElement("b")
)

const container = document.getElementById("root")


ReactDOM.createRoot(container).render(element);