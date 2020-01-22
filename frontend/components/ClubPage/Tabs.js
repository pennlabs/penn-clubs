import { EMPTY_DESCRIPTION } from '../../utils'
import { EmptyState, Center } from '../common'
import TabView from '../TabView'

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
            {members.length ? (
              members.map((a, i) => (
                <div className="media" key={i}>
                  <div className="media-left">
                    <figure className="has-background-light image is-48x48"></figure>
                  </div>
                  <div className="media-content">
                    <p className="title is-4">{a.name || 'No Name'}</p>
                    <p className="subtitle is-6">
                      {a.email ? (
                        <span>
                          <a href={'mailto:' + a.email}>{a.email}</a> ({a.title}
                          )
                        </span>
                      ) : (
                        a.title
                      )}
                    </p>
                  </div>
                </div>
              ))
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
