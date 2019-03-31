import React from 'react'

class Modal extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      modal: '',
      club: {}
    }
  }

  componentDidUpdate(prevProps, prevState, snapshot){
    console.log(this.props, prevProps)
    if (this.props !== prevProps) {
      var { modal, club } = this.props
      this.setState({ modal, club })
    }
  }

  randomClub() {
    const clubs = ["https://files.slack.com/files-pri/T4EM1119V-FH9E8PE93/images.jpeg",
    "http://static.asiawebdirect.com/m/kl/portals/kuala-lumpur-ws/homepage/magazine/5-clubs/pagePropertiesImage/best-clubs-kuala-lumpur.jpg.jpg",
    "https://files.slack.com/files-pri/T4EM1119V-FHA7CVCNT/image.png",
    "https://files.slack.com/files-pri/T4EM1119V-FH920P727/image.png",
    "https://files.slack.com/files-pri/T4EM1119V-FH958BEAW/image.png",
    "https://files.slack.com/files-pri/T4EM1119V-FH6NHNE0Y/seltzer.jpg",
    "https://s3.envato.com/files/990f2541-adb3-497d-a92e-78e03ab34d9d/inline_image_preview.jpg"
    ]
    const i = Math.floor(Math.random() * (6));
    return clubs[i];
  }

  render() {
    return(
      <div className={"modal" + this.state.modal} style={{position: "fixed", top: 0, height: "100%", width: "100%"}}>
        <div className="modal-background" style={{backgroundColor: "#d5d5d5", opacity: .5}}></div>
        <div className="card" style={{ margin: "6rem", padding: 10, borderRadius: 5, borderWidth: 1, boxShadow: "0px 2px 6px grey" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", margin: 10}}>
            <b className="is-size-1"> {this.state.club.name} </b>
            <a className="button" style={{ color: "#fff", backgroundColor: "#8089f8", borderWidth: 0 }}><b>Add</b></a>
          </div>
          <div className="columns" style={{ padding: 10 }}>
            <div className="column">
              <img style={{ height: 400 }} src={this.state.club.img ? this.state.club.img : this.randomClub()} />
            </div>
            <div className="column">
              <p className="is-size-5">{this.state.club.description}</p>
            </div>
          </div>
        </div>
        <button className="modal-close is-large" aria-label="close" onClick={(e) => this.props.closeModal()}></button>
      </div>
    )
  }
}

export default Modal
