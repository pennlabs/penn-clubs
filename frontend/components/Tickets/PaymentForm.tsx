import Script from 'next/script'
import React, { useCallback, useRef } from 'react'

type PaymentProps = {
  captureContext: string
  onTrasientTokenReceived?: (transientToken: string) => void
}

const Payment: React.FC<PaymentProps> = ({
  captureContext,
  onTrasientTokenReceived,
}) => {
  const checkoutButtonRef = useRef<HTMLDivElement>(null)
  const paymentContainerRef = useRef<HTMLDivElement>(null)

  const onLoad = useCallback(async () => {
    const Accept = (window as any).Accept
    if (typeof Accept !== 'function') {
      throw new Error('Accept not found')
    }
    if (!checkoutButtonRef.current || !paymentContainerRef.current) {
      throw new Error('Ref not found')
    }
    const showArgs = {
      containers: {
        paymentSelection: `#${checkoutButtonRef.current.id}`,
        paymentScreen: `#${paymentContainerRef.current.id}`,
      },
    }
    const acceptFn = await Accept(captureContext)
    const up = await acceptFn.unifiedPayments(false)
    const transientToken = await up.show(showArgs)
    onTrasientTokenReceived?.(transientToken)
  }, [])

  return (
    <>
      <Script
        src="https://apitest.cybersource.com/up/v1/assets/0.15/SecureAcceptance.js"
        async
        onLoad={onLoad}
      />
      <div>
        <div id="cybersource_checkout" ref={checkoutButtonRef}></div>
        <div id="cybersource_payment_container" ref={paymentContainerRef}></div>
      </div>
    </>
  )
}

export default Payment
