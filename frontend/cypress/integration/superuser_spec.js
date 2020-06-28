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
    cy.wait(3000)

    cy.url().should('contain', 'edit')
    cy.contains('.field', 'Name')
      .should('be.visible')
      .find('input')
      .clear()
      .type('Penn Pre-Professional Juggling Organization - Edited')
      .blur()
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

    const tabs = [
      'Information',
      'Membership',
      'Subscriptions',
      'Resources',
      'Settings',
    ]

    tabs.forEach(tab => {
      cy.contains(tab).click()
    })
  })
})
