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

  beforeEach(() => {
    Cypress.Cookies.preserveOnce('sessionid', 'csrftoken')
  })

  it('Logs in successfully', () => {
    cy.visit('/')
    cy.contains('Test User')
  })

  it('Vists the settings page', () => {
    cy.visit('/settings')
    cy.contains('Penn Clubs')
    cy.contains('Test User')
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
