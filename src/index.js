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

// This function actually 
// add the "element" node inside "container" node
function render(element,container) {
    // if the element type is TEXT_ELEMENT
    // we create a text node instead of a regular node.
    // element.type Examples => "div", "h1", "h2" etc etc
    const dom = element.type === "TEXT_ELEMENT" 
        ? document.createTextNode("")
        : document.createElement(element.type)

    
    const isProperty = key => key !== "children"

    // if the Props is not children
    // then assign that element props to the node
    // assign the element props to the node.
    // Example => "style", "id", "class" etc etc
    Object.keys(element.props)
        .filter(isProperty)
        .forEach(name => {
            dom[name] = element.props[name]
        })

    // Recursively adding all the Nodes to the Child
    element.props.children.forEach(child => {
        render(child,dom)
    });

    container.appendChild(dom)
}

// ZACT is the name of our library
const Zact = {
    createElement,
    render
}

/** @jsx Zact.createElement */
const element = (
    <div style="background: salmon">
        <h1>Hello World</h1>
        <h2 style="text-align:right">from Zact</h2>
    </div>
)

// Babel will transform the above JSX into this below function
// Zact.createElement(
//    "div",
//    {
//     style: "background: salmon"
//    },
//    Zact.createElement("h1", null, "Hello World"),
//    Zact.createElement("h2", {style: "text-align: right"}, "from Zact")
// )

const container = document.getElementById("root")


// ReactDOM.createRoot(container).render(element);
Zact.render(element,container)