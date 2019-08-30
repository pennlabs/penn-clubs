import { getSizeDisplay } from '../../utils'

export default (props) => (
  <div>
    <p>
      <i className="fa-fw fas fa-user-friends"></i>
      {' ' + getSizeDisplay(props.club.size)}
    </p>
    { props.club.accepting_members ? (<p><i className="fa-fw fas fa-door-open"></i> Currently Accepting Members</p>) : (<p><i className="fas fa-door-closed"></i> Not Currently Accepting Members</p>) }
    { props.club.application_required === 3 ? (<p><i className="fa-fw fas fa-user-plus"></i> Application Required for All Roles</p>) : props.club.application_required === 2 ? (<p><i className="fas fa-user-plus"></i> Application Required for Some Roles</p>) : (<p><i className="fas fa-user-times"></i> No Application Required</p>) }
  </div>
)
