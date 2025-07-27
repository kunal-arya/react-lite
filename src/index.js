// =================================================== //
// ==== REACT createElement Implementation =========== //
// =================================================== //

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

// =================================================== //
// ============== REACT RENDERDOM ==================== //
// =================================================== //


// This function actually 
// add the "element" node inside "container" node
function renderV1(element,container) {
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
        renderV1(child,dom)
    });

    container.appendChild(dom)
}


// ======== REACT FIBER ===================== //

// Zact.render(
//   <div>
//     <h1>
//       <p />
//       <a />
//     </h1>
//     <h2 />
//   </div>,
//   container
// )

/*
Fiber Tree Structure (ASCII Diagram):

div
├── h1
│   ├── p
│   └── a
└── h2

Traversal Order:
1. div       → has child → go to h1
2. h1        → has child → go to p
3. p         → no child → go to sibling a
4. a         → no child/sibling → go to parent's sibling h2
5. h2        → no child/sibling → done
*/

/*
Fiber Navigation Logic:

- Each fiber has:
  fiber.child      → first child
  fiber.sibling    → next sibling
  fiber.parent     → parent fiber

- To determine nextUnitOfWork:
  1. If fiber has a child → return fiber.child
  2. Else if fiber has a sibling → return fiber.sibling
  3. Else → go up to parent's sibling (uncle)
     Keep going up until a sibling is found or root is reached
*/

/*
Purpose:
- This pattern ensures depth-first traversal of the fiber tree
- Allows incremental rendering by pausing/resuming at any fiber
*/

/**
 * Creates a DOM node from a fiber object.
 * This function is responsible for creating the actual HTML element
 * or text node that will be inserted into the DOM.
 * @param {object} fiber - The fiber object representing an element.
 * @returns {Node} The created DOM node.
 */
function createDOM(fiber) {
    // If the fiber type is "TEXT_ELEMENT", create a text node.
    // Otherwise, create a standard HTML element based on the fiber's type (e.g., 'div', 'h1').
    const dom = fiber.type === "TEXT_ELEMENT" 
        ? document.createTextNode("")
        : document.createElement(fiber.type);

    updateDom(dom, {}, fiber.props)
    return dom;
}

// One special kind of prop that we need to update are event listeners, 
// so if the prop name starts with the “on” prefix we’ll handle them differently.
const isEvent = key => key.startsWith("on")

const isProperty = key => key !== "children" && !isEvent(key)
const isNew = (prev, next) => key => prev[key] != next[key]
const isGone = (prev, next) => key => !(key in next)

function updateDom(dom, prevProps, nextProps) {
    // Remove old or change event event listeners
    Object.keys(prevProps)
        .filter(isEvent)
        .filter(
            key =>
                !(key in nextProps) || isNew(prevProps, nextProps)(key))
        .forEach(name => {
            const eventType = name
                .toLowerCase()
                .substring(2)

            dom.removeEventListener(
                eventType,
                prevProps[name]
            )
        })

    // Remove OLD properties
    Object.keys(prevProps)
        .filter(isProperty)
        .filter(isGone(prevProps,nextProps))
        .forEach(name => {
            dom[name] = ""
        })

    // Set new or changed Properties
    Object.keys(nextProps)
        .filter(isProperty)
        .filter(isNew(prevProps,nextProps))
        .forEach(name => {
            dom[name] = nextProps[name]
        })
    
    // Add Event Listeners
    Object.keys(nextProps)
        .filter(isEvent)
        .filter(isNew(prevProps, nextProps))
        .forEach(name => {
            const eventType = name
                .toLowerCase()
                .substring(2)
            
            dom.addEventListener(
                eventType,
                nextProps[name]
            )
        })
}

function commitRoot() {
    // Deleting the nodes from the DOM
    deletions.forEach(commitWork)

    // add nodes to dom
    commitWork(wipRoot.child)
    currentRoot = wipRoot
    wipRoot = null
}


