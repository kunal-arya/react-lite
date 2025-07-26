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
    // PROBLEM WITH THIS RECURSIVE CALL
    // -- Once start rendering, we won't stop until we have
    // rendered the complete element tree. If the element
    // tree is big, it may block the main thread for too long.
    // and if the browsers needs to do high priority stuff like
    // handling user input or keeping an animation smooth,
    // it will have to wait until the render finishes.
    element.props.children.forEach(child => {
        render(child,dom)
    });

    container.appendChild(dom)
}

// breaking the work into small units,
// and after we finish each unit we'll let the
// browser interrupt the rendering if there's
// anything else that needs to be done.
let nextUnitOfWork = null

function workLoop(deadline) {
    let shouldYield = false

    while (nextUnitOfWork && !shouldYield) {
        nextUnitOfWork = performUnitOfWork(
            nextUnitOfWork
        )

        shouldYield = deadline.timeRemaining() < 1
    }

    // We use requestIdleCallback to make a loop. 
    // You can think of requestIdleCallback as a setTimeout, 
    // but instead of us telling it when to run, the browser 
    // will run the callback when the main thread is idle.
    // React doesn’t use requestIdleCallback anymore (LINK: https://github.com/facebook/react/issues/11171#issuecomment-417349573)
    //  Now it uses the scheduler package. (LINK: https://github.com/facebook/react/tree/master/packages/scheduler)
    // But for this use case it’s conceptually the same.

    // requestIdleCallback also gives us a deadline parameter. 
    // We can use it to check how much time we have 
    // until the browser needs to take control again.
    requestIdleCallback(workLoop)
}

requestIdleCallback(workLoop)

function performUnitOfWork(nextUnitOfWork) {
    // TODO
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