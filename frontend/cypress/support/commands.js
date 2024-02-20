// ***********************************************
// This example commands.js shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************
//
//
// -- This is a parent command --
Cypress.Commands.add('logout', () => {
  cy.request({
    method: 'GET',
    url: '/api/admin/',
  }).then(() => {
    cy.getCookie('csrftoken')
      .its('value')
      .then((token) => {
        cy.request({
          method: 'POST',
          headers: {
            'X-CSRFToken': token,
          },
          url: '/api/admin/logout/',
        }).then(() => {
          cy.contains('Clubs Backend Admin')
        })
      })
  })
})

Cypress.Commands.add('login', (username, password) => {
  if (!username || !password) {
    cy.visit('/')
    cy.contains('Login')
      .invoke('attr', 'href')
      .then(href => {
        cy.request({
          method: 'GET',
          url: href,
        }).then(data => {
          cy.log('Processing platform auth flow')
          cy.window().then(win => {
            const ele = win.document.createElement('div')
            ele.innerHTML = data.body
            const form = new win.FormData(ele.querySelector('form'))
            const formattedData = {}
            Array.from(form.entries()).forEach(a => {
              formattedData[a[0]] = a[1]
            })
            formattedData.allow = 'Authorize'
            formattedData.userChoice = 1000
            const url = data.redirects[data.redirects.length - 1].substring(5)
            cy.request({
              method: 'POST',
              url: url,
              form: true,
              headers: {
                Referer: url,
              },
              body: formattedData,
            })
          })
        })
      })
  } else {
    cy.visit('/api/admin/login/?next=/')
    cy.get('[name=username]').type(username)
    cy.get('[name=password]').type(password)
    cy.contains('Log in').click()
    cy.contains('Penn Clubs')
  }
})
//
//
// -- This is a child command --
// Cypress.Commands.add("drag", { prevSubject: 'element'}, (subject, options) => { ... })
//
//
// -- This is a dual command --
// Cypress.Commands.add("dismiss", { prevSubject: 'optional'}, (subject, options) => { ... })
//
//
// -- This will overwrite an existing command --
// Cypress.Commands.overwrite("visit", (originalFn, url, options) => { ... })
