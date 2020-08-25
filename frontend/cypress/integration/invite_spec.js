describe('Invitation tests', () => {
  before(() => {
    cy.login('bfranklin', 'test') 

    cy.visit('/api/admin/auth/user')  

    // Promote James Madision as a staff
    cy.contains('jmadison').click()
    cy.get('input[id="id_is_staff"]').check()
    cy.get('input[id="id_is_superuser"]').check()
    cy.contains('Save').click({ force: true })
  })


  after(() => {
    // Remove James Madison (self) from the club
    cy.visit('/settings')
    cy.get('table > tbody > tr').last().contains('Leave').click()
     
    // Demote James Madison (self) from staff
    cy.visit('/api/admin/auth/user')  
    cy.contains('jmadison').click()
    cy.get('input[id="id_is_staff"]').uncheck()
    cy.get('input[id="id_is_superuser"]').uncheck()
    cy.contains('Save').click({ force: true })

    cy.logout()
  })

  beforeEach(() => {
    Cypress.Cookies.preserveOnce('sessionid', 'csrftoken')
  })

  it('Invites User', () => {
    cy.visit('/club/pppjo/edit#member')
    cy.contains('Invite Members').scrollIntoView()
    cy.get('[data-testid="invite-emails-input"]').type(
        'jmadison@seas.upenn.edu'
    )

    cy.get('[data-testid="invite-emails-submit"]').click()

    cy.contains(/Sent invites? to 1 emails?/).should('be.visible')
  })

  it('Visits invitation page', () => {
    cy.logout()

    cy.login('jmadison', 'test')

    cy.request('GET', '/api/test/lastemail').then((response) => {
      cy.logout()
      cy.login('bfranklin', 'test')

      cy.visit(`/invite/${response.body['code']}/${response.body['id']}/${response.body['token']}`)
      cy.contains('Invitation for Penn Pre-Professional Juggling Organization')
    })
  })

  it('Accepts invitation using incorrect login credentials', () => {
    cy.contains('Accept Invitation').click()
    cy.contains('This invitation was meant for "jmadison", but you are logged in as "bfranklin"!')
    cy.logout()
  })

  it('Accepts invitation using incorrect and correct token with correct login credentials', () => {
    cy.login('jmadison', 'test')

    cy.request('GET', '/api/test/lastemail').then((response) => {
      // Wrong Token leads to error
      cy.visit(`/invite/${response.body['code']}/${response.body['id']}/WRONGTOKEN`)

      cy.contains('Accept Invitation').click()
      cy.contains('Missing or invalid token in request!')

      // Correct Token leads to success
      cy.visit(`/invite/${response.body['code']}/${response.body['id']}/${response.body['token']}`)

      cy.contains('Accept Invitation').click()

      // Redirect to club page
      cy.title().should('eq', 'Penn Pre-Professional Juggling Organization')
      
      // Accessing invitation link after accepting it leads to 404 
      cy.visit(`/invite/${response.body['code']}/${response.body['id']}/${response.body['token']}`)
      cy.contains('404 Not Found')
    })
  })
})
