describe('Page load tests', () => {
  it('Visits the index page', () => {
    cy.visit('/')
    cy.contains('Penn Clubs')
  })

  it('Visits the FAQ page', () => {
    cy.visit('/faq')
    cy.contains('Penn Clubs')
  })

  it('Visits the rank page', () => {
    cy.visit('/rank')
    cy.contains('Penn Clubs')
  })

  it('Visits the settings page', () => {
    cy.visit('/settings')
    cy.contains('Penn Clubs')
  })

  it('Visits the welcome page', () => {
    cy.visit('/welcome')
    cy.contains('Penn Clubs')
  })

  it('Visits the reports page', () => {
    cy.visit('/admin/reports')
    cy.contains('Penn Clubs')
  })

  it('Visits the directory and constitution pages', () => {
    cy.visit('/directory')
    cy.contains('Penn Clubs')

    cy.visit('/constitutions')
    cy.contains('Penn Clubs')
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
