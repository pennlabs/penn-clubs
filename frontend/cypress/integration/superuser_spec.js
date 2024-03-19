describe(
  'Permissioned (superuser) user tests',
  { retries: { runMode: 2, openMode: 0 } },
  () => {
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
      cy.contains('Penn Pre-Professional Juggling Organization').should(
        'be.visible',
      )

      // navigate to club edit page
      cy.contains('a:visible', 'Manage Club').scrollIntoView().click()

      // wait additional time for manage club page to compile
      cy.url({ timeout: 15 * 1000 }).should('contain', 'edit')

      // change club name
      cy.contains('.field', 'Name')
        .should('be.visible')
        .find('input')
        .clear()
        .type('Penn Pre-Professional Juggling Organization - Edited')
        .blur()
      cy.contains('Submit').click({ force: true })

      // go back to club page, ensure edited title is shown
      cy.contains('View Club').scrollIntoView().click({ force: true })
      cy.contains('Penn Pre-Professional Juggling Organization - Edited')

      // revert edits
      cy.contains('a:visible', 'Manage Club').scrollIntoView().click()
      cy.url({ timeout: 15 * 1000 }).should('contain', 'edit')
      cy.contains('.field', 'Name')
        .should('be.visible')
        .find('input')
        .clear()
        .type('Penn Pre-Professional Juggling Organization')
        .blur()
      cy.contains('Submit').click()

      // go back to club page, ensure reverted title is shown
      cy.contains('View Club').scrollIntoView().click({ force: true })
      cy.contains('Penn Pre-Professional Juggling Organization')
    })

    it('Visits edit page tabs', () => {
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

      tabs.forEach((tab) => {
        cy.get('.tabs').contains(tab).should('be.visible')
      })

      tabs.forEach((tab) => {
        cy.get('.tabs').contains(tab).click()
      })
    })

    it('Visits the reports page', () => {
      cy.visit('/admin/reports')
      cy.contains('Reports')
      cy.contains('.button', 'Create New Report').click()
    })

    it('Visits a user profile page', () => {
      cy.visit('/user/bfranklin')
      cy.contains('Benjamin Franklin')
    })

    it('Visits the admin page', () => {
      cy.visit('/admin')
      cy.contains('Admin Dashboard')

      const tabs = ['Bulk Editing', 'Scripts']

      tabs.forEach((tab) => {
        cy.get('.tabs').contains(tab).should('be.visible')
      })

      tabs.forEach((tab) => {
        cy.get('.tabs').contains(tab).click()
      })
    })
  },
)
