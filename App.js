import React from 'react';
import { 
  StyleSheet, 
  Text, 
  View,
  Platform,
  Alert,
  TouchableOpacity 
} from 'react-native';

import { TaskManager, Location, Permissions, Constants } from 'expo';
import { Font } from 'expo';
import { AppState } from 'react-native';

// <===== FIREBASE ====>
import * as firebase from 'firebase';

const firebaseConfig = {
  apiKey: "beep boop",
  authDomain: "ooowheep",
  databaseURL: "blip",
  projectId: "eeooo",
  storageBucket: "wheeeee",
  messagingSenderId: "enough of that Artoo, watch your language!"
};
firebase.initializeApp(firebaseConfig);
var database = firebase.database();

export default class App extends React.Component {

  constructor() {
    super();
    if(Platform.OS === 'android') {
      console.disableYellowBox = true;
    }
  }

  state = {
    fontLoaded: false,
    appState: AppState.currentState,
    errorMessage: null,
    pressed: false,
    latitude: 0,
    longitude: 0,
  }

  onPress = async() => {
      /* --- below works --- */
      await Location.startLocationUpdatesAsync('test-task', {
        accuracy: Location.Accuracy.Balanced,
        distanceInterval: 0,
        timeInterval: 1000,
      })
      console.log('pressed');
      this.setState({ pressed: true });
      /* --- above works --- */
  }

  componentWillMount() {
    if(Platform.OS === 'android' && !Constants.isDevice) {
      this.setState({
        errorMessage: 'This does not work in Android emulator, try on device.'
      });
    } else {
      this.getLocationPermissions();
    }
  }

  getLocationPermissions = async() => {
    let { status } = await Permissions.askAsync(Permissions.LOCATION);
    if(status !== 'granted') {
      this.setState({
        errorMessage: 'Permission to get locations denied'
      });
    }
  }
  
  componentDidMount = async () => {
    AppState.addEventListener('change', this._handleAppStateChange);
    await Font.loadAsync({
      'montserrat-bold': require('./assets/fonts/Montserrat-SemiBold.ttf'),
      'montserrat': require('./assets/fonts/Montserrat-Medium.ttf'),
    });
    this.setState({ fontLoaded: true });
    this.interval = setInterval(() => this.findCoordinates(), 10000);
  }
  
  componentWillUnmount() {
    AppState.removeEventListener('change', this._handleAppStateChange);
    clearInterval(this.interval);
  }
  
  _handleAppStateChange = (nextAppState) => {
    if(this.state.appState.match(/inactive|background/)  && nextAppState === 'active') {
      console.log('App has come to the foreground!');
    } else {
      console.log('App has gone underground... ooh!');
    }
    this.setState({appState: nextAppState});
  }

  findCoordinates = () => {
    navigator.geolocation.getCurrentPosition(
      position => {
        this.setState({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        });
      },
      error => Alert.alert(error.message),
      { enableHighAccuracy: Platform.OS != 'android', timeout: 1000, maximumAge: 1000 }
    );
  };

  render() {
    return(
      <View style={styles.body}>
        {
          this.state.fontLoaded ? (
            <View style={styles.container}>
                <Text style={styles.welcome}>Welcome</Text>
                <Text style={styles.instructions}>
                  This app will run in the background and sends your latitude and longitutde
                  to the website which then reveals part of the image.  The coordinate data
                  being sent is only used for this project.  Once you press
                  the button below, you can leave the Expo app and it will continue running (even
                  if your phone is locked).  Quitting the Expo app will stop this app from running.
                </Text>
                <Text style={styles.thanks}>
                  Thank you again for participating in this project!
                </Text>
                {
                  this.state.pressed ?(
                    <Text style={styles.begun}>
                      Your Coordinates{"\n"}
                      {Math.round(this.state.latitude * 1000)/1000}, 
                      {Math.round(this.state.longitude * 1000)/1000}
                    </Text>
                  ) : null
                }
                <TouchableOpacity onPress={this.onPress} style={styles.button}>
                  <Text style={styles.buttonText}>LET'S BEGIN</Text>
                </TouchableOpacity>
            </View>
        ) : null
      }
      </View>
    );
  }
}

TaskManager.defineTask('test-task', ({ data: {locations}, error }) => {
  if(error) {
    console.log(error.message);
    return;
  }
  console.log('Got new locations', locations[0].coords);
  const lat  = locations[0].coords.latitude;
  const long = locations[0].coords.longitude;
  const time = locations[0].timestamp;

  var leftBound = -84.7395;
  var rightBound = -84.7305;
  var upperBound = 39.5105;
  var lowerBound = 39.5016;

  if (
    lat > lowerBound && lat < upperBound &&
    long > leftBound && long < rightBound
  ) {
    database.ref('locations/')
      .push({
        latitude: lat,
        longitude: long,
        timestamp: time
      });
  }
})

