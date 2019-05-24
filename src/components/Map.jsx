import React, { Component } from "react";
import { Map, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import Button from "react-bootstrap/Button";
import axios from "axios";
import Keycloak from "keycloak-js";

const height = {
  height: "100vh"
};
const center = {
  lat: 6.795,
  lng: 79.9008
};

class MapComponent extends Component {
  constructor(props) {
    super(props);
    this.state = {
      keycloak: null,
      authenticated: false,
      metaData: null,
      qrCode: null
    };
  }

  componentDidMount = () => {
    var isAuthenticated =
      this.props.match.params != undefined
        ? this.props.match.params.authenticated
        : false;
    const keycloak = Keycloak("/keycloak.json");
    keycloak
      .init({
        onLoad: isAuthenticated ? "check-sso" : "login-required"
      })
      .success(authenticated => {
        this.setState({
          keycloak: keycloak,
          authenticated: authenticated
        });
        alert("Keycloak Token: " + this.state.keycloak.token);
      })
      .error(err => {
        alert(err);
      });
    const map = this.leafletMap.leafletElement;
    const geocoder = L.Control.Geocoder.nominatim();
    let marker;

    map.on("click", e => {
      geocoder.reverse(
        e.latlng,
        map.options.crs.scale(map.getZoom()),
        results => {
          var r = results[0];
          if (r) {
            if (marker) {
              marker
                .setLatLng(r.center)
                .setPopupContent(r.html || r.name)
                .openPopup();
            } else {
              marker = L.marker(r.center)
                .bindPopup(r.name)
                .addTo(map)
                .openPopup();
            }
          }
        }
      );
    });
  };

  handleClick = () => {
    axios
      .get("http://localhost:8091/devices/register", {
        headers: {
          Authorization: "Bearer " + this.state.keycloak.token
        },
        params: {
          redirectUrl: "http://e636d5eb.ngrok.io",
          metaData: {}
        }
      })
      .then(res => {
        this.setState({
          qrCode: res.data.qrCode
        });
        console.log(res.data);
        console.log(this.state);
      });
  };

  render() {
    return (
      <div>
        <div>
          <Button variant="primary" onClick={this.handleClick}>
            Primary{" "}
          </Button>{" "}
          {this.state.qrCode ? (
            <span>
              <img
                id="qrCode"
                src={"data:image/png;base64," + this.state.qrCode}
              />{" "}
            </span>
          ) : (
            <span />
          )}{" "}
        </div>{" "}
        <Map
          style={height}
          center={center}
          zoom={18}
          ref={m => {
            this.leafletMap = m;
          }}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
          />
          <Marker position={center}>
            <Popup>
              <span> You are here! </span>{" "}
            </Popup>{" "}
          </Marker>{" "}
        </Map>{" "}
      </div>
    );
  }
}

export default MapComponent;
