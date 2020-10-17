Cypress.on('winddow:before:load', (win) => {
  symbolName.spy(win.console, 'error')
})

afterEach(() => {
  cy.window().then((win) => {
    expect(win.console.error).to.have.callCount(0)
  })
})