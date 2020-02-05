describe('Page load tests', () => {
  it('Visits the index page', () => {
    cy.visit('/')
    cy.contains('Penn Clubs')
  })

  it('Visits the FAQ page', () => {
    cy.visit('/faq')
    cy.contains('Penn Clubs')
  })

  it('Vists the rank page', () => {
    cy.visit('/rank')
    cy.contains('Penn Clubs')
  })

  it('Visits the settings page', () => {
    cy.visit('/settings')
    cy.contains('Penn Clubs')
  })
})

describe('Authenticated user tests', () => {
  before(() => {
    cy.login()
  })

  after(() => {
    cy.logout()
  })

  beforeEach(() => {
    Cypress.Cookies.preserveOnce('sessionid', 'csrftoken')
  })

  it('Logs in successfully', () => {
    cy.visit('/')
    cy.contains('Test User')
  })

  it('Visits the settings page', () => {
    cy.visit('/settings')
    cy.contains('Penn Clubs')
    cy.contains('Test User')
  })

  it('Visits club page', () => {
    cy.visit('/club/pppjo')
    cy.contains('Penn Pre-Professional Juggling Organization')
  })

  it('Vists the welcome page', () => {
    cy.visit('/welcome')
    cy.contains('Penn Clubs')
  })
})

describe('Permissioned user tests', () => {
  before(() => {
    cy.login('bfranklin', 'test')
  })

  after(() => {
    cy.logout()
  })

  beforeEach(() => {
    Cypress.Cookies.preserveOnce('sessionid', 'csrftoken')
  })

  it('Logs in successfully', () => {
    cy.contains('Penn Clubs')
    cy.contains('Benjamin Franklin')
  })

  it('Edits a club page', () => {
    cy.visit('/club/pppjo')
    cy.contains('Benjamin Franklin').should('be.visible')

    cy.contains('button', 'Edit Club').click({ force: true })
    cy.contains('.field', 'Name')
      .find('input')
      .clear()
      .type('Penn Pre-Professional Juggling Organization - Edited')
    cy.contains('Submit').click()
    cy.contains('saved')
    cy.contains('View Club').click({ force: true })
    cy.contains('Penn Pre-Professional Juggling Organization - Edited')

    cy.contains('button', 'Edit Club').click({ force: true })
    cy.contains('.field', 'Name')
      .find('input')
      .clear()
      .type('Penn Pre-Professional Juggling Organization')
    cy.contains('Submit').click()
  })

  it('Vists edit page tabs', () => {
    cy.visit('/club/pppjo/edit')
    [
      // visit all tabs
      ('Information', 'Membership', 'Subscriptions', 'Resources', 'Settings')
    ].forEach(tab => {
      cy.contains(tab).click()
    })
  })
})

describe('Individual club page tests', () => {
  it('Visits club page', () => {
    cy.visit('/club/pppjo')
    cy.contains('Penn Pre-Professional Juggling Organization')
  })

  it('Visits club edit page', () => {
    cy.visit('/club/pppjo/edit')
    cy.contains('Continue to login')
  })

  it('Vists club flyer/fair page', () => {
    cy.visit('/club/pppjo/fair')
    cy.contains('Penn Pre-Professional Juggling Organization')

    cy.visit('/club/pppjo/flyer')
    cy.contains('Penn Pre-Professional Juggling Organization')
  })
})
