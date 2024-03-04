describe('Invitation tests', () => {
  before(() => {
    cy.login('bfranklin', 'test')
  })

  after(() => {
    // Remove James Madison (self) from the club
    cy.visit('/settings')
    cy.get('table > tbody > tr').last().contains('Leave').click()

    cy.logout()
  })

  beforeEach(() => {
    Cypress.Cookies.preserveOnce('sessionid', 'csrftoken')
  })

  it('Invites User', () => {
    cy.visit('/club/pppjo/edit/member')
    cy.contains('Invite Members').scrollIntoView()
    cy.get('textarea[placeholder="Enter email addresses here!"]').type(
      'jmadison@seas.upenn.edu',
    )

    cy.contains('.button', 'Send Invite').click()

    cy.contains(/Sent invites? to 1 emails?/).should('be.visible')
  })

  it('Visits invitation page', () => {
    cy.logout()

    cy.login('jmadison', 'test')

    cy.request('GET', '/api/settings/invites').then((responses) => {
      const invite = responses.body[0]

      cy.logout()
      cy.login('bfranklin', 'test')

      cy.visit(`/invite/${invite['code']}/${invite['id']}/${invite['token']}`)
      cy.contains('Penn Pre-Professional Juggling Organization has invited you')
    })
  })

  it('Accepts invitation using incorrect login credentials', () => {
    cy.contains('Accept Invitation').click()
    cy.contains(
      'This invitation was meant for jmadison, but you are logged in as bfranklin!',
    )
    cy.logout()
  })

  it('Accepts invitation using incorrect and correct token with correct login credentials', () => {
    cy.login('jmadison', 'test')

    cy.request('GET', '/api/settings/invites/').then((responses) => {
      // get the latest token
      const invite = responses.body[0]

      // Wrong Token leads to error
      cy.visit(`/invite/${invite['code']}/${invite['id']}/WRONGTOKEN`)

      cy.contains('Accept Invitation').click()
      cy.contains('Missing or invalid token in request!')

      // Correct Token leads to success
      cy.visit(`/invite/${invite['code']}/${invite['id']}/${invite['token']}`)

      cy.contains('Accept Invitation').click()

      // Redirect to club page
      cy.title().should('eq', 'Penn Pre-Professional Juggling Organization')

      // Accessing invitation link after accepting it leads to 404
      cy.visit(`/invite/${invite['code']}/${invite['id']}/${invite['token']}`)
      cy.contains('404 Not Found')
    })
  })
})
