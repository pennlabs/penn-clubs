import React, { useEffect } from 'react'

type PaymentFormProps = {
  token: string | null
}

const PaymentForm = ({ token }: PaymentFormProps) => {
  const captureContext = token

  useEffect(() => {
    const script = document.createElement('script')
    script.src =
      'https://apitest.cybersource.com/up/v1/assets/0.15/SecureAcceptance.js'
    script.async = true
    document.body.appendChild(script)

    script.onload = () => {
      const acceptFn = (window as any).Accept
      if (acceptFn) {
        const showArgs = {
          containers: {
            paymentSelection: '#buttonPaymentListContainer',
          },
        }
        acceptFn(captureContext)
          .then((accept) => accept.unifiedPayments())
          .then((up) => up.show(showArgs))
          .then((tt) => {
            // console.log('Transient Token:', tt)
            // authForm.submit();
          })
          .catch((error) => {
            // eslint-disable-next-line no-console
            console.error('Error initializing payment:', error)
          })
      }
    }

    // Cleanup function to remove the script when the component unmounts
    return () => {
      document.body.removeChild(script)
    }
  }, [captureContext])

  return (
    <div style={{ width: '40vw' }}>
      <p>{captureContext}</p>
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
  )
}

export default PaymentForm