function commitWork(fiber) {
    if(!fiber) return

    let domParentFiber = fiber.parent

    // First, to find the parent of a DOM node 
    // we’ll need to go up the fiber tree 
    // until we find a fiber with a DOM node.
    while(!domParentFiber.dom) {
        domParentFiber = domParentFiber.parent
    }

    const domParent = domParentFiber.dom

    if(fiber.effectTag === "PLACEMENT" && fiber.dom != null) {
        domParent.appendChild(fiber.dom)
        
    } else if (fiber.effectTag === "UPDATE" && fiber.dom != null) {
        updateDom(
            fiber.dom,
            fiber.alternate.props,
            fiber.props
        )
    } else if (fiber.effectTag === "DELETION") {
      commitDeletion(fiber, domParent)
    }

    commitWork(fiber.child)
    commitWork(fiber.sibling)
}

function commitDeletion(fiber, domParent) {
    if (fiber.dom) {
        domParent.removeChild(fiber.dom)
    } else {
        commitDeletion(fiber.child, domParent)
    }
}

/**
 * Kicks off the rendering process.
 * This function sets up the root fiber and initializes the work loop.
 * @param {object} element - The root element to render.
 * @param {Node} container - The DOM node where the element will be rendered.
 */
function renderV2(element,container) {
    // Initialize the next unit of work with the root fiber.
    // The root fiber's 'dom' is the container, and its 'props'
    // contain the root element as its only child.
    wipRoot = {
        dom: container,
        props: {
            children: [element]
        },
        alternate: currentRoot
    };

    deletions = []
    nextUnitOfWork = wipRoot
}

// This variable holds the next unit of work to be processed.
// It's the core of the concurrent rendering mechanism.
let nextUnitOfWork = null;

// keep track of the root of the fiber tree.
let wipRoot = null;

// Saving the reference to "Last fiber tree we committed to the DOM"
let currentRoot = null;

// Nodes we want to delete
let deletions = null;


/**
 * The main work loop for concurrent rendering.
 * This function is called by `requestIdleCallback` and processes
 * units of work until the browser needs to take back control.
 * @param {IdleDeadline} deadline - An object provided by `requestIdleCallback`
 * that contains information about the remaining idle time.
 */
function workLoop(deadline) {
    let shouldYield = false;

    // Continue processing units of work as long as there is work to do
    // and the browser hasn't signaled that it needs to yield.
    while (nextUnitOfWork && !shouldYield) {
        nextUnitOfWork = performUnitOfWork(
            nextUnitOfWork
        );

        // Check if there's enough time remaining in the idle period.
        // If not, we should yield to the browser.
        shouldYield = deadline.timeRemaining() < 1;
    }

    // once we finish all the work (we know it because there isn’t a 
    // next unit of work) we commit the whole fiber tree to the DOM.
    if(!nextUnitOfWork && wipRoot) {
        commitRoot()
    }

    // `requestIdleCallback` schedules the `workLoop` to be called
    // during the browser's next idle period. This is how we achieve
    // cooperative scheduling and avoid blocking the main thread.
    requestIdleCallback(workLoop);
}

// Start the work loop for the first time.
requestIdleCallback(workLoop);

/**
 * Performs a single unit of work and returns the next unit of work.
 * This function is the heart of the fiber reconciliation algorithm.
 * @param {object} fiber - The fiber to process.
 * @returns {object|null} The next fiber to process, or null if there's no more work.
 */
function performUnitOfWork(fiber) {
    const isFunctionComponent =
        fiber.type instanceof Function
    if (isFunctionComponent) {
        updateFunctionComponent(fiber)
    } else {
        updateHostComponent(fiber)
    }

    // 3. Return the next unit of work.
    // The next unit of work is the first child of the current fiber.
    if(fiber.child) {
        return fiber.child;
    }

    // If there's no child, we look for a sibling.
    let nextFiber = fiber;
    while(nextFiber) {
        if(nextFiber.sibling) {
            return nextFiber.sibling;
        }
        // If no sibling, we go up to the parent and check for its sibling.
        nextFiber = nextFiber.parent;
    }
}


