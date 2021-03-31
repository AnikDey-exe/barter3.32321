import React, { Component } from 'react';
import {
  View,
  Text,
  TextInput,
  KeyboardAvoidingView,
  StyleSheet,
  TouchableOpacity,
  TouchableHighlight,
  Alert,
  FlatList
} from 'react-native';
import db from '../config';
import firebase from 'firebase';
import MyHeader from '../components/MyHeader'
import { itemSearch } from 'react-native-google-books';
import { RFValue } from 'react-native-responsive-fontsize';
import {Input, Icon} from 'react-native-elements';

export default class ExchangeScreen extends Component {
  constructor() {
    super();
    this.state = {
      userId: firebase.auth().currentUser.email,
      itemName: "",
      itemDescription: "",
      requestedItemName: "",
      isItemRequestActive: "",
      itemStatus: "",
      requestId: "",
      userdocId: '',
      docId: '',
      dataSource: "",
      showFlatlist: false,
      currencyCode: ''
    }
  }

  createUniqueId() {
    return Math.random().toString(36).substring(7);
  }

  addRequest = async (itemName, itemDescription, currencyCode) => {
    var userId = this.state.userId;
    var randomRequestId = this.createUniqueId();
    //var items = await itemSearch.searchitem(itemName, 'AIzaSyCEC5YHJXZr9opnYy8IRzRg92-zW6CujGA');
    db.collection('RequestedItems').add({
      "userId": userId,
      "itemName": itemName,
      "itemDescription": itemDescription,
      "itemStatus": "requested",
      "requestId": randomRequestId,
      "date": firebase.firestore.FieldValue.serverTimestamp(),
      "currencyCode": currencyCode
    })
    this.getitemRequest()
    db.collection('Users').where("emailID", "==", userId).get()
      .then()
      .then((snapshot) => {
        snapshot.forEach((doc) => {
          db.collection('Users').doc(doc.id).update({
            isItemRequestActive: true
          })
        })
      })
    this.setState({
      itemName: '',
      itemDescription: '',
      requestId: randomRequestId
    })

    return Alert.alert("Item Requested Successfully");
  }
  getitemRequest = () => {
    var itemRequest = db.collection('RequestedItems')
      .where('userId', '==', this.state.userId)
      .get()
      .then((snapshot) => {
        snapshot.forEach((doc) => {
          if (doc.data().itemStatus !== "received") {
            this.setState({
              requestId: doc.data().requestId,
              requesteditemName: doc.data().itemName,
              itemStatus: doc.data().itemStatus,
              docId: doc.id
            })
          }
        })
      })
  }
  getitemRequestActive() {
    db.collection('Users')
      .where('emailID', '==', this.state.userId)
      .onSnapshot(querySnapshot => {
        querySnapshot.forEach(doc => {
          this.setState({
            isItemRequestActive: doc.data().isItemRequestActive,
            userDocId: doc.id
          })
        })
      })
  }
  sendNotification = () => {
    //to get the first name and last name
    db.collection('Users').where('emailID', '==', this.state.userId).get()
      .then((snapshot) => {
        snapshot.forEach((doc) => {
          var name = doc.data().firstName
          var lastName = doc.data().lastName

          // to get the donor id and item nam
          db.collection('AllNotifications').where('requestId', '==', this.state.requestId).get()
            .then((snapshot) => {
              snapshot.forEach((doc) => {
                var donorId = doc.data().donorId
                var itemName = doc.data().itemName

                //targert user id is the donor id to send notification to the user
                db.collection('AllNotifications').add({
                  "targetedUserId": donorId,
                  "message": firstName + " " + lastName + " received the item " + itemName,
                  "notificationStatus": "unread",
                  "itemName": itemName
                })
              })
            })
        })
      })
  }
  updateitemRequestStatus = () => {
    //updating the item status after receiving the item
    db.collection('Requesteditems').doc(this.state.docId)
      .update({
        itemStatus: 'received'
      })

    //getting the  doc id to update the users doc
    db.collection('Users').where('emailID', '==', this.state.userId).get()
      .then((snapshot) => {
        snapshot.forEach((doc) => {
          //updating the doc
          db.collection('Users').doc(doc.id).update({
            isItemRequestActive: false
          })
        })
      })
  }
  getitemsFromApi() {
    fetch('http://data.fixer.io/api/latest?access_key=cb45b0f9685226ab43bdb982effd8f99')
    .then(response=>{
      return response.json()
    })
    .then(responseData => {
      var currencyCode = this.state.currencyCode;
      var currency = responseData.rates.INR;
      var value = 60/currency;
      console.log(value);
    })

  }
  receiveditems = (itemName) => {
    var userId = this.state.userId
    var requestId = this.state.requestId
    db.collection('Receiveditems').add({
      "userId": userId,
      "itemName": itemName,
      "requestId": requestId,
      "itemStatus": "received",

    })
  }
  //render Items  functionto render the items from api
  renderItem = ({ item, i }) => {
    let obj = {
      title: item.volumeInfo.title,
      selfLink: item.selfLink,
      buyLink: item.saleInfo.buyLink,
      imageLink: item.volumeInfo.imageLinks
    }
    return (
      <TouchableHighlight
        style={{
          alignItems: "center",
          backgroundColor: "#ADD8E6",
          padding: 10,
          width: '90%',
          borderWidth: 1,
          borderRadius: 10
        }}
        activeOpacity={0.6}
        underlayColor="#00008B"
        onPress={() => {
          this.setState({
            showFlatlist: false,
            itemName: item.volumeInfo.title,
          })
        }
        }
        bottomDivider>
        <Text> {item.volumeInfo.title} </Text>
      </TouchableHighlight>
    )
  }
  componentDidMount() {
    this.getItemRequest()
    this.getItemRequestActive()
    // var item =itemSearch.searchitem("rich ",'AIzaSyCEC5YHJXZr9opnYy8IRzRg92-zW6CujGA')
  }
  //
  render() {
    if (this.state.isItemRequestActive === true) {
      return (
        <View style={{ flex: 1, justifyContent: 'center' }}>
          <View style={{ borderColor: "orange", borderWidth: 2, justifyContent: 'center', alignItems: 'center', padding: 10, margin: 10 }}>
            <Text>item Name</Text>
            <Text>{this.state.requestedItemName}</Text>
          </View>
          <View style={{ borderColor: "orange", borderWidth: 2, justifyContent: 'center', alignItems: 'center', padding: 10, margin: 10 }}>
            <Text>item Status</Text>
            <Text>{this.state.itemStatus}</Text>
          </View>

          <View style={{ borderColor: "orange", borderWidth: 2, justifyContent: 'center', alignItems: 'center', padding: 10, margin: 10 }}>
            <Text>Currency</Text>
            <Text>{this.state.currencyCode}</Text>
          </View>
          <TouchableOpacity style={{ borderWidth: 1, borderColor: 'orange', backgroundColor: "orange", width: 300, alignSelf: 'center', alignItems: 'center', height: 30, marginTop: 30 }}
            onPress={() => {
              this.sendNotification();
              this.updateItemRequestStatus();
              this.receiveditems(this.state.requestedItemName)
            }}>
            <Text>I received the item </Text>
          </TouchableOpacity>
        </View>
      )
    }
    else {
      return (
        // Form screen
        <View style={{ flex: 1 }}>
          <MyHeader title="Request item" navigation={this.props.navigation} />

          <View>
            <TextInput
              style={styles.formTextInput}
              label={"item Name"}
              placeholder={"enter item name"}
              containerStyle={{marginTop:RFValue(60)}}
              value={this.state.itemName}
            />

            {this.state.showFlatlist ?
              (<FlatList
                data={this.state.dataSource}
                renderItem={this.renderItem}
                enableEmptySections={true}
                style={{ marginTop: 10, marginLeft: 20 }}
                keyExtractor={(item, index) => index.toString()}
              />)
              : (
                <View style={{ alignItems: 'center' }}>
                   <TextInput
                    style={styles.formTextInput}
                    containerStyle={{marginTop:RFValue(30)}}
                    label={"Code"}
                    placeholder={"Currency Code"}
                    onChangeText={(text) => {
                      this.setState({
                        currencyCode: text
                      })
                    }}
                    onChangeText={text => this.getitemsFromApi(text)}
              onClear={text => this.getitemsFromApi('')}
                    value={this.state.itemDescription}
                  />
                  <TextInput
                    style={[styles.formTextInput, { height: 300 }]}
                    containerStyle={{marginTop:RFValue(30)}}
                    multiline
                    numberOfLines={8}
                    label={"Reason"}
                    placeholder={"Why do you need the item"}
                    onChangeText={(text) => {
                      this.setState({
                        itemDescription: text
                      })
                    }}
                    value={this.state.itemDescription}
                  />
                  <TouchableOpacity
                    style={styles.button}
                    onPress={() => {
                      this.addRequest(this.state.itemName, this.state.itemDescription, this.state.currencyCode);
                    }}
                  >
                    <Text>Request</Text>
                  </TouchableOpacity>
                </View>
              )
            }
          </View>
        </View>
      )
    }
  }
}


const styles = StyleSheet.create({
  keyBoardStyle: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center'
  },
  formTextInput: {
    width: "75%",
    height: 35,
    alignSelf: 'center',
    borderColor: '#ffab91',
    borderRadius: 10,
    borderWidth: 1,
    marginTop: 20,
    padding: 10,
  },
  button: {
    width: "75%",
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 10,
    backgroundColor: "#ff5722",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.44,
    shadowRadius: 10.32,
    elevation: 16,
    marginTop: 20
  },
}
)