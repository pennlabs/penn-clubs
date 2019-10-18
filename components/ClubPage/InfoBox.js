import { getSizeDisplay } from '../../utils'



export default (props) => (
  <div>
    <p>
    <ul>
      <li style={{marginBottom: '5px'}}><i className="fa-fw fas fa-user-friends" style={{height: '100%', marginRight: '5px'}}></i> 
      {' ' + getSizeDisplay(props.club.size)}</li>
      <li style={{marginBottom: '5px'}}>{ props.club.accepting_members ? 
        (<p><i className="fa-fw fas fa-door-open" style={{height: '100%', marginRight: '5px'}}></i> Currently Accepting Members</p>) : 
        (<p><i className="fas fa-door-closed" style={{height: '100%', marginRight: '5px'}}></i> Not Currently Accepting Members</p>) }</li>
      <li style={{marginBottom: '5px'}}>{ props.club.application_required === 3 ? 
        (<p><i className="fa-fw fas fa-user-plus" style={{height: '100%', marginRight: '5px'}}></i> Application Required for All Roles</p>) : props.club.application_required === 2 ? 
        (<p><i className="fas fa-user-plus" style={{height: '100%', marginRight: '5px'}}></i> Application Required for Some Roles</p>) : 
        (<p><i className="fas fa-user-times" style={{height: '100%', marginRight: '5px'}}></i> No Application Required</p>) }</li>
    </ul>
    </p>
  </div>
)
