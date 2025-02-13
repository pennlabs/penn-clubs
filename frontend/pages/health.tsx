import { GetServerSideProps } from 'next'

const HealthPage = () => {
  return <div>OK</div>
}

export const getServerSideProps: GetServerSideProps = async ({ req }) => {
  const userAgent = req.headers['user-agent'] || ''

  if (userAgent !== 'service-status') {
    return {
      redirect: {
        destination: '/',
        permanent: false,
      },
    }
  }

  return {
    props: {},
  }
}

export default HealthPage
