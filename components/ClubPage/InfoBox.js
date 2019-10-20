import { getSizeDisplay } from "../../utils";

const InfoIcon = {
  height: "100%",
  marginRight: "10px"
};

const InfoBoxItem = {
  marginBottom: "5px"
};

export default props => {
  const data = [
    {
      icon: "fa-fw fas fa-user-friends",
      text: getSizeDisplay(props.club.size)
    },
    {
      icon: props.club.accepting_members
        ? "fa-fw fas fa-door-open"
        : "fas fa-door-closed",
      text: props.club.accepting_members
        ? "Currently Accepting Members"
        : "Not Currently Accepting Members"
    },
    {
      icon:
        props.club.application_required === 3
          ? "fa-fw fas fa-user-plus"
          : props.club.application_required === 2
          ? "fas fa-user-plus"
          : "fas fa-user-times",
      text:
        props.club.application_required === 3
          ? "Application Required for All Roles"
          : props.club.application_required === 2
          ? "Application Required for Some Roles"
          : "No Application Required"
    }
  ];

  const items = data.map(({ icon, text }) => (
    <li style={InfoBoxItem}>
      <i className={icon} style={InfoIcon}></i>
      {text}
    </li>
  ));

  return (
    <div>
      <p>
        <ul>{items}</ul>
      </p>
    </div>
  );
};
