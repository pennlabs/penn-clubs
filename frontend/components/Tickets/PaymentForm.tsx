import Script from 'next/script'
import React from 'react'

type PaymentFormProps = {
  token: string | null
}

const PaymentForm = ({ token }: PaymentFormProps) => {
  const captureContext = token
  return (
    <>
      <Script
        src="https://apitest.cybersource.com/up/v1/assets/0.15/SecureAcceptance.js"
        async
        onLoad={() => {
          const acceptFn = (window as any).Accept
          if (acceptFn) {
            const showArgs = {
              containers: {
                paymentSelection: '#buttonPaymentListContainer',
              },
            }
            acceptFn(captureContext)
              .then((accept) => accept.unifiedPayments(false))
              .then((up) => up.show(showArgs))
              .then((tt) => {
                // authForm.submit();
              })
              .catch((error) => {
                // eslint-disable-next-line no-console
                console.error('Error initializing payment:', error)
              })
          }
        }}
      />
      <div style={{ width: '40vw' }}>
        <div
          id="buttonPaymentListContainer"
          className="buttonPaymentListContainer"
        ></div>
        <form id="authForm">
          {/* Your form elements here */}
          <input
            type="hidden"
            id="captureContext"
            name="captureContext"
            value={captureContext ?? ''}
          />
        </form>
      </div>
    </>
  )
}

export default PaymentForm
