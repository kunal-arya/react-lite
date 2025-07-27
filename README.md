# react-lite
Lite version of Javascript Library - React

# Epilogue

This guide wasn’t just about explaining **how React works** — it was also designed to make exploring the actual React codebase easier. That’s why we stuck to using the **same function and variable names** as React wherever possible.

So, if you set a breakpoint in a real React app, the call stack might look familiar:

- `workLoop`
- `performUnitOfWork`
- `updateFunctionComponent`

### What's Different From React?

We’ve kept this project (Zact) intentionally simple. React includes many optimizations and extra features that we’ve skipped here for clarity. Here are some differences:

- **Render Phase**  
  Zact walks through the *entire tree*.  
  React uses *heuristics* to skip subtrees where nothing changed.

- **Commit Phase**  
  Zact again walks the whole tree.  
  React maintains a *linked list of fibers with side effects* and commits only those.

- **Fiber Creation**  
  Zact creates *new fiber objects* every time.  
  React *recycles* old fibers for better performance.

- **Handling Updates**  
  If Zact gets a new update during rendering, it *discards the current tree* and starts over.  
  React *tags updates with expiration times* and prioritizes them accordingly.

And there’s a lot more React does under the hood.

### Want to Extend Zact?

Here are some features you could add to level up Zact:

- Support `style` as an object (like React)
- Flatten nested `children` arrays
- Implement the `useEffect` hook
- Support reconciliation using `key` props

If you build any of these (or something else cool), consider opening a **pull request** on GitHub. Others might learn from your implementation!

---
