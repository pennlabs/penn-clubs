import { EMPTY_DESCRIPTION } from '../../utils'
import { EmptyState, Center } from '../common'
import TabView from '../TabView'
import MemberCard from './MemberCard'

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
          </div>
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
  />
)
