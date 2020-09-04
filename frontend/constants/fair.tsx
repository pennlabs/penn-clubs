import { ReactElement } from 'react'

type FairInfoType = {
  [key: string]: {
    name: string
    organization: string
    contact: string
    additionalInformation?: () => ReactElement | null
  }
}

export const FAIR_INFO: FairInfoType = {
  sac: {
    name: 'SAC Virtual Activities Fair',
    organization: 'Student Activities Council',
    contact: 'sacfair@sacfunded.net',
    additionalInformation: (): ReactElement => {
      return (
        <>
          <p>
            <b>Additional Opportunities:</b>
          </p>
          <p>
            In addition to student-run clubs, there are several
            university-sponsored programs that also provide student involvement
            opportunities covering a wide variety of interests. Details for some
            of these programs are included on the SAC website at{' '}
            <a
              href="https://sacfunded.net/additional-opportunities"
              target="_blank"
            >
              https://sacfunded.net/additional-opportunities
            </a>
            .
          </p>
        </>
      )
    },
  },
  esac: {
    name: 'ESAC Virtual Activities Fair',
    organization: 'Engineering Student Activities Council',
    contact: 'pennesac@gmail.com',
  },
}
