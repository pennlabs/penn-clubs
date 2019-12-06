import { EMPTY_DESCRIPTION } from '../../utils'
import TabView from '../TabView'
import OrgChildren from '../OrgPage/OrgChildren'
import OrgLinks from '../OrgPage/OrgLinks'
import { Icon } from '../common'
import SocialIcons from '../ClubPage/SocialIcons'

export default props => (
  <TabView
    tabs={[
      {
        name: 'constituents',
        content: <OrgChildren children={props.children} />,
      },
      {
        name: 'links',
        content: <SocialIcons club={props.club} />,
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
