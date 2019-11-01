import { EMPTY_DESCRIPTION } from "../../utils";
import TabView from "../TabView";

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
              props.club.members.map((a, i) => (
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
