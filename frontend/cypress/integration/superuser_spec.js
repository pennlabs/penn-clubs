describe('Permissioned (superuser) user tests', { retries: { runMode: 2, openMode: 0 } }, () => {
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
    // visit club page
    cy.visit('/club/pppjo')

    // ensure critical page elements exist
    cy.contains('Benjamin Franklin').should('be.visible')
    cy.contains('Penn Pre-Professional Juggling Organization').should('be.visible')

    // navigate to club edit page
    cy.contains('button:visible', 'Manage Club').scrollIntoView().click()

    // wait additional time for manage club page to compile
    cy.url({ timeout: 15 * 1000 }).should('contain', 'edit')
    
    // change club name
    cy.contains('.field', 'Name')
      .should('be.visible')
      .find('input')
      .clear()
      .type('Penn Pre-Professional Juggling Organization - Edited')
      .blur()
    cy.contains('Submit').click()
    cy.contains('saved')

    // go back to club page, ensure edits are shown
    cy.contains('View Club').scrollIntoView().click({ force: true })
    cy.contains('Penn Pre-Professional Juggling Organization - Edited')

    // revert edits
    cy.contains('button:visible', 'Manage Club').scrollIntoView().click()
    cy.url({ timeout: 15 * 1000 }).should('contain', 'edit')
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
