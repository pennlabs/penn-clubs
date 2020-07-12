declare namespace Cypress {
  interface Chainable {
    login(): Chainable
    logout(username?: string, password?: string): Chainable
  }
}
