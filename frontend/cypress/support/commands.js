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
Cypress.Commands.add('login', () => {
  cy.visit('/')
  cy.contains('Login')
    .invoke('attr', 'href')
    .then(href => {
      cy.request({
        method: 'GET',
        url: href,
      }).then(data => {
        cy.window().then(win => {
          const ele = win.document.createElement('div')
          ele.innerHTML = data.body
          const form = new win.FormData(ele.querySelector('form'))
          const formattedData = {}
          Array.from(form.entries()).forEach(a => {
            formattedData[a[0]] = a[1]
          })
          formattedData.allow = 'Authorize'
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
