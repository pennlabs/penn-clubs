Cypress.on('window:before:load', (win) => {
  cy.spy(win.console, 'error')
})

afterEach(() => {
  cy.window().then((win) => {
    expect(win.console.error).to.have.callCount(0)
  })
})