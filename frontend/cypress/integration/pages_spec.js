describe('Page load tests', () => {
  it('Visits the index page', () => {
    cy.visit('/')
    cy.contains('Penn Clubs')
  })

  it('Visits the FAQ page', () => {
    cy.visit('/faq')
    cy.contains('Penn Clubs')
  })
})
