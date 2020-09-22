import { useEffect, useState, ReactElement } from "react"

export const withBreakpoint = (DesktopComponent, MobileComponent) => 
    ({ breakpointWidth, ...props }) => {
        const [showDesktop, setShowDesktop] = useState<Boolean>(true)
        const [handleResize, setHandleResize] = useState<EventHandlerNonNull>(() => {})
        useEffect(() => {
            setHandleResize(() => setShowDesktop(window.innerWidth >= breakpointWidth)) 
            window.addEventListener('resize', handleResize)
            return () => window.removeEventListener('resize', handleResize)
        }, [])
        return showDesktop ? <DesktopComponent {...props} /> : <MobileComponent {...props} />
    }
