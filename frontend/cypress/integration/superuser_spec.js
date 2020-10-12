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

    cy.contains('button:visible', 'Manage Club').click({ force: true })

    // wait additional time for manage club page to compile
    cy.url({ timeout: 60000 }).should('contain', 'edit')
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

    cy.contains('button:visible', 'Manage Club').click({ force: true })
    cy.url({ timeout: 15000 }).should('contain', 'edit')
    cy.contains('.field', 'Name')
      .find('input')
      .clear()
      .type('Penn Pre-Professional Juggling Organization')
    cy.contains('Submit').click()
  })

  it('Vists edit page tabs', () => {
    cy.visit('/club/pppjo/edit')

    const tabs = [
      'Edit Club Page',
      'Membership',
      'Events',
      'Recruitment',
      'Resources',
      'Questions',
      'Settings',
    ]

    tabs.forEach(tab => {
      cy.get('.tabs').contains(tab).should('be.visible')
    })

    tabs.forEach(tab => {
      cy.get('.tabs').contains(tab).click()
    })
  })
})
