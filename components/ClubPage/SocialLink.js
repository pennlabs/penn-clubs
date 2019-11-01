export default ({ club, item, type }) => {
  if (type === "email") {
    return club[item.name];
  }
  return <a href={club[item.name]}>{club.name}</a>;
};
