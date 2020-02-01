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

  it ('Visits the settings page', () => {
    cy.visit('/settings')
    cy.contains('Penn Clubs')
  })
})
