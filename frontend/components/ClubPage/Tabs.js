import { EMPTY_DESCRIPTION } from '../../utils'
import TabView from '../TabView'
import MemberCard from './MemberCard'

export default props => (
  <TabView
    tabs={[
      {
        name: 'description',
        content: (
          <div>
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
              props.club.members.map((a, i) => <MemberCard a={a} i={i} />)
            ) : (
              <p>
                No club members have linked their accounts on Penn Clubs yet.
                Check back later for a list of club members!
              </p>
            )}
          </div>
        ),
      },
    ]}
  />
)
