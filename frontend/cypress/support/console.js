// Ensure that there are no console.error calls when running through the test suite.
// Ignore the React no-op unmounted state component errors.

Cypress.on('window:before:load', (win) => {
  cy.spy(win.console, 'error')
})

const CONSOLE_ERROR_ALLOWLIST = [
  "Warning: Can't perform a React state update on an unmounted component.",
  "Warning: validateDOMNesting(...):",
  "Warning: Expected server HTML to contain a matching ",
  "Warning: Text content did not match. ",
]

afterEach(() => {
  cy.window().then((win) => {
    const collection = []
    win.console.error.getCalls().forEach((fn) => {
      if (!CONSOLE_ERROR_ALLOWLIST.some(prefix => fn.args[0].startsWith(prefix))) {
        collection.push(`Unexpected console.error call with ${fn}`)
      }
    })

    if (collection.length > 0) {
      throw new Error(collection.join("\n"))
    }
  })
})