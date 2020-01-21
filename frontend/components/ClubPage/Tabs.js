<<<<<<< HEAD
import { EMPTY_DESCRIPTION } from '../../utils'
import { EmptyState, Center } from '../common'
import TabView from '../TabView'
import MemberCard from './MemberCard'
=======
>>>>>>> code cleanup
import s from 'styled-components'
import { StrongText } from '../common'
import { EMPTY_DESCRIPTION } from '../../utils'

const Wrapper = s.div`
  display: flex;
  justify-content: space-between;
  flex-direction: row;
  align-items: center;
  flex: 1;
`

<<<<<<< HEAD
export default ({
  club: {
    description,
    how_to_get_involved: involvedText,
    members,
  },
}) => (
  <TabView
    tabs={[
      {
        name: 'description',
        content: (
          <div>
            <div
              style={{ whiteSpace: 'pre-wrap' }}
              dangerouslySetInnerHTML={{
                __html: description || EMPTY_DESCRIPTION,
              }}
            />
            {involvedText && (
              <div>
                <div style={{ marginTop: 20 }}>
                  <b>Getting Involved</b>
                </div>
                <div style={{ whiteSpace: 'pre-wrap' }}>
                  {involvedText}
                </div>
              </div>
            )}
=======
export default props => (
  <Wrapper>
    <div style={{ padding: '10px' }}>
      <StrongText>Description</StrongText>
      <div
        style={{ whiteSpace: 'pre-wrap' }}
        dangerouslySetInnerHTML={{
          __html: props.club.description || EMPTY_DESCRIPTION,
        }}
      />
      {props.club.how_to_get_involved && (
        <div>
          <div style={{ marginTop: 20 }}>
            <b>Getting Involved</b>
          </div>
          <div style={{ whiteSpace: 'pre-wrap' }}>
            {props.club.how_to_get_involved}
>>>>>>> header fix and kill tabs temporary
          </div>
        </div>
      )}
    </div>{' '}
<<<<<<< HEAD
  </Wrapper> /*
        ),
      },
      {
        name: 'members',
        content: (
          <div>
            {props.club.members.length ? (
              props.club.members.map((a, i) => <MemberCard a={a} key={i} />)
            ) : (
                <>
                  <Center>
                    <EmptyState name="hiring" size="25%" style={{ marginTop: 0, marginBottom: 0 }} />
                    <p>
                      No club members have linked their accounts on Penn Clubs yet.
                      <br />
                      Check back later for a list of club members!
                    </p>
                  </Center>
                </>
            )}
          </div>
        ),
      },
    ]}
  />*/
=======
  </Wrapper>
>>>>>>> code cleanup
)
