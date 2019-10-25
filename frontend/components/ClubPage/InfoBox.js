import { getSizeDisplay } from '../../utils'

const Icon = ({ name }) => <i className={`fa-fw fas fa-${name}`} />

const applicationTextMap = {
  3: 'Application Required for All Roles',
  2: 'Application Required for Some',
  1: 'No Application Required',
}
const defaultApplicationText = 'No Application Required'

const InfoBox = ({
  club: {
    size,
    accepting_members: acceptingMembers,
    application_required: applicationRequired,
  },
}) => (
  <div>
    <p>
      <Icon name="user-friends" />
      {' ' + getSizeDisplay(size)}
    </p>
    {acceptingMembers ? (
      <p>
        <Icon name="door-open" />
        {' Currently Accepting Members'}
      </p>
    ) : (
      <p>
        <Icon name="door-closed" />
        {' Not Currently Accepting Members'}
      </p>
    )}

    <p>
      <Icon name="user-plus" />
      {' ' + applicationTextMap[applicationRequired] || defaultApplicationText}
    </p>
  </div>
)

export default InfoBox
