// Ensure that there are no console.error calls when running through the test suite.
// Ignore the React no-op unmounted state component errors.

Cypress.on('window:before:load', (win) => {
  cy.spy(win.console, 'error')
})

afterEach(() => {
  cy.window().then((win) => {
    win.console.error.getCalls().forEach((fn) => {
      if (!fn.args[0].startsWith("Warning: Can't perform a React state update on an unmounted component.")) {
        throw new Error(`Unexpected console.error call with ${fn}`)
      }
    })
  })
})