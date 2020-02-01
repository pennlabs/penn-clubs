describe('Page load tests', () => {
  it('Visits the index page', () => {
    cy.visit('http://localhost:3000')
    cy.contains('Penn Clubs')
  })

  it('Visits the FAQ page', () => {
    cy.visit('http://localhost:3000/faq')
    cy.contains('Penn Clubs')
  })
})