function updateFunctionComponent(fiber) {
  const children = [fiber.type(fiber.props)]
  reconcileChildren(fiber, children)
}

function updateHostComponent(fiber) {
    // 1. Create the DOM node for the current fiber if it doesn't exist.
    if(!fiber.dom) {
        fiber.dom = createDOM(fiber);
    }

    // We can Append the new DOM node to its parent's DOM node.
    // BUT This is a simplification.
    // this should happen in a separate "commit" phase.
    // b/c We are adding a new node to the DOM each time 
    // we work on an element. And, remember, the browser 
    // could interrupt our work before we finish rendering 
    // the whole tree. In that case, the user will see an 
    // incomplete UI. And we don’t want that.
    // if (fiber.parent) {
    //     fiber.parent.dom.appendChild(fiber.dom);
    // }

    // 2. Create new fibers for each of the current fiber's children.
    const elements = fiber.props.children;
    reconcileChildren(fiber,elements)
}

// Reconciling code, in a general sense, refers to the process
// of comparing and adjusting records from different sources
// to ensure they align
function reconcileChildren(wipFiber, elements) {
    let index = 0;
    let oldFiber = wipFiber.alternate && wipFiber.alternate.child
    let prevSibling = null;

    while (index < elements.length || oldFiber != null) {
        const element = elements[index];

        // Create a new fiber for the child element.
        let newFiber = null

        // compare oldFiber to element ============= //
        // The element is the thing we want to render to the DOM and 
        // the oldFiber is what we rendered the last time.
        const sameType = oldFiber && element && element.type == oldFiber.type

        // Here React also uses keys, that makes a better reconciliation. 
        // For example, it detects when children change places in the element array.

        // If the old fiber and the new element have the same type, 
        // we can keep the DOM node and just update it with the new props
        if(sameType) {
            // Update the node
            newFiber = {
                type: oldFiber.type,
                props: element.props,
                dom: oldFiber.dom,
                parent: wipFiber,
                alternate: oldFiber,
                effectTag: "UPDATE"
            }
        }
        
        // If the type is different and there is a new element, 
        // it means we need to create a new DOM node
        if(element && !sameType) {
            // Add this Node
            newFiber = {
                type: element.type,
                props: element.props,
                dom: null,
                parent: wipFiber,
                alternate: null,
                // For the case where the element needs a new DOM
                // node we tag the new fiber with the "PLACEMENT" effect tag.
                effectTag: "PLACEMENT"
            }
        }

        // If the types are different and there is an old fiber, 
        // we need to remove the old node
        if(oldFiber && !sameType) {
            // Delete the OldFiber's node
            oldFiber.effectTag = "DELETION"
            deletions.push(oldFiber)
        }

        if(oldFiber) {
            oldFiber = oldFiber.sibling
        }

        // Link the new fiber to its parent and siblings.
        if (index === 0) {
            // The first child is the `child` of the parent fiber.
            wipFiber.child = newFiber;
        } else if (element) {
            // Subsequent children are siblings of the first child.
            prevSibling.sibling = newFiber;
        }

        prevSibling = newFiber;
        index++;
    }
}

// ZACT is the name of our library
const Zact = {
    createElement,
    render: renderV2
}



// ========================================================== //
// ================= APP EXAMPLE ============================ //
// ========================================================== //


/*
Function components are differents in two ways:

1. the fiber from a function component doesn’t have a DOM node
2. and the children come from running the function instead of 
    getting them directly from the props
*/

/** @jsx Zact.createElement */
function App(props) {
  return <h1>Hi {props.name}</h1>
}

const element = <App name="foo" />

// BABEL transform above form JSX to JS
// function App(props) {
//   return Didact.createElement(
//     "h1",
//     null,
//     "Hi ",
//     props.name
//   )
// }
// const element = Didact.createElement(App, {
//   name: "foo",
// })
const container = document.getElementById("root")

Zact.render(element,container)






