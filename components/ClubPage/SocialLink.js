export default props => {
  let club = props.club;
  let item = props.item;
  let social = props.type;

  if (social == "email") {
    return club[item.name];
  } else {
    return <a href={club[item.name]}>{club.name}</a>;
  }
};
