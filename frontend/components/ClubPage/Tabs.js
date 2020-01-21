import { EMPTY_DESCRIPTION } from '../../utils'
import { EmptyState } from '../common'
import TabView from '../TabView'

export default ({ club }) => (
  <TabView
    tabs={[
      {
        name: 'description',
        content: (
          <div>
            <div
              style={{ whiteSpace: 'pre-wrap' }}
              dangerouslySetInnerHTML={{
                __html: club.description || EMPTY_DESCRIPTION,
              }}
            />
            {club.how_to_get_involved && (
              <div>
                <div style={{ marginTop: 20 }}>
                  <b>Getting Involved</b>
                </div>
                <div style={{ whiteSpace: 'pre-wrap' }}>
                  {club.how_to_get_involved}
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
            {club.members.length ? (
              club.members.map((a, i) => (
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
                  <EmptyState name="hiring" size="25%" style={{ marginTop: 0, marginBottom: 0 }} />
                  <p style={{ textAlign: 'center' }}>
                    No club members have linked their accounts on Penn Clubs yet.
                    <br />
                    Check back later for a list of club members!
                  </p>
                </>
            )}
          </div>
        ),
      },
    ]}
  />
)