// STYLES
const styles = StyleSheet.create({
  body: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
    padding: 0,
    paddingTop: 0,
  },
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fafafa',
    paddingTop: 32,
    paddingBottom: 32,
    paddingRight: 32,
    paddingLeft: 32,
    width: '100%',
  },
  welcome: {
    fontFamily: 'montserrat-bold',
    fontSize: 24,
    fontWeight: '600',
    textAlign: "center",
    textTransform: 'uppercase',
    marginBottom: 32,
  },
  instructions: {
    fontFamily: 'montserrat',
    fontSize: 14,
    textAlign: "center",
    color: '#333333',
    lineHeight: 24,
    marginBottom: 16,
  },
  thanks: {
    fontFamily: 'montserrat-bold',
    fontSize: 14,
    textAlign: "center",
    color: '#333333',
    lineHeight: 24,
    marginBottom: 16,
  },
  begun: {
    fontFamily: 'montserrat-bold',
    fontSize: 14,
    textAlign: "center",
    color: '#27AE60',
    lineHeight: 24,
    marginBottom: 16,
  },
  button: {
    display: 'flex',
    flexDirection: 'column',
    height: 64,
    width: '100%',
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    color: '#ffffff',
    padding: 2,
    marginTop: 30,
  },
  buttonText: {
    fontFamily: 'montserrat-bold',
    flex: 1,
    color: '#ffffff',
    height: 60,
    lineHeight: 60,
    width: '100%',
    textAlign: 'center',
    fontWeight: '600',
    borderColor: '#ffffff',
    borderWidth: 2,
  }
});



// old code, aren't using, but keeping for reference in case.
// this is some old foreground code

/* hiding the code for some testing purposes... we'll have it up and running again.


firebase.initializeApp(firebaseConfig);
var database = firebase.database();

export default class App extends React.Component {

  state = {
    latitude: null,
    longitude: null,
    timestamp: null
  }

  onPress = async () => {
    await Location.hasStartedLocationUpdatesAsync('testTask', {
      accuracy: Location.Accuracy.Balanced,
    });
  };

  componentDidMount() {
    this.interval = setInterval(() => this.manageLocation(), 10000);
  }
  componentWillUnmount() {
    clearInterval(this.interval);
  }

  findCoordinates = () => {
    navigator.geolocation.getCurrentPosition(
      position => {
        //const location = JSON.stringify(position);
        //this.setState({ location });

        this.setState({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          timestamp: position.timestamp
        });
      },
      error => Alert.alert(error.message),
      { enableHighAccuracy: true, timeout: 200000, maximumAge: 1000 }
    );
  };

  logCoordinates = () => {
    database.ref('locations/')
      .push({
        latitude: this.state.latitude,
        longitude: this.state.longitude,
        timestamp: this.state.timestamp
      });
  }

  manageLocation = () => {
    this.findCoordinates();
    if(this.state.latitude != null && this.state.longitude != null) {
      this.logCoordinates();
      //console.log(this.state);
    }
  }

  render() {
    return (
      <View style={styles.container}>
        <Text style = {styles.welcome}>Welcome!</Text>
        <Text>Your Coords: </Text>
        <Text>Lat:{this.state.latitude}</Text>
        <Text>Long:{this.state.longitude}</Text>
        <TouchableOpacity style={styles.button} onPress={this.onPress}>
          <Text>Test</Text>
        </TouchableOpacity>
      </View>
    );
    }
}
*/


/*

/*
<View style={styles.container}>
        <TouchableOpacity onPress={this.manageLocation}>
          <Text style = {styles.welcome}>Find My Coords?</Text>
          <Text>Location: Lat:{this.state.latitude} Long:{this.state.longitude}</Text>
        </TouchableOpacity>
      </View>
*/

// checking background or foreground
/*
state = {
  appState: AppState.currentState
}

componentDidMount = async () => {
  AppState.addEventListener('change', this._handleAppStateChange);
}

componentWillUnmount() {
  //AppState.removeEventListener('change', this._handleAppStateChange);
}

_handleAppStateChange = (nextAppState) => {
  if(this.state.appState.match(/inactive|background/)  && nextAppState === 'active') {
    console.log('App has come to the foreground!');
  } else {
    console.log('App has gone underground... ooh!');
  }
  this.setState({appState: nextAppState});
}
*/
